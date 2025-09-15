import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents, visitor_records, guards } from "../db/schema";
import { eq, count, and, gte, lt } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
/**
 * Interface for the create visitor record request body.
 * @interface
 */
interface CreateVisitorRecordBody {
  resident_id: string;
  guard_id: string;
  house_id: string;
  picture_key?: string;
  license_plate?: string;
  visit_purpose?: string;
}

/**
 * Interface for the update status request body.
 * @interface
 */
interface UpdateStatusBody {
  record_status: "pending" | "approved" | "rejected";
}

/**
 * Validates the visitor record data.
 * @param {CreateVisitorRecordBody} data - The data to validate.
 * @returns {string[]} An array of validation errors.
 */
const validateVisitorRecordData = (data: CreateVisitorRecordBody) => {
  const errors: string[] = [];

  if (!data.resident_id?.trim()) {
    errors.push("Resident ID is required");
  }

  if (!data.guard_id?.trim()) {
    errors.push("Guard ID is required");
  }

  if (!data.house_id?.trim()) {
    errors.push("House ID is required");
  }

  return errors;
};

const residentApi = new Elysia();

residentApi.get("/api/visitor-requests/pending/:resident_id", async ({ params }) => {
  const pendingRequests = await db
    .select()
    .from(visitor_records)
    .where(
      and(
        eq(visitor_records.record_status, "pending"),
        eq(visitor_records.resident_id, params.resident_id)
      )
    )
    .orderBy(visitor_records.createdAt);
  return pendingRequests;
});

export default residentApi;