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
      // Extract village_id from query parameters
      let village_id = query?.village_id;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_id && request?.url) {
        const url = new URL(request.url);
        village_id = url.searchParams.get('village_id');
      }
      
      const { village_ids, role } = currentUser;

      console.log("Extracted village_id:", village_id);
      console.log("Available village_ids:", village_ids);

      // Validate village_id parameter
      if (!village_id || typeof village_id !== 'string') {
        return {
          success: false,
          error: "Village ID is required",
        };
      }

      // Check if user has access to the specified village
      if (!village_ids.includes(village_id)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }

      // Fetch houses for the specific village
      const result = await db
        .select()
        .from(houses)
        .where(eq(houses.village_id, village_id));

      return {
        success: true,
        data: result,
        total: result.length,
        village_id: village_id,
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
      const { village_ids, role } = currentUser;

      if (!village_ids || village_ids.length === 0) {
        return {
          success: false,
          error: "No village assigned to user",
        };
      }

      // Fetch village information for the user's assigned village
      const result = await db
        .select()
        .from(villages)
        .where(eq(villages.village_id, village_ids[0]));

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
