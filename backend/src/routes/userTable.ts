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
import { eq, sql, and, isNull } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { userManagementActivityLogger } from "../utils/activityLogUtils";
import { notificationService } from "../services/notificationService";

// LIFF Authentication middleware for cookie-based sessions
const requireLiffAuth = async (context: any) => {
  const { jwt, cookie, set } = context;
  const token = cookie.liff_session?.value;

  if (!token) {
    set.status = 401;
    return { error: "Unauthorized: No LIFF session token provided." };
  }

  let payload;
  try {
    payload = await jwt.verify(token);
  } catch {
    set.status = 401;
    return { error: "Unauthorized: The provided LIFF token is invalid." };
  }

  if (!payload?.id || !payload?.iat) {
    set.status = 401;
    return { error: "Unauthorized: The LIFF token payload is malformed." };
  }

  const tokenAgeInSeconds = Date.now() / 1000 - payload.iat;
  if (tokenAgeInSeconds > 60 * 60) { // 1 hour expiry for LIFF sessions
    set.status = 401;
    return { error: "Unauthorized: The provided LIFF token has expired." };
  }

  // Determine user type from JWT payload
  const userRole = payload.role;
  let user = null;

  // Find user in the appropriate table based on their role
  if (userRole === 'guard') {
    user = await db.query.guards.findFirst({
      where: eq(guards.guard_id, payload.id),
    });
  } else if (userRole === 'resident') {
    user = await db.query.residents.findFirst({
      where: eq(residents.resident_id, payload.id),
    });
  }

  if (!user) {
    set.status = 401;
    return { error: "Unauthorized: User associated with the LIFF token not found." };
  }

  if (user.status !== "verified") {
    set.status = 403;
    return { error: "Forbidden: The user account is not active." };
  }

  // Add user to context
  context.currentUser = {
    ...user,
    village_ids: user.village_id ? [user.village_id] : [],
  };
};

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
      village_id: resident.village_id,
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
      village_id: guard.village_id,
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
  villageId: string | null
) {
  if (!villageId) return null;

  const newHouse = await db
    .insert(houses)
    .values({
      address: houseNumber,
      village_id: villageId,
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
 * Accessible by: admin (เจ้าของโครงการ) and staff (นิติ)
 * @type {Elysia}
 */
export const userTableRoutes = new Elysia({ prefix: "/api" })
  // Get guard by LINE user ID - accessible by guards themselves
  .get("/guards/by-line-user", async (context: any) => {
    // Apply LIFF authentication middleware
    const authResult = await requireLiffAuth(context);
    if (authResult) {
      return authResult;
    }
    
    const { query, set, currentUser } = context;
    try {
      const { lineUserId } = query as { lineUserId: string };

      if (!lineUserId) {
        set.status = 400;
        return {
          success: false,
          error: "Line User ID is required",
        };
      }

      const guard = await db.query.guards.findFirst({
        where: eq(guards.line_user_id, lineUserId),
        columns: {
          guard_id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          village_id: true,
          status: true,
          line_user_id: true,
        }
      });

      if (!guard) {
        set.status = 404;
        return {
          success: false,
          error: "Guard not found",
        };
      }

      // If currentUser is provided (authenticated request), verify it's the same person
      if (currentUser) {
        // Check if the found guard matches the current user's village
        if (currentUser.village_id && guard.village_id !== currentUser.village_id) {
          set.status = 403;
          return {
            success: false,
            error: "Access denied: Guard not in your village",
          };
        }
      }

      return {
        success: true,
        guard: guard,
      };
    } catch (error) {
      console.error("Error fetching guard by LINE user ID:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to fetch guard",
      };
    }
  })
  // Get guard by name - accessible by guards themselves
  .get("/guards/by-name", async ({ query, set, currentUser }: any) => {
    try {
      const { fname, lname } = query as { fname: string; lname: string };

      if (!fname || !lname) {
        set.status = 400;
        return {
          success: false,
          error: "First name and last name are required",
        };
      }

      const guard = await db.query.guards.findFirst({
        where: and(
          eq(guards.fname, fname),
          eq(guards.lname, lname)
        ),
        columns: {
          guard_id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          village_id: true,
          status: true,
          line_user_id: true,
        }
      });

      if (!guard) {
        set.status = 404;
        return {
          success: false,
          error: "Guard not found",
        };
      }

      // If currentUser is provided (authenticated request), verify it's the same person
      if (currentUser) {
        // Check if the found guard matches the current user's village
        if (currentUser.village_id && guard.village_id !== currentUser.village_id) {
          set.status = 403;
          return {
            success: false,
            error: "Access denied: Guard not in your village",
          };
        }
      }

      return {
        success: true,
        guard: guard,
      };
    } catch (error) {
      console.error("Error fetching guard by name:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to fetch guard",
      };
    }
  })
  .onBeforeHandle(requireRole(["staff","admin"]))
  /**
   * Get all users for the current user's village.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} A promise that resolves to an object containing the user data.
   */
  .get("/userTable", async ({ currentUser, query, request }: any) => {
    try {
      // Extract village_id from query parameters
      let village_id = query?.village_id;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_id && request?.url) {
        const url = new URL(request.url);
        village_id = url.searchParams.get('village_id');
      }
      
      const { village_ids, role } = currentUser;

      console.log("UserTable - Extracted village_id:", village_id);
      console.log("UserTable - Available village_ids:", village_ids);

      // Validate village_id parameter
      if (!village_id || typeof village_id !== 'string') {
        return {
          success: false,
          error: "Village ID is required",
        };
      }

      // Check if admin has access to the specified village
      if (role !== "superadmin" && !village_ids.includes(village_id)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }

      const residentsData = await db
        .select({
          id: residents.resident_id,
          fname: residents.fname,
          lname: residents.lname,
          email: residents.email,
          phone: residents.phone,
          status: residents.status,
          role: sql`'resident'`.as("role"),
          village_id: residents.village_id,
          house_address: houses.address,
          createdAt: residents.createdAt,
          updatedAt: residents.updatedAt,
          line_profile_url: residents.line_profile_url,
        })
        .from(residents)
        .where(
          and(
            role === "superadmin" 
              ? sql`1=1` // Super admin can see all residents
              : eq(residents.village_id, village_id),
            sql`${residents.status} != 'pending'`,
            isNull(residents.disable_at)
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
          village_id: guards.village_id,
          house_address: sql`NULL`.as("house_address"),
          createdAt: guards.createdAt,
          updatedAt: guards.updatedAt,
          line_profile_url: guards.line_profile_url,
        })
        .from(guards)
        .where(
          and(
            role === "superadmin" 
              ? sql`1=1` // Super admin can see all guards
              : eq(guards.village_id, village_id),
            sql`${guards.status} != 'pending'`,
            isNull(guards.disable_at)
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
        village_id: village_id,
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
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .put("/updateUser", async ({ body, currentUser }: any) => {
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
        // Get current resident data for logging
        const currentResident = await getResident(userId);
        if (!currentResident) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

        // Get old status for notification
        const oldResident = await db
          .select({ status: residents.status, fname: residents.fname, lname: residents.lname, village_id: residents.village_id })
          .from(residents)
          .where(eq(residents.resident_id, userId));

        if (oldResident.length === 0) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

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

        // Create notification for resident status change if status actually changed
        if (oldResident[0].status !== status) {
          try {
            // Get house address for notification
            const houseMember = await db
              .select({ address: houses.address })
              .from(house_members)
              .innerJoin(houses, eq(house_members.house_id, houses.house_id))
              .where(eq(house_members.resident_id, userId));

            if (houseMember.length > 0) {
              await notificationService.notifyResidentStatusChange({
                resident_id: userId,
                resident_name: `${oldResident[0].fname} ${oldResident[0].lname}`,
                house_address: houseMember[0].address,
                old_status: oldResident[0].status || 'unknown',
                new_status: status,
                village_id: oldResident[0].village_id || '',
              });
              console.log(`📢 Resident status change notification sent: ${oldResident[0].fname} ${oldResident[0].lname}`);
            }
          } catch (notificationError) {
            console.error('❌ Error sending resident status change notification:', notificationError);
          }
        }

        // If houseNumber is provided, update house address
        let oldHouseAddress = null;
        if (houseNumber) {
          // First, get the current house_id for this resident
          const currentHouseMember = await db
            .select()
            .from(house_members)
            .where(eq(house_members.resident_id, userId));

          if (currentHouseMember.length > 0 && currentHouseMember[0].house_id) {
            // Get current house address for logging
            const currentHouse = await db
              .select()
              .from(houses)
              .where(eq(houses.house_id, currentHouseMember[0].house_id));
            oldHouseAddress = currentHouse[0]?.address || null;

            // Update existing house address
            await db
              .update(houses)
              .set({ address: houseNumber })
              .where(eq(houses.house_id, currentHouseMember[0].house_id));
          } else {
            // Create new house and house_member record
            const villageId = updateResult[0].village_id;

            // Create new house
            const newHouse = await db
              .insert(houses)
              .values({
                address: houseNumber,
                village_id: villageId,
              })
              .returning();

            // Create house_member relationship
            await db.insert(house_members).values({
              house_id: newHouse[0].house_id,
              resident_id: userId,
            });
          }
        }

        // Log the user update activity
        try {
          const userName = `${currentResident.fname} ${currentResident.lname}`;
          
          // Log status update
          if (currentResident.status !== status) {
            const statusLogResult = await userManagementActivityLogger.logUserStatusUpdated(
              currentUser.admin_id,
              currentUser.username,
              "resident",
              userName,
              currentResident.status || "unknown",
              status
            );
            if (statusLogResult) {
              console.log("User status update logged successfully");
            }
          }

          // Log house update
          if (houseNumber) {
            const houseLogResult = await userManagementActivityLogger.logUserHouseUpdated(
              currentUser.admin_id,
              currentUser.username,
              userName,
              oldHouseAddress,
              houseNumber
            );
            if (houseLogResult) {
              console.log("User house update logged successfully");
            } else {
              console.log("No house change detected, skipping log");
            }
          }
        } catch (logError) {
          console.error("Error logging user update:", logError);
          // Don't fail the request if logging fails
        }

        return {
          success: true,
          message: "Resident updated successfully",
          data: updateResult[0],
        };
      } else if (role === "guard") {
        // Get current guard data for logging
        const currentGuard = await getGuard(userId);
        if (!currentGuard) {
          return {
            success: false,
            error: "Guard not found",
          };
        }

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

        // Log the guard update activity
        try {
          const userName = `${currentGuard.fname} ${currentGuard.lname}`;
          
          // Log status update
          if (currentGuard.status !== status) {
            const statusLogResult = await userManagementActivityLogger.logUserStatusUpdated(
              currentUser.admin_id,
              currentUser.username,
              "guard",
              userName,
              currentGuard.status || "unknown",
              status
            );
            if (statusLogResult) {
              console.log("Guard status update logged successfully");
            }
          }
        } catch (logError) {
          console.error("Error logging guard update:", logError);
          // Don't fail the request if logging fails
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
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .put("/changeUserRole", async ({ body, currentUser }: any) => {
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

          // Create notification for house member removed if there was a house relationship
          if (houseMemberData?.house_id) {
            try {
              // Get house address for notification
              const houseInfo = await db
                .select({ address: houses.address })
                .from(houses)
                .where(eq(houses.house_id, houseMemberData.house_id));

              if (houseInfo.length > 0) {
                await notificationService.notifyHouseMemberRemoved({
                  house_member_id: houseMemberData.house_member_id,
                  resident_id: userId,
                  resident_name: `${resident.fname} ${resident.lname}`,
                  house_address: houseInfo[0].address,
                  village_id: resident.village_id || '',
                });
                console.log(`📢 House member removed notification sent: ${resident.fname} ${resident.lname}`);
              }
            } catch (notificationError) {
              console.error('❌ Error sending house member removed notification:', notificationError);
            }
          }

          // Clean up visitor records for this resident
          await cleanupVisitorRecords(userId, "resident");

          // Create new guard
          const newGuard = await createGuardFromResident(resident, status);
          if (!newGuard) {
            throw new Error("Failed to create guard");
          }

          // Soft delete old resident
          const deleteResult = await db
            .update(residents)
            .set({ 
              disable_at: new Date(),
              status: "disable"
            })
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

          // Log the role change activity
          try {
            const userName = `${resident.fname} ${resident.lname}`;
            await userManagementActivityLogger.logUserRoleChanged(
              currentUser.admin_id,
              currentUser.username,
              userName,
              "resident",
              "guard",
              status
            );
          } catch (logError) {
            console.error("Error logging role change:", logError);
            // Don't fail the request if logging fails
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

          // Soft delete old guard
          const deleteResult = await db
            .update(guards)
            .set({ 
              disable_at: new Date(),
              status: "disable"
            })
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
              guard.village_id
            );

            // Create notification for house member added
            try {
              await notificationService.notifyHouseMemberAdded({
                house_member_id: '', // Will be generated by database
                resident_id: newResident.resident_id,
                resident_name: `${newResident.fname} ${newResident.lname}`,
                house_address: houseNumber || '',
                village_id: guard.village_id || '',
              });
              console.log(`📢 House member added notification sent: ${newResident.fname} ${newResident.lname}`);
            } catch (notificationError) {
              console.error('❌ Error sending house member added notification:', notificationError);
            }
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

          // Log the role change activity
          try {
            const userName = `${guard.fname} ${guard.lname}`;
            await userManagementActivityLogger.logUserRoleChanged(
              currentUser.admin_id,
              currentUser.username,
              userName,
              "guard",
              "resident",
              status
            );
          } catch (logError) {
            console.error("Error logging role change:", logError);
            // Don't fail the request if logging fails
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
