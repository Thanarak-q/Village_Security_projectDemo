/**
 * @file Restore Routes for Soft-Deleted Records
 * Provides API endpoints to restore disabled entities
 */

import { Elysia } from "elysia";
import { requireRole } from "../hooks/requireRole";
import { 
  restoreVillage, 
  restoreHouse, 
  restoreResident, 
  restoreGuard, 
  restoreAdmin,
  getDisabledRecords 
} from "../utils/restoreUtils";

/**
 * Restore Routes
 * Accessible by: superadmin only
 */
export const restoreRoutes = new Elysia({ prefix: "/api/restore" })
  .onBeforeHandle(requireRole(["superadmin"]))

  /**
   * Restore a disabled village
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message and restored village data
   */
  .put("/village/:id", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };
      const result = await restoreVillage(id);
      
      if (!result.success) {
        set.status = 404;
        return result;
      }
      
      return result;
    } catch (error) {
      console.error("Error restoring village:", error);
      set.status = 500;
      return { success: false, error: "Failed to restore village" };
    }
  })

  /**
   * Restore a disabled house
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message and restored house data
   */
  .put("/house/:id", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };
      const result = await restoreHouse(id);
      
      if (!result.success) {
        set.status = 404;
        return result;
      }
      
      return result;
    } catch (error) {
      console.error("Error restoring house:", error);
      set.status = 500;
      return { success: false, error: "Failed to restore house" };
    }
  })

  /**
   * Restore a disabled resident
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message and restored resident data
   */
  .put("/resident/:id", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };
      const result = await restoreResident(id);
      
      if (!result.success) {
        set.status = 404;
        return result;
      }
      
      return result;
    } catch (error) {
      console.error("Error restoring resident:", error);
      set.status = 500;
      return { success: false, error: "Failed to restore resident" };
    }
  })

  /**
   * Restore a disabled guard
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message and restored guard data
   */
  .put("/guard/:id", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };
      const result = await restoreGuard(id);
      
      if (!result.success) {
        set.status = 404;
        return result;
      }
      
      return result;
    } catch (error) {
      console.error("Error restoring guard:", error);
      set.status = 500;
      return { success: false, error: "Failed to restore guard" };
    }
  })

  /**
   * Restore a disabled admin
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message and restored admin data
   */
  .put("/admin/:id", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };
      const result = await restoreAdmin(id);
      
      if (!result.success) {
        set.status = 404;
        return result;
      }
      
      return result;
    } catch (error) {
      console.error("Error restoring admin:", error);
      set.status = 500;
      return { success: false, error: "Failed to restore admin" };
    }
  })

  /**
   * Get all disabled records for a specific entity type
   * @param {Object} context - The context for the request.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} List of disabled records
   */
  .get("/disabled/:entityType", async ({ params, set }) => {
    try {
      const { entityType } = params as { entityType: string };
      
      if (!["villages", "houses", "residents", "guards", "admins"].includes(entityType)) {
        set.status = 400;
        return { 
          success: false, 
          error: "Invalid entity type. Must be one of: villages, houses, residents, guards, admins" 
        };
      }
      
      const result = await getDisabledRecords(entityType as "villages" | "houses" | "residents" | "guards" | "admins");
      
      if (!result.success) {
        set.status = 500;
        return result;
      }
      
      return result;
    } catch (error) {
      console.error("Error getting disabled records:", error);
      set.status = 500;
      return { success: false, error: "Failed to get disabled records" };
    }
  });
