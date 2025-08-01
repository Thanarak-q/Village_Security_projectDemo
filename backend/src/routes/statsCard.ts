import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents, visitor_records, guards } from "../db/schema";
import { eq, count, and, gte, lt } from "drizzle-orm";

export const statsCardRoutes = new Elysia({ prefix: "/api" })

  // Get resident count and visitor record stats for today
  .get("/statsCard", async () => {
    try {
      // Get today's date range (start of day to end of day)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // Count total residents
      const countResidents = await db.select({ count: count() }).from(residents);
      
      // Count residents with pending status
      const countResidentsPending = await db.select({ count: count() })
        .from(residents)
        .where(eq(residents.status, "pending"));
      
      // Count guards with pending status
      const countGuardsPending = await db.select({ count: count() })
        .from(guards)
        .where(eq(guards.status, "pending"));
      
      // Count visitor records for today
      const countVisitorRecordToday = await db.select({ count: count() })
        .from(visitor_records)
        // อยู่ภายในวันนี้
        .where(
          and(
            gte(visitor_records.createdAt, startOfDay),
            lt(visitor_records.createdAt, endOfDay)
          )
        );
      
      // Count approved visitor records for today
      const countApprovedToday = await db.select({ count: count() })
        .from(visitor_records)
        .where(
          and(
            eq(visitor_records.record_status, "approved"),
            gte(visitor_records.createdAt, startOfDay),
            lt(visitor_records.createdAt, endOfDay)
          )
        );
      
      // Count pending visitor records for today
      const countPendingToday = await db.select({ count: count() })
        .from(visitor_records)
        .where(
          and(
            eq(visitor_records.record_status, "pending"),
            gte(visitor_records.createdAt, startOfDay),
            lt(visitor_records.createdAt, endOfDay)
          )
        );
      
      // Count rejected visitor records for today
      const countRejectedToday = await db.select({ count: count() })
        .from(visitor_records)
        .where(
          and(
            eq(visitor_records.record_status, "rejected"),
            gte(visitor_records.createdAt, startOfDay),
            lt(visitor_records.createdAt, endOfDay)
          )
        );
      
      return { 
        success: true, 
        data: { 
          residentCount: countResidents[0]?.count || 0,
          residentPendingCount: countResidentsPending[0]?.count || 0,
          guardPendingCount: countGuardsPending[0]?.count || 0,
          visitorRecordToday: countVisitorRecordToday[0]?.count || 0,
          visitorApprovedToday: countApprovedToday[0]?.count || 0,
          visitorPendingToday: countPendingToday[0]?.count || 0,
          visitorRejectedToday: countRejectedToday[0]?.count || 0,
          message: "ข้อมูลสถิติประจำวัน"
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: "Failed to fetch statistics",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
  })
  
; 