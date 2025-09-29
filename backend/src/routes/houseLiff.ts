import { Elysia } from "elysia";
import db from "../db/drizzle";
import { houses, villages } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireLiffAuth } from "../hooks/requireLiffAuth";

/**
 * The house management routes for LIFF users (guards and residents).
 * Accessible by: guard (ยามรักษาความปลอดภัย) and resident (ผู้อยู่อาศัย)
 * @type {Elysia}
 */
export const houseLiffRoutes = new Elysia({ prefix: "/api" })
  // Test endpoint to check if the route is accessible
  .get("/houses/liff/test", async () => {
    return {
      success: true,
      message: "LIFF houses API is accessible",
      timestamp: new Date().toISOString(),
    };
  })
  .onBeforeHandle(requireLiffAuth(["guard", "resident"]))

  // Get houses for LIFF users (guards and residents) - accessible by guards and residents only
  .get("/houses/liff", async ({ query, currentUser, request }: any) => {
    console.log("🏠 LIFF houses API called");
    console.log("currentUser", currentUser);
    console.log("query", query);
    console.log("request URL:", request?.url);
    
    try {
      // Extract village_key from query parameters
      let village_key = query?.village_key;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_key && request?.url) {
        const url = new URL(request.url);
        village_key = url.searchParams.get('village_key');
      }
      
      const { village_keys, role } = currentUser;

      console.log("Extracted village_key:", village_key);
      console.log("Available village_keys:", village_keys);

      // Validate village_key parameter
      if (!village_key || typeof village_key !== 'string') {
        return {
          success: false,
          error: "Village key is required",
        };
      }

      // Check if user has access to the specified village
      if (!village_keys.includes(village_key)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }

      // Fetch houses for the specific village
      const result = await db
        .select()
        .from(houses)
        .where(eq(houses.village_key, village_key));

      return {
        success: true,
        data: result,
        total: result.length,
        village_key: village_key,
        user_role: role,
      };
    } catch (error) {
      console.error("Error fetching houses for LIFF:", error);
      return {
        success: false,
        error: "Failed to fetch houses",
      };
    }
  })

  // Get village information for LIFF users
  .get("/villages/liff", async ({ currentUser }: any) => {
    console.log("🏘️ LIFF villages API called");
    console.log("currentUser", currentUser);
    
    try {
      const { village_keys, role } = currentUser;

      if (!village_keys || village_keys.length === 0) {
        return {
          success: false,
          error: "No village assigned to user",
        };
      }

      // Fetch village information for the user's assigned village
      const result = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_keys[0]));

      if (result.length === 0) {
        return {
          success: false,
          error: "Village not found",
        };
      }

      return {
        success: true,
        data: result[0],
        user_role: role,
      };
    } catch (error) {
      console.error("Error fetching village for LIFF:", error);
      return {
        success: false,
        error: "Failed to fetch village information",
      };
    }
  });
