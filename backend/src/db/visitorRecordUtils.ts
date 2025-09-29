/**
 * @file This file provides a comprehensive set of utility functions for managing visitor records.
 * It includes functions for creating, retrieving, updating, and deleting records,
 * as well as for generating detailed statistics on a weekly, monthly, and yearly basis.
 */

import db from "./drizzle";
import { visitor_records, houses, residents, guards, house_members } from "./schema";
import { eq, sql, and, gte, lte, inArray } from "drizzle-orm";

/**
 * Retrieves all visitor records, joining them with related resident, guard, and house information.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of all visitor records with detailed information.
 */
export async function getAllVisitorRecords() {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      visitor_name: visitor_records.visitor_name,
      visitor_id_card: visitor_records.visitor_id_card,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key,
    })
    .from(visitor_records)
    .leftJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .leftJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id));

  return result;
}

/**
 * Retrieves all visitor records for a specific village.
 * @param {string} villageKey - The unique key of the village.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of visitor records for the specified village.
 */
export async function getVisitorRecordsByVillage(villageKey: string) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      visitor_name: visitor_records.visitor_name,
      visitor_id_card: visitor_records.visitor_id_card,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key,
    })
    .from(visitor_records)
    .leftJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .leftJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(houses.village_key, villageKey));

  return result;
}

/**
 * Retrieves all visitor records associated with a specific resident.
 * @param {string} residentId - The UUID of the resident.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of visitor records for the resident.
 */
export async function getVisitorRecordsByResident(residentId: string) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      visitor_name: visitor_records.visitor_name,
      visitor_id_card: visitor_records.visitor_id_card,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key,
    })
    .from(visitor_records)
    .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(visitor_records.resident_id, residentId));

  return result;
}

/**
 * Retrieves all visitor records handled by a specific guard.
 * @param {string} guardId - The UUID of the guard.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of visitor records for the guard.
 */
export async function getVisitorRecordsByGuard(guardId: string) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      visitor_name: visitor_records.visitor_name,
      visitor_id_card: visitor_records.visitor_id_card,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key,
    })
    .from(visitor_records)
    .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(visitor_records.guard_id, guardId));

  return result;
}

/**
 * Retrieves all visitor records for a specific house.
 * @param {string} houseId - The UUID of the house.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of visitor records for the house.
 */
export async function getVisitorRecordsByHouse(houseId: string) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      visitor_name: visitor_records.visitor_name,
      visitor_id_card: visitor_records.visitor_id_card,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key,
    })
    .from(visitor_records)
    .leftJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .leftJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(visitor_records.house_id, houseId));

  return result;
}

/**
 * Retrieves all visitor records matching a specific status.
 * @param {"approved" | "pending" | "rejected"} status - The status to filter by.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of visitor records with the specified status.
 */
export async function getVisitorRecordsByStatus(
  status: "approved" | "pending" | "rejected"
) {
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      visitor_name: visitor_records.visitor_name,
      visitor_id_card: visitor_records.visitor_id_card,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key,
    })
    .from(visitor_records)
    .leftJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
    .leftJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .where(eq(visitor_records.record_status, status));

  return result;
}

/**
 * Retrieves all visitor records associated with a specific LINE user ID.
 * @param {string} lineUserId - The LINE user ID of the resident.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of visitor records for the resident.
 */
export async function getVisitorRecordsByLineId(lineUserId: string) {
  console.log(`🔍 Querying visitor records for LINE user ID: ${lineUserId}`);
  
  // First, check if the resident exists
  const resident = await db.query.residents.findFirst({
    where: eq(residents.line_user_id, lineUserId),
  });
  
  if (!resident) {
    console.log(`❌ No resident found for LINE user ID: ${lineUserId}`);
    return [];
  }
  
  console.log(`✅ Found resident: ${resident.resident_id} (${resident.fname} ${resident.lname})`);
  
  // Find visitor records where the resident is associated with the house
  const result = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      resident_id: visitor_records.resident_id,
      guard_id: visitor_records.guard_id,
      house_id: visitor_records.house_id,
      picture_key: visitor_records.picture_key,
      visitor_name: visitor_records.visitor_name,
      visitor_id_card: visitor_records.visitor_id_card,
      license_plate: visitor_records.license_plate,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      visit_purpose: visitor_records.visit_purpose,
      createdAt: visitor_records.createdAt,
      updatedAt: visitor_records.updatedAt,
      resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
      resident_email: residents.email,
      guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
      guard_email: guards.email,
      house_address: houses.address,
      village_key: houses.village_key,
    })
    .from(visitor_records)
    .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
    .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
    .innerJoin(house_members, eq(visitor_records.house_id, house_members.house_id))
    .innerJoin(residents, eq(house_members.resident_id, residents.resident_id))
    .where(eq(residents.line_user_id, lineUserId));

  console.log(`📊 Found ${result.length} visitor records for resident ${resident.resident_id}`);
  return result;
}


/**
 * Creates a new visitor record in the database.
 * @param {Object} data - The data for the new record.
 * @param {string} [data.resident_id] - The UUID of the resident being visited (optional).
 * @param {string} data.guard_id - The UUID of the guard who logged the visit.
 * @param {string} data.house_id - The UUID of the house being visited.
 * @param {string} [data.picture_key] - An optional key for a visitor photo.
 * @param {string} [data.license_plate] - An optional license plate number.
 * @param {"approved" | "pending" | "rejected"} [data.record_status="pending"] - The initial status of the record.
 * @param {string} [data.visit_purpose] - The purpose of the visit.
 * @returns {Promise<Object>} A promise that resolves to the newly created visitor record.
 */
export async function createVisitorRecord(data: {
  resident_id?: string;
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
      resident_id: data.resident_id || null,
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

/**
 * Updates the status of an existing visitor record.
 * @param {string} visitorRecordId - The UUID of the visitor record to update.
 * @param {"approved" | "pending" | "rejected"} status - The new status to set.
 * @returns {Promise<Object>} A promise that resolves to the updated visitor record.
 */
export async function updateVisitorRecordStatus(
  visitorRecordId: string,
  status: "approved" | "pending" | "rejected"
) {
  const [updatedVisitorRecord] = await db
    .update(visitor_records)
    .set({
      record_status: status,
      updatedAt: new Date(),
    })
    .where(eq(visitor_records.visitor_record_id, visitorRecordId))
    .returning();

  return updatedVisitorRecord;
}

/**
 * Deletes a visitor record from the database.
 * @param {string} visitorRecordId - The UUID of the visitor record to delete.
 * @returns {Promise<Object>} A promise that resolves to the deleted visitor record.
 */
export async function deleteVisitorRecord(visitorRecordId: string) {
  const [deletedVisitorRecord] = await db
    .delete(visitor_records)
    .where(eq(visitor_records.visitor_record_id, visitorRecordId))
    .returning();

  return deletedVisitorRecord;
}

/**
 * Retrieves visitor records by resident name (fname + lname).
 * @param {string} residentName - The full name of the resident (e.g., "สมชาย ผาสุก").
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of visitor records for the specified resident.
 */
export async function getVisitorRecordsByResidentName(residentName: string) {
  console.log(`🔍 Database query for resident: "${residentName}"`);
  
  try {
    // First, let's get all records and filter in JavaScript to debug
    const allRecords = await db
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
        resident_name: sql`${residents.fname} || ' ' || ${residents.lname}`,
        resident_email: residents.email,
        guard_name: sql`${guards.fname} || ' ' || ${guards.lname}`,
        guard_email: guards.email,
        house_address: houses.address,
        village_key: houses.village_key,
      })
      .from(visitor_records)
      .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
      .innerJoin(guards, eq(visitor_records.guard_id, guards.guard_id))
      .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
      .orderBy(visitor_records.createdAt);

    console.log(`📊 Total records in database: ${allRecords.length}`);
    
    // Filter by resident name in JavaScript
    const filteredRecords = allRecords.filter(record => {
      const recordName = record.resident_name;
      const matches = recordName === residentName;
      if (matches) {
        console.log(`✅ Found matching record: ${record.license_plate} for ${recordName}`);
      }
      return matches;
    });

    console.log(`✅ Found ${filteredRecords.length} records for "${residentName}"`);
    
    // Log some debug info
    if (filteredRecords.length === 0) {
      console.log(`🔍 Available resident names in database:`);
      const uniqueNames = [...new Set(allRecords.map(r => r.resident_name))];
      uniqueNames.slice(0, 10).forEach(name => console.log(`  - "${name}"`));
    }
    
    return filteredRecords;
  } catch (error) {
    console.error(`❌ Database query failed for resident "${residentName}":`, error);
    throw error;
  }
}

/**
 * Retrieves and compiles statistics for visitor records for the current week (Sunday to Saturday).
 * @param {string[]} villageKeys - Array of village keys to filter by (optional).
 * @param {string} role - User role for permission checking.
 * @returns {Promise<Object>} A promise that resolves to an object containing weekly statistics, including counts per day and a summary.
 */
export async function getWeeklyVisitorRecords(villageKeys?: string[], role?: string) {
  // Calculate the start and end of current week (Sunday to Saturday)
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay); // Go back to Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
  endOfWeek.setHours(23, 59, 59, 999);

  // Build query with village filtering if provided
  let query = db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      createdAt: visitor_records.createdAt,
    })
    .from(visitor_records);

  // Add village filtering if villageKeys provided and user is not superadmin
  if (villageKeys && villageKeys.length > 0 && role !== "superadmin") {
    query = query
      .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
      .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
      .where(
        and(
          inArray(houses.village_key, villageKeys),
          gte(visitor_records.entry_time, startOfWeek),
          lte(visitor_records.entry_time, endOfWeek)
        )
      );
  } else {
    // No village filtering for superadmin or when no villageKeys provided
    query = query.where(
      and(
        gte(visitor_records.entry_time, startOfWeek),
        lte(visitor_records.entry_time, endOfWeek)
      )
    );
  }

  const weeklyRecords = await query;

  // Initialize data structure for each day of the week
  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const weeklyData = weekDays.map((day) => ({
    day,
    approved: 0,
    pending: 0,
    rejected: 0,
    total: 0,
  }));

  // Process records and count by status for each day
  weeklyRecords.forEach((record) => {
    if (!record.entry_time) return;
    const recordDate = new Date(record.entry_time);
    const dayOfWeek = recordDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (dayOfWeek >= 0 && dayOfWeek < 7) {
      const status = record.record_status || "pending";
      weeklyData[dayOfWeek][status]++;
      weeklyData[dayOfWeek].total++;
    }
  });

  // Add metadata
  const result = {
    weekStart: startOfWeek.toISOString(),
    weekEnd: endOfWeek.toISOString(),
    currentDate: now.toISOString(),
    weeklyData,
    summary: {
      totalApproved: weeklyData.reduce((sum, day) => sum + day.approved, 0),
      totalPending: weeklyData.reduce((sum, day) => sum + day.pending, 0),
      totalRejected: weeklyData.reduce((sum, day) => sum + day.rejected, 0),
      totalRecords: weeklyData.reduce((sum, day) => sum + day.total, 0),
    },
  };

  return result;
}

/**
 * Retrieves and compiles statistics for visitor records for each month of the current year.
 * @param {string[]} villageKeys - Array of village keys to filter by (optional).
 * @param {string} role - User role for permission checking.
 * @returns {Promise<Object>} A promise that resolves to an object containing monthly statistics and a summary.
 */
export async function getMonthlyVisitorRecords(villageKeys?: string[], role?: string) {
  // Get current year
  const currentYear = new Date().getFullYear();

  // Calculate start and end of current year
  const startOfYear = new Date(currentYear, 0, 1); // January 1st
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31st

  // Build query with village filtering if provided
  let query = db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      createdAt: visitor_records.createdAt,
    })
    .from(visitor_records);

  // Add village filtering if villageKeys provided and user is not superadmin
  if (villageKeys && villageKeys.length > 0 && role !== "superadmin") {
    query = query
      .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
      .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
      .where(
        and(
          inArray(houses.village_key, villageKeys),
          gte(visitor_records.entry_time, startOfYear),
          lte(visitor_records.entry_time, endOfYear)
        )
      );
  } else {
    // No village filtering for superadmin or when no villageKeys provided
    query = query.where(
      and(
        gte(visitor_records.entry_time, startOfYear),
        lte(visitor_records.entry_time, endOfYear)
      )
    );
  }

  const yearlyRecords = await query;

  // Initialize data structure for each month
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthlyData = months.map((month, index) => ({
    month,
    monthNumber: index + 1,
    approved: 0,
    pending: 0,
    rejected: 0,
    total: 0,
  }));

  // Process records and count by status for each month
  yearlyRecords.forEach((record) => {
    if (record.entry_time) {
      const recordDate = new Date(record.entry_time);
      const monthIndex = recordDate.getMonth(); // 0 = January, 1 = February, ..., 11 = December

      if (monthIndex >= 0 && monthIndex < 12) {
        const status = record.record_status || "pending";
        monthlyData[monthIndex][status]++;
        monthlyData[monthIndex].total++;
      }
    }
  });

  // Add metadata
  const result = {
    year: currentYear,
    yearStart: startOfYear.toISOString(),
    yearEnd: endOfYear.toISOString(),
    currentDate: new Date().toISOString(),
    monthlyData,
    summary: {
      totalApproved: monthlyData.reduce((sum, month) => sum + month.approved, 0),
      totalPending: monthlyData.reduce((sum, month) => sum + month.pending, 0),
      totalRejected: monthlyData.reduce((sum, month) => sum + month.rejected, 0),
      totalRecords: monthlyData.reduce((sum, month) => sum + month.total, 0),
    },
  };

  return result;
}

/**
 * Retrieves and compiles statistics for visitor records, aggregated by year.
 * @param {string[]} villageKeys - Array of village keys to filter by (optional).
 * @param {string} role - User role for permission checking.
 * @returns {Promise<Object>} A promise that resolves to an object containing yearly statistics and a summary.
 */
export async function getYearlyVisitorRecords(villageKeys?: string[], role?: string) {
  // Build query with village filtering if provided
  let query = db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      createdAt: visitor_records.createdAt,
    })
    .from(visitor_records);

  // Add village filtering if villageKeys provided and user is not superadmin
  if (villageKeys && villageKeys.length > 0 && role !== "superadmin") {
    query = query
      .innerJoin(residents, eq(visitor_records.resident_id, residents.resident_id))
      .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
      .where(inArray(houses.village_key, villageKeys));
  }

  const allRecords = await query;

  // Group records by year
  const recordsByYear: { [key: number]: any[] } = {};
  
  allRecords.forEach(record => {
    if (record.entry_time) {
      const recordDate = new Date(record.entry_time);
      const year = recordDate.getFullYear();
      
      if (!recordsByYear[year]) {
        recordsByYear[year] = [];
      }
      recordsByYear[year].push(record);
    }
  });

  // Process each year and create statistics
  const yearlyData = Object.keys(recordsByYear)
    .map((yearStr) => {
      const year = parseInt(yearStr);
      const yearRecords = recordsByYear[year];

      // Count records by status for this year
      const approved = yearRecords.filter(
        (r) => r.record_status === "approved"
      ).length;
      const pending = yearRecords.filter(
        (r) => r.record_status === "pending"
      ).length;
      const rejected = yearRecords.filter(
        (r) => r.record_status === "rejected"
      ).length;
      const total = yearRecords.length;

      return {
        year,
        approved,
        pending,
        rejected,
        total,
      };
    })
    .sort((a, b) => b.year - a.year); // Sort by year descending (newest first)

  // Add metadata
  const result = {
    currentDate: new Date().toISOString(),
    totalYears: yearlyData.length,
    yearlyData,
    summary: {
      totalApproved: yearlyData.reduce((sum, year) => sum + year.approved, 0),
      totalPending: yearlyData.reduce((sum, year) => sum + year.pending, 0),
      totalRejected: yearlyData.reduce((sum, year) => sum + year.rejected, 0),
      totalRecords: yearlyData.reduce((sum, year) => sum + year.total, 0),
    },
  };

  return result;
} 