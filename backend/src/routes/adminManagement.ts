import { Elysia, t } from "elysia";
import db from "../db/drizzle";
import { admins, villages, admin_villages, guards } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";

/**
 * Admin Management Routes
 * Accessible by: admin and superadmin
 * @type {Elysia}
 */
export const adminManagementRoutes = new Elysia({ prefix: "/api/admin" })
  .onBeforeHandle(requireRole(["admin", "superadmin"]))

  /**
   * Get admin's assigned villages
   * @param {Object} context - The context for the request.
   * @returns {Promise<Object>} List of villages assigned to the admin
   */
  .get("/villages", async ({ set, user }) => {
    try {
      const adminId = user.admin_id;

      const adminVillages = await db
        .select({
          village_key: villages.village_key,
          village_name: villages.village_name,
          created_at: admin_villages.created_at,
        })
        .from(admin_villages)
        .innerJoin(villages, eq(admin_villages.village_key, villages.village_key))
        .where(eq(admin_villages.admin_id, adminId))
        .orderBy(admin_villages.created_at);

      return { success: true, data: adminVillages };
    } catch (error) {
      console.error("Error fetching admin villages:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch admin villages" };
    }
  })

  /**
   * Select a village for management (store in session/context)
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Success message
   */
  .post("/select-village", async ({ body, set, user }) => {
    try {
      const { village_key } = body as { village_key: string };
      const adminId = user.admin_id;

      // Validation
      if (!village_key) {
        set.status = 400;
        return { success: false, error: "village_key is required" };
      }

      // Check if admin has access to this village
      const adminVillage = await db
        .select()
        .from(admin_villages)
        .where(and(
          eq(admin_villages.admin_id, adminId),
          eq(admin_villages.village_key, village_key)
        ));

      if (adminVillage.length === 0) {
        set.status = 403;
        return { success: false, error: "You don't have access to this village" };
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
          village_name: village[0].village_name
        }
      };
    } catch (error) {
      console.error("Error selecting village:", error);
      set.status = 500;
      return { success: false, error: "Failed to select village" };
    }
  })

  /**
   * Create a new staff for the selected village
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Created staff data
   */
  .post("/staff/create", async ({ body, set, user }) => {
    try {
      const { 
        village_key,
        email, 
        fname, 
        lname, 
        phone 
      } = body as {
        village_key: string;
        email: string;
        fname: string;
        lname: string;
        phone: string;
      };

      const adminId = user.admin_id;

      // Validation
      if (!village_key || !email || !fname || !lname || !phone) {
        set.status = 400;
        return { 
          success: false, 
          error: "All fields are required (village_key, email, fname, lname, phone)" 
        };
      }

      if (email.trim().length === 0 || fname.trim().length === 0 || 
          lname.trim().length === 0 || phone.trim().length === 0) {
        set.status = 400;
        return { success: false, error: "Fields cannot be empty" };
      }

      // Check if admin has access to this village
      const adminVillage = await db
        .select()
        .from(admin_villages)
        .where(and(
          eq(admin_villages.admin_id, adminId),
          eq(admin_villages.village_key, village_key)
        ));

      if (adminVillage.length === 0) {
        set.status = 403;
        return { success: false, error: "You don't have access to this village" };
      }

      // Check if village exists
      const village = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_key));

      if (village.length === 0) {
        set.status = 404;
        return { success: false, error: "Village not found" };
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(guards)
        .where(eq(guards.email, email.trim()));

      if (existingEmail.length > 0) {
        set.status = 400;
        return { success: false, error: "Email already exists" };
      }

      // Create staff (guard) with default password
      const defaultPassword = "staff123"; // In production, generate a secure password
      const hashedPassword = await hashPassword(defaultPassword);

      const newStaff = await db
        .insert(guards)
        .values({
          email: email.trim(),
          fname: fname.trim(),
          lname: lname.trim(),
          phone: phone.trim(),
          village_key: village_key,
          status: "pending", // Staff needs approval
        })
        .returning({
          guard_id: guards.guard_id,
          email: guards.email,
          fname: guards.fname,
          lname: guards.lname,
          phone: guards.phone,
          village_key: guards.village_key,
          status: guards.status,
          createdAt: guards.createdAt,
        });

      return { 
        success: true, 
        data: {
          ...newStaff[0],
          default_password: defaultPassword, // Return for admin to share with staff
          message: "Staff created successfully. Please share the default password with the staff member."
        }
      };
    } catch (error) {
      console.error("Error creating staff:", error);
      set.status = 500;
      return { success: false, error: "Failed to create staff" };
    }
  })

  /**
   * Get staff list for a specific village
   * @param {Object} context - The context for the request.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} List of staff for the village
   */
  .get("/staff", async ({ query, set, user }) => {
    try {
      const { village_key } = query as { village_key: string };
      const adminId = user.admin_id;

      // Validation
      if (!village_key) {
        set.status = 400;
        return { success: false, error: "village_key is required" };
      }

      // Check if admin has access to this village
      const adminVillage = await db
        .select()
        .from(admin_villages)
        .where(and(
          eq(admin_villages.admin_id, adminId),
          eq(admin_villages.village_key, village_key)
        ));

      if (adminVillage.length === 0) {
        set.status = 403;
        return { success: false, error: "You don't have access to this village" };
      }

      // Get staff for the village
      const staffList = await db
        .select({
          guard_id: guards.guard_id,
          email: guards.email,
          fname: guards.fname,
          lname: guards.lname,
          phone: guards.phone,
          status: guards.status,
          hired_date: guards.hired_date,
          createdAt: guards.createdAt,
          updatedAt: guards.updatedAt,
        })
        .from(guards)
        .where(eq(guards.village_key, village_key))
        .orderBy(guards.createdAt);

      return { success: true, data: staffList };
    } catch (error) {
      console.error("Error fetching staff:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch staff" };
    }
  })

  /**
   * Update staff status (approve/reject/disable)
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Success message
   */
  .put("/staff/:id/status", async ({ params, body, set, user }) => {
    try {
      const { id } = params as { id: string };
      const { status } = body as { status: "verified" | "pending" | "disable" };
      const adminId = user.admin_id;

      // Validation
      if (!status || !["verified", "pending", "disable"].includes(status)) {
        set.status = 400;
        return { 
          success: false, 
          error: "Status must be 'verified', 'pending', or 'disable'" 
        };
      }

      // Get staff details
      const staff = await db
        .select()
        .from(guards)
        .where(eq(guards.guard_id, id));

      if (staff.length === 0) {
        set.status = 404;
        return { success: false, error: "Staff not found" };
      }

      // Check if admin has access to this staff's village
      const adminVillage = await db
        .select()
        .from(admin_villages)
        .where(and(
          eq(admin_villages.admin_id, adminId),
          eq(admin_villages.village_key, staff[0].village_key)
        ));

      if (adminVillage.length === 0) {
        set.status = 403;
        return { success: false, error: "You don't have access to this staff member" };
      }

      // Update staff status
      await db
        .update(guards)
        .set({ 
          status: status,
          updatedAt: new Date()
        })
        .where(eq(guards.guard_id, id));

      return { 
        success: true, 
        message: `Staff status updated to ${status} successfully` 
      };
    } catch (error) {
      console.error("Error updating staff status:", error);
      set.status = 500;
      return { success: false, error: "Failed to update staff status" };
    }
  });
