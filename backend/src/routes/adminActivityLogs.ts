import { Elysia } from "elysia";
import { requireRole } from "../hooks/requireRole";
import {
  getAllActivityLogs,
  getActivityLogsByAdmin,
  getActivityLogsByActionType,
  getActivityLogsByDateRange,
  getActivityStatistics,
} from "../db/adminActivityLogUtils";

// Types
interface GetLogsQuery {
  page?: string;
  limit?: string;
  action_type?: string;
  admin_id?: string;
  start_date?: string;
  end_date?: string;
}

export const adminActivityLogsRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole("admin"))
  
  // Get all activity logs with pagination and filters
  .get("/admin-activity-logs", async ({ query, currentUser }: any) => {
    try {
      const {
        page = "1",
        limit = "20",
        action_type,
        admin_id,
        start_date,
        end_date,
      }: GetLogsQuery = query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const { village_key } = currentUser;

      // Validate pagination parameters
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return {
          success: false,
          error: "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100",
        };
      }

      let result;

      // Filter by specific admin
      if (admin_id) {
        result = await getActivityLogsByAdmin(admin_id, pageNum, limitNum);
      }
      // Filter by action type
      else if (action_type) {
        result = await getActivityLogsByActionType(
          action_type as any,
          pageNum,
          limitNum,
          village_key
        );
      }
      // Filter by date range
      else if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return {
            success: false,
            error: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
          };
        }

        result = await getActivityLogsByDateRange(
          startDate,
          endDate,
          pageNum,
          limitNum,
          village_key
        );
      }
      // Get all logs
      else {
        result = await getAllActivityLogs(pageNum, limitNum, village_key);
      }

      return {
        success: true,
        data: result.logs,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      return {
        success: false,
        error: "Failed to fetch activity logs",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get activity logs by specific admin
  .get("/admin-activity-logs/admin/:admin_id", async ({ params, query, currentUser }: any) => {
    try {
      const { admin_id } = params;
      const { page = "1", limit = "20" } = query;
      const { village_key } = currentUser;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      // Validate pagination parameters
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return {
          success: false,
          error: "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100",
        };
      }

      // Validate admin_id
      if (!admin_id?.trim()) {
        return {
          success: false,
          error: "Admin ID is required",
        };
      }

      const result = await getActivityLogsByAdmin(admin_id, pageNum, limitNum);

      return {
        success: true,
        data: result.logs,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error fetching activity logs by admin:", error);
      return {
        success: false,
        error: "Failed to fetch activity logs by admin",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get activity logs by action type
  .get("/admin-activity-logs/action/:action_type", async ({ params, query, currentUser }: any) => {
    try {
      const { action_type } = params;
      const { page = "1", limit = "20" } = query;
      const { village_key } = currentUser;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      // Validate pagination parameters
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return {
          success: false,
          error: "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100",
        };
      }

      // Validate action_type
      if (!action_type?.trim()) {
        return {
          success: false,
          error: "Action type is required",
        };
      }

      // Validate action_type values
      const validActionTypes = [
        "approve_user", "reject_user",
        "create_house", "update_house", "delete_house", "change_house_status",
        "add_house_member", "remove_house_member",
        "change_user_status", "change_user_role",
        "create_admin", "update_admin", "delete_admin",
        "create_village", "update_village", "delete_village",
        "view_resident", "view_guard", "view_visitor_records",
        "export_data", "system_config"
      ];

      if (!validActionTypes.includes(action_type)) {
        return {
          success: false,
          error: "Invalid action type",
          validActionTypes,
        };
      }

      const result = await getActivityLogsByActionType(
        action_type as any,
        pageNum,
        limitNum,
        village_key
      );

      return {
        success: true,
        data: result.logs,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error fetching activity logs by action type:", error);
      return {
        success: false,
        error: "Failed to fetch activity logs by action type",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get activity logs by date range
  .get("/admin-activity-logs/date-range", async ({ query, currentUser }: any) => {
    try {
      const { start_date, end_date, page = "1", limit = "20" } = query;
      const { village_key } = currentUser;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      // Validate required parameters
      if (!start_date || !end_date) {
        return {
          success: false,
          error: "Start date and end date are required",
        };
      }

      // Validate pagination parameters
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return {
          success: false,
          error: "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100",
        };
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
          success: false,
          error: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
        };
      }

      if (startDate > endDate) {
        return {
          success: false,
          error: "Start date must be before or equal to end date",
        };
      }

      const result = await getActivityLogsByDateRange(
        startDate,
        endDate,
        pageNum,
        limitNum,
        village_key
      );

      return {
        success: true,
        data: result.logs,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error fetching activity logs by date range:", error);
      return {
        success: false,
        error: "Failed to fetch activity logs by date range",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get activity statistics
  .get("/admin-activity-logs/statistics", async ({ currentUser }: any) => {
    try {
      const { village_key } = currentUser;

      const stats = await getActivityStatistics(village_key);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Error fetching activity statistics:", error);
      return {
        success: false,
        error: "Failed to fetch activity statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get available action types for filtering
  .get("/admin-activity-logs/action-types", async () => {
    try {
      const actionTypes = [
        "approve_user",
        "reject_user",
        "create_house",
        "update_house",
        "delete_house",
        "change_house_status",
        "add_house_member",
        "remove_house_member",
        "change_user_status",
        "change_user_role",
        "create_admin",
        "update_admin",
        "delete_admin",
        "create_village",
        "update_village",
        "delete_village",
        "view_resident",
        "view_guard",
        "view_visitor_records",
        "export_data",
        "system_config"
      ];

      return {
        success: true,
        data: actionTypes,
      };
    } catch (error) {
      console.error("Error fetching action types:", error);
      return {
        success: false,
        error: "Failed to fetch action types",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }); 