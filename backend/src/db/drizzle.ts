import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';
import { schema } from '../db/schema'; // 👈 import schema
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'; // 👈 import type

/**
 * The configuration for the database connection.
 * @type {Object}
 */
const databaseConfig = {
  url: process.env.DATABASE_URL,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  }
};

/**
 * Validates the database configuration.
 * @throws {Error} If the DATABASE_URL environment variable is not set or is invalid.
 */
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

/**
 * The PostgreSQL connection pool.
 * @type {Pool}
 */
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

/**
 * The Drizzle ORM instance.
 * @type {NodePgDatabase<typeof schema>}
 */
const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

/**
 * Tests the database connection.
 * @returns {Promise<Object>} A promise that resolves to the result of the test query.
 * @throws {Error} If the database connection fails.
 */
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

/**
 * Gets the statistics of the database connection pool.
 * @returns {Object} An object containing the pool statistics.
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Closes the database connection.
 * @returns {Promise<void>} A promise that resolves when the connection is closed.
 * @throws {Error} If there is an error closing the connection.
 */
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