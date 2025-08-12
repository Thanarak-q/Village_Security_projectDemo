import { Elysia } from "elysia";
import db from "../db/drizzle";
import { houses } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

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








