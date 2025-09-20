import { Elysia, t } from "elysia";
import db from "../db/drizzle";
import { villages, admins } from "../db/schema";
import { eq, count } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";

/**
 * Super Admin Village Management Routes
 * Accessible by: superadmin only
 * @type {Elysia}
 */
export const superAdminVillagesRoutes = new Elysia({ prefix: "/api/superadmin" })
  .onBeforeHandle(requireRole(["superadmin"]))

  /**
   * Get all villages with admin count
   * @returns {Promise<Object>} List of villages with admin count
   */
  .get("/villages", async ({ set }) => {
    try {
      const villagesWithAdminCount = await db
        .select({
          village_id: villages.village_id,
          village_name: villages.village_name,
          village_key: villages.village_key,
          admin_count: count(admins.admin_id),
        })
        .from(villages)
        .leftJoin(admins, eq(villages.village_key, admins.village_key))
        .groupBy(villages.village_id, villages.village_name, villages.village_key);

      return { success: true, data: villagesWithAdminCount };
    } catch (error) {
      console.error("Error fetching villages:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch villages" };
    }
  })

  /**
   * Create a new village
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Created village data
   */
  .post("/villages", async ({ body, set }) => {
    try {
      const { village_name, village_key } = body as {
        village_name: string;
        village_key: string;
      };

      // Validation
      if (!village_name || !village_key) {
        set.status = 400;
        return { success: false, error: "Village name and village key are required" };
      }

      if (village_name.trim().length === 0 || village_key.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Village name and village key cannot be empty" };
      }

      // Check if village_key already exists
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_key.trim()));

      if (existingVillage.length > 0) {
        set.status = 400;
        return { success: false, error: "Village key already exists" };
      }

      // Create village
      const newVillage = await db
        .insert(villages)
        .values({
          village_name: village_name.trim(),
          village_key: village_key.trim(),
        })
        .returning({
          village_id: villages.village_id,
          village_name: villages.village_name,
          village_key: villages.village_key,
        });

      return { success: true, data: newVillage[0] };
    } catch (error) {
      console.error("Error creating village:", error);
      set.status = 500;
      return { success: false, error: "Failed to create village" };
    }
  })

  /**
   * Update a village
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Updated village data
   */
  .put("/villages/:id", async ({ params, body, set }) => {
    try {
      const { id } = params as { id: string };
      const { village_name, village_key } = body as {
        village_name?: string;
        village_key?: string;
      };

      // Check if village exists
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_id, id));

      if (existingVillage.length === 0) {
        set.status = 404;
        return { success: false, error: "Village not found" };
      }

      // Validation
      if (village_name !== undefined && village_name.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Village name cannot be empty" };
      }

      if (village_key !== undefined && village_key.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Village key cannot be empty" };
      }

      // Check if new village_key already exists (if being updated)
      if (village_key && village_key !== existingVillage[0].village_key) {
        const duplicateVillage = await db
          .select()
          .from(villages)
          .where(eq(villages.village_key, village_key.trim()));

        if (duplicateVillage.length > 0) {
          set.status = 400;
          return { success: false, error: "Village key already exists" };
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (village_name !== undefined) updateData.village_name = village_name.trim();
      if (village_key !== undefined) updateData.village_key = village_key.trim();

      // Update village
      const updatedVillage = await db
        .update(villages)
        .set(updateData)
        .where(eq(villages.village_id, id))
        .returning({
          village_id: villages.village_id,
          village_name: villages.village_name,
          village_key: villages.village_key,
        });

      return { success: true, data: updatedVillage[0] };
    } catch (error) {
      console.error("Error updating village:", error);
      set.status = 500;
      return { success: false, error: "Failed to update village" };
    }
  })

  /**
   * Delete a village
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message
   */
  .delete("/villages/:id", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };

      // Check if village exists
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_id, id));

      if (existingVillage.length === 0) {
        set.status = 404;
        return { success: false, error: "Village not found" };
      }

      // Check if village has admins
      const villageAdmins = await db
        .select()
        .from(admins)
        .where(eq(admins.village_key, existingVillage[0].village_key));

      if (villageAdmins.length > 0) {
        set.status = 400;
        return { 
          success: false, 
          error: "Cannot delete village that has admins. Please remove all admins first." 
        };
      }

      // Delete village
      await db
        .delete(villages)
        .where(eq(villages.village_id, id));

      return { success: true, message: "Village deleted successfully" };
    } catch (error) {
      console.error("Error deleting village:", error);
      set.status = 500;
      return { success: false, error: "Failed to delete village" };
    }
  });
