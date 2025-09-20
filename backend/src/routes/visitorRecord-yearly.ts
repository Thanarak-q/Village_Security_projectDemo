import { Elysia } from "elysia";
import { getYearlyVisitorRecords } from "../db/visitorRecordUtils";
import { requireRole } from "../hooks/requireRole";

/**
 * The yearly visitor record routes.
 * Accessible by: admin (เจ้าของโครงการ) only
 * @type {Elysia}
 */
export const visitorRecordYearlyRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  // .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get yearly visitor records statistics.
   * @returns {Promise<Object>} A promise that resolves to an object containing the yearly visitor records.
   */
  .get("/visitor-record-yearly", async () => {
    try {
      const result = await getYearlyVisitorRecords();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching yearly visitor records:", error);
      return {
        success: false,
        error: "Failed to fetch yearly visitor records",
      };
    }
  });
