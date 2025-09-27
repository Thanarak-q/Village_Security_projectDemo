import { Elysia } from "elysia";
import { getYearlyVisitorRecords } from "../db/visitorRecordUtils";
import { requireRole } from "../hooks/requireRole";

/**
 * The yearly visitor record routes.
 * Accessible by: admin (เจ้าของโครงการ), staff (นิติ)
 * @type {Elysia}
 */
export const visitorRecordYearlyRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get yearly visitor records statistics.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} A promise that resolves to an object containing the yearly visitor records.
   */
  .get("/visitor-record-yearly", async ({ currentUser, query }: any) => {
    try {
      const { village_keys, role } = currentUser;
      
      // Get selected village from query parameter, fallback to all villages
      const selectedVillageKey = query?.village_key;
      const targetVillageKeys = selectedVillageKey ? [selectedVillageKey] : village_keys;
      
      const result = await getYearlyVisitorRecords(targetVillageKeys, role);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching yearly visitor records:", error);
      return {
        success: false,
        error: "Failed to fetch yearly visitor records",
      };
    }
  });
