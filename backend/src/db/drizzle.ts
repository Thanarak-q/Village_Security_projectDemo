/**
 * @file This file sets up and configures the database connection using Drizzle ORM
 * with a PostgreSQL backend. It establishes a connection pool, validates the
 * configuration, and exports the Drizzle instance along with utility functions
 * for managing the connection.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';
import { schema } from '../db/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Holds the configuration for the database connection, read from environment variables.
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
 * Validates that the essential database configuration, such as the connection URL,
 * is present and correctly formatted.
 * @throws {Error} If the `DATABASE_URL` environment variable is missing or invalid.
 */
function validateDatabaseConfig() {
  if (!databaseConfig.url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!databaseConfig.url.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  console.log('✅ Database configuration validated');
}

// Immediately validate the configuration upon module initialization.
validateDatabaseConfig();

/**
 * The PostgreSQL connection pool instance. It manages a set of active connections
 * to the database, improving performance by reusing connections.
 * @type {Pool}
 */
const pool = new Pool({
  connectionString: databaseConfig.url,
  max: databaseConfig.pool.max,
  idleTimeoutMillis: databaseConfig.pool.idleTimeoutMillis,
  connectionTimeoutMillis: databaseConfig.pool.connectionTimeoutMillis,
});

// Sets up an error listener on the pool to handle and log unexpected errors.
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * The main Drizzle ORM instance, configured with the connection pool and database schema.
 * This is the primary object used for all database interactions.
 * @type {NodePgDatabase<typeof schema>}
 */
const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

/**
 * Executes a simple query to test the database connection and verify that it is active.
 *
 * @returns {Promise<Object>} A promise that resolves with the query result upon a successful connection.
 * @throws {Error} Throws an error if the connection attempt fails.
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
 * Retrieves statistics about the current state of the connection pool.
 *
 * @returns {{totalCount: number, idleCount: number, waitingCount: number}} An object containing the counts of total, idle, and waiting connections.
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Gracefully closes the database connection pool, ending all client connections.
 *
 * @returns {Promise<void>} A promise that resolves when the pool has been closed.
 * @throws {Error} Throws an error if closing the connection fails.
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