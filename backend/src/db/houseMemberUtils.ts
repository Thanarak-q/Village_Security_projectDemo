import db from "./drizzle";
import { houses, residents, house_members } from "./schema";
import { eq, sql } from "drizzle-orm";

// Utility function to get house_members data for a specific village
export async function getHouseMembersByVillage(villageKey: string) {
  const result = await db
    .select({
      house_member_id: house_members.house_member_id,
      house_id: house_members.house_id,
      resident_id: house_members.resident_id,
      house_address: houses.address,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      village_key: houses.village_key
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(houses.village_key, villageKey));
  
  return result;
}

// Utility function to get all house_members with related data
export async function getAllHouseMembers() {
  const result = await db
    .select({
      house_member_id: house_members.house_member_id,
      house_id: house_members.house_id,
      resident_id: house_members.resident_id,
      house_address: houses.address,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      village_key: houses.village_key
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id));
  
  return result;
}

// Utility function to get house_members for a specific house
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
      village_key: houses.village_key
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(house_members.house_id, houseId));
  
  return result;
}

// Utility function to get house_members for a specific resident
export async function getHouseMembersByResident(residentId: string) {
  const result = await db
    .select({
      house_member_id: house_members.house_member_id,
      house_id: house_members.house_id,
      resident_id: house_members.resident_id,
      house_address: houses.address,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      village_key: houses.village_key
    })
    .from(house_members)
    .innerJoin(houses, eq(house_members.house_id, houses.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(house_members.resident_id, residentId));
  
  return result;
}

// Utility function to create a new house_member relationship
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

// Utility function to delete a house_member relationship
export async function deleteHouseMember(houseMemberId: string) {
  const [deletedHouseMember] = await db
    .delete(house_members)
    .where(eq(house_members.house_member_id, houseMemberId))
    .returning();
  
  return deletedHouseMember;
} 