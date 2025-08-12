import { Elysia } from "elysia";
import { getYearlyVisitorRecords } from "../db/visitorRecordUtils";
import { requireRole } from "../hooks/requireRole";

export const visitorRecordYearlyRoutes = new Elysia({ prefix: "/api" })
.onBeforeHandle(requireRole("admin"))
// .onBeforeHandle(requireRole(["admin", "staff"]))
  // Get yearly visitor records statistics
  .get("/visitor-record-yearly", async () => {
    try {
      const result = await getYearlyVisitorRecords();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching yearly visitor records:", error);
      return { success: false, error: "Failed to fetch yearly visitor records" };
    }
  });
