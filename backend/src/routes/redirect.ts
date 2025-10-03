import { Elysia } from "elysia";
import { requireRole } from "../hooks/requireRole";

/**
 * Redirect Routes
 * Provides redirect logic based on user role after login
 * @type {Elysia}
 */
export const redirectRoutes = new Elysia({ prefix: "/api/redirect" })
  .onBeforeHandle(requireRole("*"))

  /**
   * Get redirect URL based on user role
   * @param {Object} context - The context for the request.
   * @returns {Promise<Object>} Redirect URL and user info
   */
  .get("/dashboard", async ({ currentUser }: any) => {
    const { role, village_ids } = currentUser;

    // Super Admin: Redirect to super admin dashboard
    if (role === "superadmin") {
      return {
        success: true,
        redirect_url: "/super-admin-dashboard",
        user_info: {
          role,
          village_ids: [], // Super admin has access to all villages
        },
      };
    }

    // Admin: Always redirect to village selection page
    if (role === "admin") {
      return {
        success: true,
        redirect_url: "/admin-village-selection",
        user_info: {
          role,
          village_ids,
          needs_village_selection: true,
        },
      };
    }

    // Staff: Redirect to regular dashboard (limited access)
    if (role === "staff") {
      // Staff users should have exactly one village assigned
      const staffVillageId = village_ids && village_ids.length > 0 ? village_ids[0] : null;
      
      return {
        success: true,
        redirect_url: "/dashboard",
        user_info: {
          role,
          village_ids,
          limited_access: true,
          // Provide the village id for automatic setting in frontend
          auto_village_id: staffVillageId,
        },
      };
    }

    // Fallback for unknown roles
    return {
      success: false,
      error: "Unknown user role",
      redirect_url: "/login",
    };
  })

  /**
   * Get user's accessible villages for selection
   * @param {Object} context - The context for the request.
   * @returns {Promise<Object>} List of accessible villages
   */
  .get("/villages", async ({ currentUser }: any) => {
    const { role, village_ids } = currentUser;

    // Super Admin: Can access all villages (handled in frontend)
    if (role === "superadmin") {
      return {
        success: true,
        villages: [],
        message: "Super admin has access to all villages",
      };
    }

    // Admin and Staff: Return their assigned villages
    return {
      success: true,
      villages: village_ids || [],
      role,
    };
  });
