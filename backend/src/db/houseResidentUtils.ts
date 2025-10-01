/**
 * @file Utility functions for managing house residents and their LINE IDs
 * This file provides functions to get residents with LINE IDs for specific houses
 * to enable flex message notifications
 */

import db from "./drizzle";
import { houses, residents, house_members, villages } from "./schema";
import { eq, and, isNotNull, inArray } from "drizzle-orm";

/**
 * Interface for resident with LINE ID information
 */
export interface ResidentWithLineId {
  resident_id: string;
  line_user_id: string;
  line_display_name: string | null;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  house_id: string;
  house_address: string;
  village_key: string | null;
  village_name: string;
}

/**
 * Gets all residents with LINE IDs for a specific house
 * @param houseId - The UUID of the house
 * @returns Promise<ResidentWithLineId[]> - Array of residents with LINE IDs
 */
export async function getHouseResidentsWithLineId(houseId: string): Promise<ResidentWithLineId[]> {
  console.log(`🔍 Getting residents with LINE IDs for house: ${houseId}`);
  
  try {
    const result = await db
      .select({
        resident_id: residents.resident_id,
        line_user_id: residents.line_user_id,
        line_display_name: residents.line_display_name,
        fname: residents.fname,
        lname: residents.lname,
        email: residents.email,
        phone: residents.phone,
        house_id: houses.house_id,
        house_address: houses.address,
        village_key: houses.village_id,
        village_name: villages.village_name,
      })
      .from(house_members)
      .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
      .innerJoin(houses, eq(house_members.house_id, houses.house_id))
      .innerJoin(villages, eq(houses.village_id, villages.village_id))
      .where(
        and(
          eq(house_members.house_id, houseId),
          isNotNull(residents.line_user_id),
          eq(residents.status, "verified")
        )
      );

    console.log(`✅ Found ${result.length} residents with LINE IDs for house ${houseId}`);
    // Type assertion is safe here because we filter for non-null line_user_id
    return result as ResidentWithLineId[];
  } catch (error) {
    console.error(`❌ Error getting residents with LINE IDs for house ${houseId}:`, error);
    return [];
  }
}

/**
 * Gets all residents with LINE IDs for multiple houses
 * @param houseIds - Array of house UUIDs
 * @returns Promise<ResidentWithLineId[]> - Array of residents with LINE IDs
 */
export async function getMultipleHouseResidentsWithLineId(houseIds: string[]): Promise<ResidentWithLineId[]> {
  console.log(`🔍 Getting residents with LINE IDs for ${houseIds.length} houses`);
  
  if (houseIds.length === 0) {
    return [];
  }

  try {
    const result = await db
      .select({
        resident_id: residents.resident_id,
        line_user_id: residents.line_user_id,
        line_display_name: residents.line_display_name,
        fname: residents.fname,
        lname: residents.lname,
        email: residents.email,
        phone: residents.phone,
        house_id: houses.house_id,
        house_address: houses.address,
        village_key: houses.village_id,
        village_name: villages.village_name,
      })
      .from(house_members)
      .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
      .innerJoin(houses, eq(house_members.house_id, houses.house_id))
      .innerJoin(villages, eq(houses.village_id, villages.village_id))
      .where(
        and(
          inArray(house_members.house_id, houseIds),
          isNotNull(residents.line_user_id),
          eq(residents.status, "verified")
        )
      );

    console.log(`✅ Found ${result.length} residents with LINE IDs for ${houseIds.length} houses`);
    // Type assertion is safe here because we filter for non-null line_user_id
    return result as ResidentWithLineId[];
  } catch (error) {
    console.error(`❌ Error getting residents with LINE IDs for houses:`, error);
    return [];
  }
}

/**
 * Gets a single resident with LINE ID by resident ID
 * @param residentId - The UUID of the resident
 * @returns Promise<ResidentWithLineId | null> - Resident with LINE ID or null
 */
export async function getResidentWithLineId(residentId: string): Promise<ResidentWithLineId | null> {
  console.log(`🔍 Getting resident with LINE ID: ${residentId}`);
  
  try {
    const result = await db
      .select({
        resident_id: residents.resident_id,
        line_user_id: residents.line_user_id,
        line_display_name: residents.line_display_name,
        fname: residents.fname,
        lname: residents.lname,
        email: residents.email,
        phone: residents.phone,
        house_id: houses.house_id,
        house_address: houses.address,
        village_key: houses.village_id,
        village_name: villages.village_name,
      })
      .from(house_members)
      .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
      .innerJoin(houses, eq(house_members.house_id, houses.house_id))
      .innerJoin(villages, eq(houses.village_id, villages.village_id))
      .where(
        and(
          eq(residents.resident_id, residentId),
          isNotNull(residents.line_user_id),
          eq(residents.status, "verified")
        )
      )
      .limit(1);

    if (result.length > 0) {
      console.log(`✅ Found resident with LINE ID: ${result[0].fname} ${result[0].lname}`);
      // Type assertion is safe here because we filter for non-null line_user_id
      return result[0] as ResidentWithLineId;
    } else {
      console.log(`❌ No resident with LINE ID found for resident: ${residentId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error getting resident with LINE ID:`, error);
    return null;
  }
}

/**
 * Gets all residents with LINE IDs for a specific village
 * @param villageKey - The village key
 * @returns Promise<ResidentWithLineId[]> - Array of residents with LINE IDs
 */
export async function getVillageResidentsWithLineId(villageKey: string): Promise<ResidentWithLineId[]> {
  console.log(`🔍 Getting residents with LINE IDs for village: ${villageKey}`);
  
  try {
    const result = await db
      .select({
        resident_id: residents.resident_id,
        line_user_id: residents.line_user_id,
        line_display_name: residents.line_display_name,
        fname: residents.fname,
        lname: residents.lname,
        email: residents.email,
        phone: residents.phone,
        house_id: houses.house_id,
        house_address: houses.address,
        village_key: houses.village_id,
        village_name: villages.village_name,
      })
      .from(house_members)
      .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
      .innerJoin(houses, eq(house_members.house_id, houses.house_id))
      .innerJoin(villages, eq(houses.village_id, villages.village_id))
      .where(
        and(
          eq(villages.village_key, villageKey),
          isNotNull(residents.line_user_id),
          eq(residents.status, "verified")
        )
      );

    console.log(`✅ Found ${result.length} residents with LINE IDs for village ${villageKey}`);
    // Type assertion is safe here because we filter for non-null line_user_id
    return result as ResidentWithLineId[];
  } catch (error) {
    console.error(`❌ Error getting residents with LINE IDs for village:`, error);
    return [];
  }
}
