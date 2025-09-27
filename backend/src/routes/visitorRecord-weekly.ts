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
      // Extract village_key from query parameters
      let village_key = query?.village_key;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_key && request?.url) {
        const url = new URL(request.url);
        village_key = url.searchParams.get('village_key');
      }
      
      const { village_keys, role } = currentUser;

      console.log("Weekly Records - Extracted village_key:", village_key);
      console.log("Weekly Records - Available village_keys:", village_keys);

      // Validate village_key parameter
      if (!village_key || typeof village_key !== 'string') {
        return {
          success: false,
          error: "Village key is required",
        };
      }

      // Check if admin has access to the specified village
      if (role !== "superadmin" && !village_keys.includes(village_key)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }
      
      const result = await getWeeklyVisitorRecords([village_key], role);
      return { 
        success: true, 
        data: result,
        village_key: village_key 
      };
    } catch (error) {
      console.error("Error fetching weekly visitor records:", error);
      return {
        success: false,
        error: "Failed to fetch weekly visitor records",
      };
    }
  });
