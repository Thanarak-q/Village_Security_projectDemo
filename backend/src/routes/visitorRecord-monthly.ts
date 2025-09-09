import { Elysia } from "elysia";
import { getMonthlyVisitorRecords } from "../db/visitorRecordUtils";
import { requireRole } from "../hooks/requireRole";

/**
 * The monthly visitor record routes.
 * @type {Elysia}
 */
export const visitorRecordMonthlyRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get monthly visitor records statistics for the current year.
   * @returns {Promise<Object>} A promise that resolves to an object containing the monthly visitor records.
   */
  .get("/visitor-record-monthly", async () => {
    try {
      const result = await getMonthlyVisitorRecords();
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
