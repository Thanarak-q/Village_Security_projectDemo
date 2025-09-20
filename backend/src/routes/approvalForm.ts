import { Elysia } from "elysia";
import db from "../db/drizzle";
import { visitor_records } from "../db/schema";
import { requireRole } from "../hooks/requireRole";
import { eq, and } from "drizzle-orm";

const approvalForm = new Elysia()
    .onBeforeHandle(requireRole(["admin", "staff"]))
    .post("/approvalForms", async ({ body, store }: { body: unknown, store: { user?: { id?: string } } }) => {
        type ApprovalFormBody = {
            residentId?: string;
            houseId: string;
            pictureKey?: string;
            licensePlate?: string;
            visitPurpose?: string;
        };

        const {
            residentId,
            houseId,
            pictureKey,
            licensePlate,
            visitPurpose
        } = body as ApprovalFormBody;

        // Get guardId from authenticated user
        const guardId = store?.user?.id;
        const errors: string[] = [];

        // residentId is now optional
        // if (!residentId || typeof residentId !== "string" || !residentId.trim()) {
        //     errors.push("Resident ID is required and must be a non-empty string.");
        // }
        if (!houseId || typeof houseId !== "string" || !houseId.trim()) {
            errors.push("House ID is required and must be a non-empty string.");
        }
        if (pictureKey !== undefined && (typeof pictureKey !== "string" || !pictureKey.trim())) {
            errors.push("Picture Key, if provided, must be a non-empty string.");
        }
        if (licensePlate !== undefined && (typeof licensePlate !== "string" || !licensePlate.trim())) {
            errors.push("License Plate, if provided, must be a non-empty string.");
        }
        if (visitPurpose !== undefined && (typeof visitPurpose !== "string" || !visitPurpose.trim())) {
            errors.push("Visit Purpose, if provided, must be a non-empty string.");
        }

        if (errors.length > 0) {
            return { error: errors };
        }

        // Insert visitor record
        const [result] = await db.insert(visitor_records).values({
            resident_id: residentId || null,
            guard_id: guardId,
            house_id: houseId,
            picture_key: pictureKey,
            license_plate: licensePlate,
            visit_purpose: visitPurpose,
            createdAt: new Date(),
            record_status: "pending"
        }).returning();

        return { success: true, visitorId: result?.visitor_record_id };
    })
    // After inserting the visitor record, notify the resident with matching house_id
    // Endpoint for resident to accept a visitor record
    .post("/acceptVisitorRecord", async ({ body, store }: { body: unknown, store: { user?: { id?: string } } }) => {
        type AcceptBody = {
            visitorRecordId: string;
        };

        const { visitorRecordId } = body as AcceptBody;
        const residentId = store?.user?.id;

        if (!visitorRecordId || typeof visitorRecordId !== "string" || !visitorRecordId.trim()) {
            return { error: "visitorRecordId is required and must be a non-empty string." };
        }

        if (!residentId) {
            return { error: "Resident ID is required." };
        }

        // Update the visitor record status to 'approved' if resident is owner
        const [updated] = await db.update(visitor_records)
            .set({ record_status: "approved" })
            .where(and(
                eq(visitor_records.visitor_record_id, visitorRecordId),
                eq(visitor_records.resident_id, residentId)
            ))
            .returning();

        if (!updated) {
            return { error: "Record not found or you are not authorized to accept this visitor." };
        }

        return { success: true, visitorRecordId };
    })
    .onBeforeHandle(requireRole(["admin", "staff"]));

export default approvalForm;