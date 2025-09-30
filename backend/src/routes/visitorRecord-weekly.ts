import { Elysia } from "elysia";
import { getWeeklyVisitorRecords } from "../db/visitorRecordUtils";
import { requireRole } from "../hooks/requireRole";

/**
 * The weekly visitor record routes.
 * Accessible by: admin (เจ้าของโครงการ), staff (นิติ)
 * @type {Elysia}
 */
export const visitorRecordWeeklyRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get weekly visitor records statistics.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} A promise that resolves to an object containing the weekly visitor records.
   */
  .get("/visitor-record-weekly", async ({ currentUser, query, request }: any) => {
    try {
      // Extract village_id from query parameters
      let village_id = query?.village_id;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_id && request?.url) {
        const url = new URL(request.url);
        village_id = url.searchParams.get('village_id');
      }
      
      const { village_ids, role } = currentUser;

      console.log("Weekly Records - Extracted village_id:", village_id);
      console.log("Weekly Records - Available village_ids:", village_ids);

      // Validate village_id parameter
      if (!village_id || typeof village_id !== 'string') {
        return {
          success: false,
          error: "Village ID is required",
        };
      }

      // Check if admin has access to the specified village
      if (role !== "superadmin" && !village_ids.includes(village_id)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }
      
      const result = await getWeeklyVisitorRecords([village_id], role);
      return { 
        success: true, 
        data: result,
        village_id: village_id 
      };
    } catch (error) {
      console.error("Error fetching weekly visitor records:", error);
      return {
        success: false,
        error: "Failed to fetch weekly visitor records",
      };
    }
  });
