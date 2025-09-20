import { Elysia, t } from "elysia";
import db from "../db/drizzle";
import { admins, villages } from "../db/schema";
import { eq, and } from "drizzle-orm";
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
      const adminsWithVillage = await db
        .select({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          village_key: admins.village_key,
          village_name: villages.village_name,
          createdAt: admins.createdAt,
          updatedAt: admins.updatedAt,
        })
        .from(admins)
        .leftJoin(villages, eq(admins.village_key, villages.village_key))
        .orderBy(admins.createdAt);

      return { success: true, data: adminsWithVillage };
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
        village_key 
      } = body as {
        username: string;
        email: string;
        password: string;
        phone: string;
        role: "admin" | "staff";
        village_key: string;
      };

      // Validation
      if (!username || !email || !password || !phone || !role || !village_key) {
        set.status = 400;
        return { 
          success: false, 
          error: "All fields are required (username, email, password, phone, role, village_key)" 
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

      // Check if village exists
      const village = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_key));

      if (village.length === 0) {
        set.status = 400;
        return { success: false, error: "Village not found" };
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
          village_key: village_key,
          status: "verified", // Auto-verify admins created by superadmin
        })
        .returning({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          village_key: admins.village_key,
          createdAt: admins.createdAt,
        });

      return { success: true, data: newAdmin[0] };
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
      if (village_key && village_key !== existingAdmin[0].village_key) {
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
      if (village_key !== undefined) updateData.village_key = village_key;
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
          village_key: admins.village_key,
          updatedAt: admins.updatedAt,
        });

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

      // Delete admin
      await db
        .delete(admins)
        .where(eq(admins.admin_id, id));

      return { success: true, message: "Admin deleted successfully" };
    } catch (error) {
      console.error("Error deleting admin:", error);
      set.status = 500;
      return { success: false, error: "Failed to delete admin" };
    }
  });
