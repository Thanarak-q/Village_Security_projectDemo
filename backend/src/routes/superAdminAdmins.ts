import { Elysia, t } from "elysia";
import db from "../db/drizzle";
import { admins, villages, admin_villages } from "../db/schema";
import { eq, and, isNull, isNotNull, inArray } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";
import { randomBytes } from "crypto";

type VillageLookup = {
  village_id: string;
  village_name: string;
};

const sanitizeVillageIds = (villageIds: string[]): string[] => {
  return Array.from(
    new Set(
      villageIds
        .map((id) => id.trim())
        .filter((id): id is string => id.length > 0),
    ),
  );
};

const fetchVillagesByIds = async (villageIds: string[]) => {
  const normalizedVillageIds = sanitizeVillageIds(villageIds);

  if (normalizedVillageIds.length === 0) {
    return {
      normalizedVillageIds,
      villageMap: new Map<string, VillageLookup>(),
    } as const;
  }

  const villageRecords = await db
    .select({
      village_id: villages.village_id,
      village_name: villages.village_name,
    })
    .from(villages)
    .where(inArray(villages.village_id, normalizedVillageIds));

  const villageMap = new Map<string, VillageLookup>();
  villageRecords.forEach((record) => {
    villageMap.set(record.village_id, record);
  });

  return {
    normalizedVillageIds,
    villageMap,
  } as const;
};

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
              village_id: villages.village_id,
              village_name: villages.village_name,
            })
            .from(admin_villages)
            .innerJoin(
              villages,
              eq(admin_villages.village_id, villages.village_id),
            )
            .where(eq(admin_villages.admin_id, admin.admin_id));

          return {
            ...admin,
            village_ids: adminVillages.map((av) => av.village_id),
            villages: adminVillages,
          };
        }),
      );

      return { success: true, data: adminsWithVillages };
    } catch (error) {
      console.error("Error fetching admins:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch admins" };
    }
  })

  /**
   * Get disabled admins with village information
   * @returns {Promise<Object>} List of disabled admins with village data
   */
  .get("/admins/disabled", async ({ set }) => {
    try {
      const disabledAdminsWithVillages = await db
        .select({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          status: admins.status,
          disable_at: admins.disable_at,
          createdAt: admins.createdAt,
          updatedAt: admins.updatedAt,
          village_id: villages.village_id,
          village_name: villages.village_name,
        })
        .from(admins)
        .leftJoin(admin_villages, eq(admins.admin_id, admin_villages.admin_id))
        .leftJoin(villages, eq(admin_villages.village_id, villages.village_id))
        .where(isNotNull(admins.disable_at))
        .orderBy(admins.createdAt);

      // Group admins by admin_id and collect their villages
      const adminMap = new Map();

      disabledAdminsWithVillages.forEach((row) => {
        if (!adminMap.has(row.admin_id)) {
          adminMap.set(row.admin_id, {
            admin_id: row.admin_id,
            username: row.username,
            email: row.email,
            phone: row.phone,
            role: row.role,
            status: row.status,
            disable_at: row.disable_at,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            village_ids: [],
            villages: [],
          });
        }

        if (row.village_id && row.village_name) {
          const admin = adminMap.get(row.admin_id);
          if (!admin.village_ids.includes(row.village_id)) {
            admin.village_ids.push(row.village_id);
            admin.villages.push({
              village_id: row.village_id,
              village_name: row.village_name,
            });
          }
        }
      });

      const disabledAdmins = Array.from(adminMap.values());

      return { success: true, data: disabledAdmins };
    } catch (error) {
      console.error("Error fetching disabled admins:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch disabled admins" };
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
      const { username, email, phone, role, village_ids } = body as {
        username: string;
        email: string;
        phone: string;
        role: "admin" | "staff";
        village_ids?: string[]; // Optional: can create admin without villages
      };

      // Validation
      if (!username || !email || !phone || !role) {
        set.status = 400;
        return {
          success: false,
          error: "All fields are required (username, email, phone, role)",
        };
      }

      if (
        username.trim().length === 0 ||
        email.trim().length === 0 ||
        phone.trim().length === 0
      ) {
        set.status = 400;
        return { success: false, error: "Fields cannot be empty" };
      }

      // Password will be auto-generated

      if (!["admin", "staff"].includes(role)) {
        set.status = 400;
        return {
          success: false,
          error: "Role must be either 'admin' or 'staff'",
        };
      }

      // For staff role, village_ids is required
      if (role === "staff" && (!village_ids || village_ids.length === 0)) {
        set.status = 400;
        return {
          success: false,
          error: "Staff must be assigned to at least one village",
        };
      }

      let normalizedVillageIds: string[] = [];
      let villageLookupMap = new Map<string, VillageLookup>();

      // Check if villages exist (if village_ids provided)
      if (village_ids && village_ids.length > 0) {
        const fetchResult = await fetchVillagesByIds(village_ids);
        normalizedVillageIds = fetchResult.normalizedVillageIds;
        villageLookupMap = fetchResult.villageMap;

        if (normalizedVillageIds.length !== villageLookupMap.size) {
          const missingVillages = normalizedVillageIds.filter(
            (id) => !villageLookupMap.has(id),
          );
          set.status = 400;
          return {
            success: false,
            error: `Village(s) not found: ${missingVillages.join(", ")}`,
          };
        }
      }

      // Validate and normalize username, enforce admin_ prefix
      const rawUsername = username.trim();
      const baseUsername = rawUsername.replace(/^admin_+/i, "");
      const USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;
      if (!USERNAME_REGEX.test(baseUsername)) {
        set.status = 400;
        return {
          success: false,
          error:
            "Invalid username. Use English letters, numbers, dot (.), underscore (_), or dash (-) only",
        };
      }
      const prefixedUsername = `admin_${baseUsername}`;

      // Check if username already exists (with prefix)
      const existingUsername = await db
        .select()
        .from(admins)
        .where(eq(admins.username, prefixedUsername));

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

      // Auto-generate password and hash it (crypto-random)
      const generatedPassword = randomBytes(12)
        .toString("base64url")
        .slice(0, 12);
      const hashedPassword = await hashPassword(generatedPassword);

      // Create admin
      const newAdmin = await db
        .insert(admins)
        .values({
          username: prefixedUsername,
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

      // Create admin-village relationships (if village_ids provided)
      if (normalizedVillageIds.length > 0) {
        const adminVillageData = normalizedVillageIds.map((villageId) => ({
          admin_id: newAdmin[0].admin_id,
          village_id: villageLookupMap.get(villageId)!.village_id,
        }));

        await db.insert(admin_villages).values(adminVillageData);
      }

      return {
        success: true,
        data: {
          ...newAdmin[0],
          village_ids: normalizedVillageIds,
          generated_password: generatedPassword,
        },
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
      const { username, email, phone, role, village_id, status } = body as {
        username?: string;
        email?: string;
        phone?: string;
        role?: "admin" | "staff";
        village_id?: string;
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
        return {
          success: false,
          error: "Role must be either 'admin' or 'staff'",
        };
      }

      if (
        status !== undefined &&
        !["verified", "pending", "disable"].includes(status)
      ) {
        set.status = 400;
        return {
          success: false,
          error: "Status must be 'verified', 'pending', or 'disable'",
        };
      }

      // Check if village exists (if village_id is being updated)
      if (village_id) {
        const village = await db
          .select()
          .from(villages)
          .where(eq(villages.village_id, village_id));

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

      // Update admin-village relationship if village_id is provided
      if (village_id !== undefined) {
        const { normalizedVillageIds, villageMap } = await fetchVillagesByIds([
          village_id,
        ]);
        const normalizedVillageId = normalizedVillageIds[0];

        if (!normalizedVillageId) {
          set.status = 400;
          return { success: false, error: "Village id cannot be empty" };
        }

        const villageRecord = villageMap.get(normalizedVillageId);

        if (!villageRecord) {
          set.status = 400;
          return { success: false, error: "Village not found" };
        }

        // Delete existing relationships
        await db.delete(admin_villages).where(eq(admin_villages.admin_id, id));

        // Create new relationship
        await db.insert(admin_villages).values({
          admin_id: id,
          village_id: villageRecord.village_id,
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
      await db.delete(admin_villages).where(eq(admin_villages.admin_id, id));

      // Soft delete admin
      await db
        .update(admins)
        .set({
          disable_at: new Date(),
          status: "disable",
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
      const { village_ids } = body as { village_ids: string[] };

      // Validation
      if (
        !village_ids ||
        !Array.isArray(village_ids) ||
        village_ids.length === 0
      ) {
        set.status = 400;
        return { success: false, error: "village_ids array is required" };
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

      const { normalizedVillageIds, villageMap } =
        await fetchVillagesByIds(village_ids);

      if (normalizedVillageIds.length !== villageMap.size) {
        const missingVillages = normalizedVillageIds.filter(
          (idValue) => !villageMap.has(idValue),
        );
        set.status = 400;
        return {
          success: false,
          error: `Village(s) not found: ${missingVillages.join(", ")}`,
        };
      }

      // Check for existing relationships to avoid duplicates
      const existingRelations = await db
        .select()
        .from(admin_villages)
        .where(eq(admin_villages.admin_id, id));

      const existingVillageIds = new Set(
        existingRelations.map((rel) => rel.village_id),
      );
      const newVillageIds = normalizedVillageIds.filter((villageIdValue) => {
        const villageRecord = villageMap.get(villageIdValue);
        return (
          villageRecord && !existingVillageIds.has(villageRecord.village_id)
        );
      });

      if (newVillageIds.length === 0) {
        return {
          success: true,
          message: "All villages are already assigned to this admin",
        };
      }

      // Create new admin-village relationships
      const adminVillageData = newVillageIds.map((villageIdValue) => ({
        admin_id: id,
        village_id: villageMap.get(villageIdValue)!.village_id,
      }));

      await db.insert(admin_villages).values(adminVillageData);

      return {
        success: true,
        message: `Added ${newVillageIds.length} village(s) to admin`,
        added_villages: newVillageIds,
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
  .delete("/admins/:id/villages/:village_id", async ({ params, set }) => {
    try {
      const { id, village_id } = params as { id: string; village_id: string };

      // Check if admin exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.admin_id, id));

      if (existingAdmin.length === 0) {
        set.status = 404;
        return { success: false, error: "Admin not found" };
      }

      const { normalizedVillageIds, villageMap } = await fetchVillagesByIds([
        village_id,
      ]);
      const normalizedVillageId = normalizedVillageIds[0];

      if (!normalizedVillageId) {
        set.status = 400;
        return { success: false, error: "Village id cannot be empty" };
      }

      const villageRecord = villageMap.get(normalizedVillageId);

      if (!villageRecord) {
        set.status = 404;
        return { success: false, error: "Village not found" };
      }

      // Check if relationship exists
      const existingRelation = await db
        .select()
        .from(admin_villages)
        .where(
          and(
            eq(admin_villages.admin_id, id),
            eq(admin_villages.village_id, villageRecord.village_id),
          ),
        );

      if (existingRelation.length === 0) {
        set.status = 404;
        return { success: false, error: "Village not assigned to this admin" };
      }

      // Remove the relationship
      await db
        .delete(admin_villages)
        .where(
          and(
            eq(admin_villages.admin_id, id),
            eq(admin_villages.village_id, villageRecord.village_id),
          ),
        );

      return {
        success: true,
        message: "Village removed from admin successfully",
      };
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
      const { village_ids } = body as { village_ids: string[] };

      // Validation
      if (!Array.isArray(village_ids)) {
        set.status = 400;
        return { success: false, error: "village_ids must be an array" };
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

      const { normalizedVillageIds, villageMap } =
        await fetchVillagesByIds(village_ids);

      if (normalizedVillageIds.length !== villageMap.size) {
        const missingVillages = normalizedVillageIds.filter(
          (idValue) => !villageMap.has(idValue),
        );
        set.status = 400;
        return {
          success: false,
          error: `Village(s) not found: ${missingVillages.join(", ")}`,
        };
      }

      // Remove all existing relationships
      await db.delete(admin_villages).where(eq(admin_villages.admin_id, id));

      // Create new relationships (if any villages provided)
      if (normalizedVillageIds.length > 0) {
        const adminVillageData = normalizedVillageIds.map((villageIdValue) => ({
          admin_id: id,
          village_id: villageMap.get(villageIdValue)!.village_id,
        }));

        await db.insert(admin_villages).values(adminVillageData);
      }

      return {
        success: true,
        message: `Updated admin villages successfully`,
        village_ids: normalizedVillageIds,
      };
    } catch (error) {
      console.error("Error updating admin villages:", error);
      set.status = 500;
      return { success: false, error: "Failed to update admin villages" };
    }
  })

  /**
   * Restore a disabled admin
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message
   */
  .patch("/admins/:id/restore", async ({ params, set }) => {
    try {
      const { id } = params as { id: string };

      // Check if admin exists and is disabled
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(and(eq(admins.admin_id, id), isNotNull(admins.disable_at)));

      if (existingAdmin.length === 0) {
        set.status = 404;
        return { success: false, error: "Disabled admin not found" };
      }

      // Restore admin
      await db
        .update(admins)
        .set({
          disable_at: null,
          status: "verified",
        })
        .where(eq(admins.admin_id, id));

      return { success: true, message: "Admin restored successfully" };
    } catch (error) {
      console.error("Error restoring admin:", error);
      set.status = 500;
      return { success: false, error: "Failed to restore admin" };
    }
  });
