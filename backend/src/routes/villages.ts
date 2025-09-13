import { Elysia } from "elysia";
import db from "../db/drizzle";
import { villages } from "../db/schema";
import { eq } from "drizzle-orm";

export const villagesRoutes = new Elysia({ prefix: "/api/villages" })
  .get("/", async ({ set }) => {
    try {
      const allVillages = await db.select({
        village_key: villages.village_key,
        village_name: villages.village_name,
      }).from(villages);
      
      return allVillages;
    } catch (error) {
      console.error("Error fetching villages:", error);
      set.status = 500;
      return { error: "Failed to fetch villages" };
    }
  })
  .get("/check/:villageKey", async ({ params, set }) => {
    try {
      const { villageKey } = params as { villageKey: string };

      const village = await db
        .select({
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(eq(villages.village_key, villageKey))
        .then(results => results[0]);

      if (village) {
        return { 
          exists: true, 
          village_key: village.village_key,
          village_name: village.village_name 
        };
      } else {
        return { exists: false };
      }
    } catch (error) {
      console.error("Error checking village:", error);
      set.status = 500;
      return { error: "Failed to check village" };
    }
  })
