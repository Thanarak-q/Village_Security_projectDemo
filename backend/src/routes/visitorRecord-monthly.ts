import { Elysia } from "elysia";
import { getMonthlyVisitorRecords } from "../db/visitorRecordUtils";
import { requireRole } from "../hooks/requireRole";

/**
 * The monthly visitor record routes.
 * Accessible by: admin (เจ้าของโครงการ), staff (นิติ)
 * @type {Elysia}
 */
export const visitorRecordMonthlyRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get monthly visitor records statistics for the current year.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} A promise that resolves to an object containing the monthly visitor records.
   */
  .get("/visitor-record-monthly", async ({ currentUser, query }: any) => {
    try {
      const { village_keys, role } = currentUser;
      
      // Get selected village from query parameter, fallback to all villages
      const selectedVillageKey = query?.village_key;
      const targetVillageKeys = selectedVillageKey ? [selectedVillageKey] : village_keys;
      
      const result = await getMonthlyVisitorRecords(targetVillageKeys, role);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error fetching monthly visitor records:", error);
      return {
        success: false,
        error: "Failed to fetch monthly visitor records",
      };
    }
  });
