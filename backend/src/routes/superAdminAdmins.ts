import { Elysia, t } from "elysia";
import db from "../db/drizzle";
import { admins, villages, admin_villages } from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";

/**
 * Super Admin Admin Management Routes
 * Accessible by: superadmin only
 * @type {Elysia}
 */
export const superAdminAdminsRoutes = new Elysia({ prefix: "/api/superadmin" })
  .onBeforeHandle(requireRole(["superadmin"]))

  /**
   * Get all admins with village information
   * @returns {Promise<Object>} List of admins with village data
   */
  .get("/admins", async ({ set }) => {
    try {
      // Get all admins first (only active admins)
      const allAdmins = await db
        .select({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          createdAt: admins.createdAt,
          updatedAt: admins.updatedAt,
        })
        .from(admins)
        .where(isNull(admins.disable_at))
        .orderBy(admins.createdAt);

      // Get villages for each admin
      const adminsWithVillages = await Promise.all(
        allAdmins.map(async (admin) => {
          const adminVillages = await db
            .select({
              village_key: villages.village_key,
              village_name: villages.village_name,
            })
            .from(admin_villages)
            .innerJoin(villages, eq(admin_villages.village_key, villages.village_key))
            .where(eq(admin_villages.admin_id, admin.admin_id));

          return {
            ...admin,
            village_keys: adminVillages.map(av => av.village_key),
            villages: adminVillages,
          };
        })
      );

      return { success: true, data: adminsWithVillages };
    } catch (error) {
      console.error("Error fetching admins:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch admins" };
    }
  })

  /**
   * Create a new admin
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Created admin data
   */
  .post("/admins", async ({ body, set }) => {
    try {
      const { 
        username, 
        email, 
        password, 
        phone, 
        role, 
        village_keys 
      } = body as {
        username: string;
        email: string;
        password: string;
        phone: string;
        role: "admin" | "staff";
        village_keys?: string[]; // Optional: can create admin without villages
      };

      // Validation
      if (!username || !email || !password || !phone || !role) {
        set.status = 400;
        return { 
          success: false, 
          error: "All fields are required (username, email, password, phone, role)" 
        };
      }

      if (username.trim().length === 0 || email.trim().length === 0 || 
          password.trim().length === 0 || phone.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Fields cannot be empty" };
      }

      if (password.length < 6) {
        set.status = 400;
        return { success: false, error: "Password must be at least 6 characters long" };
      }

      if (!["admin", "staff"].includes(role)) {
        set.status = 400;
        return { success: false, error: "Role must be either 'admin' or 'staff'" };
      }

      // For staff role, village_keys is required
      if (role === "staff" && (!village_keys || village_keys.length === 0)) {
        set.status = 400;
        return { success: false, error: "Staff must be assigned to at least one village" };
      }

      // Check if villages exist (if village_keys provided)
      if (village_keys && village_keys.length > 0) {
        const existingVillages = await db
          .select()
          .from(villages)
          .where(eq(villages.village_key, village_keys[0])); // Check first village

        if (existingVillages.length === 0) {
          set.status = 400;
          return { success: false, error: "One or more villages not found" };
        }

        // Validate all village_keys exist
        for (const villageKey of village_keys) {
          const village = await db
            .select()
            .from(villages)
            .where(eq(villages.village_key, villageKey));
          
          if (village.length === 0) {
            set.status = 400;
            return { success: false, error: `Village ${villageKey} not found` };
          }
        }
      }

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(admins)
        .where(eq(admins.username, username.trim()));

      if (existingUsername.length > 0) {
        set.status = 400;
        return { success: false, error: "Username already exists" };
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email.trim()));

      if (existingEmail.length > 0) {
        set.status = 400;
        return { success: false, error: "Email already exists" };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create admin
      const newAdmin = await db
        .insert(admins)
        .values({
          username: username.trim(),
          email: email.trim(),
          password_hash: hashedPassword,
          phone: phone.trim(),
          role: role,
          status: "verified", // Auto-verify admins created by superadmin
        })
        .returning({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          createdAt: admins.createdAt,
        });

      // Create admin-village relationships (if village_keys provided)
      if (village_keys && village_keys.length > 0) {
        const adminVillageData = village_keys.map(villageKey => ({
          admin_id: newAdmin[0].admin_id,
          village_key: villageKey,
        }));

        await db
          .insert(admin_villages)
          .values(adminVillageData);
      }

      return { 
        success: true, 
        data: {
          ...newAdmin[0],
          village_keys: village_keys || []
        }
      };
    } catch (error) {
      console.error("Error creating admin:", error);
      set.status = 500;
      return { success: false, error: "Failed to create admin" };
    }
  })

  /**
   * Update an admin
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Updated admin data
   */
  .put("/admins/:id", async ({ params, body, set }) => {
    try {
      const { id } = params as { id: string };
      const { 
        username, 
        email, 
        phone, 
        role, 
        village_key, 
        status 
      } = body as {
        username?: string;
        email?: string;
        phone?: string;
        role?: "admin" | "staff";
        village_key?: string;
        status?: "verified" | "pending" | "disable";
      };

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, id));

      if (existingAdmin.length === 0) {
        set.status = 404;
        return { success: false, error: "Admin not found" };
      }

      // Validation
      if (username !== undefined && username.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Username cannot be empty" };
      }

      if (email !== undefined && email.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Email cannot be empty" };
      }

      if (phone !== undefined && phone.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Phone cannot be empty" };
      }

      if (role !== undefined && !["admin", "staff"].includes(role)) {
        set.status = 400;
        return { success: false, error: "Role must be either 'admin' or 'staff'" };
      }

      if (status !== undefined && !["verified", "pending", "disable"].includes(status)) {
        set.status = 400;
        return { success: false, error: "Status must be 'verified', 'pending', or 'disable'" };
      }

      // Check if village exists (if village_key is being updated)
      if (village_key) {
        const village = await db
          .select()
          .from(villages)
          .where(eq(villages.village_key, village_key));

        if (village.length === 0) {
          set.status = 400;
          return { success: false, error: "Village not found" };
        }
      }

      // Check if username already exists (if being updated)
      if (username && username !== existingAdmin[0].username) {
        const existingUsername = await db
          .select()
          .from(admins)
          .where(eq(admins.username, username.trim()));

        if (existingUsername.length > 0) {
          set.status = 400;
          return { success: false, error: "Username already exists" };
        }
      }

      // Check if email already exists (if being updated)
      if (email && email !== existingAdmin[0].email) {
        const existingEmail = await db
          .select()
          .from(admins)
          .where(eq(admins.email, email.trim()));

        if (existingEmail.length > 0) {
          set.status = 400;
          return { success: false, error: "Email already exists" };
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (username !== undefined) updateData.username = username.trim();
      if (email !== undefined) updateData.email = email.trim();
      if (phone !== undefined) updateData.phone = phone.trim();
      if (role !== undefined) updateData.role = role;
      if (status !== undefined) updateData.status = status;
      updateData.updatedAt = new Date();

      // Update admin
      const updatedAdmin = await db
        .update(admins)
        .set(updateData)
        .where(eq(admins.admin_id, id))
        .returning({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          updatedAt: admins.updatedAt,
        });

      // Update admin-village relationship if village_key is provided
      if (village_key !== undefined) {
        // Delete existing relationships
        await db
          .delete(admin_villages)
          .where(eq(admin_villages.admin_id, id));

        // Create new relationship
        await db
          .insert(admin_villages)
          .values({
            admin_id: id,
            village_key: village_key,
          });
      }

      return { success: true, data: updatedAdmin[0] };
    } catch (error) {
      console.error("Error updating admin:", error);
      set.status = 500;
      return { success: false, error: "Failed to update admin" };
    }
  })

  /**
   * Delete an admin
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message
   */
  .delete("/admins/:id", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, id));

      if (existingAdmin.length === 0) {
        set.status = 404;
        return { success: false, error: "Admin not found" };
      }

      // Prevent deleting superadmin
      if (existingAdmin[0].role === "superadmin") {
        set.status = 400;
        return { success: false, error: "Cannot delete superadmin" };
      }

      // Delete admin-village relationships first
      await db
        .delete(admin_villages)
        .where(eq(admin_villages.admin_id, id));

      // Soft delete admin
      await db
        .update(admins)
        .set({ 
          disable_at: new Date(),
          status: "disable"
        })
        .where(eq(admins.admin_id, id));

      return { success: true, message: "Admin deleted successfully" };
    } catch (error) {
      console.error("Error deleting admin:", error);
      set.status = 500;
      return { success: false, error: "Failed to delete admin" };
    }
  })

  /**
   * Add villages to an admin
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Success message
   */
  .post("/admins/:id/villages", async ({ params, body, set }) => {
    try {
      const { id } = params as { id: string };
      const { village_keys } = body as { village_keys: string[] };

      // Validation
      if (!village_keys || !Array.isArray(village_keys) || village_keys.length === 0) {
        set.status = 400;
        return { success: false, error: "village_keys array is required" };
      }

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, id));

      if (existingAdmin.length === 0) {
        set.status = 404;
        return { success: false, error: "Admin not found" };
      }

      // Validate all villages exist
      for (const villageKey of village_keys) {
        const village = await db
          .select()
          .from(villages)
          .where(eq(villages.village_key, villageKey));
        
        if (village.length === 0) {
          set.status = 400;
          return { success: false, error: `Village ${villageKey} not found` };
        }
      }

      // Check for existing relationships to avoid duplicates
      const existingRelations = await db
        .select()
        .from(admin_villages)
        .where(eq(admin_villages.admin_id, id));

      const existingVillageKeys = existingRelations.map(rel => rel.village_key);
      const newVillageKeys = village_keys.filter(key => !existingVillageKeys.includes(key));

      if (newVillageKeys.length === 0) {
        return { success: true, message: "All villages are already assigned to this admin" };
      }

      // Create new admin-village relationships
      const adminVillageData = newVillageKeys.map(villageKey => ({
        admin_id: id,
        village_key: villageKey,
      }));

      await db
        .insert(admin_villages)
        .values(adminVillageData);

      return { 
        success: true, 
        message: `Added ${newVillageKeys.length} village(s) to admin`,
        added_villages: newVillageKeys
      };
    } catch (error) {
      console.error("Error adding villages to admin:", error);
      set.status = 500;
      return { success: false, error: "Failed to add villages to admin" };
    }
  })

  /**
   * Remove a village from an admin
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message
   */
  .delete("/admins/:id/villages/:village_key", async ({ params, set }) => {
    try {
      const { id, village_key } = params as { id: string; village_key: string };

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, id));

      if (existingAdmin.length === 0) {
        set.status = 404;
        return { success: false, error: "Admin not found" };
      }

      // Check if relationship exists
      const existingRelation = await db
        .select()
        .from(admin_villages)
        .where(and(
          eq(admin_villages.admin_id, id),
          eq(admin_villages.village_key, village_key)
        ));

      if (existingRelation.length === 0) {
        set.status = 404;
        return { success: false, error: "Village not assigned to this admin" };
      }

      // Remove the relationship
      await db
        .delete(admin_villages)
        .where(and(
          eq(admin_villages.admin_id, id),
          eq(admin_villages.village_key, village_key)
        ));

      return { success: true, message: "Village removed from admin successfully" };
    } catch (error) {
      console.error("Error removing village from admin:", error);
      set.status = 500;
      return { success: false, error: "Failed to remove village from admin" };
    }
  })

  /**
   * Update admin's villages (replace all)
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Success message
   */
  .put("/admins/:id/villages", async ({ params, body, set }) => {
    try {
      const { id } = params as { id: string };
      const { village_keys } = body as { village_keys: string[] };

      // Validation
      if (!Array.isArray(village_keys)) {
        set.status = 400;
        return { success: false, error: "village_keys must be an array" };
      }

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, id));

      if (existingAdmin.length === 0) {
        set.status = 404;
        return { success: false, error: "Admin not found" };
      }

      // Validate all villages exist (if any provided)
      if (village_keys.length > 0) {
        for (const villageKey of village_keys) {
          const village = await db
            .select()
            .from(villages)
            .where(eq(villages.village_key, villageKey));
          
          if (village.length === 0) {
            set.status = 400;
            return { success: false, error: `Village ${villageKey} not found` };
          }
        }
      }

      // Remove all existing relationships
      await db
        .delete(admin_villages)
        .where(eq(admin_villages.admin_id, id));

      // Create new relationships (if any villages provided)
      if (village_keys.length > 0) {
        const adminVillageData = village_keys.map(villageKey => ({
          admin_id: id,
          village_key: villageKey,
        }));

        await db
          .insert(admin_villages)
          .values(adminVillageData);
      }

      return { 
        success: true, 
        message: `Updated admin villages successfully`,
        village_keys: village_keys
      };
    } catch (error) {
      console.error("Error updating admin villages:", error);
      set.status = 500;
      return { success: false, error: "Failed to update admin villages" };
    }
  });
