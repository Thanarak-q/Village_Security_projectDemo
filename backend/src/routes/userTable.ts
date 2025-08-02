import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents, guards, villages, houses, house_members } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export const userTableRoutes = new Elysia({ prefix: "/api" })
  .get("/userTable", async () => {
    try {
      // ดึงข้อมูล residents พร้อม house address
      const residentsData = await db
        .select({
          id: residents.resident_id,
          fname: residents.fname,
          lname: residents.lname,
          email: residents.email,
          phone: residents.phone,
          status: residents.status,
          role: sql`'resident'`.as('role'),
          village_key: residents.village_key,
          house_address: houses.address,
          createdAt: residents.createdAt,
          updatedAt: residents.updatedAt,
        })
        .from(residents)
        .leftJoin(house_members, eq(residents.resident_id, house_members.resident_id))
        .leftJoin(houses, eq(house_members.house_id, houses.house_id))
        .where(eq(residents.status, 'verified'));

      // ดึงข้อมูล guards
      const guardsData = await db
        .select({
          id: guards.guard_id,
          fname: guards.fname,
          lname: guards.lname,
          email: guards.email,
          phone: guards.phone,
          status: guards.status,
          role: sql`'guard'`.as('role'),
          village_key: guards.village_key,
          house_address: sql`NULL`.as('house_address'), // Guards don't have houses
          createdAt: guards.createdAt,
          updatedAt: guards.updatedAt,
        })
        .from(guards)
        .where(eq(guards.status, 'verified'));

      return {
        success: true,
        data: {
          residents: residentsData,
          guards: guardsData,
        },
        total: {
          residents: residentsData.length,
          guards: guardsData.length,
          total: residentsData.length + guardsData.length,
        },
      };
    } catch (error) {
      return { 
        success: false, 
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
  })
; 