import { Elysia } from "elysia";
import { getWeeklyVisitorRecords } from "../db/visitorRecordUtils";
import { requireRole } from "../hooks/requireRole";

/**
 * The weekly visitor record routes.
 * @type {Elysia}
 */
export const visitorRecordWeeklyRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get weekly visitor records statistics.
   * @returns {Promise<Object>} A promise that resolves to an object containing the weekly visitor records.
   */
  .get("/visitor-record-weekly", async () => {
    try {
      const result = await getWeeklyVisitorRecords();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching weekly visitor records:", error);
      return {
        success: false,
        error: "Failed to fetch weekly visitor records",
      };
    }
  });
