import { Elysia } from "elysia";
import db from "../db/drizzle";
import { villages } from "../db/schema";
import { eq } from "drizzle-orm";

export const villageRoutes = new Elysia({ prefix: "/api" })
  .get("/villages", async () => {
    try {
      const result = await db.select().from(villages);
      return { success: true, data: result };
    } catch (error) {
      return { error: "Failed to fetch villages" };
    }
  })
  
  .post("/villages", async ({ body }) => {
    try {
      const { village_name, village_key } = body as {
        village_name: string;
        village_key: string;
      };

      // Validation
      if (!village_name || !village_key) {
        return { 
          success: false, 
          error: "Missing required fields! village_name and village_key are required." 
        };
      }

      if (village_name.trim().length === 0) {
        return { 
          success: false, 
          error: "Village name cannot be empty!" 
        };
      }

      if (village_key.trim().length === 0) {
        return { 
          success: false, 
          error: "Village key cannot be empty!" 
        };
      }

      // Check if village_key already exists
      const existingVillage = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_key));

      if (existingVillage.length > 0) {
        return { 
          success: false, 
          error: "Village key already exists! Please use a different key." 
        };
      }

      // Insert new village
      const [newVillage] = await db
        .insert(villages)
        .values({
          village_name: village_name.trim(),
          village_key: village_key.trim(),
        })
        .returning();

      return { 
        success: true, 
        message: "Village created successfully!", 
        data: newVillage 
      };
    } catch (error) {
      console.error("Error creating village:", error);
      return { 
        success: false, 
        error: "Failed to create village. Please try again." 
      };
    }
  }); 