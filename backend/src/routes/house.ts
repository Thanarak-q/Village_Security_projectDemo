import { Elysia } from "elysia";
import db from "../db/drizzle";
import { houses, villages } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

// Types
interface CreateHouseBody {
  address: string;
  village_key: string;
}

interface UpdateHouseBody {
  address?: string;
  village_key?: string;
  status?: "available" | "occupied" | "disable";
}

interface UpdateStatusBody {
  status: "available" | "occupied" | "disable";
}

// Validation functions
const validateHouseData = (data: CreateHouseBody) => {
  const errors: string[] = [];

  if (!data.address?.trim()) {
    errors.push("Address is required");
  }

  if (!data.village_key?.trim()) {
    errors.push("Village key is required");
  }

  return errors;
};

const validateUpdateData = (data: UpdateHouseBody) => {
  const errors: string[] = [];

  if (data.address !== undefined && !data.address.trim()) {
    errors.push("Address cannot be empty");
  }

  if (data.village_key !== undefined && !data.village_key.trim()) {
    errors.push("Village key cannot be empty");
  }

  if (
    data.status !== undefined &&
    !["available", "occupied", "disable"].includes(data.status)
  ) {
    errors.push("Invalid status. Must be: available, occupied, or disable");
  }

  return errors;
};

const validateStatus = (
  status: string
): status is "available" | "occupied" | "disable" => {
  return ["available", "occupied", "disable"].includes(status);
};

export const houseRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole("admin"))
  // Get all houses
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

  // Get houses by village
  .get("/houses/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;

      if (!village_key?.trim()) {
        return {
          success: false,
          error: "Village key is required",
        };
      }

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
      console.error("Error fetching houses by village:", error);
      return {
        success: false,
        error: "Failed to fetch houses for village",
      };
    }
  })

  // Get single house by ID
  .get("/houses/:house_id", async ({ params }) => {
    try {
      const { house_id } = params;

      if (!house_id?.trim()) {
        return {
          success: false,
          error: "House ID is required",
        };
      }

      const result = await db
        .select()
        .from(houses)
        .where(eq(houses.house_id, house_id));

      if (result.length === 0) {
        return {
          success: false,
          error: "House not found",
        };
      }

      return {
        success: true,
        data: result[0],
      };
    } catch (error) {
      console.error("Error fetching house:", error);
      return {
        success: false,
        error: "Failed to fetch house",
      };
    }
  })

  // Create new house
  .post("/houses", async ({ body }) => {
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

      // Check if village exists
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, houseData.village_key.trim()));

      if (existingVillage.length === 0) {
        return {
          success: false,
          error: "Village not found. Please provide a valid village key.",
        };
      }

      // Insert new house
      const [newHouse] = await db
        .insert(houses)
        .values({
          address: houseData.address.trim(),
          village_key: houseData.village_key.trim(),
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

  // Update house
  .put("/houses/:house_id", async ({ params, body }) => {
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

      // Validation
      const validationErrors = validateUpdateData(updateData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(", "),
        };
      }

      // Check if new village exists (if updating village_key)
      if (updateData.village_key !== undefined) {
        const existingVillage = await db
          .select()
          .from(villages)
          .where(eq(villages.village_key, updateData.village_key.trim()));

        if (existingVillage.length === 0) {
          return {
            success: false,
            error: "Village not found! Please provide a valid village key.",
          };
        }
      }

      // Prepare update data
      const dataToUpdate: any = {};
      if (updateData.address !== undefined)
        dataToUpdate.address = updateData.address.trim();
      if (updateData.village_key !== undefined)
        dataToUpdate.village_key = updateData.village_key.trim();
      if (updateData.status !== undefined)
        dataToUpdate.status = updateData.status;

      // Update house
      const [updatedHouse] = await db
        .update(houses)
        .set(dataToUpdate)
        .where(eq(houses.house_id, house_id))
        .returning();

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
  })

  // Update house status only
  .patch("/houses/:house_id/status", async ({ params, body }) => {
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

      // Update house status
      const [updatedHouse] = await db
        .update(houses)
        .set({ status })
        .where(eq(houses.house_id, house_id))
        .returning();

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
  })

  // Delete house
  .delete("/houses/:house_id", async ({ params }) => {
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
