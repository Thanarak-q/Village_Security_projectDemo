import db from "./drizzle";
import { visitor_records, houses, residents, guards } from "./schema";
import { eq, sql } from "drizzle-orm";

// Utility function to get all visitor_records with related data
export async function getAllVisitorRecords() {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      // Related data
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key
    })
    .from(visitor_records)
    .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id));
  
  return result;
}

// Utility function to get visitor_records by village
export async function getVisitorRecordsByVillage(villageKey: string) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      // Related data
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key
    })
    .from(visitor_records)
    .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(houses.village_key, villageKey));
  
  return result;
}

// Utility function to get visitor_records by resident
export async function getVisitorRecordsByResident(residentId: string) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      // Related data
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key
    })
    .from(visitor_records)
    .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(visitor_records.resident_id, residentId));
  
  return result;
}

// Utility function to get visitor_records by guard
export async function getVisitorRecordsByGuard(guardId: string) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      // Related data
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key
    })
    .from(visitor_records)
    .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(visitor_records.guard_id, guardId));
  
  return result;
}

// Utility function to get visitor_records by house
export async function getVisitorRecordsByHouse(houseId: string) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      // Related data
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key
    })
    .from(visitor_records)
    .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(visitor_records.house_id, houseId));
  
  return result;
}

// Utility function to get visitor_records by status
export async function getVisitorRecordsByStatus(status: "approved" | "pending" | "rejected") {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      // Related data
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key
    })
    .from(visitor_records)
    .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(visitor_records.record_status, status));
  
  return result;
}

// Utility function to create a new visitor record
export async function createVisitorRecord(data: {
  resident_id: string;
  guard_id: string;
  house_id: string;
  picture_key?: string;
  license_plate?: string;
  record_status?: "approved" | "pending" | "rejected";
  visit_purpose?: string;
}) {
  const [newVisitorRecord] = await db
    .insert(visitor_records)
    .values({
      resident_id: data.resident_id,
      guard_id: data.guard_id,
      house_id: data.house_id,
      picture_key: data.picture_key,
      license_plate: data.license_plate,
      record_status: data.record_status || "pending",
      visit_purpose: data.visit_purpose,
    })
    .returning();
  
  return newVisitorRecord;
}

// Utility function to update visitor record status
export async function updateVisitorRecordStatus(visitorRecordId: string, status: "approved" | "pending" | "rejected") {
  const [updatedVisitorRecord] = await db
    .update(visitor_records)
    .set({ 
      record_status: status,
      updatedAt: new Date()
    })
    .where(eq(visitor_records.visitor_record_id, visitorRecordId))
    .returning();
  
  return updatedVisitorRecord;
}

// Utility function to delete a visitor record
export async function deleteVisitorRecord(visitorRecordId: string) {
  const [deletedVisitorRecord] = await db
    .delete(visitor_records)
    .where(eq(visitor_records.visitor_record_id, visitorRecordId))
    .returning();
  
  return deletedVisitorRecord;
} 