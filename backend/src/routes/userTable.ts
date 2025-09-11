import { Elysia } from "elysia";
import db from "../db/drizzle";
import {
  residents,
  guards,
  villages,
  houses,
  house_members,
  visitor_records,
} from "../db/schema";
import { eq, sql, and } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

/**
 * Interface for the update user request.
 * @interface
 */
interface UpdateUserRequest {
  userId: string;
  role: "resident" | "guard";
  status: string;
  houseNumber?: string;
  notes?: string;
}

/**
 * Interface for the change role request.
 * @interface
 */
interface ChangeRoleRequest {
  userId: string;
  currentRole: "resident" | "guard";
  newRole: "resident" | "guard";
  status: string;
  houseNumber?: string;
  notes?: string;
}

/**
 * Gets a resident by user ID.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object|null>} A promise that resolves to the resident object or null if not found.
 */
async function getResident(userId: string) {
  const result = await db
    .select()
    .from(residents)
    .where(eq(residents.resident_id, userId));
  return result[0] || null;
}
/**
 * Gets a guard by user ID.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object|null>} A promise that resolves to the guard object or null if not found.
 */
async function getGuard(userId: string) {
  const result = await db
    .select()
    .from(guards)
    .where(eq(guards.guard_id, userId));
  return result[0] || null;
}

/**
 * Removes house relationships for a user.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object|null>} A promise that resolves to the house member data or null if not found.
 */
async function removeHouseRelationships(userId: string) {
  const houseMemberData = await db
    .select()
    .from(house_members)
    .where(eq(house_members.resident_id, userId));

  if (houseMemberData.length > 0) {
    await db.delete(house_members).where(eq(house_members.resident_id, userId));
  }

  return houseMemberData[0] || null;
}

/**
 * Cleans up visitor records for a user.
 * @param {string} userId - The user ID.
 * @param {"resident" | "guard"} role - The user's role.
 * @returns {Promise<void>}
 */
async function cleanupVisitorRecords(
  userId: string,
  role: "resident" | "guard"
) {
  if (role === "resident") {
    await db
      .delete(visitor_records)
      .where(eq(visitor_records.resident_id, userId));
  } else if (role === "guard") {
    await db
      .delete(visitor_records)
      .where(eq(visitor_records.guard_id, userId));
  }
}

/**
 * Creates a guard from a resident.
 * @param {any} resident - The resident object.
 * @param {string} status - The status of the new guard.
 * @returns {Promise<Object|null>} A promise that resolves to the new guard object or null if creation fails.
 */
async function createGuardFromResident(resident: any, status: string) {
  const result = await db
    .insert(guards)
    .values({
      line_user_id: resident.line_user_id,
      email: resident.email,
      fname: resident.fname,
      lname: resident.lname,
      phone: resident.phone,
      village_key: resident.village_key,
      status: status as "verified" | "pending" | "disable",
      line_display_name: resident.line_display_name,
      line_profile_url: resident.line_profile_url,
    })
    .returning();
  return result[0] || null;
}

/**
 * Creates a resident from a guard.
 * @param {any} guard - The guard object.
 * @param {string} status - The status of the new resident.
 * @returns {Promise<Object|null>} A promise that resolves to the new resident object or null if creation fails.
 */
async function createResidentFromGuard(guard: any, status: string) {
  const result = await db
    .insert(residents)
    .values({
      line_user_id: guard.line_user_id,
      email: guard.email,
      fname: guard.fname,
      lname: guard.lname,
      phone: guard.phone,
      village_key: guard.village_key,
      status: status as "verified" | "pending" | "disable",
      line_display_name: guard.line_display_name,
      line_profile_url: guard.line_profile_url,
    })
    .returning();
  return result[0] || null;
}

/**
 * Cleans up orphaned houses.
 * @param {string} houseId - The house ID.
 * @returns {Promise<void>}
 */
async function cleanupOrphanedHouse(houseId: string) {
  const remainingResidents = await db
    .select()
    .from(house_members)
    .where(eq(house_members.house_id, houseId));

  if (remainingResidents.length === 0) {
    await db.delete(houses).where(eq(houses.house_id, houseId));
  }
}

/**
 * Creates a house for a resident.
 * @param {string} residentId - The resident ID.
 * @param {string} houseNumber - The house number.
 * @param {string | null} villageKey - The village key.
 * @returns {Promise<Object|null>} A promise that resolves to the new house object or null if creation fails.
 */
async function createHouseForResident(
  residentId: string,
  houseNumber: string,
  villageKey: string | null
) {
  if (!villageKey) return null;

  const newHouse = await db
    .insert(houses)
    .values({
      address: houseNumber,
      village_key: villageKey,
    })
    .returning();

  await db.insert(house_members).values({
    house_id: newHouse[0].house_id,
    resident_id: residentId,
  });

  return newHouse[0];
}

/**
 * The user table routes.
 * @type {Elysia}
 */
export const userTableRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin"]))
  /**
   * Get all users for the current user's village.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing the user data.
   */
  .get("/userTable", async ({ currentUser }: any) => {
    try {
      const { village_key } = currentUser;

      const residentsData = await db
        .select({
          id: residents.resident_id,
          fname: residents.fname,
          lname: residents.lname,
          email: residents.email,
          phone: residents.phone,
          status: residents.status,
          role: sql`'resident'`.as("role"),
          village_key: residents.village_key,
          house_address: houses.address,
          createdAt: residents.createdAt,
          updatedAt: residents.updatedAt,
          profile_image_url: residents.line_profile_url,
        })
        .from(residents)
        .where(
          and(
            eq(residents.village_key, village_key),
            sql`${residents.status} != 'pending'`
          )
        )
        .leftJoin(
          house_members,
          eq(residents.resident_id, house_members.resident_id)
        )
        .leftJoin(houses, eq(house_members.house_id, houses.house_id));

      const guardsData = await db
        .select({
          id: guards.guard_id,
          fname: guards.fname,
          lname: guards.lname,
          email: guards.email,
          phone: guards.phone,
          status: guards.status,
          role: sql`'guard'`.as("role"),
          village_key: guards.village_key,
          house_address: sql`NULL`.as("house_address"),
          createdAt: guards.createdAt,
          updatedAt: guards.updatedAt,
          profile_image_url: guards.line_profile_url,
        })
        .from(guards)
        .where(
          and(
            eq(guards.village_key, village_key),
            sql`${guards.status} != 'pending'`
          )
        );

      return {
        success: true,
        currentUser,
        data: {
          residents: residentsData,
          guards: guardsData,
        },
        total: {
          residents: residentsData.length,
          guards: guardsData.length,
          total: residentsData.length + guardsData.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  /**
   * Update a user.
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .put("/updateUser", async ({ body }) => {
    try {
      const { userId, role, status, houseNumber, notes }: UpdateUserRequest =
        body as UpdateUserRequest;

      // Validate required fields
      if (!userId || !role || !status) {
        return {
          success: false,
          error: "Missing required fields: userId, role, status",
        };
      }

      // Update based on role
      if (role === "resident") {
        // Update resident
        const updateResult = await db
          .update(residents)
          .set({
            status: status as "verified" | "pending" | "disable",
            updatedAt: new Date(),
          })
          .where(eq(residents.resident_id, userId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

        // If houseNumber is provided, update house address
        if (houseNumber) {
          // First, get the current house_id for this resident
          const currentHouseMember = await db
            .select()
            .from(house_members)
            .where(eq(house_members.resident_id, userId));

          if (currentHouseMember.length > 0 && currentHouseMember[0].house_id) {
            // Update existing house address
            await db
              .update(houses)
              .set({ address: houseNumber })
              .where(eq(houses.house_id, currentHouseMember[0].house_id));
          } else {
            // Create new house and house_member record
            const villageKey = updateResult[0].village_key;

            // Create new house
            const newHouse = await db
              .insert(houses)
              .values({
                address: houseNumber,
                village_key: villageKey,
              })
              .returning();

            // Create house_member relationship
            await db.insert(house_members).values({
              house_id: newHouse[0].house_id,
              resident_id: userId,
            });
          }
        }

        return {
          success: true,
          message: "Resident updated successfully",
          data: updateResult[0],
        };
      } else if (role === "guard") {
        // Update guard
        const updateResult = await db
          .update(guards)
          .set({
            status: status as "verified" | "pending" | "disable",
            updatedAt: new Date(),
          })
          .where(eq(guards.guard_id, userId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            error: "Guard not found",
          };
        }

        return {
          success: true,
          message: "Guard updated successfully",
          data: updateResult[0],
        };
      } else {
        return {
          success: false,
          error: "Invalid role specified",
        };
      }
    } catch (error) {
      console.error("Error updating user:", error);
      return {
        success: false,
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  /**
   * Change a user's role.
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .put("/changeUserRole", async ({ body }) => {
    try {
      const {
        userId,
        currentRole,
        newRole,
        status,
        houseNumber,
        notes,
      }: ChangeRoleRequest = body as ChangeRoleRequest;

      // Validate required fields
      if (!userId || !currentRole || !newRole || !status) {
        return {
          success: false,
          error:
            "Missing required fields: userId, currentRole, newRole, status",
        };
      }

      // Don't allow same role
      if (currentRole === newRole) {
        return {
          success: false,
          error: "Current role and new role cannot be the same",
        };
      }

      // Validate roles
      if (
        !["resident", "guard"].includes(currentRole) ||
        !["resident", "guard"].includes(newRole)
      ) {
        return {
          success: false,
          error: "Invalid role specified. Must be 'resident' or 'guard'",
        };
      }

      if (currentRole === "resident" && newRole === "guard") {
        // Convert resident to guard
        const resident = await getResident(userId);
        if (!resident) {
          return { success: false, error: "Resident not found" };
        }

        try {
          // Remove house relationships first
          const houseMemberData = await removeHouseRelationships(userId);

          // Clean up visitor records for this resident
          await cleanupVisitorRecords(userId, "resident");

          // Create new guard
          const newGuard = await createGuardFromResident(resident, status);
          if (!newGuard) {
            throw new Error("Failed to create guard");
          }

          // Delete old resident
          const deleteResult = await db
            .delete(residents)
            .where(eq(residents.resident_id, userId))
            .returning();

          if (deleteResult.length === 0) {
            throw new Error("Failed to delete resident");
          }

          // Clean up orphaned houses
          if (houseMemberData?.house_id) {
            await cleanupOrphanedHouse(houseMemberData.house_id);
          }

          // Verify the conversion was successful
          const remainingResident = await getResident(userId);
          if (remainingResident) {
            throw new Error("Resident still exists after conversion");
          }

          const newGuardExists = await getGuard(newGuard.guard_id);
          if (!newGuardExists) {
            throw new Error("New guard was not created properly");
          }

          return {
            success: true,
            message: "Resident successfully converted to guard",
            data: newGuard,
          };
        } catch (error) {
          // If any step fails, we need to clean up
          console.error("Error during resident to guard conversion:", error);

          // Try to clean up any partial changes
          try {
            // If guard was created but resident deletion failed, delete the guard
            const newGuard = await db
              .select()
              .from(guards)
              .where(eq(guards.email, resident.email))
              .limit(1);

            if (newGuard.length > 0) {
              await db
                .delete(guards)
                .where(eq(guards.guard_id, newGuard[0].guard_id));
            }
          } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
          }

          return {
            success: false,
            error: "Failed to convert resident to guard",
            details: error instanceof Error ? error.message : "Unknown error",
          };
        }
      } else if (currentRole === "guard" && newRole === "resident") {
        // Convert guard to resident
        const guard = await getGuard(userId);
        if (!guard) {
          return { success: false, error: "Guard not found" };
        }

        // Validate house number is provided when converting to resident
        if (!houseNumber || houseNumber.trim() === "") {
          return {
            success: false,
            error: "House number is required when converting guard to resident",
          };
        }

        try {
          // Clean up visitor records for this guard
          await cleanupVisitorRecords(userId, "guard");

          // Create new resident
          const newResident = await createResidentFromGuard(guard, status);
          if (!newResident) {
            throw new Error("Failed to create resident");
          }

          // Delete old guard
          const deleteResult = await db
            .delete(guards)
            .where(eq(guards.guard_id, userId))
            .returning();

          if (deleteResult.length === 0) {
            throw new Error("Failed to delete guard");
          }

          // Create house if houseNumber provided
          if (houseNumber && newResident.resident_id) {
            await createHouseForResident(
              newResident.resident_id,
              houseNumber,
              guard.village_key
            );
          }

          // Verify the conversion was successful
          const remainingGuard = await getGuard(userId);
          if (remainingGuard) {
            throw new Error("Guard still exists after conversion");
          }

          const newResidentExists = await getResident(newResident.resident_id);
          if (!newResidentExists) {
            throw new Error("New resident was not created properly");
          }

          return {
            success: true,
            message: "Guard successfully converted to resident",
            data: newResident,
          };
        } catch (error) {
          // If any step fails, we need to clean up
          console.error("Error during guard to resident conversion:", error);

          // Try to clean up any partial changes
          try {
            // If resident was created but guard deletion failed, delete the resident
            const newResident = await db
              .select()
              .from(residents)
              .where(eq(residents.email, guard.email))
              .limit(1);

            if (newResident.length > 0) {
              await db
                .delete(residents)
                .where(eq(residents.resident_id, newResident[0].resident_id));
            }
          } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
          }

          return {
            success: false,
            error: "Failed to convert guard to resident",
            details: error instanceof Error ? error.message : "Unknown error",
          };
        }
      } else {
        return {
          success: false,
          error: "Invalid role conversion",
        };
      }
    } catch (error) {
      console.error("Error changing user role:", error);
      return {
        success: false,
        error: "Failed to change user role",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
