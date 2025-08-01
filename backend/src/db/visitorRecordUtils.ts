import db from "./drizzle";
import { visitor_records, houses, residents, guards } from "./schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

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

// Utility function to get weekly visitor records statistics
export async function getWeeklyVisitorRecords() {
  // Calculate the start and end of current week (Sunday to Saturday)
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay); // Go back to Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
  endOfWeek.setHours(23, 59, 59, 999);

  // Get all visitor records for the current week
  const weeklyRecords = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      createdAt: visitor_records.createdAt,
    })
    .from(visitor_records)
    .where(
      and(
        gte(visitor_records.entry_time, startOfWeek),
        lte(visitor_records.entry_time, endOfWeek)
      )
    );

  // Initialize data structure for each day of the week
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyData = weekDays.map(day => ({
    day,
    approved: 0,
    pending: 0,
    rejected: 0,
    total: 0
  }));

  // Process records and count by status for each day
  weeklyRecords.forEach(record => {
    const recordDate = new Date(record.entry_time);
    const dayOfWeek = recordDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayOfWeek >= 0 && dayOfWeek < 7) {
      const status = record.record_status || 'pending';
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
      totalRecords: weeklyData.reduce((sum, day) => sum + day.total, 0)
    }
  };

  return result;
} 

// Utility function to get monthly visitor records statistics for current year
export async function getMonthlyVisitorRecords() {
  // Get current year
  const currentYear = new Date().getFullYear();
  
  // Calculate start and end of current year
  const startOfYear = new Date(currentYear, 0, 1); // January 1st
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31st

  // Get all visitor records for the current year
  const yearlyRecords = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      createdAt: visitor_records.createdAt,
    })
    .from(visitor_records)
    .where(
      and(
        gte(visitor_records.entry_time, startOfYear),
        lte(visitor_records.entry_time, endOfYear)
      )
    );

  // Initialize data structure for each month
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthlyData = months.map((month, index) => ({
    month,
    monthNumber: index + 1,
    approved: 0,
    pending: 0,
    rejected: 0,
    total: 0
  }));

  // Process records and count by status for each month
  yearlyRecords.forEach(record => {
    const recordDate = new Date(record.entry_time!);
    const monthIndex = recordDate.getMonth(); // 0 = January, 1 = February, ..., 11 = December
    
    if (monthIndex >= 0 && monthIndex < 12) {
      const status = record.record_status || 'pending';
      monthlyData[monthIndex][status]++;
      monthlyData[monthIndex].total++;
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
      totalRecords: monthlyData.reduce((sum, month) => sum + month.total, 0)
    }
  };

  return result;
} 

// Utility function to get yearly visitor records statistics for multiple years
export async function getYearlyVisitorRecords() {
  // Get all visitor records with their years
  const allRecords = await db
    .select({
      visitor_record_id: visitor_records.visitor_record_id,
      entry_time: visitor_records.entry_time,
      record_status: visitor_records.record_status,
      createdAt: visitor_records.createdAt,
    })
    .from(visitor_records);

  // Group records by year
  const recordsByYear: { [key: number]: any[] } = {};
  
  allRecords.forEach(record => {
    const recordDate = new Date(record.entry_time);
    const year = recordDate.getFullYear();
    
    if (!recordsByYear[year]) {
      recordsByYear[year] = [];
    }
    recordsByYear[year].push(record);
  });

  // Process each year and create statistics
  const yearlyData = Object.keys(recordsByYear)
    .map(yearStr => {
      const year = parseInt(yearStr);
      const yearRecords = recordsByYear[year];
      
      // Count records by status for this year
      const approved = yearRecords.filter(r => r.record_status === 'approved').length;
      const pending = yearRecords.filter(r => r.record_status === 'pending').length;
      const rejected = yearRecords.filter(r => r.record_status === 'rejected').length;
      const total = yearRecords.length;

      return {
        year,
        approved,
        pending,
        rejected,
        total
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
      totalRecords: yearlyData.reduce((sum, year) => sum + year.total, 0)
    }
  };

  return result;
} 