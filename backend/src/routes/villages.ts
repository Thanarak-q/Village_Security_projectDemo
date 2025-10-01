import { Elysia } from "elysia";
import db from "../db/drizzle";
import { villages, admins } from "../db/schema";
import { eq, or, inArray } from "drizzle-orm";
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
        .where(eq(villages.village_key, villageKey))
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
  .onBeforeHandle(requireRole(["admin", "superadmin"]))
  .get("/admin", async ({ currentUser, set }: any) => {
    try {
      // Role checking is already handled by requireRole middleware
      const { role, village_keys } = currentUser;
      
      let adminVillages;
      
      if (role === "superadmin") {
        // Superadmin can see all villages
        adminVillages = await db.select({
          village_key: villages.village_key,
          village_name: villages.village_name,
        }).from(villages);
      } else {
        // Regular admin can only see their assigned villages
        if (!village_keys || village_keys.length === 0) {
          return { 
            success: true, 
            data: [], 
            message: "No villages assigned to this admin" 
          };
        }
        
        adminVillages = await db
          .select({
            village_key: villages.village_key,
            village_name: villages.village_name,
          })
          .from(villages)
          .where(inArray(villages.village_key, village_keys));
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
      const { key: villageKey } = query as { key: string };

      if (!villageKey) {
        set.status = 400;
        return {
          success: false,
          error: "Village key is required"
        };
      }

      // Check if the user has access to this village
      const { village_keys } = currentUser;
      if (!village_keys.includes(villageKey)) {
        set.status = 403;
        return {
          success: false,
          error: "You don't have access to this village"
        };
      }

      // Get village information
      const village = await db
        .select({
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(eq(villages.village_key, villageKey))
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