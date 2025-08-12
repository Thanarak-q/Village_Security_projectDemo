import { Elysia } from "elysia";
import db from "../db/drizzle";
import { admins } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword, verifyPassword } from "../utils/passwordUtils";

export const adminSettingsRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole("admin"))
  
  // Get admin profile for settings page - current user only
  .get("/admin/profile", async ({ currentUser }: any) => {
    try {
      const admin_id = currentUser.admin_id;
      
      const result = await db
        .select({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          village_key: admins.village_key,
          createdAt: admins.createdAt,
          updatedAt: admins.updatedAt
        })
        .from(admins)
        .where(eq(admins.admin_id, admin_id));
      
      if (result.length === 0) {
        return { success: false, error: "Admin not found" };
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      return { success: false, error: "Failed to fetch admin profile" };
    }
  })
  
  // Update admin profile settings (username, email, phone) - current user only
  .put("/admin/profile", async ({ currentUser, body }: any) => {
    try {
      const admin_id = currentUser.admin_id;
      const { username, email, phone } = body as {
        username?: string;
        email?: string;
        phone?: string;
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
      if (username !== undefined && username.trim().length === 0) {
        return { success: false, error: "Username cannot be empty!" };
      }

      if (email !== undefined && email.trim().length === 0) {
        return { success: false, error: "Email cannot be empty!" };
      }

      if (phone !== undefined && phone.trim().length === 0) {
        return { success: false, error: "Phone cannot be empty!" };
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
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      updateData.updatedAt = new Date();

      const result = await db
        .update(admins)
        .set(updateData)
        .where(eq(admins.admin_id, admin_id))
        .returning({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          updatedAt: admins.updatedAt
        });

      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error updating admin profile:", error);
      return { success: false, error: "Failed to update admin profile" };
    }
  })
  
  // Change admin password - current user only
  .put("/admin/password", async ({ currentUser, body }: any) => {
    try {
      const admin_id = currentUser.admin_id;
      const { currentPassword, newPassword } = body as {
        currentPassword: string;
        newPassword: string;
      };

      // Validation
      if (!currentPassword || !newPassword) {
        return { 
          success: false, 
          error: "Current password and new password are required!" 
        };
      }

      if (newPassword.trim().length < 6) {
        return { 
          success: false, 
          error: "New password must be at least 6 characters long!" 
        };
      }

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, admin_id));

      if (existingAdmin.length === 0) {
        return { success: false, error: "Admin not found" };
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(
        currentPassword, 
        existingAdmin[0].password_hash
      );

      if (!isCurrentPasswordValid) {
        return { success: false, error: "Current password is incorrect!" };
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      const result = await db
        .update(admins)
        .set({ 
          password_hash: hashedNewPassword, 
          updatedAt: new Date() 
        })
        .where(eq(admins.admin_id, admin_id))
        .returning({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          updatedAt: admins.updatedAt
        });

      return { 
        success: true, 
        message: "Password changed successfully",
        data: result[0]
      };
    } catch (error) {
      console.error("Error changing admin password:", error);
      return { success: false, error: "Failed to change password" };
    }
  })
  
  // Update admin profile and password together - current user only
  .put("/admin/settings", async ({ currentUser, body }: any) => {
    try {
      const admin_id = currentUser.admin_id;
      const { 
        username, 
        email, 
        phone, 
        currentPassword, 
        newPassword 
      } = body as {
        username?: string;
        email?: string;
        phone?: string;
        currentPassword?: string;
        newPassword?: string;
      };

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, admin_id));

      if (existingAdmin.length === 0) {
        return { success: false, error: "Admin not found" };
      }

      const updateData: any = {};
      let passwordChanged = false;

      // Handle profile updates
      if (username !== undefined && username.trim().length === 0) {
        return { success: false, error: "Username cannot be empty!" };
      }

      if (email !== undefined && email.trim().length === 0) {
        return { success: false, error: "Email cannot be empty!" };
      }

      if (phone !== undefined && phone.trim().length === 0) {
        return { success: false, error: "Phone cannot be empty!" };
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

      // Handle password change
      if (currentPassword && newPassword) {
        if (newPassword.trim().length < 6) {
          return { 
            success: false, 
            error: "New password must be at least 6 characters long!" 
          };
        }

        // Verify current password
        const isCurrentPasswordValid = await verifyPassword(
          currentPassword, 
          existingAdmin[0].password_hash
        );

        if (!isCurrentPasswordValid) {
          return { success: false, error: "Current password is incorrect!" };
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);
        updateData.password_hash = hashedNewPassword;
        passwordChanged = true;
      }

      // Prepare update data
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      updateData.updatedAt = new Date();

      // Update admin
      const result = await db
        .update(admins)
        .set(updateData)
        .where(eq(admins.admin_id, admin_id))
        .returning({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          updatedAt: admins.updatedAt
        });

      return { 
        success: true, 
        message: passwordChanged ? "Profile and password updated successfully" : "Profile updated successfully",
        data: result[0]
      };
    } catch (error) {
      console.error("Error updating admin settings:", error);
      return { success: false, error: "Failed to update admin settings" };
    }
  }); 