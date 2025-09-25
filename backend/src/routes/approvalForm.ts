import { Elysia } from "elysia";
import db from "../db/drizzle";
import { visitor_records, house_members } from "../db/schema";
import { eq } from "drizzle-orm";
import { saveBase64Image, getImageExtension } from "../utils/imageUtils";

// Note: This route is intentionally left unauthenticated to support the
// current mock frontend flow. Add role checks later if required.
const approvalForm = new Elysia({ prefix: "/api" }).post(
  "/approvalForms",
  async ({ body }) => {
    type ApprovalFormBody = {
      residentId?: string;
      visitorIDCard: string;
      houseId: string;
      pictureKey?: string;
      licensePlate?: string;
      visitPurpose?: string;
    };

    const {
      visitorIDCard,
      houseId,
      pictureKey,
      licensePlate,
      visitPurpose,
    } = (body || {}) as ApprovalFormBody;

    const errors: string[] = [];

    if (!houseId || typeof houseId !== "string" || !houseId.trim()) {
      errors.push("House ID is required and must be a non-empty string.");
    }
    if (!visitorIDCard || typeof visitorIDCard !== "string" || !visitorIDCard.trim()) {
      errors.push("Visitor ID card is required and must be a non-empty string.");
    }
    if (licensePlate !== undefined && (typeof licensePlate !== "string" || !licensePlate.trim())) {
      errors.push("License Plate, if provided, must be a non-empty string.");
    }

    if (errors.length > 0) {
      return { error: errors };
    }

    let savedImageFilename: string | null = null;

    // Save base64 image to disk and store filename
    if (pictureKey && pictureKey.trim()) {
      try {
        const imageExtension = getImageExtension(pictureKey);
        savedImageFilename = await saveBase64Image(
          pictureKey,
          `visitor_${Date.now()}.${imageExtension}`
        );
      } catch (err) {
        console.error("Failed to save image:", err);
        return { error: "Failed to save image file" };
      }
    }

    try {

    console.log("🚀 Inserting visitor record:", {
      resident_id: null,
      guard_id: null,
      house_id: houseId,
      visitor_id_card: visitorIDCard,
      picture_key: savedImageFilename,
      license_plate: licensePlate,
      visit_purpose: visitPurpose,
    });
      const [inserted] = await db
        .insert(visitor_records)
        .values({
          resident_id: null,
          guard_id: null,
          house_id: houseId,
          visitor_id_card: visitorIDCard,
          picture_key: savedImageFilename,
          license_plate: licensePlate,
          visit_purpose: visitPurpose,
          createdAt: new Date(),
          record_status: "pending",
        })
        .returning();

      return {
        success: true,
        visitorId: inserted?.visitor_record_id,
        imageFilename: savedImageFilename,
        message: "Visitor record created successfully",
      };
    } catch (dbError) {
      console.error("Database insertion failed:", dbError);
      return { error: "Failed to save visitor record to database" };
    }
  }
)

export default approvalForm;


