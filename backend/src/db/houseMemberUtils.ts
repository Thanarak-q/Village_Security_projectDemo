/**
 * @file This file contains database utility functions for managing the `house_members` table,
 * which represents the many-to-many relationship between houses and residents.
 * It provides functions to create, retrieve, and delete these relationships.
 */

import db from "./drizzle";
import { houses, residents, house_members } from "./schema";
import { eq, sql } from "drizzle-orm";

/**
 * Retrieves a list of house members for a specific village, joining house and resident data.
 *
 * @param {string} villageId - The unique key of the village.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects, each representing a house member with associated house and resident details.
 */
export async function getHouseMembersByVillage(villageId: string) {
  const result = await db
    .select({
      house_member_id: house_members.house_member_id,
      house_id: house_members.house_id,
      resident_id: house_members.resident_id,
      house_address: houses.address,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      village_id: houses.village_id,
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(houses.village_id, villageId));

  return result;
}

/**
 * Retrieves all house member relationships from the database, along with their associated house and resident data.
 *
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
      village_id: houses.village_id,
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
 * Retrieves all members associated with a specific house.
 *
 * @param {string} houseId - The UUID of the house.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of members for the specified house.
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
      village_id: houses.village_id,
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(house_members.house_id, houseId));

  return result;
}

/**
 * Retrieves all house memberships for a specific resident.
 *
 * @param {string} residentId - The UUID of the resident.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of house memberships for the specified resident.
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
      village_id: houses.village_id,
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(house_members.resident_id, residentId));

  return result;
}

/**
 * Creates a new relationship between a house and a resident.
 *
 * @param {string} houseId - The UUID of the house.
 * @param {string} residentId - The UUID of the resident.
 * @returns {Promise<Object>} A promise that resolves to the newly created house member record.
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
 * Deletes a house member relationship by its unique ID.
 *
 * @param {string} houseMemberId - The UUID of the house member relationship to delete.
 * @returns {Promise<Object>} A promise that resolves to the deleted house member record.
 */
export async function deleteHouseMember(houseMemberId: string) {
  const [deletedHouseMember] = await db
    .delete(house_members)
    .where(eq(house_members.house_member_id, houseMemberId))
    .returning();

  return deletedHouseMember;
} 