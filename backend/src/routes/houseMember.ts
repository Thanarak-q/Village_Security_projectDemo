import { Elysia } from "elysia";
import db from "../db/drizzle";
import { house_members, houses, residents } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  getAllHouseMembers,
  getHouseMembersByVillage,
  getHouseMembersByHouse,
  getHouseMembersByResident,
  createHouseMember,
  deleteHouseMember,
} from "../db/houseMemberUtils";
import { requireRole } from "../hooks/requireRole";

/**
 * The house member routes.
 * @type {Elysia}
 */
export const houseMemberRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff"]))
  /**
   * Get all house members.
   * @returns {Promise<Object>} A promise that resolves to an object containing the house members.
   */
  .get("/house-members", async () => {
    try {
      const result = await getAllHouseMembers();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching house members:", error);
      return { success: false, error: "Failed to fetch house members" };
    }
  })

  /**
   * Get house members by village.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.village_key - The village key.
   * @returns {Promise<Object>} A promise that resolves to an object containing the house members.
   */
  .get("/house-members/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;

      if (!village_key || village_key.trim().length === 0) {
        return {
          success: false,
          error: "Village key is required",
        };
      }

      const result = await getHouseMembersByVillage(village_key);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching house members by village:", error);
      return {
        success: false,
        error: "Failed to fetch house members for village",
      };
    }
  })

  /**
   * Get house members by house.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.house_id - The house ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing the house members.
   */
  .get("/house-members/house/:house_id", async ({ params }) => {
    try {
      const { house_id } = params;

      if (!house_id || house_id.trim().length === 0) {
        return {
          success: false,
          error: "House ID is required",
        };
      }

      const result = await getHouseMembersByHouse(house_id);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching house members by house:", error);
      return {
        success: false,
        error: "Failed to fetch house members for house",
      };
    }
  })

  /**
   * Get house members by resident.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.resident_id - The resident ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing the house members.
   */
  .get("/house-members/resident/:resident_id", async ({ params }) => {
    try {
      const { resident_id } = params;

      if (!resident_id || resident_id.trim().length === 0) {
        return {
          success: false,
          error: "Resident ID is required",
        };
      }

      const result = await getHouseMembersByResident(resident_id);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching house members by resident:", error);
      return {
        success: false,
        error: "Failed to fetch house members for resident",
      };
    }
  })

  /**
   * Get a single house member by ID.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.house_member_id - The house member ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing the house member.
   */
  .get("/house-members/:house_member_id", async ({ params }) => {
    try {
      const { house_member_id } = params;

      if (!house_member_id || house_member_id.trim().length === 0) {
        return {
          success: false,
          error: "House member ID is required",
        };
      }

      const result = await db
        .select()
        .from(house_members)
        .where(eq(house_members.house_member_id, house_member_id));

      if (result.length === 0) {
        return { success: false, error: "House member not found" };
      }

      return { success: true, data: result[0] };
    } catch (error) {
      console.error("Error fetching house member:", error);
      return { success: false, error: "Failed to fetch house member" };
    }
  })

  /**
   * Create a new house member.
   * @param {Object} body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the new house member.
   */
  .post("/house-members", async ({ body }) => {
    try {
      const { house_id, resident_id } = body as {
        house_id: string;
        resident_id: string;
      };

      // Validation
      if (!house_id || !resident_id) {
        return {
          success: false,
          error:
            "Missing required fields! house_id and resident_id are required.",
        };
      }

      if (house_id.trim().length === 0) {
        return {
          success: false,
          error: "House ID cannot be empty!",
        };
      }

      if (resident_id.trim().length === 0) {
        return {
          success: false,
          error: "Resident ID cannot be empty!",
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
          error: "House not found! Please provide a valid house ID.",
        };
      }

      // Check if resident exists
      const existingResident = await db
        .select()
        .from(residents)
        .where(eq(residents.resident_id, resident_id));

      if (existingResident.length === 0) {
        return {
          success: false,
          error: "Resident not found! Please provide a valid resident ID.",
        };
      }

      // Check if house member relationship already exists
      const existingHouseMember = await db
        .select()
        .from(house_members)
        .where(
          eq(house_members.house_id, house_id) &&
            eq(house_members.resident_id, resident_id)
        );

      if (existingHouseMember.length > 0) {
        return {
          success: false,
          error: "House member relationship already exists!",
        };
      }

      // Create new house member
      const newHouseMember = await createHouseMember(house_id, resident_id);

      return {
        success: true,
        message: "House member created successfully!",
        data: newHouseMember,
      };
    } catch (error) {
      console.error("Error creating house member:", error);
      return {
        success: false,
        error: "Failed to create house member. Please try again.",
      };
    }
  })

  /**
   * Delete a house member.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.house_member_id - The house member ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .delete("/house-members/:house_member_id", async ({ params }) => {
    try {
      const { house_member_id } = params;

      if (!house_member_id || house_member_id.trim().length === 0) {
        return {
          success: false,
          error: "House member ID is required",
        };
      }

      // Check if house member exists
      const existingHouseMember = await db
        .select()
        .from(house_members)
        .where(eq(house_members.house_member_id, house_member_id));

      if (existingHouseMember.length === 0) {
        return {
          success: false,
          error: "House member not found!",
        };
      }

      // Delete house member
      const deletedHouseMember = await deleteHouseMember(house_member_id);

      return {
        success: true,
        message: "House member deleted successfully!",
        data: deletedHouseMember,
      };
    } catch (error) {
      console.error("Error deleting house member:", error);
      return {
        success: false,
        error: "Failed to delete house member. Please try again.",
      };
    }
  });
