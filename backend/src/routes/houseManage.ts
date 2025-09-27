import { Elysia } from "elysia";
import db from "../db/drizzle";
import { houses, villages, guards, admins } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { houseActivityLogger } from "../utils/activityLogUtils";
import { notificationService } from "../services/notificationService";

/**
 * Interface for the create house request body.
 * @interface
 */
interface CreateHouseBody {
  address: string;
  village_key: string; // Admin must specify which village to create house in
}

/**
 * Interface for the update house request body.
 * @interface
 */
interface UpdateHouseBody {
  address?: string;
  // village_key cannot be changed - a house must remain in its original village.
  status?: "available" | "occupied" | "disable";
}

/**
 * Interface for the update status request body.
 * @interface
 */
interface UpdateStatusBody {
  status: "available" | "occupied" | "disable";
}

/**
 * Validates the house data for creation.
 * @param {CreateHouseBody} data - The data to validate.
 * @returns {string[]} An array of validation errors.
 */
const validateHouseData = (data: CreateHouseBody) => {
  const errors: string[] = [];

  if (!data.address?.trim()) {
    errors.push("Address is required");
  }

  if (!data.village_key?.trim()) {
    errors.push("Village is required");
  }

  return errors;
};

/**
 * Validates the house data for updates.
 * @param {UpdateHouseBody} data - The data to validate.
 * @returns {string[]} An array of validation errors.
 */
const validateUpdateData = (data: UpdateHouseBody) => {
  const errors: string[] = [];

  if (data.address !== undefined && !data.address.trim()) {
    errors.push("Address cannot be empty");
  }

  if (
    data.status !== undefined &&
    !["available", "occupied", "disable"].includes(data.status)
  ) {
    errors.push("Invalid status. Must be: available, occupied, or disable");
  }

  return errors;
};

/**
 * Validates the status value.
 * @param {string} status - The status to validate.
 * @returns {boolean} True if the status is valid, false otherwise.
 */
const validateStatus = (
  status: string
): status is "available" | "occupied" | "disable" => {
  return ["available", "occupied", "disable"].includes(status);
};

/**
 * The house management routes.
 * Accessible by: admin (เจ้าของโครงการ) and guard (ยามรักษาความปลอดภัย)
 * Accessible by: admin (เจ้าของโครงการ) and staff (นิติ)
 * @type {Elysia}
 */
export const houseManageRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  // Test endpoint to check houses without authentication
  .get("/houses-test", async () => {
    try {
      const result = await db.select().from(houses);
      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching houses:", error);
      return {
        success: false,
        error: "Failed to fetch houses",
      };
    }
  })
  // Get all houses - accessible by admin and guard
  .get("/houses", async ({ query, currentUser, request }: any) => {
    console.log("currentUser", currentUser);
    console.log("query", query);
    console.log("request URL:", request?.url);
    
    try {
      // Extract village_key from query parameters
      let village_key = query?.village_key;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_key && request?.url) {
        const url = new URL(request.url);
        village_key = url.searchParams.get('village_key');
      }
      
      const { village_keys, role } = currentUser;

      console.log("Extracted village_key:", village_key);
      console.log("Available village_keys:", village_keys);

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

      // Fetch houses for the specific village
      const result = await db
        .select()
        .from(houses)
        .where(eq(houses.village_key, village_key));

      return {
        success: true,
        data: result,
        total: result.length,
        village_key: village_key,
      };
    } catch (error) {
      console.error("Error fetching houses:", error);
      return {
        success: false,
        error: "Failed to fetch houses",
      };
    }
  })
  
  // Create new house - admin only
  .post("/house-manage", async ({ body, currentUser }: any) => {
    // Check if user has admin role
    if (currentUser.role !== "admin" && currentUser.role !== "staff") {
      return {
        success: false,
        error: "Access denied. Admin or staff role required.",
      };
    }
    try {
      const houseData = body as CreateHouseBody;

      // Validation
      const validationErrors = validateHouseData(houseData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(", "),
        };
      }

      const { village_keys, role } = currentUser;

      // Check if admin has access to the specified village
      if (!village_keys.includes(houseData.village_key)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }

      // Check if village exists
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, houseData.village_key));

      if (existingVillage.length === 0) {
        return {
          success: false,
          error: "Village not found",
        };
      }

      // Insert new house (status will be "available" by default from schema)
      const [newHouse] = await db
        .insert(houses)
        .values({
          address: houseData.address.trim(),
          village_key: houseData.village_key, // Use specified village_key
        })
        .returning();

      // Log the house creation activity
      try {
        await houseActivityLogger.logHouseCreated(
          currentUser.admin_id,
          houseData.address.trim(),
          houseData.village_key
        );
      } catch (logError) {
        console.error("Error logging house creation:", logError);
        // Don't fail the request if logging fails
      }

      return {
        success: true,
        message: "House created successfully!",
        data: newHouse,
      };
    } catch (error) {
      console.error("Error creating house:", error);
      return {
        success: false,
        error: "Failed to create house. Please try again.",
      };
    }
  })

  /**
   * Update a house.
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @param {string} context.params.house_id - The house ID.
   * @param {Object} context.body - The body of the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing the updated house.
   */
  .put(
    "/house-manage/:house_id",
    async ({ params, body, currentUser }: any) => {
      // Check if user has admin role
      if (currentUser.role !== "admin") {
        return {
          success: false,
          error: "Access denied. Admin role required.",
        };
      }
      try {
        const { house_id } = params;
        const updateData = body as UpdateHouseBody;

        if (!house_id?.trim()) {
          return {
            success: false,
            error: "House ID is required",
          };
        }

        // Check if house exists
        const existingHouse = await db
          .select()
          .from(houses)
          .where(eq(houses.house_id, house_id));

        if (existingHouse.length === 0) {
          return {
            success: false,
            error: "House not found!",
          };
        }

        // Check if admin can update this house (same village)
        const { village_keys, role } = currentUser;
        if (role !== "superadmin" && !village_keys.includes(existingHouse[0].village_key)) {
          return {
            success: false,
            error: "You can only update houses in your assigned villages!",
          };
        }

        // Validation
        const validationErrors = validateUpdateData(updateData);
        if (validationErrors.length > 0) {
          return {
            success: false,
            error: validationErrors.join(", "),
          };
        }

        // Get old status for notification
        const oldStatus = existingHouse[0].status || 'unknown';

        // Prepare update data
        const dataToUpdate: any = {};
        if (updateData.address !== undefined)
          dataToUpdate.address = updateData.address.trim();
        if (updateData.status !== undefined)
          dataToUpdate.status = updateData.status;

        // Update house
        const [updatedHouse] = await db
          .update(houses)
          .set(dataToUpdate)
          .where(eq(houses.house_id, house_id))
          .returning();

        // Log the house update activity
        try {
          const logResult = await houseActivityLogger.logHouseUpdated(
            currentUser.admin_id,
            house_id,
            existingHouse[0].address,
            dataToUpdate,
            {
              address: existingHouse[0].address,
              status: existingHouse[0].status || undefined
            }
          );
          // Only log if there were actual changes
          if (logResult) {
            console.log("House update logged successfully");
          } else {
            console.log("No actual changes detected, skipping log");
          }
        } catch (logError) {
          console.error("Error logging house update:", logError);
          // Don't fail the request if logging fails
        }

        // Send notification if status changed
        if (updateData.status !== undefined && oldStatus !== updateData.status) {
          try {
            await notificationService.notifyHouseStatusChange({
              house_id: house_id,
              address: updatedHouse.address ?? "",
              old_status: oldStatus ?? "",
              new_status: updateData.status ?? "",
              village_key: existingHouse[0].village_key ?? "",
            });
            console.log(`📢 House status change notification sent: ${updatedHouse.address ?? ""}`);
          } catch (notificationError) {
            console.error('❌ Error sending house status change notification:', notificationError);
            // Don't fail the request if notification fails
          }
        }

        return {
          success: true,
          message: "House updated successfully!",
          data: updatedHouse,
        };
      } catch (error) {
        console.error("Error updating house:", error);
        return {
          success: false,
          error: "Failed to update house. Please try again.",
        };
      }
    }
  )

  /**
   * Update a house's status only.
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @param {string} context.params.house_id - The house ID.
   * @param {Object} context.body - The body of the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing the updated house.
   */
  .patch(
    "/house-manage/:house_id/status",
    async ({ params, body, currentUser }: any) => {
      // Check if user has admin role
      if (currentUser.role !== "admin") {
        return {
          success: false,
          error: "Access denied. Admin role required.",
        };
      }
      try {
        const { house_id } = params;
        const { status } = body as UpdateStatusBody;

        if (!house_id?.trim()) {
          return {
            success: false,
            error: "House ID is required",
          };
        }

        if (!status || !validateStatus(status)) {
          return {
            success: false,
            error: "Invalid status. Must be: available, occupied, or disable",
          };
        }

        // Check if house exists
        const existingHouse = await db
          .select()
          .from(houses)
          .where(eq(houses.house_id, house_id));

        if (existingHouse.length === 0) {
          return {
            success: false,
            error: "House not found!",
          };
        }

        // Check if admin can update this house (same village)
        const { village_keys, role } = currentUser;
        if (role !== "superadmin" && !village_keys.includes(existingHouse[0].village_key)) {
          return {
            success: false,
            error: "You can only update houses in your assigned villages!",
          };
        }

        // Get old status for notification
        const oldStatus = existingHouse[0].status || 'unknown';

        // Update house status
        const [updatedHouse] = await db
          .update(houses)
          .set({ status })
          .where(eq(houses.house_id, house_id))
          .returning();

        // Log the house status update activity
        try {
          await houseActivityLogger.logHouseStatusUpdated(
            currentUser.admin_id,
            existingHouse[0].address,
            existingHouse[0].status || "unknown",
            status
          );
        } catch (logError) {
          console.error("Error logging house status update:", logError);
          // Don't fail the request if logging fails
        }

        // Send notification if status actually changed
        if (oldStatus !== status) {
          try {
            await notificationService.notifyHouseStatusChange({
              house_id: house_id,
              address: updatedHouse.address ?? "",
              old_status: oldStatus ?? "",
              new_status: status,
              village_key: existingHouse[0].village_key ?? "",
            });
            console.log(`📢 House status change notification sent: ${updatedHouse.address ?? ""}`);
          } catch (notificationError) {
            console.error('❌ Error sending house status change notification:', notificationError);
            // Don't fail the request if notification fails
          }
        }

        return {
          success: true,
          message: "House status updated successfully!",
          data: updatedHouse,
        };
      } catch (error) {
        console.error("Error updating house status:", error);
        return {
          success: false,
          error: "Failed to update house status. Please try again.",
        };
      }
    }
  )

  /**
   * Delete a house.
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @param {string} context.params.house_id - The house ID.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .delete("/house-manage/:house_id", async ({ params, currentUser }: any) => {
    // Check if user has admin role
    if (currentUser.role !== "admin") {
      return {
        success: false,
        error: "Access denied. Admin role required.",
      };
    }
    try {
      const { house_id } = params;

      if (!house_id?.trim()) {
        return {
          success: false,
          error: "House ID is required",
        };
      }

      // Check if house exists
      const existingHouse = await db
        .select()
        .from(houses)
        .where(eq(houses.house_id, house_id));

      if (existingHouse.length === 0) {
        return {
          success: false,
          error: "House not found!",
        };
        }

        // Check if admin can delete this house (same village)
        const { village_keys, role } = currentUser;
        if (role !== "superadmin" && !village_keys.includes(existingHouse[0].village_key)) {
          return {
            success: false,
            error: "You can only delete houses in your assigned villages!",
          };
        }

        // Store house info for logging before deletion
      const houseInfo = existingHouse[0];

      // Delete house
      await db.delete(houses).where(eq(houses.house_id, house_id));

      // Log the house deletion activity
      try {
        await houseActivityLogger.logHouseDeleted(
          currentUser.admin_id,
          houseInfo.address,
          houseInfo.village_key || "unknown"
        );
      } catch (logError) {
        console.error("Error logging house deletion:", logError);
        // Don't fail the request if logging fails
      }

      return {
        success: true,
        message: "House deleted successfully!",
      };
    } catch (error) {
      console.error("Error deleting house:", error);
      return {
        success: false,
        error: "Failed to delete house. Please try again.",
      };
    }
  }); 