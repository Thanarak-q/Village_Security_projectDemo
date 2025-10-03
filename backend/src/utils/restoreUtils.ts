/**
 * @file Utility functions for restoring soft-deleted records
 * Provides functions to restore disabled entities (villages, houses, residents, guards, admins)
 */

import db from "../db/drizzle";
import { villages, houses, residents, guards, admins } from "../db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

/**
 * Restores a disabled village by setting disable_at to null and status to available
 * @param {string} villageId - The ID of the village to restore
 * @returns {Promise<Object>} Success message and restored village data
 */
export async function restoreVillage(villageId: string) {
  try {
    const restoredVillage = await db
      .update(villages)
      .set({ 
        disable_at: null,
        status: "active"
      })
      .where(eq(villages.village_id, villageId))
      .returning();

    if (restoredVillage.length === 0) {
      return { 
        success: false, 
        error: "Village not found or not disabled" 
      };
    }

    return {
      success: true,
      message: "Village restored successfully",
      data: restoredVillage[0]
    };
  } catch (error) {
    console.error("Error restoring village:", error);
    return { 
      success: false, 
      error: "Failed to restore village" 
    };
  }
}

/**
 * Restores a disabled house by setting disable_at to null and status to available
 * @param {string} houseId - The ID of the house to restore
 * @returns {Promise<Object>} Success message and restored house data
 */
export async function restoreHouse(houseId: string) {
  try {
    const restoredHouse = await db
      .update(houses)
      .set({ 
        disable_at: null,
        status: "available"
      })
      .where(eq(houses.house_id, houseId))
      .returning();

    if (restoredHouse.length === 0) {
      return { 
        success: false, 
        error: "House not found or not disabled" 
      };
    }

    return {
      success: true,
      message: "House restored successfully",
      data: restoredHouse[0]
    };
  } catch (error) {
    console.error("Error restoring house:", error);
    return { 
      success: false, 
      error: "Failed to restore house" 
    };
  }
}

/**
 * Restores a disabled resident by setting disable_at to null and status to verified
 * @param {string} residentId - The ID of the resident to restore
 * @returns {Promise<Object>} Success message and restored resident data
 */
export async function restoreResident(residentId: string) {
  try {
    const restoredResident = await db
      .update(residents)
      .set({ 
        disable_at: null,
        status: "verified"
      })
      .where(eq(residents.resident_id, residentId))
      .returning();

    if (restoredResident.length === 0) {
      return { 
        success: false, 
        error: "Resident not found or not disabled" 
      };
    }

    return {
      success: true,
      message: "Resident restored successfully",
      data: restoredResident[0]
    };
  } catch (error) {
    console.error("Error restoring resident:", error);
    return { 
      success: false, 
      error: "Failed to restore resident" 
    };
  }
}

/**
 * Restores a disabled guard by setting disable_at to null and status to verified
 * @param {string} guardId - The ID of the guard to restore
 * @returns {Promise<Object>} Success message and restored guard data
 */
export async function restoreGuard(guardId: string) {
  try {
    const restoredGuard = await db
      .update(guards)
      .set({ 
        disable_at: null,
        status: "verified"
      })
      .where(eq(guards.guard_id, guardId))
      .returning();

    if (restoredGuard.length === 0) {
      return { 
        success: false, 
        error: "Guard not found or not disabled" 
      };
    }

    return {
      success: true,
      message: "Guard restored successfully",
      data: restoredGuard[0]
    };
  } catch (error) {
    console.error("Error restoring guard:", error);
    return { 
      success: false, 
      error: "Failed to restore guard" 
    };
  }
}

/**
 * Restores a disabled admin by setting disable_at to null and status to verified
 * @param {string} adminId - The ID of the admin to restore
 * @returns {Promise<Object>} Success message and restored admin data
 */
export async function restoreAdmin(adminId: string) {
  try {
    const restoredAdmin = await db
      .update(admins)
      .set({ 
        disable_at: null,
        status: "verified"
      })
      .where(eq(admins.admin_id, adminId))
      .returning();

    if (restoredAdmin.length === 0) {
      return { 
        success: false, 
        error: "Admin not found or not disabled" 
      };
    }

    return {
      success: true,
      message: "Admin restored successfully",
      data: restoredAdmin[0]
    };
  } catch (error) {
    console.error("Error restoring admin:", error);
    return { 
      success: false, 
      error: "Failed to restore admin" 
    };
  }
}

/**
 * Gets all disabled records for a specific entity type
 * @param {"villages" | "houses" | "residents" | "guards" | "admins"} entityType - The type of entity to query
 * @returns {Promise<Array>} Array of disabled records
 */
export async function getDisabledRecords(entityType: "villages" | "houses" | "residents" | "guards" | "admins") {
  try {
    let query;
    
    switch (entityType) {
      case "villages":
        query = db
          .select()
          .from(villages)
          .where(isNotNull(villages.disable_at));
        break;
      case "houses":
        query = db
          .select()
          .from(houses)
          .where(isNotNull(houses.disable_at));
        break;
      case "residents":
        query = db
          .select()
          .from(residents)
          .where(isNotNull(residents.disable_at));
        break;
      case "guards":
        query = db
          .select()
          .from(guards)
          .where(isNotNull(guards.disable_at));
        break;
      case "admins":
        query = db
          .select()
          .from(admins)
          .where(isNotNull(admins.disable_at));
        break;
      default:
        return { 
          success: false, 
          error: "Invalid entity type" 
        };
    }

    const disabledRecords = await query;
    
    return {
      success: true,
      data: disabledRecords,
      count: disabledRecords.length
    };
  } catch (error) {
    console.error(`Error getting disabled ${entityType}:`, error);
    return { 
      success: false, 
      error: `Failed to get disabled ${entityType}` 
    };
  }
}
