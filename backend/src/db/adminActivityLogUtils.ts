import db from "./drizzle";
import { admin_activity_logs, AdminActivityLogInsert } from "./schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

// Interface for creating activity log
export interface CreateActivityLogParams {
  admin_id: string;
  action_type: AdminActivityLogInsert["action_type"];
  target_type: AdminActivityLogInsert["target_type"];
  target_id?: string;
  old_value?: string;
  new_value?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
}

// Create new activity log
export const createActivityLog = async (params: CreateActivityLogParams) => {
  try {
    const [newLog] = await db
      .insert(admin_activity_logs)
      .values({
        admin_id: params.admin_id,
        action_type: params.action_type,
        target_type: params.target_type,
        target_id: params.target_id || null,
        old_value: params.old_value || null,
        new_value: params.new_value || null,
        description: params.description,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
      })
      .returning();

    return newLog;
  } catch (error) {
    console.error("Error creating activity log:", error);
    throw error;
  }
};

// Get all activity logs with pagination
export const getAllActivityLogs = async (
  page: number = 1,
  limit: number = 20,
  village_key?: string
) => {
  try {
    const offset = (page - 1) * limit;
    
    let query = db
      .select({
        log_id: admin_activity_logs.log_id,
        admin_id: admin_activity_logs.admin_id,
        action_type: admin_activity_logs.action_type,
        target_type: admin_activity_logs.target_type,
        target_id: admin_activity_logs.target_id,
        old_value: admin_activity_logs.old_value,
        new_value: admin_activity_logs.new_value,
        description: admin_activity_logs.description,
        ip_address: admin_activity_logs.ip_address,
        user_agent: admin_activity_logs.user_agent,
        created_at: admin_activity_logs.created_at,
        admin_username: sql<string>`admins.username`.as("admin_username"),
        admin_fname: sql<string>`admins.fname`.as("admin_fname"),
        admin_lname: sql<string>`admins.lname`.as("admin_lname"),
      })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id))
      .orderBy(desc(admin_activity_logs.created_at))
      .limit(limit)
      .offset(offset);

    // Filter by village if provided
    if (village_key) {
      query = query.where(eq(db.admins.village_key, village_key));
    }

    const logs = await query;
    
    // Get total count
    let countQuery = db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id));

    if (village_key) {
      countQuery = countQuery.where(eq(db.admins.village_key, village_key));
    }

    const [{ count }] = await countQuery;

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

// Get activity logs by admin
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
        target_type: admin_activity_logs.target_type,
        target_id: admin_activity_logs.target_id,
        old_value: admin_activity_logs.old_value,
        new_value: admin_activity_logs.new_value,
        description: admin_activity_logs.description,
        ip_address: admin_activity_logs.ip_address,
        user_agent: admin_activity_logs.user_agent,
        created_at: admin_activity_logs.created_at,
        admin_username: sql<string>`admins.username`.as("admin_username"),
        admin_fname: sql<string>`admins.fname`.as("admin_fname"),
        admin_lname: sql<string>`admins.lname`.as("admin_lname"),
      })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id))
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

// Get activity logs by action type
export const getActivityLogsByActionType = async (
  action_type: AdminActivityLogInsert["action_type"],
  page: number = 1,
  limit: number = 20,
  village_key?: string
) => {
  try {
    const offset = (page - 1) * limit;
    
    let query = db
      .select({
        log_id: admin_activity_logs.log_id,
        admin_id: admin_activity_logs.admin_id,
        action_type: admin_activity_logs.action_type,
        target_type: admin_activity_logs.target_type,
        target_id: admin_activity_logs.target_id,
        old_value: admin_activity_logs.old_value,
        new_value: admin_activity_logs.new_value,
        description: admin_activity_logs.description,
        ip_address: admin_activity_logs.ip_address,
        user_agent: admin_activity_logs.user_agent,
        created_at: admin_activity_logs.created_at,
        admin_username: sql<string>`admins.username`.as("admin_username"),
        admin_fname: sql<string>`admins.fname`.as("admin_fname"),
        admin_lname: sql<string>`admins.lname`.as("admin_lname"),
      })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id))
      .where(eq(admin_activity_logs.action_type, action_type))
      .orderBy(desc(admin_activity_logs.created_at))
      .limit(limit)
      .offset(offset);

    if (village_key) {
      query = query.where(eq(db.admins.village_key, village_key));
    }

    const logs = await query;
    
    let countQuery = db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id))
      .where(eq(admin_activity_logs.action_type, action_type));

    if (village_key) {
      countQuery = countQuery.where(eq(db.admins.village_key, village_key));
    }

    const [{ count }] = await countQuery;

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

// Get activity logs by date range
export const getActivityLogsByDateRange = async (
  start_date: Date,
  end_date: Date,
  page: number = 1,
  limit: number = 20,
  village_key?: string
) => {
  try {
    const offset = (page - 1) * limit;
    
    let query = db
      .select({
        log_id: admin_activity_logs.log_id,
        admin_id: admin_activity_logs.admin_id,
        action_type: admin_activity_logs.action_type,
        target_type: admin_activity_logs.target_type,
        target_id: admin_activity_logs.target_id,
        old_value: admin_activity_logs.old_value,
        new_value: admin_activity_logs.new_value,
        description: admin_activity_logs.description,
        ip_address: admin_activity_logs.ip_address,
        user_agent: admin_activity_logs.user_agent,
        created_at: admin_activity_logs.created_at,
        admin_username: sql<string>`admins.username`.as("admin_username"),
        admin_fname: sql<string>`admins.fname`.as("admin_fname"),
        admin_lname: sql<string>`admins.lname`.as("admin_lname"),
      })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id))
      .where(
        and(
          gte(admin_activity_logs.created_at, start_date),
          lte(admin_activity_logs.created_at, end_date)
        )
      )
      .orderBy(desc(admin_activity_logs.created_at))
      .limit(limit)
      .offset(offset);

    if (village_key) {
      query = query.where(eq(db.admins.village_key, village_key));
    }

    const logs = await query;
    
    let countQuery = db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id))
      .where(
        and(
          gte(admin_activity_logs.created_at, start_date),
          lte(admin_activity_logs.created_at, end_date)
        )
      );

    if (village_key) {
      countQuery = countQuery.where(eq(db.admins.village_key, village_key));
    }

    const [{ count }] = await countQuery;

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

// Get activity statistics
export const getActivityStatistics = async (village_key?: string) => {
  try {
    let query = db
      .select({
        action_type: admin_activity_logs.action_type,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id))
      .groupBy(admin_activity_logs.action_type);

    if (village_key) {
      query = query.where(eq(db.admins.village_key, village_key));
    }

    const stats = await query;

    // Get total logs
    let totalQuery = db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(admin_activity_logs)
      .leftJoin(db.admins, eq(admin_activity_logs.admin_id, db.admins.admin_id));

    if (village_key) {
      totalQuery = totalQuery.where(eq(db.admins.village_key, village_key));
    }

    const [{ count: total }] = await totalQuery;

    return {
      total,
      byActionType: stats,
    };
  } catch (error) {
    console.error("Error fetching activity statistics:", error);
    throw error;
  }
}; 