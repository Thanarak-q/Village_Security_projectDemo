import { Elysia } from "elysia";
import db from "../db/drizzle";
import { villages, admins } from "../db/schema";
import { eq, or, inArray, and, isNull } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

export const villagesRoutes = new Elysia({ prefix: "/api/villages" })
  // Public endpoint for village key validation used during registration
  .get("/check/:villageKey", async ({ params, set }) => {
    try {
      const { villageKey } = params as { villageKey: string };

      const village = await db
        .select({
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(and(
          eq(villages.village_key, villageKey),
          isNull(villages.disable_at),
          eq(villages.status, "active")
        ))
        .then(results => results[0]);

      if (village) {
        return { 
          exists: true, 
          village_key: village.village_key,
          village_name: village.village_name 
        };
      } else {
        return { exists: false };
      }
    } catch (error) {
      console.error("Error checking village:", error);
      set.status = 500;
      return { error: "Failed to check village" };
    }
  })
  .onBeforeHandle(requireRole("*"))
  .get("/", async ({ set }) => {
    try {
      const allVillages = await db.select({
        village_key: villages.village_key,
        village_name: villages.village_name,
      })
      .from(villages)
      .where(and(
        isNull(villages.disable_at),
        eq(villages.status, "active")
      ));
      
      return allVillages;
    } catch (error) {
      console.error("Error fetching villages:", error);
      set.status = 500;
      return { error: "Failed to fetch villages" };
    }
  })
  .onBeforeHandle(requireRole(["admin", "superadmin"]))
  .get("/admin", async ({ currentUser, set }: any) => {
    try {
      // Check if user has admin or superadmin role
      if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "superadmin")) {
        set.status = 403;
        return { 
          success: false, 
          error: "Access denied. Admin role required." 
        };
      }

      const { role, village_ids } = currentUser;
      
      let adminVillages;
      
      if (role === "superadmin") {
        // Superadmin can see all villages
        adminVillages = await db
          .select({
            village_id: villages.village_id,
            village_key: villages.village_key,
            village_name: villages.village_name,
          })
          .from(villages);
      } else {
        // Regular admin can only see their assigned villages
        const allowedVillageIds: string[] = Array.isArray(village_ids)
          ? village_ids
          : [];

        if (!allowedVillageIds.length) {
          return { 
            success: true, 
            data: [], 
            message: "No villages assigned to this admin" 
          };
        }
        
        adminVillages = await db
          .select({
            village_id: villages.village_id,
            village_key: villages.village_key,
            village_name: villages.village_name,
          })
          .from(villages)
          .where(inArray(villages.village_id, allowedVillageIds));
      }
      
      return {
        success: true,
        data: adminVillages,
        total: adminVillages.length
      };
    } catch (error) {
      console.error("Error fetching admin villages:", error);
      set.status = 500;
      return { 
        success: false, 
        error: "Failed to fetch admin villages" 
      };
    }
  })
