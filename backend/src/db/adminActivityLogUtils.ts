/**
 * @file This file contains database utility functions for managing admin activity logs.
 * It provides an interface for creating, retrieving, and analyzing log entries,
 * which are crucial for auditing and monitoring administrative actions within the system.
 */

import db from "./drizzle";
import { admin_activity_logs, admins, AdminActivityLogInsert } from "./schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

/**
 * Defines the structure for the parameters required to create a new activity log.
 * @interface
 */
export interface CreateActivityLogParams {
  /**
   * The UUID of the administrator who performed the action.
   * @type {string}
   */
  admin_id: string;
  /**
   * The type of action performed, conforming to the predefined action types in the schema.
   * @type {AdminActivityLogInsert["action_type"]}
   */
  action_type: AdminActivityLogInsert["action_type"];
  /**
   * A detailed, human-readable description of the action.
   * @type {string}
   */
  description: string;
}

/**
 * Inserts a new admin activity log into the database.
 *
 * @param {CreateActivityLogParams} params - The data for the new activity log entry.
 * @returns {Promise<AdminActivityLog>} A promise that resolves to the newly created log record.
 * @throws {Error} Throws an error if the database insertion fails.
 */
export const createActivityLog = async (params: CreateActivityLogParams) => {
  try {
    const [newLog] = await db
      .insert(admin_activity_logs)
      .values({
        admin_id: params.admin_id,
        action_type: params.action_type,
        description: params.description,
      })
      .returning();

    return newLog;
  } catch (error) {
    console.error("Error creating activity log:", error);
    throw error;
  }
};

/**
 * Retrieves a paginated list of all admin activity logs, optionally filtered by village.
 *
 * @param {number} [page=1] - The page number to fetch.
 * @param {number} [limit=20] - The number of logs to return per page.
 * @param {string} [village_key] - An optional key to filter logs for a specific village.
 * @returns {Promise<Object>} A promise that resolves to an object containing the logs and pagination details.
 * @throws {Error} Throws an error if fetching the logs fails.
 */
export const getAllActivityLogs = async (
  page: number = 1,
  limit: number = 20,
  village_key?: string
) => {
  try {
    const offset = (page - 1) * limit;

    // Build the logs query
    const logs = village_key
      ? await db
          .select({
            log_id: admin_activity_logs.log_id,
            admin_id: admin_activity_logs.admin_id,
            action_type: admin_activity_logs.action_type,
            description: admin_activity_logs.description,
            created_at: admin_activity_logs.created_at,
            admin_username: sql<string>`admins.username`.as("admin_username"),
          })
          .from(admin_activity_logs)
          .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
          .where(eq(admins.village_key, village_key))
          .orderBy(desc(admin_activity_logs.created_at))
          .limit(limit)
          .offset(offset)
      : await db
          .select({
            log_id: admin_activity_logs.log_id,
            admin_id: admin_activity_logs.admin_id,
            action_type: admin_activity_logs.action_type,
            description: admin_activity_logs.description,
            created_at: admin_activity_logs.created_at,
            admin_username: sql<string>`admins.username`.as("admin_username"),
          })
          .from(admin_activity_logs)
          .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
          .orderBy(desc(admin_activity_logs.created_at))
          .limit(limit)
          .offset(offset);

    // Get total count
    const [{ count }] = village_key
      ? await db
          .select({ count: sql<number>`count(*)`.as("count") })
          .from(admin_activity_logs)
          .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
          .where(eq(admins.village_key, village_key))
      : await db
          .select({ count: sql<number>`count(*)`.as("count") })
          .from(admin_activity_logs)
          .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id));

    return {
      logs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }
};

/**
 * Retrieves a paginated list of activity logs for a specific administrator.
 *
 * @param {string} admin_id - The UUID of the administrator.
 * @param {number} [page=1] - The page number to fetch.
 * @param {number} [limit=20] - The number of logs to return per page.
 * @returns {Promise<Object>} A promise that resolves to an object with logs and pagination details.
 * @throws {Error} Throws an error if fetching the logs fails.
 */
export const getActivityLogsByAdmin = async (
  admin_id: string,
  page: number = 1,
  limit: number = 20
) => {
  try {
    const offset = (page - 1) * limit;

    const logs = await db
      .select({
        log_id: admin_activity_logs.log_id,
        admin_id: admin_activity_logs.admin_id,
        action_type: admin_activity_logs.action_type,
        description: admin_activity_logs.description,
        created_at: admin_activity_logs.created_at,
        admin_username: sql<string>`admins.username`.as("admin_username"),
      })
      .from(admin_activity_logs)
      .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
      .where(eq(admin_activity_logs.admin_id, admin_id))
      .orderBy(desc(admin_activity_logs.created_at))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(admin_activity_logs)
      .where(eq(admin_activity_logs.admin_id, admin_id));

    return {
      logs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching activity logs by admin:", error);
    throw error;
  }
};

/**
 * Retrieves a paginated list of activity logs filtered by a specific action type.
 *
 * @param {AdminActivityLogInsert["action_type"]} action_type - The type of action to filter by.
 * @param {number} [page=1] - The page number to fetch.
 * @param {number} [limit=20] - The number of logs per page.
 * @param {string} [village_key] - An optional key to filter logs for a specific village.
 * @returns {Promise<Object>} A promise that resolves to an object with logs and pagination details.
 * @throws {Error} Throws an error if fetching the logs fails.
 */
export const getActivityLogsByActionType = async (
  action_type: AdminActivityLogInsert["action_type"],
  page: number = 1,
  limit: number = 20,
  village_key?: string
) => {
  try {
    const offset = (page - 1) * limit;

    let whereConditions = [eq(admin_activity_logs.action_type, action_type)];
    if (village_key) {
      whereConditions.push(eq(admins.village_key, village_key));
    }

    const logs = await db
      .select({
        log_id: admin_activity_logs.log_id,
        admin_id: admin_activity_logs.admin_id,
        action_type: admin_activity_logs.action_type,
        description: admin_activity_logs.description,
        created_at: admin_activity_logs.created_at,
        admin_username: sql<string>`admins.username`.as("admin_username"),
      })
      .from(admin_activity_logs)
      .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
      .where(and(...whereConditions))
      .orderBy(desc(admin_activity_logs.created_at))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(admin_activity_logs)
      .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
      .where(and(...whereConditions));

    return {
      logs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching activity logs by action type:", error);
    throw error;
  }
};

/**
 * Retrieves a paginated list of activity logs within a specified date range.
 *
 * @param {Date} start_date - The start of the date range.
 * @param {Date} end_date - The end of the date range.
 * @param {number} [page=1] - The page number to fetch.
 * @param {number} [limit=20] - The number of logs per page.
 * @param {string} [village_key] - An optional key to filter logs for a specific village.
 * @returns {Promise<Object>} A promise that resolves to an object with logs and pagination details.
 * @throws {Error} Throws an error if fetching the logs fails.
 */
export const getActivityLogsByDateRange = async (
  start_date: Date,
  end_date: Date,
  page: number = 1,
  limit: number = 20,
  village_key?: string
) => {
  try {
    const offset = (page - 1) * limit;

    let whereConditions = [
      gte(admin_activity_logs.created_at, start_date),
      lte(admin_activity_logs.created_at, end_date),
    ];
    if (village_key) {
      whereConditions.push(eq(admins.village_key, village_key));
    }

    const logs = await db
      .select({
        log_id: admin_activity_logs.log_id,
        admin_id: admin_activity_logs.admin_id,
        action_type: admin_activity_logs.action_type,
        description: admin_activity_logs.description,
        created_at: admin_activity_logs.created_at,
        admin_username: sql<string>`admins.username`.as("admin_username"),
      })
      .from(admin_activity_logs)
      .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
      .where(and(...whereConditions))
      .orderBy(desc(admin_activity_logs.created_at))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(admin_activity_logs)
      .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
      .where(and(...whereConditions));

    return {
      logs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching activity logs by date range:", error);
    throw error;
  }
};

/**
 * Retrieves statistics about admin activities, such as the total number of logs
 * and a breakdown of activities by action type.
 *
 * @param {string} [village_key] - An optional key to filter statistics for a specific village.
 * @returns {Promise<Object>} A promise that resolves to an object containing the total log count and a list of counts per action type.
 * @throws {Error} Throws an error if fetching the statistics fails.
 */
export const getActivityStatistics = async (village_key?: string) => {
  try {
    const stats = village_key
      ? await db
          .select({
            action_type: admin_activity_logs.action_type,
            count: sql<number>`count(*)`.as("count"),
          })
          .from(admin_activity_logs)
          .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
          .where(eq(admins.village_key, village_key))
          .groupBy(admin_activity_logs.action_type)
      : await db
          .select({
            action_type: admin_activity_logs.action_type,
            count: sql<number>`count(*)`.as("count"),
          })
          .from(admin_activity_logs)
          .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
          .groupBy(admin_activity_logs.action_type);

    // Get total logs
    const [{ count: total }] = village_key
      ? await db
          .select({ count: sql<number>`count(*)`.as("count") })
          .from(admin_activity_logs)
          .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
          .where(eq(admins.village_key, village_key))
      : await db
          .select({ count: sql<number>`count(*)`.as("count") })
          .from(admin_activity_logs)
          .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id));

    return {
      total,
      byActionType: stats,
    };
  } catch (error) {
    console.error("Error fetching activity statistics:", error);
    throw error;
  }
}; 