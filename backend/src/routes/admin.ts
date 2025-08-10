import { Elysia } from "elysia";
import db from "../db/drizzle";
import { admins, villages } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";

export const adminRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "superadmin"]))
  // Get all admins
  .get("/admins", async () => {
    try {
      const result = await db.select().from(admins);
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch admins" };
    }
  })
  
  // Get admins by village
  .get("/admins/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;
      
      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.village_key, village_key));
      
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch admins for village" };
    }
  })
  
  // Get single admin by ID
  .get("/admins/:admin_id", async ({ params }) => {
    try {
      const { admin_id } = params;
      
      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, admin_id));
      
      if (result.length === 0) {
        return { success: false, error: "Admin not found" };
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      return { error: "Failed to fetch admin" };
    }
  })
  
  // Get admin by username
  .get("/admins/username/:username", async ({ params }) => {
    try {
      const { username } = params;
      
      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.username, username));
      
      if (result.length === 0) {
        return { success: false, error: "Admin not found" };
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      return { error: "Failed to fetch admin" };
    }
  })
  
  // Create new admin
  .post("/admins", async ({ body }) => {
    try {
      const { email, username, password_hash, phone, village_key, status } = body as {
        email: string;
        username: string;
        password_hash: string;
        phone: string;
        village_key: string;
        status?: "verified" | "pending" | "disable";
      };

      // Validation
      if (!email || !username || !password_hash || !phone || !village_key) {
        return { 
          success: false, 
          error: "Missing required fields! email, username, password_hash, phone, and village_key are required." 
        };
      }

      if (email.trim().length === 0) {
        return { 
          success: false, 
          error: "Email cannot be empty!" 
        };
      }

      if (username.trim().length === 0) {
        return { 
          success: false, 
          error: "Username cannot be empty!" 
        };
      }

      if (password_hash.trim().length === 0) {
        return { 
          success: false, 
          error: "Password hash cannot be empty!" 
        };
      }

      if (phone.trim().length === 0) {
        return { 
          success: false, 
          error: "Phone cannot be empty!" 
        };
      }

      if (village_key.trim().length === 0) {
        return { 
          success: false, 
          error: "Village key cannot be empty!" 
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
          error: "Village not found!" 
        };
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email));

      if (existingEmail.length > 0) {
        return { 
          success: false, 
          error: "Email already exists!" 
        };
      }

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(admins)
        .where(eq(admins.username, username));

      if (existingUsername.length > 0) {
        return { 
          success: false, 
          error: "Username already exists!" 
        };
      }

      // Hash password before inserting
      const hashedPassword = await hashPassword(password_hash);

      const result = await db.insert(admins).values({
        email,
        username,
        password_hash: hashedPassword,
        phone,
        village_key,
        status: status || "pending"
      }).returning();

      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error creating admin:", error);
      return { success: false, error: "Failed to create admin" };
    }
  })
  
  // Update admin
  .put("/admins/:admin_id", async ({ params, body }) => {
    try {
      const { admin_id } = params;
      const { email, username, password_hash, phone, village_key, status } = body as {
        email?: string;
        username?: string;
        password_hash?: string;
        phone?: string;
        village_key?: string;
        status?: "verified" | "pending" | "disable";
      };

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, admin_id));

      if (existingAdmin.length === 0) {
        return { success: false, error: "Admin not found" };
      }

      // Validation for provided fields
      if (email !== undefined && email.trim().length === 0) {
        return { success: false, error: "Email cannot be empty!" };
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
      if (email && email !== existingAdmin[0].email) {
        const existingEmail = await db
          .select()
          .from(admins)
          .where(eq(admins.email, email));

        if (existingEmail.length > 0) {
          return { success: false, error: "Email already exists!" };
        }
      }

      // Check if username already exists (if username is being updated)
      if (username && username !== existingAdmin[0].username) {
        const existingUsername = await db
          .select()
          .from(admins)
          .where(eq(admins.username, username));

        if (existingUsername.length > 0) {
          return { success: false, error: "Username already exists!" };
        }
      }

      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
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
        .update(admins)
        .set(updateData)
        .where(eq(admins.admin_id, admin_id))
        .returning();

      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error updating admin:", error);
      return { success: false, error: "Failed to update admin" };
    }
  })
  
  // Delete admin
  .delete("/admins/:admin_id", async ({ params }) => {
    try {
      const { admin_id } = params;

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, admin_id));

      if (existingAdmin.length === 0) {
        return { success: false, error: "Admin not found" };
      }

      await db.delete(admins).where(eq(admins.admin_id, admin_id));

      return { success: true, message: "Admin deleted successfully" };
    } catch (error) {
      console.error("Error deleting admin:", error);
      return { success: false, error: "Failed to delete admin" };
    }
  })
  
  // Get admins by status
  .get("/admins/status/:status", async ({ params }) => {
    try {
      const { status } = params;
      
      if (!["verified", "pending", "disable"].includes(status)) {
        return { success: false, error: "Invalid status. Must be 'verified', 'pending', or 'disable'" };
      }
      
      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.status, status as "verified" | "pending" | "disable"));
      
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch admins by status" };
    }
  })
  
  // Update admin status
  .patch("/admins/:admin_id/status", async ({ params, body }) => {
    try {
      const { admin_id } = params;
      const { status } = body as { status: "verified" | "pending" | "disable" };

      if (!["verified", "pending", "disable"].includes(status)) {
        return { success: false, error: "Invalid status. Must be 'verified', 'pending', or 'disable'" };
      }

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, admin_id));

      if (existingAdmin.length === 0) {
        return { success: false, error: "Admin not found" };
      }

      const result = await db
        .update(admins)
        .set({ status, updatedAt: new Date() })
        .where(eq(admins.admin_id, admin_id))
        .returning();

      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error updating admin status:", error);
      return { success: false, error: "Failed to update admin status" };
    }
  })
  
  // Get admin by email
  .get("/admins/email/:email", async ({ params }) => {
    try {
      const { email } = params;
      
      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email));
      
      if (result.length === 0) {
        return { success: false, error: "Admin not found" };
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      return { error: "Failed to fetch admin" };
    }
  })
  
  // Get admin count by village
  .get("/admins/count/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;
      
      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.village_key, village_key));
      
      return { success: true, count: result.length, data: result };
    } catch (error) {
      return { error: "Failed to count admins for village" };
    }
  }); 