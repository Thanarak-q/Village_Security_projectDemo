import { Elysia } from "elysia";
import db from "../db/drizzle";
import { guards, villages } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";

/**
 * The guard routes.
 * @type {Elysia}
 */
export const guardRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get all guards.
   * @returns {Promise<Object>} A promise that resolves to an object containing the guards.
   */
  .get("/guards", async () => {
    try {
      const result = await db.select().from(guards);
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch guards" };
    }
  })

  /**
   * Get guards by village.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.village_key - The village key.
   * @returns {Promise<Object>} A promise that resolves to an object containing the guards.
   */
  .get("/guards/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;

      const result = await db
        .select()
        .from(guards)
        .where(eq(guards.village_key, village_key));

      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch guards for village" };
    }
  })

  /**
   * Get a single guard by ID.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.guard_id - The guard ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing the guard.
   */
  .get("/guards/:guard_id", async ({ params }) => {
    try {
      const { guard_id } = params;

      const result = await db
        .select()
        .from(guards)
        .where(eq(guards.guard_id, guard_id));

      if (result.length === 0) {
        return { success: false, error: "Guard not found" };
      }

      return { success: true, data: result[0] };
    } catch (error) {
      return { error: "Failed to fetch guard" };
    }
  })

  /**
   * Get a guard by username.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.username - The username.
   * @returns {Promise<Object>} A promise that resolves to an object containing the guard.
   */
  .get("/guards/username/:username", async ({ params }) => {
    try {
      const { username } = params;

      const result = await db
        .select()
        .from(guards)
        .where(eq(guards.username, username));

      if (result.length === 0) {
        return { success: false, error: "Guard not found" };
      }

      return { success: true, data: result[0] };
    } catch (error) {
      return { error: "Failed to fetch guard" };
    }
  })

  /**
   * Create a new guard.
   * @param {Object} body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the new guard.
   */
  .post("/guards", async ({ body }) => {
    try {
      const {
        email,
        fname,
        lname,
        username,
        password_hash,
        phone,
        village_key,
        status,
      } = body as {
        email: string;
        fname: string;
        lname: string;
        username: string;
        password_hash: string;
        phone: string;
        village_key: string;
        status?: "verified" | "pending" | "disable";
      };

      // Validation
      if (
        !email ||
        !fname ||
        !lname ||
        !username ||
        !password_hash ||
        !phone ||
        !village_key
      ) {
        return {
          success: false,
          error:
            "Missing required fields! email, fname, lname, username, password_hash, phone, and village_key are required.",
        };
      }

      if (email.trim().length === 0) {
        return {
          success: false,
          error: "Email cannot be empty!",
        };
      }

      if (fname.trim().length === 0) {
        return {
          success: false,
          error: "First name cannot be empty!",
        };
      }

      if (lname.trim().length === 0) {
        return {
          success: false,
          error: "Last name cannot be empty!",
        };
      }

      if (username.trim().length === 0) {
        return {
          success: false,
          error: "Username cannot be empty!",
        };
      }

      if (password_hash.trim().length === 0) {
        return {
          success: false,
          error: "Password hash cannot be empty!",
        };
      }

      if (phone.trim().length === 0) {
        return {
          success: false,
          error: "Phone cannot be empty!",
        };
      }

      if (village_key.trim().length === 0) {
        return {
          success: false,
          error: "Village key cannot be empty!",
        };
      }

      // Check if village exists
      const villageExists = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_key));

      if (villageExists.length === 0) {
        return {
          success: false,
          error: "Village not found!",
        };
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(guards)
        .where(eq(guards.email, email));

      if (existingEmail.length > 0) {
        return {
          success: false,
          error: "Email already exists!",
        };
      }

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(guards)
        .where(eq(guards.username, username));

      if (existingUsername.length > 0) {
        return {
          success: false,
          error: "Username already exists!",
        };
      }

      // Hash password before inserting
      const hashedPassword = await hashPassword(password_hash);

      const result = await db
        .insert(guards)
        .values({
          email,
          fname,
          lname,
          username,
          password_hash: hashedPassword,
          phone,
          village_key,
          status: status || "pending",
        })
        .returning();

      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error creating guard:", error);
      return { success: false, error: "Failed to create guard" };
    }
  })

  /**
   * Update a guard.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.guard_id - The guard ID.
   * @param {Object} body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the updated guard.
   */
  .put("/guards/:guard_id", async ({ params, body }) => {
    try {
      const { guard_id } = params;
      const {
        email,
        fname,
        lname,
        username,
        password_hash,
        phone,
        village_key,
        status,
      } = body as {
        email?: string;
        fname?: string;
        lname?: string;
        username?: string;
        password_hash?: string;
        phone?: string;
        village_key?: string;
        status?: "verified" | "pending" | "disable";
      };

      // Check if guard exists
      const existingGuard = await db
        .select()
        .from(guards)
        .where(eq(guards.guard_id, guard_id));

      if (existingGuard.length === 0) {
        return { success: false, error: "Guard not found" };
      }

      // Validation for provided fields
      if (email !== undefined && email.trim().length === 0) {
        return { success: false, error: "Email cannot be empty!" };
      }

      if (fname !== undefined && fname.trim().length === 0) {
        return { success: false, error: "First name cannot be empty!" };
      }

      if (lname !== undefined && lname.trim().length === 0) {
        return { success: false, error: "Last name cannot be empty!" };
      }

      if (username !== undefined && username.trim().length === 0) {
        return { success: false, error: "Username cannot be empty!" };
      }

      if (password_hash !== undefined && password_hash.trim().length === 0) {
        return { success: false, error: "Password hash cannot be empty!" };
      }

      if (phone !== undefined && phone.trim().length === 0) {
        return { success: false, error: "Phone cannot be empty!" };
      }

      if (village_key !== undefined && village_key.trim().length === 0) {
        return { success: false, error: "Village key cannot be empty!" };
      }

      // Check if village exists (if village_key is being updated)
      if (village_key) {
        const villageExists = await db
          .select()
          .from(villages)
          .where(eq(villages.village_key, village_key));

        if (villageExists.length === 0) {
          return { success: false, error: "Village not found!" };
        }
      }

      // Check if email already exists (if email is being updated)
      if (email && email !== existingGuard[0].email) {
        const existingEmail = await db
          .select()
          .from(guards)
          .where(eq(guards.email, email));

        if (existingEmail.length > 0) {
          return { success: false, error: "Email already exists!" };
        }
      }

      // Check if username already exists (if username is being updated)
      if (username && username !== existingGuard[0].username) {
        const existingUsername = await db
          .select()
          .from(guards)
          .where(eq(guards.username, username));

        if (existingUsername.length > 0) {
          return { success: false, error: "Username already exists!" };
        }
      }

      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (fname !== undefined) updateData.fname = fname;
      if (lname !== undefined) updateData.lname = lname;
      if (username !== undefined) updateData.username = username;
      if (password_hash !== undefined) {
        // Hash password if it's being updated
        updateData.password_hash = await hashPassword(password_hash);
      }
      if (phone !== undefined) updateData.phone = phone;
      if (village_key !== undefined) updateData.village_key = village_key;
      if (status !== undefined) updateData.status = status;
      updateData.updatedAt = new Date();

      const result = await db
        .update(guards)
        .set(updateData)
        .where(eq(guards.guard_id, guard_id))
        .returning();

      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error updating guard:", error);
      return { success: false, error: "Failed to update guard" };
    }
  })

  /**
   * Delete a guard.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.guard_id - The guard ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .delete("/guards/:guard_id", async ({ params }) => {
    try {
      const { guard_id } = params;

      // Check if guard exists
      const existingGuard = await db
        .select()
        .from(guards)
        .where(eq(guards.guard_id, guard_id));

      if (existingGuard.length === 0) {
        return { success: false, error: "Guard not found" };
      }

      await db.delete(guards).where(eq(guards.guard_id, guard_id));

      return { success: true, message: "Guard deleted successfully" };
    } catch (error) {
      console.error("Error deleting guard:", error);
      return { success: false, error: "Failed to delete guard" };
    }
  })

  /**
   * Get guards by status.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.status - The status.
   * @returns {Promise<Object>} A promise that resolves to an object containing the guards.
   */
  .get("/guards/status/:status", async ({ params }) => {
    try {
      const { status } = params;

      if (!["verified", "pending", "disable"].includes(status)) {
        return {
          success: false,
          error: "Invalid status. Must be 'verified', 'pending', or 'disable'",
        };
      }

      const result = await db
        .select()
        .from(guards)
        .where(eq(guards.status, status as "verified" | "pending" | "disable"));

      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch guards by status" };
    }
  })

  /**
   * Update a guard's status.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.guard_id - The guard ID.
   * @param {Object} body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the updated guard.
   */
  .patch("/guards/:guard_id/status", async ({ params, body }) => {
    try {
      const { guard_id } = params;
      const { status } = body as { status: "verified" | "pending" | "disable" };

      if (!["verified", "pending", "disable"].includes(status)) {
        return {
          success: false,
          error: "Invalid status. Must be 'verified', 'pending', or 'disable'",
        };
      }

      // Check if guard exists
      const existingGuard = await db
        .select()
        .from(guards)
        .where(eq(guards.guard_id, guard_id));

      if (existingGuard.length === 0) {
        return { success: false, error: "Guard not found" };
      }

      const result = await db
        .update(guards)
        .set({ status, updatedAt: new Date() })
        .where(eq(guards.guard_id, guard_id))
        .returning();

      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error updating guard status:", error);
      return { success: false, error: "Failed to update guard status" };
    }
  }); 