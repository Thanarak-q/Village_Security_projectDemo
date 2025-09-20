import { Elysia } from "elysia";
import db from "../db/drizzle";
import {
  residents,
  guards,
  villages,
  houses,
  house_members,
} from "../db/schema";
import { eq, sql, and } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
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
   * @returns {Promise<Object>} A promise that resolves to an object containing the pending users.
   */
  .get("/pendingUsers", async ({ currentUser }: any) => {
    try {
      const { village_key } = currentUser;
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
            eq(residents.village_key, village_key)
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
        .where(sql`${guards.status} = 'pending'`);

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
  .put("/approveUser", async ({ body, currentUser }) => {
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
          }
        }

        // Log the user approval activity
        try {
          const userName = `${currentResident[0].fname} ${currentResident[0].lname}`;
          await userManagementActivityLogger.logUserApproved(
            currentUser.admin_id,
            currentUser.username,
            "resident",
            userName,
            houseNumber
          );
        } catch (logError) {
          console.error("Error logging user approval:", logError);
          // Don't fail the request if logging fails
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

        // Log the user approval activity
        try {
          const userName = `${currentGuard[0].fname} ${currentGuard[0].lname}`;
          await userManagementActivityLogger.logUserApproved(
            currentUser.admin_id,
            currentUser.username,
            "guard",
            userName
          );
        } catch (logError) {
          console.error("Error logging user approval:", logError);
          // Don't fail the request if logging fails
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

        // Delete old resident
        await db.delete(residents).where(eq(residents.resident_id, userId));

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
        }

        // Delete old guard
        await db.delete(guards).where(eq(guards.guard_id, userId));

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
  .put("/rejectUser", async ({ body, currentUser }) => {
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
