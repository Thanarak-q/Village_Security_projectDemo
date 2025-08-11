import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents, villages } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";

export const residentRoutes = new Elysia({ prefix: "/api" })
.onBeforeHandle(requireRole(["admin", "staff"]))
  // Get all residents
  .get("/residents", async () => {
    try {
      const result = await db.select().from(residents);
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch residents" };
    }
  })
  
  // Get residents by village
  .get("/residents/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;
      
      const result = await db
        .select()
        .from(residents)
        .where(eq(residents.village_key, village_key));
      
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch residents for village" };
    }
  })
  
  // Get single resident by ID
  .get("/residents/:resident_id", async ({ params }) => {
    try {
      const { resident_id } = params;
      
      const result = await db
        .select()
        .from(residents)
        .where(eq(residents.resident_id, resident_id));
      
      if (result.length === 0) {
        return { success: false, error: "Resident not found" };
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      return { error: "Failed to fetch resident" };
    }
  })
  
  // Get resident by username
  .get("/residents/username/:username", async ({ params }) => {
    try {
      const { username } = params;
      
      const result = await db
        .select()
        .from(residents)
        .where(eq(residents.username, username));
      
      if (result.length === 0) {
        return { success: false, error: "Resident not found" };
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      return { error: "Failed to fetch resident" };
    }
  })
  
  // Create new resident
  .post("/residents", async ({ body }) => {
    try {
      const { email, fname, lname, username, password_hash, phone, village_key, status } = body as {
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
      if (!email || !fname || !lname || !username || !password_hash || !phone || !village_key) {
        return { 
          success: false, 
          error: "Missing required fields! email, fname, lname, username, password_hash, phone, and village_key are required." 
        };
      }

      if (email.trim().length === 0) {
        return { 
          success: false, 
          error: "Email cannot be empty!" 
        };
      }

      if (fname.trim().length === 0) {
        return { 
          success: false, 
          error: "First name cannot be empty!" 
        };
      }

      if (lname.trim().length === 0) {
        return { 
          success: false, 
          error: "Last name cannot be empty!" 
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
          error: "Password cannot be empty!" 
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
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_key));

      if (existingVillage.length === 0) {
        return { 
          success: false, 
          error: "Village not found! Please provide a valid village key." 
        };
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(residents)
        .where(eq(residents.email, email));

      if (existingEmail.length > 0) {
        return { 
          success: false, 
          error: "Email already exists! Please use a different email." 
        };
      }

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(residents)
        .where(eq(residents.username, username));

      if (existingUsername.length > 0) {
        return { 
          success: false, 
          error: "Username already exists! Please use a different username." 
        };
      }

      // Hash password before inserting
      const hashedPassword = await hashPassword(password_hash.trim());

      // Insert new resident
      const [newResident] = await db
        .insert(residents)
        .values({
          email: email.trim(),
          fname: fname.trim(),
          lname: lname.trim(),
          username: username.trim(),
          password_hash: hashedPassword,
          phone: phone.trim(),
          village_key: village_key.trim(),
          status: status || "pending",
        })
        .returning();

      return { 
        success: true, 
        message: "Resident created successfully!", 
        data: newResident 
      };
    } catch (error) {
      console.error("Error creating resident:", error);
      return { 
        success: false, 
        error: "Failed to create resident. Please try again." 
      };
    }
  })
  
  // Update resident
  .put("/residents/:resident_id", async ({ params, body }) => {
    try {
      const { resident_id } = params;
      const { email, fname, lname, username, password_hash, phone, village_key, status } = body as {
        email?: string;
        fname?: string;
        lname?: string;
        username?: string;
        password_hash?: string;
        phone?: string;
        village_key?: string;
        status?: "verified" | "pending" | "disable";
      };

      // Check if resident exists
      const existingResident = await db
        .select()
        .from(residents)
        .where(eq(residents.resident_id, resident_id));

      if (existingResident.length === 0) {
        return { 
          success: false, 
          error: "Resident not found!" 
        };
      }

      // Validation
      if (email !== undefined && email.trim().length === 0) {
        return { 
          success: false, 
          error: "Email cannot be empty!" 
        };
      }

      if (fname !== undefined && fname.trim().length === 0) {
        return { 
          success: false, 
          error: "First name cannot be empty!" 
        };
      }

      if (lname !== undefined && lname.trim().length === 0) {
        return { 
          success: false, 
          error: "Last name cannot be empty!" 
        };
      }

      if (username !== undefined && username.trim().length === 0) {
        return { 
          success: false, 
          error: "Username cannot be empty!" 
        };
      }

      if (password_hash !== undefined && password_hash.trim().length === 0) {
        return { 
          success: false, 
          error: "Password cannot be empty!" 
        };
      }

      if (phone !== undefined && phone.trim().length === 0) {
        return { 
          success: false, 
          error: "Phone cannot be empty!" 
        };
      }

      if (village_key !== undefined) {
        if (village_key.trim().length === 0) {
          return { 
            success: false, 
            error: "Village key cannot be empty!" 
          };
        }

        // Check if new village exists
        const existingVillage = await db
          .select()
          .from(villages)
          .where(eq(villages.village_key, village_key));

        if (existingVillage.length === 0) {
          return { 
            success: false, 
            error: "Village not found! Please provide a valid village key." 
          };
        }
      }

      // Check for duplicate email if email is being updated
      if (email !== undefined && email !== existingResident[0].email) {
        const existingEmail = await db
          .select()
          .from(residents)
          .where(eq(residents.email, email));

        if (existingEmail.length > 0) {
          return { 
            success: false, 
            error: "Email already exists! Please use a different email." 
          };
        }
      }

      // Check for duplicate username if username is being updated
      if (username !== undefined && username !== existingResident[0].username) {
        const existingUsername = await db
          .select()
          .from(residents)
          .where(eq(residents.username, username));

        if (existingUsername.length > 0) {
          return { 
            success: false, 
            error: "Username already exists! Please use a different username." 
          };
        }
      }

      // Update resident
      const updateData: any = {};
      if (email !== undefined) updateData.email = email.trim();
      if (fname !== undefined) updateData.fname = fname.trim();
      if (lname !== undefined) updateData.lname = lname.trim();
      if (username !== undefined) updateData.username = username.trim();
      if (password_hash !== undefined) {
        // Hash password if it's being updated
        updateData.password_hash = await hashPassword(password_hash.trim());
      }
      if (phone !== undefined) updateData.phone = phone.trim();
      if (village_key !== undefined) updateData.village_key = village_key.trim();
      if (status !== undefined) updateData.status = status;

      const [updatedResident] = await db
        .update(residents)
        .set(updateData)
        .where(eq(residents.resident_id, resident_id))
        .returning();

      return { 
        success: true, 
        message: "Resident updated successfully!", 
        data: updatedResident 
      };
    } catch (error) {
      console.error("Error updating resident:", error);
      return { 
        success: false, 
        error: "Failed to update resident. Please try again." 
      };
    }
  })
  
  // Delete resident
  .delete("/residents/:resident_id", async ({ params }) => {
    try {
      const { resident_id } = params;

      // Check if resident exists
      const existingResident = await db
        .select()
        .from(residents)
        .where(eq(residents.resident_id, resident_id));

      if (existingResident.length === 0) {
        return { 
          success: false, 
          error: "Resident not found!" 
        };
      }

      // Delete resident
      await db
        .delete(residents)
        .where(eq(residents.resident_id, resident_id));

      return { 
        success: true, 
        message: "Resident deleted successfully!" 
      };
    } catch (error) {
      console.error("Error deleting resident:", error);
      return { 
        success: false, 
        error: "Failed to delete resident. Please try again." 
      };
    }
  }); 