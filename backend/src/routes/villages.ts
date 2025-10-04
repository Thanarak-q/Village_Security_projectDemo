import { Elysia } from "elysia";
import db from "../db/drizzle";
import { villages, admins } from "../db/schema";
import { eq, or, inArray, and, isNull } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { requireLiffAuth } from "../hooks/requireLiffAuth";

// Create separate route groups to avoid middleware conflicts
const publicRoutes = new Elysia({ prefix: "/api/villages" })
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
  });

const adminRoutes = new Elysia({ prefix: "/api/villages" })
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
      // Role checking is already handled by requireRole middleware
      const { role, village_keys } = currentUser;
      // Check if user has admin or superadmin role
      if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "superadmin")) {
        set.status = 403;
        return { 
          success: false, 
          error: "Access denied. Admin role required." 
        };
      }

      const { village_ids } = currentUser;
      
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
  });

const generalRoutes = new Elysia({ prefix: "/api/villages" })
  .onBeforeHandle(requireRole("*"))
  .get("/", async ({ set }) => {
    try {
      const allVillages = await db.select({
        village_key: villages.village_key,
        village_name: villages.village_name,
      }).from(villages);
      
      return allVillages;
    } catch (error) {
      console.error("Error fetching villages:", error);
      set.status = 500;
      return { error: "Failed to fetch villages" };
    }
  });

const liffRoutes = new Elysia({ prefix: "/api/villages" })
  .onBeforeHandle(requireLiffAuth(["guard", "resident"]))
  .get("/validate", async ({ query, currentUser, set }: any) => {
    try {
      const { id: villageId } = query as { id: string };

      if (!villageId) {
        set.status = 400;
        return {
          success: false,
          error: "Village ID is required"
        };
      }

      // Check if the user has access to this village
      const { village_ids } = currentUser;
      
      // Check if user has access to this village_id
      const hasAccess = village_ids && village_ids.includes(villageId);
      
      if (!hasAccess) {
        set.status = 403;
        return {
          success: false,
          error: "You don't have access to this village"
        };
      }

      // Get village information
      const village = await db
        .select({
          village_id: villages.village_id,
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(eq(villages.village_id, villageId))
        .then(results => results[0]);

      if (!village) {
        set.status = 404;
        return {
          success: false,
          error: "Village not found"
        };
      }

      return {
        success: true,
        data: {
          village_id: village.village_id,
          village_key: village.village_key,
          village_name: village.village_name,
          exists: true
        }
      };
    } catch (error) {
      console.error("Error validating village for LIFF user:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to validate village"
      };
    }
  });

// Combine all routes
export const villagesRoutes = new Elysia()
  .use(publicRoutes)
  .use(adminRoutes)
  .use(generalRoutes)
  .use(liffRoutes);