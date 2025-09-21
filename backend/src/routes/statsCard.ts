import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents, visitor_records, guards } from "../db/schema";
import { eq, count, and, gte, lt, inArray } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

/**
 * Interface for the statistics data.
 * @interface
 */
interface StatsData {
  residentCount: number;
  residentPendingCount: number;
  guardPendingCount: number;
  visitorRecordToday: number;
  visitorApprovedToday: number;
  visitorPendingToday: number;
  visitorRejectedToday: number;
}

/**
 * Gets the start and end of the current day.
 * @returns {Object} An object containing the start and end of the day.
 */
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

/**
 * Gets the count from a database query result.
 * @param {any[]} result - The result of the database query.
 * @returns {number} The count.
 */
const getCountFromResult = (result: any[]): number => {
  return result[0]?.count || 0;
};

/**
 * The statistics card routes.
 * Accessible by: admin (เจ้าของโครงการ), staff (นิติ)
 * @type {Elysia}
 */
export const statsCardRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get resident count and visitor record stats for today.
   * @returns {Promise<Object>} A promise that resolves to an object containing the statistics data.
   */
  .get("/statsCard", async ({ currentUser }: any) => {
    try {
      const { startOfDay, endOfDay } = getTodayDateRange();
      const { village_keys, role } = currentUser;

      // Count total residents (filtered by village if not superadmin)
      const countResidents = role === "superadmin"
        ? await db.select({ count: count() }).from(residents)
        : await db.select({ count: count() }).from(residents).where(inArray(residents.village_key, village_keys));

      // Count residents with pending status (filtered by village if not superadmin)
      const countResidentsPending = role === "superadmin"
        ? await db
            .select({ count: count() })
            .from(residents)
            .where(eq(residents.status, "pending"))
        : await db
            .select({ count: count() })
            .from(residents)
            .where(and(eq(residents.status, "pending"), inArray(residents.village_key, village_keys)));

      // Count guards with pending status (filtered by village if not superadmin)
      const countGuardsPending = role === "superadmin"
        ? await db
            .select({ count: count() })
            .from(guards)
            .where(eq(guards.status, "pending"))
        : await db
            .select({ count: count() })
            .from(guards)
            .where(and(eq(guards.status, "pending"), inArray(guards.village_key, village_keys)));

      // Count visitor records for today (filtered by village if not superadmin)
      const countVisitorRecordToday = role === "superadmin"
        ? await db
            .select({ count: count() })
            .from(visitor_records)
            .where(
              and(
                gte(visitor_records.createdAt, startOfDay),
                lt(visitor_records.createdAt, endOfDay)
              )
            )
        : await db
            .select({ count: count() })
            .from(visitor_records)
            .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
            .where(
              and(
                inArray(residents.village_key, village_keys),
                gte(visitor_records.createdAt, startOfDay),
                lt(visitor_records.createdAt, endOfDay)
              )
            );

      // Count approved visitor records for today (filtered by village if not superadmin)
      const countApprovedToday = role === "superadmin"
        ? await db
            .select({ count: count() })
            .from(visitor_records)
            .where(
              and(
                eq(visitor_records.record_status, "approved"),
                gte(visitor_records.createdAt, startOfDay),
                lt(visitor_records.createdAt, endOfDay)
              )
            )
        : await db
            .select({ count: count() })
            .from(visitor_records)
            .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
            .where(
              and(
                inArray(residents.village_key, village_keys),
                eq(visitor_records.record_status, "approved"),
                gte(visitor_records.createdAt, startOfDay),
                lt(visitor_records.createdAt, endOfDay)
              )
            );

      // Count pending visitor records for today (filtered by village if not superadmin)
      const countPendingToday = role === "superadmin"
        ? await db
            .select({ count: count() })
            .from(visitor_records)
            .where(
              and(
                eq(visitor_records.record_status, "pending"),
                gte(visitor_records.createdAt, startOfDay),
                lt(visitor_records.createdAt, endOfDay)
              )
            )
        : await db
            .select({ count: count() })
            .from(visitor_records)
            .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
            .where(
              and(
                inArray(residents.village_key, village_keys),
                eq(visitor_records.record_status, "pending"),
                gte(visitor_records.createdAt, startOfDay),
                lt(visitor_records.createdAt, endOfDay)
              )
            );

      // Count rejected visitor records for today (filtered by village if not superadmin)
      const countRejectedToday = role === "superadmin"
        ? await db
            .select({ count: count() })
            .from(visitor_records)
            .where(
              and(
                eq(visitor_records.record_status, "rejected"),
                gte(visitor_records.createdAt, startOfDay),
                lt(visitor_records.createdAt, endOfDay)
              )
            )
        : await db
            .select({ count: count() })
            .from(visitor_records)
            .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
            .where(
              and(
                inArray(residents.village_key, village_keys),
                eq(visitor_records.record_status, "rejected"),
                gte(visitor_records.createdAt, startOfDay),
                lt(visitor_records.createdAt, endOfDay)
              )
            );

      const statsData: StatsData = {
        residentCount: getCountFromResult(countResidents),
        residentPendingCount: getCountFromResult(countResidentsPending),
        guardPendingCount: getCountFromResult(countGuardsPending),
        visitorRecordToday: getCountFromResult(countVisitorRecordToday),
        visitorApprovedToday: getCountFromResult(countApprovedToday),
        visitorPendingToday: getCountFromResult(countPendingToday),
        visitorRejectedToday: getCountFromResult(countRejectedToday),
      };

      return {
        success: true,
        data: statsData,
        message: "ข้อมูลสถิติประจำวัน",
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