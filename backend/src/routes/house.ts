import { Elysia } from "elysia";
import db from "../db/drizzle";
import { houses, villages } from "../db/schema";
import { eq } from "drizzle-orm";

export const houseRoutes = new Elysia({ prefix: "/api" })
  // Get all houses
  .get("/houses", async () => {
    try {
      const result = await db.select().from(houses);
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch houses" };
    }
  })
  
  // Get houses by village
  .get("/houses/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;
      
      const result = await db
        .select()
        .from(houses)
        .where(eq(houses.village_key, village_key));
      
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch houses for village" };
    }
  })
  
  // Get single house by ID
  .get("/houses/:house_id", async ({ params }) => {
    try {
      const { house_id } = params;
      
      const result = await db
        .select()
        .from(houses)
        .where(eq(houses.house_id, house_id));
      
      if (result.length === 0) {
        return { success: false, error: "House not found" };
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      return { error: "Failed to fetch house" };
    }
  })
  
  // Create new house
  .post("/houses", async ({ body }) => {
    try {
      const { address, village_key } = body as {
        address: string;
        village_key: string;
      };

      // Validation
      if (!address || !village_key) {
        return { 
          success: false, 
          error: "Missing required fields! address and village_key are required." 
        };
      }

      if (address.trim().length === 0) {
        return { 
          success: false, 
          error: "Address cannot be empty!" 
        };
      }

      if (village_key.trim().length === 0) {
        return { 
          success: false, 
          error: "Village key cannot be empty!" 
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
          error: "Village not found! Please provide a valid village key." 
        };
      }

      // Insert new house
      const [newHouse] = await db
        .insert(houses)
        .values({
          address: address.trim(),
          village_key: village_key.trim(),
        })
        .returning();

      return { 
        success: true, 
        message: "House created successfully!", 
        data: newHouse 
      };
    } catch (error) {
      console.error("Error creating house:", error);
      return { 
        success: false, 
        error: "Failed to create house. Please try again." 
      };
    }
  })
  
  // Update house
  .put("/houses/:house_id", async ({ params, body }) => {
    try {
      const { house_id } = params;
      const { address, village_key } = body as {
        address?: string;
        village_key?: string;
      };

      // Check if house exists
      const existingHouse = await db
        .select()
        .from(houses)
        .where(eq(houses.house_id, house_id));

      if (existingHouse.length === 0) {
        return { 
          success: false, 
          error: "House not found!" 
        };
      }

      // Validation
      if (address !== undefined && address.trim().length === 0) {
        return { 
          success: false, 
          error: "Address cannot be empty!" 
        };
      }

      if (village_key !== undefined) {
        if (village_key.trim().length === 0) {
          return { 
            success: false, 
            error: "Village key cannot be empty!" 
          };
        }

        // Check if new village exists
        const existingVillage = await db
          .select()
          .from(villages)
          .where(eq(villages.village_key, village_key));

        if (existingVillage.length === 0) {
          return { 
            success: false, 
            error: "Village not found! Please provide a valid village key." 
          };
        }
      }

      // Update house
      const updateData: any = {};
      if (address !== undefined) updateData.address = address.trim();
      if (village_key !== undefined) updateData.village_key = village_key.trim();

      const [updatedHouse] = await db
        .update(houses)
        .set(updateData)
        .where(eq(houses.house_id, house_id))
        .returning();

      return { 
        success: true, 
        message: "House updated successfully!", 
        data: updatedHouse 
      };
    } catch (error) {
      console.error("Error updating house:", error);
      return { 
        success: false, 
        error: "Failed to update house. Please try again." 
      };
    }
  })
  
  // Delete house
  .delete("/houses/:house_id", async ({ params }) => {
    try {
      const { house_id } = params;

      // Check if house exists
      const existingHouse = await db
        .select()
        .from(houses)
        .where(eq(houses.house_id, house_id));

      if (existingHouse.length === 0) {
        return { 
          success: false, 
          error: "House not found!" 
        };
      }

      // Delete house
      await db
        .delete(houses)
        .where(eq(houses.house_id, house_id));

      return { 
        success: true, 
        message: "House deleted successfully!" 
      };
    } catch (error) {
      console.error("Error deleting house:", error);
      return { 
        success: false, 
        error: "Failed to delete house. Please try again." 
      };
    }
  }); 