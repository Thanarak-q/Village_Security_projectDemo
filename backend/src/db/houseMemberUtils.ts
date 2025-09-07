import db from "./drizzle";
import { houses, residents, house_members } from "./schema";
import { eq, sql } from "drizzle-orm";

/**
 * Gets house members data for a specific village.
 * @param {string} villageKey - The key of the village to retrieve house members for.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of house members.
 */
export async function getHouseMembersByVillage(villageKey: string) {
  const result = await db
    .select({
      house_member_id: house_members.house_member_id,
      house_id: house_members.house_id,
      resident_id: house_members.resident_id,
      house_address: houses.address,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      village_key: houses.village_key,
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(houses.village_key, villageKey));

  return result;
}

/**
 * Gets all house members with related data.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of all house members.
 */
export async function getAllHouseMembers() {
  const result = await db
    .select({
      house_member_id: house_members.house_member_id,
      house_id: house_members.house_id,
      resident_id: house_members.resident_id,
      house_address: houses.address,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      village_key: houses.village_key,
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(
      residents,
      eq(house_members.resident_id, residents.resident_id)
    );

  return result;
}

/**
 * Gets house members for a specific house.
 * @param {string} houseId - The ID of the house to retrieve house members for.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of house members.
 */
export async function getHouseMembersByHouse(houseId: string) {
  const result = await db
    .select({
      house_member_id: house_members.house_member_id,
      house_id: house_members.house_id,
      resident_id: house_members.resident_id,
      house_address: houses.address,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      resident_phone: residents.phone,
      village_key: houses.village_key,
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(house_members.house_id, houseId));

  return result;
}

/**
 * Gets house members for a specific resident.
 * @param {string} residentId - The ID of the resident to retrieve house members for.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of house members.
 */
export async function getHouseMembersByResident(residentId: string) {
  const result = await db
    .select({
      house_member_id: house_members.house_member_id,
      house_id: house_members.house_id,
      resident_id: house_members.resident_id,
      house_address: houses.address,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      village_key: houses.village_key,
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(house_members.resident_id, residentId));

  return result;
}

/**
 * Creates a new house member relationship.
 * @param {string} houseId - The ID of the house.
 * @param {string} residentId - The ID of the resident.
 * @returns {Promise<Object>} A promise that resolves to the newly created house member.
 */
export async function createHouseMember(houseId: string, residentId: string) {
  const [newHouseMember] = await db
    .insert(house_members)
    .values({
      house_id: houseId,
      resident_id: residentId,
    })
    .returning();

  return newHouseMember;
}

/**
 * Deletes a house member relationship.
 * @param {string} houseMemberId - The ID of the house member relationship to delete.
 * @returns {Promise<Object>} A promise that resolves to the deleted house member.
 */
export async function deleteHouseMember(houseMemberId: string) {
  const [deletedHouseMember] = await db
    .delete(house_members)
    .where(eq(house_members.house_member_id, houseMemberId))
    .returning();

  return deletedHouseMember;
} 