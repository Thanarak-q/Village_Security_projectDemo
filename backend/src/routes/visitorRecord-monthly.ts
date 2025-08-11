import { Elysia } from "elysia";
import { getMonthlyVisitorRecords } from "../db/visitorRecordUtils";
import { requireRole } from "../hooks/requireRole";

export const visitorRecordMonthlyRoutes = new Elysia({ prefix: "/api" })
.onBeforeHandle(requireRole(["admin", "staff"]))
  // Get monthly visitor records statistics for current year
  .get("/visitor-record-monthly", async () => {
    try {
      const result = await getMonthlyVisitorRecords();
      return { 
        success: true, 
        data: result 
      };
    } catch (error) {
      console.error("Error fetching monthly visitor records:", error);
      return { 
        success: false, 
        error: "Failed to fetch monthly visitor records" 
      };
    }
  });
