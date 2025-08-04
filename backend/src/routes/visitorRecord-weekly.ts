import { Elysia } from "elysia";
import { getWeeklyVisitorRecords } from "../db/visitorRecordUtils";

export const visitorRecordWeeklyRoutes = new Elysia({ prefix: "/api" })
  // Get weekly visitor records statistics
  .get("/visitor-record-weekly", async () => {
    try {
      const result = await getWeeklyVisitorRecords();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching weekly visitor records:", error);
      return { success: false, error: "Failed to fetch weekly visitor records" };
    }
  });
