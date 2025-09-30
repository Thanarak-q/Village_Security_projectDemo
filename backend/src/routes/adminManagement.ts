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
  .get("/villages", async ({ set, user }: any) => {
    try {
      const adminId = user.admin_id;

      const adminVillages = await db
        .select({
          village_id: villages.village_id,
          village_name: villages.village_name,
          created_at: admin_villages.created_at,
        })
        .from(admin_villages)
        .innerJoin(villages, eq(admin_villages.village_id, villages.village_id))
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
  .post("/select-village", async ({ body, set, user }: any) => {
    try {
      const { village_id } = body as { village_id: string };
      const adminId = user.admin_id;

      // Validation
      if (!village_id?.trim()) {
        set.status = 400;
        return { success: false, error: "village_id is required" };
      }

      const normalizedVillageId = village_id.trim();

      // Check if admin has access to this village
      const adminVillage = await db
        .select({
          village_id: villages.village_id,
          village_name: villages.village_name,
        })
        .from(admin_villages)
        .innerJoin(villages, eq(admin_villages.village_id, villages.village_id))
        .where(and(
          eq(admin_villages.admin_id, adminId),
          eq(admin_villages.village_id, normalizedVillageId)
        ));

      if (adminVillage.length === 0) {
        set.status = 403;
        return { success: false, error: "You don't have access to this village" };
      }

      const targetVillage = adminVillage[0];

      // In a real application, you might store this in session or JWT
      // For now, we'll just return success with village info
      return { 
        success: true, 
        message: "Village selected successfully",
        data: {
          village_id: targetVillage.village_id,
          village_name: targetVillage.village_name
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
  .post("/staff/create", async ({ body, set, user }: any) => {
    try {
      const { 
        village_id,
        email, 
        fname, 
        lname, 
        phone 
      } = body as {
        village_id: string;
        email: string;
        fname: string;
        lname: string;
        phone: string;
      };

      const adminId = user.admin_id;

      // Validation
      if (!village_id?.trim() || !email?.trim() || !fname?.trim() || !lname?.trim() || !phone?.trim()) {
        set.status = 400;
        return { 
          success: false, 
          error: "All fields are required (village_id, email, fname, lname, phone)" 
        };
      }

      const normalizedVillageId = village_id.trim();
      const trimmedEmail = email.trim();
      const trimmedFname = fname.trim();
      const trimmedLname = lname.trim();
      const trimmedPhone = phone.trim();

      // Check if admin has access to this village and get village info
      const adminVillage = await db
        .select({
          village_id: villages.village_id,
          village_name: villages.village_name,
        })
        .from(admin_villages)
        .innerJoin(villages, eq(admin_villages.village_id, villages.village_id))
        .where(and(
          eq(admin_villages.admin_id, adminId),
          eq(admin_villages.village_id, normalizedVillageId)
        ));

      if (adminVillage.length === 0) {
        set.status = 403;
        return { success: false, error: "You don't have access to this village" };
      }

      const targetVillage = adminVillage[0];

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(guards)
        .where(eq(guards.email, trimmedEmail));

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
          email: trimmedEmail,
          fname: trimmedFname,
          lname: trimmedLname,
          phone: trimmedPhone,
          village_id: targetVillage.village_id,
          status: "pending", // Staff needs approval
        })
        .returning({
          guard_id: guards.guard_id,
          email: guards.email,
          fname: guards.fname,
          lname: guards.lname,
          phone: guards.phone,
          village_id: guards.village_id,
          status: guards.status,
          createdAt: guards.createdAt,
        });

      return { 
        success: true, 
        data: {
          ...newStaff[0],
          village_name: targetVillage.village_name,
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
  .get("/staff", async ({ query, set, user }: any) => {
    try {
      const { village_id } = query as { village_id: string };
      const adminId = user.admin_id;

      // Validation
      if (!village_id?.trim()) {
        set.status = 400;
        return { success: false, error: "village_id is required" };
      }

      const normalizedVillageId = village_id.trim();

      // Check if admin has access to this village
      const adminVillage = await db
        .select()
        .from(admin_villages)
        .where(and(
          eq(admin_villages.admin_id, adminId),
          eq(admin_villages.village_id, normalizedVillageId)
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
        .where(eq(guards.village_id, normalizedVillageId))
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
  .put("/staff/:id/status", async ({ params, body, set, user }: any) => {
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
      if (!staff[0].village_id) {
        set.status = 400;
        return { success: false, error: "Staff member has no associated village" };
      }

      const adminVillage = await db
        .select()
        .from(admin_villages)
        .where(and(
          eq(admin_villages.admin_id, adminId),
          eq(admin_villages.village_id, staff[0].village_id)
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
