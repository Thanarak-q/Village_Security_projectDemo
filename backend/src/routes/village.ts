import { Elysia } from "elysia";
import db from "../db/drizzle";
import { villages } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

/**
 * Interface for the create village request body.
 * @interface
 */
interface CreateVillageBody {
  village_name: string;
  village_key: string;
}

/**
 * Validates the village data.
 * @param {CreateVillageBody} data - The data to validate.
 * @returns {string[]} An array of validation errors.
 */
const validateVillageData = (data: CreateVillageBody) => {
  const errors: string[] = [];

  if (!data.village_name?.trim()) {
    errors.push("Village name is required");
  }

  if (!data.village_key?.trim()) {
    errors.push("Village key is required");
  }

  return errors;
};

/**
 * The village routes.
 * @type {Elysia}
 */
export const villageRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get all villages.
   * @returns {Promise<Object>} A promise that resolves to an object containing the villages.
   */
  .get("/villages", async () => {
    try {
      const result = await db.select().from(villages);
      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching villages:", error);
      return {
        success: false,
        error: "Failed to fetch villages",
      };
    }
  })

  /**
   * Get a village by key.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.village_key - The village key.
   * @returns {Promise<Object>} A promise that resolves to an object containing the village.
   */
  .get("/villages/:village_key", async ({ params }) => {
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
        .from(villages)
        .where(eq(villages.village_key, village_key));

      if (result.length === 0) {
        return {
          success: false,
          error: "Village not found",
        };
      }

      return {
        success: true,
        data: result[0],
      };
    } catch (error) {
      console.error("Error fetching village:", error);
      return {
        success: false,
        error: "Failed to fetch village",
      };
    }
  })

  /**
   * Create a new village.
   * @param {Object} body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the new village.
   */
  .post("/villages", async ({ body }) => {
    try {
      const villageData = body as CreateVillageBody;

      // Validation
      const validationErrors = validateVillageData(villageData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(", "),
        };
      }

      // Check if village_key already exists
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, villageData.village_key.trim()));

      if (existingVillage.length > 0) {
        return {
          success: false,
          error: "Village key already exists! Please use a different key.",
        };
      }

      // Insert new village
      const [newVillage] = await db
        .insert(villages)
        .values({
          village_name: villageData.village_name.trim(),
          village_key: villageData.village_key.trim(),
        })
        .returning();

      return {
        success: true,
        message: "Village created successfully!",
        data: newVillage,
      };
    } catch (error) {
      console.error("Error creating village:", error);
      return {
        success: false,
        error: "Failed to create village. Please try again.",
      };
    }
  })

  /**
   * Update a village.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.village_key - The village key.
   * @param {Object} body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the updated village.
   */
  .put("/villages/:village_key", async ({ params, body }) => {
    try {
      const { village_key } = params;
      const { village_name } = body as { village_name?: string };

      if (!village_key?.trim()) {
        return {
          success: false,
          error: "Village key is required",
        };
      }

      if (!village_name?.trim()) {
        return {
          success: false,
          error: "Village name is required",
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
          error: "Village not found!",
        };
      }

      // Update village
      const [updatedVillage] = await db
        .update(villages)
        .set({ village_name: village_name.trim() })
        .where(eq(villages.village_key, village_key))
        .returning();

      return {
        success: true,
        message: "Village updated successfully!",
        data: updatedVillage,
      };
    } catch (error) {
      console.error("Error updating village:", error);
      return {
        success: false,
        error: "Failed to update village. Please try again.",
      };
    }
  })

  /**
   * Delete a village.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.village_key - The village key.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .delete("/villages/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;

      if (!village_key?.trim()) {
        return {
          success: false,
          error: "Village key is required",
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
          error: "Village not found!",
        };
      }

      // Delete village
      await db
        .delete(villages)
        .where(eq(villages.village_key, village_key));

      return {
        success: true,
        message: "Village deleted successfully!",
      };
    } catch (error) {
      console.error("Error deleting village:", error);
      return {
        success: false,
        error: "Failed to delete village. Please try again.",
      };
    }
  }); 