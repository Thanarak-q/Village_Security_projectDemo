import { Elysia, t } from "elysia";
import db from "../db/drizzle";
import { villages, admins, admin_villages } from "../db/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";
import { generateVillageKey } from "../utils/zodValidation";

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
      const villageRows = await db
        .select({
          village_id: villages.village_id,
          village_name: villages.village_name,
          village_key: villages.village_key,
          address: villages.address,
          status: villages.status,
          disable_at: villages.disable_at,
          admin_id: admins.admin_id,
          admin_username: admins.username,
        })
        .from(villages)
        .leftJoin(admin_villages, eq(villages.village_id, admin_villages.village_id))
        .leftJoin(admins, eq(admin_villages.admin_id, admins.admin_id))
        .where(isNull(villages.disable_at));

      const villageMap = new Map<
        string,
        {
          village_id: string;
          village_name: string;
          village_key: string;
          address: string | null;
          status: string;
          disable_at: Date | null;
          admins: Array<{ admin_id: string; username: string }>;
        }
      >();

      villageRows.forEach((row) => {
        if (!villageMap.has(row.village_id)) {
          villageMap.set(row.village_id, {
            village_id: row.village_id,
            village_name: row.village_name,
            village_key: row.village_key,
            address: row.address,
            status: row.status,
            disable_at: row.disable_at,
            admins: [],
          });
        }

        const villageEntry = villageMap.get(row.village_id)!;

        if (
          row.admin_id &&
          row.admin_username &&
          !villageEntry.admins.some((admin) => admin.admin_id === row.admin_id)
        ) {
          villageEntry.admins.push({
            admin_id: row.admin_id,
            username: row.admin_username,
          });
        }
      });

      const villagesWithAdmins = Array.from(villageMap.values()).map((village) => ({
        ...village,
        admin_count: village.admins.length,
      }));

      return { success: true, data: villagesWithAdmins };
    } catch (error) {
      console.error("Error fetching villages:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch villages" };
    }
  })

  /**
   * Get disabled villages with admin count
   * @returns {Promise<Object>} List of disabled villages with admin count
   */
  .get("/villages/disabled", async ({ set }) => {
    try {
      const disabledVillageRows = await db
        .select({
          village_id: villages.village_id,
          village_name: villages.village_name,
          village_key: villages.village_key,
          address: villages.address,
          status: villages.status,
          disable_at: villages.disable_at,
          admin_id: admins.admin_id,
          admin_username: admins.username,
        })
        .from(villages)
        .leftJoin(admin_villages, eq(villages.village_id, admin_villages.village_id))
        .leftJoin(admins, eq(admin_villages.admin_id, admins.admin_id))
        .where(isNotNull(villages.disable_at));

      const disabledVillageMap = new Map<
        string,
        {
          village_id: string;
          village_name: string;
          village_key: string;
          address: string | null;
          status: string;
          disable_at: Date | null;
          admins: Array<{ admin_id: string; username: string }>;
        }
      >();

      disabledVillageRows.forEach((row) => {
        if (!disabledVillageMap.has(row.village_id)) {
          disabledVillageMap.set(row.village_id, {
            village_id: row.village_id,
            village_name: row.village_name,
            village_key: row.village_key,
            address: row.address,
            status: row.status,
            disable_at: row.disable_at,
            admins: [],
          });
        }

        const villageEntry = disabledVillageMap.get(row.village_id)!;

        if (
          row.admin_id &&
          row.admin_username &&
          !villageEntry.admins.some((admin) => admin.admin_id === row.admin_id)
        ) {
          villageEntry.admins.push({
            admin_id: row.admin_id,
            username: row.admin_username,
          });
        }
      });

      const disabledVillagesWithAdmins = Array.from(disabledVillageMap.values()).map(
        (village) => ({
          ...village,
          admin_count: village.admins.length,
        })
      );

      return { success: true, data: disabledVillagesWithAdmins };
    } catch (error) {
      console.error("Error fetching disabled villages:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch disabled villages" };
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
      const { village_name, address } = body as {
        village_name: string;
        address?: string;
      };

      // Validation
      if (!village_name) {
        set.status = 400;
        return { success: false, error: "Village name is required" };
      }

      if (village_name.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Village name cannot be empty" };
      }

      // Create village
      const newVillage = await db
        .insert(villages)
        .values({
          village_name: village_name.trim(),
          address: address?.trim() || null,
          village_key: generateVillageKey(), // Auto-generate village_key with new format
        })
        .returning({
          village_id: villages.village_id,
          village_name: villages.village_name,
          village_key: villages.village_key,
          address: villages.address,
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
      const { village_name, address } = body as {
        village_name?: string;
        address?: string;
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

      // Prepare update data
      const updateData: any = {};
      if (village_name !== undefined) updateData.village_name = village_name.trim();
      if (address !== undefined) updateData.address = address.trim();

      // Update village
      const updatedVillage = await db
        .update(villages)
        .set(updateData)
        .where(eq(villages.village_id, id))
        .returning({
          village_id: villages.village_id,
          village_name: villages.village_name,
          village_key: villages.village_key,
          address: villages.address,
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

      // Check if village exists and is not already disabled
      const existingVillage = await db
        .select()
        .from(villages)
        .where(and(
          eq(villages.village_id, id),
          isNull(villages.disable_at)
        ));

      if (existingVillage.length === 0) {
        set.status = 404;
        return { success: false, error: "Village not found or already disabled" };
      }

      // Check if village has admins
      const villageAdmins = await db
        .select()
        .from(admin_villages)
        .where(eq(admin_villages.village_id, existingVillage[0].village_id));

      if (villageAdmins.length > 0) {
        set.status = 400;
        return { 
          success: false, 
          error: "Cannot delete village that has admins. Please remove all admins first." 
        };
      }

      // Soft delete village
      await db
        .update(villages)
        .set({ 
          disable_at: new Date(),
          status: "disable"
        })
        .where(eq(villages.village_id, id));

      return { success: true, message: "Village disabled successfully" };
    } catch (error) {
      console.error("Error deleting village:", error);
      set.status = 500;
      return { success: false, error: "Failed to delete village" };
    }
  })

  /**
   * Restore a disabled village
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message
   */
  .patch("/villages/:id/restore", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };

      // Check if village exists and is disabled
      const existingVillage = await db
        .select()
        .from(villages)
        .where(and(
          eq(villages.village_id, id),
          isNotNull(villages.disable_at)
        ));

      if (existingVillage.length === 0) {
        set.status = 404;
        return { success: false, error: "Disabled village not found" };
      }

      // Restore village
      await db
        .update(villages)
        .set({ 
          disable_at: null,
          status: "active"
        })
        .where(eq(villages.village_id, id));

      return { success: true, message: "Village restored successfully" };
    } catch (error) {
      console.error("Error restoring village:", error);
      set.status = 500;
      return { success: false, error: "Failed to restore village" };
    }
  });
