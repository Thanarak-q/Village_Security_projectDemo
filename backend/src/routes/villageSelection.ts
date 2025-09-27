import { Elysia } from "elysia";
import { requireRole } from "../hooks/requireRole";
import db from "../db/drizzle";
import { admins, admin_villages, villages } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Village Selection Routes
 * Handles village selection for admins with multiple villages
 * @type {Elysia}
 */
export const villageSelectionRoutes = new Elysia({ prefix: "/api/village-selection" })
  .onBeforeHandle(requireRole(["admin", "staff"]))

  /**
   * Set selected village for current session
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Success message
   */
  .post("/select", async ({ body, set, currentUser }: any) => {
    try {
      const { village_key } = body as { village_key: string };
      const { admin_id, role, village_keys } = currentUser;

      // Validation
      if (!village_key) {
        set.status = 400;
        return { success: false, error: "village_key is required" };
      }

      // Check if user has access to this village
      if (!village_keys.includes(village_key)) {
        set.status = 403;
        return { 
          success: false, 
          error: "You don't have access to this village" 
        };
      }

      // Get village details
      const village = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_key));

      if (village.length === 0) {
        set.status = 404;
        return { success: false, error: "Village not found" };
      }

      // In a real application, you might store this in session or JWT
      // For now, we'll just return success with village info
      return {
        success: true,
        message: "Village selected successfully",
        data: {
          village_key: village[0].village_key,
          village_name: village[0].village_name,
          user_role: role,
        },
      };
    } catch (error) {
      console.error("Error selecting village:", error);
      set.status = 500;
      return { success: false, error: "Failed to select village" };
    }
  })

  /**
   * Get current user's accessible villages
   * @param {Object} context - The context for the request.
   * @returns {Promise<Object>} List of accessible villages
   */
  .get("/villages", async ({ currentUser }: any) => {
    try {
      const { village_keys } = currentUser;

      if (!village_keys || village_keys.length === 0) {
        return {
          success: true,
          villages: [],
          message: "No villages assigned",
        };
      }

      // Get village details
      const villages_info = await db
        .select({
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(inArray(villages.village_key, village_keys));

      return {
        success: true,
        villages: villages_info,
      };
    } catch (error) {
      console.error("Error fetching villages:", error);
      return { success: false, error: "Failed to fetch villages" };
    }
  })

  /**
   * Get current selected village (if any)
   * @param {Object} context - The context for the request.
   * @returns {Promise<Object>} Current selected village info
   */
  .get("/current", async ({ currentUser }: any) => {
    try {
      const { village_keys, role } = currentUser;

      // For staff, they can only access their assigned village
      if (role === "staff" && village_keys && village_keys.length === 1) {
        const village = await db
          .select({
            village_key: villages.village_key,
            village_name: villages.village_name,
          })
          .from(villages)
          .where(eq(villages.village_key, village_keys[0]));

        return {
          success: true,
          data: village[0] || null,
          auto_selected: true,
        };
      }

      // For admin, they need to select a village
      return {
        success: true,
        data: null,
        needs_selection: true,
        available_villages: village_keys || [],
      };
    } catch (error) {
      console.error("Error getting current village:", error);
      return { success: false, error: "Failed to get current village" };
    }
  });
