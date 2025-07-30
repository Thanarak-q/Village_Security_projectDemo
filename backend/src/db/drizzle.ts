import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';

// Database configuration
const databaseConfig = {
  url: process.env.DATABASE_URL,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  }
};

// Validate required environment variables
function validateDatabaseConfig() {
  if (!databaseConfig.url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // Validate DATABASE_URL format
  if (!databaseConfig.url.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  console.log('✅ Database configuration validated');
}

// Validate configuration before creating connection
validateDatabaseConfig();

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseConfig.url,
  max: databaseConfig.pool.max,
  idleTimeoutMillis: databaseConfig.pool.idleTimeoutMillis,
  connectionTimeoutMillis: databaseConfig.pool.connectionTimeoutMillis,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Create drizzle instance with the pool
const db = drizzle(pool);

// Test database connection on startup
export async function testConnection() {
  try {
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');
    return result;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get database pool stats
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Graceful shutdown function
export async function closeConnection() {
  try {
    await pool.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
}

export default db;