import { Elysia } from "elysia";
import db from "../db/drizzle";
import { houses, villages } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { notificationService } from "../services/notificationService";

/**
 * Interface for the create house request body.
 * @interface
 */
interface CreateHouseBody {
  address: string;
  // village_key will be automatically assigned from the admin's village.
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
 * Accessible by: admin (เจ้าของโครงการ) only
 * @type {Elysia}
 */
export const houseManageRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole("admin"))
  // Get all houses (moved from house.ts)
  .get("/houses", async ({ currentUser }: any) => {
    try {
      const { village_key } = currentUser;

      const result = await db
        .select()
        .from(houses)
        .where(eq(houses.village_key, village_key));
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
  
  // Create new house
  .post("/house-manage", async ({ body, currentUser }: any) => {
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

      const adminVillageKey = currentUser.village_key;

      // Check if admin's village exists
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, adminVillageKey));

      if (existingVillage.length === 0) {
        return {
          success: false,
          error:
            "Admin's village not found. Please contact system administrator.",
        };
      }

      // Insert new house (status will be "available" by default from schema)
      const [newHouse] = await db
        .insert(houses)
        .values({
          address: houseData.address.trim(),
          village_key: adminVillageKey, // Use admin's village_key
        })
        .returning();

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
        if (existingHouse[0].village_key !== currentUser.village_key) {
          return {
            success: false,
            error: "You can only update houses in your own village!",
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
        const oldStatus = existingHouse[0].status;

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

        // Send notification if status changed
        if (updateData.status !== undefined && oldStatus !== updateData.status) {
          try {
            await notificationService.notifyHouseStatusChange({
              house_id: house_id,
              address: updatedHouse.address,
              old_status: oldStatus,
              new_status: updateData.status,
              village_key: currentUser.village_key,
            });
            console.log(`📢 House status change notification sent: ${updatedHouse.address}`);
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
        if (existingHouse[0].village_key !== currentUser.village_key) {
          return {
            success: false,
            error: "You can only update houses in your own village!",
          };
        }

        // Get old status for notification
        const oldStatus = existingHouse[0].status;

        // Update house status
        const [updatedHouse] = await db
          .update(houses)
          .set({ status })
          .where(eq(houses.house_id, house_id))
          .returning();

        // Send notification if status actually changed
        if (oldStatus !== status) {
          try {
            await notificationService.notifyHouseStatusChange({
              house_id: house_id,
              address: updatedHouse.address,
              old_status: oldStatus,
              new_status: status,
              village_key: currentUser.village_key,
            });
            console.log(`📢 House status change notification sent: ${updatedHouse.address}`);
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
      if (existingHouse[0].village_key !== currentUser.village_key) {
        return {
          success: false,
          error: "You can only delete houses in your own village!",
        };
      }

      // Store house info for logging before deletion
      const houseInfo = existingHouse[0];

      // Delete house
      await db.delete(houses).where(eq(houses.house_id, house_id));

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