import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents, guards, villages, houses, house_members } from "../db/schema";
import { eq, sql } from "drizzle-orm";

// Interface for update request
interface UpdateUserRequest {
  userId: string;
  role: 'resident' | 'guard';
  status: string;
  houseNumber?: string;
  notes?: string;
}

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
  .put("/updateUser", async ({ body }) => {
    try {
      const { userId, role, status, houseNumber, notes }: UpdateUserRequest = body as UpdateUserRequest;

      // Validate required fields
      if (!userId || !role || !status) {
        return {
          success: false,
          error: "Missing required fields: userId, role, status"
        };
      }

      // Update based on role
      if (role === 'resident') {
        // Update resident
        const updateResult = await db
          .update(residents)
          .set({
            status: status as "verified" | "pending" | "disable",
            updatedAt: new Date()
          })
          .where(eq(residents.resident_id, userId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            error: "Resident not found"
          };
        }

        // If houseNumber is provided, update house address
        if (houseNumber) {
          // First, get the current house_id for this resident
          const currentHouseMember = await db
            .select()
            .from(house_members)
            .where(eq(house_members.resident_id, userId));

          if (currentHouseMember.length > 0 && currentHouseMember[0].house_id) {
            // Update existing house address
            await db
              .update(houses)
              .set({ address: houseNumber })
              .where(eq(houses.house_id, currentHouseMember[0].house_id));
          } else {
            // Create new house and house_member record
            const villageKey = updateResult[0].village_key;
            
            // Create new house
            const newHouse = await db
              .insert(houses)
              .values({
                address: houseNumber,
                village_key: villageKey
              })
              .returning();

            // Create house_member relationship
            await db
              .insert(house_members)
              .values({
                house_id: newHouse[0].house_id,
                resident_id: userId
              });
          }
        }

        return {
          success: true,
          message: "Resident updated successfully",
          data: updateResult[0]
        };

      } else if (role === 'guard') {
        // Update guard
        const updateResult = await db
          .update(guards)
          .set({
            status: status as "verified" | "pending" | "disable",
            updatedAt: new Date()
          })
          .where(eq(guards.guard_id, userId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            error: "Guard not found"
          };
        }

        return {
          success: true,
          message: "Guard updated successfully",
          data: updateResult[0]
        };

      } else {
        return {
          success: false,
          error: "Invalid role specified"
        };
      }

    } catch (error) {
      console.error("Error updating user:", error);
      return {
        success: false,
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });