import { Elysia } from "elysia";
import db from "../db/drizzle";
import { admin_activity_logs, admins } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

/**
 * The admin activity logs routes.
 * Accessible by: admin (เจ้าของโครงการ) only
 * @type {Elysia}
 */
export const adminActivityLogsRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))

  /**
   * Get admin activity logs for the current admin.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing the activity logs.
   */
  .get("/admin/activity-logs", async ({ currentUser }: any) => {
    try {
      const admin_id = currentUser.admin_id;

      const result = await db
        .select({
          log_id: admin_activity_logs.log_id,
          action_type: admin_activity_logs.action_type,
          description: admin_activity_logs.description,
          created_at: admin_activity_logs.created_at,
          admin_username: admins.username,
        })
        .from(admin_activity_logs)
        .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
        .where(eq(admin_activity_logs.admin_id, admin_id))
        .orderBy(desc(admin_activity_logs.created_at));

      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching admin activity logs:", error);
      return {
        success: false,
        error: "Failed to fetch activity logs",
      };
    }
  })

  /**
   * Get all admin activity logs (for superadmin or debugging purposes).
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing all activity logs.
   */
  .get("/admin/activity-logs/all", async ({ currentUser }: any) => {
    try {
      // Only allow superadmin to see all logs
      if (currentUser.role !== "superadmin") {
        return {
          success: false,
          error: "Access denied. Only superadmin can view all activity logs.",
        };
      }

      const result = await db
        .select({
          log_id: admin_activity_logs.log_id,
          action_type: admin_activity_logs.action_type,
          description: admin_activity_logs.description,
          created_at: admin_activity_logs.created_at,
          admin_username: admins.username,
          admin_email: admins.email,
        })
        .from(admin_activity_logs)
        .leftJoin(admins, eq(admin_activity_logs.admin_id, admins.admin_id))
        .orderBy(desc(admin_activity_logs.created_at));

      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching all admin activity logs:", error);
      return {
        success: false,
        error: "Failed to fetch all activity logs",
      };
    }
  });
