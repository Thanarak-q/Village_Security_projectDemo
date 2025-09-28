import { Elysia } from "elysia";
import db from "../db/drizzle";
import {
  residents,
  guards,
  villages,
  houses,
  house_members,
} from "../db/schema";
import { eq, sql, and, isNull } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { notificationService } from "../services/notificationService";
import { userManagementActivityLogger } from "../utils/activityLogUtils";

/**
 * Interface for the approve user request.
 * @interface
 */
interface ApproveUserRequest {
  userId: string;
  currentRole: "resident" | "guard";
  approvedRole: "resident" | "guard";
  houseNumber?: string;
  notes?: string;
}

/**
 * Interface for the reject user request.
 * @interface
 */
interface RejectUserRequest {
  userId: string;
  currentRole: "resident" | "guard";
  reason: string;
  notes?: string;
}

/**
 * The pending users routes.
 * Accessible by: admin (เจ้าของโครงการ), staff (นิติ)
 * @type {Elysia}
 */
export const pendingUsersRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get all pending users.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} A promise that resolves to an object containing the pending users.
   */
  .get("/pendingUsers", async ({ currentUser, query, request }: any) => {
    try {
      // Extract village_key from query parameters
      let village_key = query?.village_key;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_key && request?.url) {
        const url = new URL(request.url);
        village_key = url.searchParams.get('village_key');
      }
      
      const { village_keys, role } = currentUser;

      console.log("PendingUsers - Extracted village_key:", village_key);
      console.log("PendingUsers - Available village_keys:", village_keys);

      // Validate village_key parameter
      if (!village_key || typeof village_key !== 'string') {
        return {
          success: false,
          error: "Village key is required",
        };
      }

      // Check if admin has access to the specified village
      if (role !== "superadmin" && !village_keys.includes(village_key)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }
      // Get pending residents data with house address
      const pendingResidentsData = await db
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
        })
        .from(residents)
        .where(
          and(
            eq(residents.status, "pending"),
            role === "superadmin" 
              ? sql`1=1` // Super admin can see all pending residents
              : eq(residents.village_key, village_key),
            isNull(residents.disable_at)
          )
        )
        // .where(sql`${residents.status} = 'pending'`)
        .leftJoin(
          house_members,
          eq(residents.resident_id, house_members.resident_id)
        )
        .leftJoin(houses, eq(house_members.house_id, houses.house_id));

      // Get pending guards data
      const pendingGuardsData = await db
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
        })
        .from(guards)
        .where(
          and(
            eq(guards.status, "pending"),
            role === "superadmin" 
              ? sql`1=1` // Super admin can see all pending guards
              : eq(guards.village_key, village_key),
            isNull(guards.disable_at)
          )
        );

      return {
        success: true,
        data: {
          residents: pendingResidentsData,
          guards: pendingGuardsData,
        },
        total: {
          residents: pendingResidentsData.length,
          guards: pendingGuardsData.length,
          total: pendingResidentsData.length + pendingGuardsData.length,
        },
        village_key: village_key,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch pending user data",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  /**
   * Approve a user.
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .put("/approveUser", async ({ body, currentUser }: any) => {
    try {
      const {
        userId,
        currentRole,
        approvedRole,
        houseNumber,
        notes,
      }: ApproveUserRequest = body as ApproveUserRequest;

      // Validate required fields
      if (!userId || !currentRole || !approvedRole) {
        return {
          success: false,
          error: "Missing required fields: userId, currentRole, approvedRole",
        };
      }

      // Validate roles
      if (
        !["resident", "guard"].includes(currentRole) ||
        !["resident", "guard"].includes(approvedRole)
      ) {
        return {
          success: false,
          error: "Invalid role specified. Must be 'resident' or 'guard'",
        };
      }

      // Validate house number for residents
      if (
        approvedRole === "resident" &&
        (!houseNumber || houseNumber.trim() === "")
      ) {
        return {
          success: false,
          error: "House number is required when approving as resident",
        };
      }

        if (currentRole === "resident" && approvedRole === "resident") {
        // Get current resident data for logging
        const currentResident = await db
          .select()
          .from(residents)
          .where(eq(residents.resident_id, userId));

        if (currentResident.length === 0) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

        // Approve existing resident
        const updateResult = await db
          .update(residents)
          .set({
            status: "verified" as "verified" | "pending" | "disable",
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

        // Update house address if provided
        if (houseNumber) {
          // Check if resident already has a house
          const existingHouse = await db
            .select()
            .from(house_members)
            .where(eq(house_members.resident_id, userId));

          if (existingHouse.length > 0) {
            // Update existing house address
            await db
              .update(houses)
              .set({ address: houseNumber })
              .where(eq(houses.house_id, existingHouse[0].house_id!));
          } else {
            // Create new house and house_member record
            const villageKey = updateResult[0].village_key;

            const newHouse = await db
              .insert(houses)
              .values({
                address: houseNumber,
                village_key: villageKey,
              })
              .returning();

            await db.insert(house_members).values({
              house_id: newHouse[0].house_id,
              resident_id: userId,
            });

            // Create notification for house member added
            try {
              await notificationService.notifyHouseMemberAdded({
                house_member_id: '', // Will be generated by database
                resident_id: userId,
                resident_name: `${updateResult[0].fname} ${updateResult[0].lname}`,
                house_address: houseNumber || '',
                village_key: updateResult[0].village_key || '',
              });
              console.log(`📢 House member added notification sent: ${updateResult[0].fname} ${updateResult[0].lname}`);
            } catch (notificationError) {
              console.error('❌ Error sending house member added notification:', notificationError);
            }
          }
        }

        // Create notification for resident approval
        try {
            await notificationService.notifyUserApproval({
              user_id: userId,
              user_type: 'resident',
              fname: updateResult[0].fname,
              lname: updateResult[0].lname,
              village_key: updateResult[0].village_key || '',
            });
          await notificationService.notifyUserApproval({
            user_id: userId,
            user_type: 'resident',
            fname: updateResult[0].fname,
            lname: updateResult[0].lname,
            village_key: updateResult[0].village_key || '',
          });
        } catch (notificationError) {
          console.error('Error creating approval notification:', notificationError);
        }

        return {
          success: true,
          message: "Resident approved successfully",
          data: updateResult[0],
        };
      } else if (currentRole === "guard" && approvedRole === "guard") {
        // Get current guard data for logging
        const currentGuard = await db
          .select()
          .from(guards)
          .where(eq(guards.guard_id, userId));

        if (currentGuard.length === 0) {
          return {
            success: false,
            error: "Guard not found",
          };
        }

        // Approve existing guard
        const updateResult = await db
          .update(guards)
          .set({
            status: "verified" as "verified" | "pending" | "disable",
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

        // Create notification for guard approval
        try {
          await notificationService.notifyUserApproval({
            user_id: userId,
            user_type: 'guard',
            fname: updateResult[0].fname,
            lname: updateResult[0].lname,
            village_key: updateResult[0].village_key || '',
          });
        } catch (notificationError) {
          console.error('Error creating approval notification:', notificationError);
        }

        return {
          success: true,
          message: "Guard approved successfully",
          data: updateResult[0],
        };
      } else if (currentRole === "resident" && approvedRole === "guard") {
        const resident = await db
          .select()
          .from(residents)
          .where(eq(residents.resident_id, userId));

        if (resident.length === 0) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

        // Fetch existing house relationship and address (for removal notification)
        const existingHouseMember = await db
          .select({
            house_member_id: house_members.house_member_id,
            house_id: house_members.house_id,
          })
          .from(house_members)
          .where(eq(house_members.resident_id, userId));

        let removedHouseAddress: string | null = null;
        if (existingHouseMember.length > 0) {
          const houseInfo = await db
            .select({ address: houses.address })
            .from(houses)
            .where(eq(houses.house_id, existingHouseMember[0].house_id!));
          removedHouseAddress = houseInfo[0]?.address || null;
        }

        // Create new guard
        const newGuard = await db
          .insert(guards)
          .values({
            line_user_id: resident[0].line_user_id,
            email: resident[0].email,
            fname: resident[0].fname,
            lname: resident[0].lname,
            phone: resident[0].phone,
            village_key: resident[0].village_key,
            status: "verified" as "verified" | "pending" | "disable",
            line_display_name: resident[0].line_display_name,
            line_profile_url: resident[0].line_profile_url,
          })
          .returning();

        // Remove house relationships
        await db
          .delete(house_members)
          .where(eq(house_members.resident_id, userId));

        // Notify house member removal if needed
        if (existingHouseMember.length > 0 && removedHouseAddress) {
          try {
            await notificationService.notifyHouseMemberRemoved({
              house_member_id: existingHouseMember[0].house_member_id,
              resident_id: userId,
              resident_name: `${resident[0].fname} ${resident[0].lname}`,
              house_address: removedHouseAddress,
              village_key: resident[0].village_key || '',
            });
            console.log(`📢 House member removed notification sent: ${resident[0].fname} ${resident[0].lname}`);
          } catch (notificationError) {
            console.error('❌ Error sending house member removed notification:', notificationError);
          }
        }

        // Soft delete old resident
        await db.update(residents)
          .set({ 
            disable_at: new Date(),
            status: "disable"
          })
          .where(eq(residents.resident_id, userId));

        // Log the user approval and role change activity
        try {
          const userName = `${resident[0].fname} ${resident[0].lname}`;
          await userManagementActivityLogger.logUserApproved(
            currentUser.admin_id,
            currentUser.username,
            "guard",
            userName
          );
          await userManagementActivityLogger.logUserRoleChanged(
            currentUser.admin_id,
            currentUser.username,
            userName,
            "resident",
            "guard",
            "verified"
          );
        } catch (logError) {
          console.error("Error logging user approval and role change:", logError);
          // Don't fail the request if logging fails
        }

        // Notify guard approval
        try {
          await notificationService.notifyUserApproval({
            user_id: newGuard[0].guard_id,
            user_type: 'guard',
            fname: newGuard[0].fname,
            lname: newGuard[0].lname,
            village_key: newGuard[0].village_key || '',
          });
        } catch (notificationError) {
          console.error('❌ Error sending guard approval notification:', notificationError);
        }

        return {
          success: true,
          message: "Resident converted to guard and approved successfully",
          data: newGuard[0],
        };
      } else if (currentRole === "guard" && approvedRole === "resident") {
        // Convert guard to resident
        const guard = await db
          .select()
          .from(guards)
          .where(eq(guards.guard_id, userId));

        if (guard.length === 0) {
          return {
            success: false,
            error: "Guard not found",
          };
        }

        // Create new resident
        const newResident = await db
          .insert(residents)
          .values({
            line_user_id: guard[0].line_user_id,
            email: guard[0].email,
            fname: guard[0].fname,
            lname: guard[0].lname,
            phone: guard[0].phone,
            village_key: guard[0].village_key,
            status: "verified" as "verified" | "pending" | "disable",
            line_display_name: guard[0].line_display_name,
            line_profile_url: guard[0].line_profile_url,
          })
          .returning();

        // Create house for resident
        if (houseNumber) {
          const newHouse = await db
            .insert(houses)
            .values({
              address: houseNumber,
              village_key: guard[0].village_key,
            })
            .returning();

          await db.insert(house_members).values({
            house_id: newHouse[0].house_id,
            resident_id: newResident[0].resident_id,
          });

          // Create notification for house member added
          try {
              await notificationService.notifyHouseMemberAdded({
                house_member_id: '', // Will be generated by database
                resident_id: newResident[0].resident_id,
                resident_name: `${newResident[0].fname} ${newResident[0].lname}`,
                house_address: houseNumber || '',
                village_key: newResident[0].village_key || '',
              });
            console.log(`📢 House member added notification sent: ${newResident[0].fname} ${newResident[0].lname}`);
          } catch (notificationError) {
            console.error('❌ Error sending house member added notification:', notificationError);
          }
        }

        // Soft delete old guard
        await db.update(guards)
          .set({ 
            disable_at: new Date(),
            status: "disable"
          })
          .where(eq(guards.guard_id, userId));

        // Log the user approval and role change activity
        try {
          const userName = `${guard[0].fname} ${guard[0].lname}`;
          await userManagementActivityLogger.logUserApproved(
            currentUser.admin_id,
            currentUser.username,
            "resident",
            userName,
            houseNumber
          );
          await userManagementActivityLogger.logUserRoleChanged(
            currentUser.admin_id,
            currentUser.username,
            userName,
            "guard",
            "resident",
            "verified"
          );
        } catch (logError) {
          console.error("Error logging user approval and role change:", logError);
          // Don't fail the request if logging fails
        }

        // Notify resident approval
        try {
          await notificationService.notifyUserApproval({
            user_id: newResident[0].resident_id,
            user_type: 'resident',
            fname: newResident[0].fname,
            lname: newResident[0].lname,
            village_key: newResident[0].village_key || '',
          });
        } catch (notificationError) {
          console.error('❌ Error sending resident approval notification:', notificationError);
        }

        return {
          success: true,
          message: "Guard converted to resident and approved successfully",
          data: newResident[0],
        };
      } else {
        return {
          success: false,
          error: "Invalid role conversion",
        };
      }
    } catch (error) {
      console.error("Error approving user:", error);
      return {
        success: false,
        error: "Failed to approve user",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  /**
   * Reject a user.
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .put("/rejectUser", async ({ body, currentUser }: any) => {
    try {
      const { userId, currentRole, reason, notes }: RejectUserRequest =
        body as RejectUserRequest;

      // Validate required fields
      if (!userId || !currentRole || !reason) {
        return {
          success: false,
          error: "Missing required fields: userId, currentRole, reason",
        };
      }

      // Validate roles
      if (!["resident", "guard"].includes(currentRole)) {
        return {
          success: false,
          error: "Invalid role specified. Must be 'resident' or 'guard'",
        };
      }

      if (currentRole === "resident") {
        // Get current resident data for logging
        const currentResident = await db
          .select()
          .from(residents)
          .where(eq(residents.resident_id, userId));

        if (currentResident.length === 0) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

        // Reject resident
        const updateResult = await db
          .update(residents)
          .set({
            status: "disable" as "verified" | "pending" | "disable",
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

        // Log the user rejection activity
        try {
          const userName = `${currentResident[0].fname} ${currentResident[0].lname}`;
          await userManagementActivityLogger.logUserRejected(
            currentUser.admin_id,
            currentUser.username,
            "resident",
            userName,
            reason
          );
        } catch (logError) {
          console.error("Error logging user rejection:", logError);
          // Don't fail the request if logging fails
        }

        return {
          success: true,
          message: "Resident rejected successfully",
          data: updateResult[0],
        };
      } else if (currentRole === "guard") {
        // Get current guard data for logging
        const currentGuard = await db
          .select()
          .from(guards)
          .where(eq(guards.guard_id, userId));

        if (currentGuard.length === 0) {
          return {
            success: false,
            error: "Guard not found",
          };
        }

        // Reject guard
        const updateResult = await db
          .update(guards)
          .set({
            status: "disable" as "verified" | "pending" | "disable",
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

        // Log the user rejection activity
        try {
          const userName = `${currentGuard[0].fname} ${currentGuard[0].lname}`;
          await userManagementActivityLogger.logUserRejected(
            currentUser.admin_id,
            currentUser.username,
            "guard",
            userName,
            reason
          );
        } catch (logError) {
          console.error("Error logging user rejection:", logError);
          // Don't fail the request if logging fails
        }

        return {
          success: true,
          message: "Guard rejected successfully",
          data: updateResult[0],
        };
      } else {
        return {
          success: false,
          error: "Invalid role specified",
        };
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      return {
        success: false,
        error: "Failed to reject user",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
