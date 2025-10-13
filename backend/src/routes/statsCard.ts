import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents, visitor_records, guards, houses } from "../db/schema";
import { eq, count, and, gte, lt, sql } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

interface StatsData {
  residentCount: number;
  residentPendingCount: number;
  guardPendingCount: number;
  visitorRecordToday: number;
  visitorApprovedToday: number;
  visitorPendingToday: number;
  visitorRejectedToday: number;
}

const getTodayDateRange = () => {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );
  return { startOfDay, endOfDay };
};

const getCountFromResult = (result: any[]): number => {
  return result[0]?.count || 0;
};

export const statsCardRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  .get("/statsCard", async ({ currentUser, query, request }: any) => {
    try {
      const { startOfDay, endOfDay } = getTodayDateRange();

      let village_id = query?.village_id;
      if (!village_id && request?.url) {
        const url = new URL(request.url);
        village_id = url.searchParams.get('village_id');
      }

      const { village_ids, role } = currentUser;

      if (!village_id && role === "staff" && village_ids?.length > 0) {
        village_id = village_ids[0];
      }

      if (!village_id || typeof village_id !== 'string') {
        return {
          success: false,
          error: "Village ID is required",
        };
      }

      if (role !== "superadmin" && !village_ids.includes(village_id)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }

      // Optimized queries using Promise.all for parallel execution
      const [
        countResidents,
        countResidentsPending,
        countGuardsPending,
        visitorStats
      ] = await Promise.all([
        // Total verified residents only
        db.select({ count: count() })
          .from(residents)
          .where(and(
            eq(residents.village_id, village_id),
            eq(residents.status, "verified")
          )),

        // Pending residents
        db.select({ count: count() })
          .from(residents)
          .where(and(
            eq(residents.status, "pending"),
            eq(residents.village_id, village_id)
          )),

        // Pending guards
        db.select({ count: count() })
          .from(guards)
          .where(and(
            eq(guards.status, "pending"),
            eq(guards.village_id, village_id)
          )),

        // All visitor stats in one query - using houses instead of residents
        db.select({
          total: count(),
          approved: sql<number>`COUNT(CASE WHEN ${visitor_records.record_status} = 'approved' THEN 1 END)`,
          pending: sql<number>`COUNT(CASE WHEN ${visitor_records.record_status} = 'pending' THEN 1 END)`,
          rejected: sql<number>`COUNT(CASE WHEN ${visitor_records.record_status} = 'rejected' THEN 1 END)`
        })
          .from(visitor_records)
          .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
          .where(and(
            eq(houses.village_id, village_id),
            gte(visitor_records.entry_time, startOfDay),
            lt(visitor_records.entry_time, endOfDay)
          ))
      ]);

      const statsData: StatsData = {
        residentCount: getCountFromResult(countResidents),
        residentPendingCount: getCountFromResult(countResidentsPending),
        guardPendingCount: getCountFromResult(countGuardsPending),
        visitorRecordToday: Number(visitorStats[0]?.total || 0),
        visitorApprovedToday: Number(visitorStats[0]?.approved || 0),
        visitorPendingToday: Number(visitorStats[0]?.pending || 0),
        visitorRejectedToday: Number(visitorStats[0]?.rejected || 0),
      };

      return {
        success: true,
        data: statsData,
        message: "ข้อมูลสถิติประจำวัน",
        village_id: village_id,
      };
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return {
        success: false,
        error: "Failed to fetch statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
