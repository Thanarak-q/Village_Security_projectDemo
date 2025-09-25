import { Elysia } from "elysia";
import db from "../db/drizzle";
import { visitor_records} from "../db/schema";
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
      licenseImage?: string;
      idCardImage?: string;
      licensePlate?: string;
      visitPurpose?: string;
    };

    const {
      visitorIDCard,
      houseId,
      licenseImage,
      idCardImage,
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
    let savedIdCardImageFilename: string | null = null;

    // Save base64 image to disk and store filename
    if (licenseImage && licenseImage.trim()) {
      try {
        const imageExtension = getImageExtension(licenseImage);
        savedImageFilename = await saveBase64Image(
          licenseImage,
          `visitor_license_${Date.now()}.${imageExtension}`,
          'license'
        );
      } catch (err) {
        console.error("Failed to save image:", err);
        return { error: "Failed to save image file" };
      }
    }

    // Save ID card image if provided
    if (idCardImage && idCardImage.trim()) {
      try {
        const imageExtension = getImageExtension(idCardImage);
        savedIdCardImageFilename = await saveBase64Image(
          idCardImage,
          `visitor_id_card_${Date.now()}.${imageExtension}`,
          'id_card'
        );
      } catch (err) {
        console.error("Failed to save ID card image:", err);
        return { error: "Failed to save ID card image file" };
      }
    }

    try {

    console.log("🚀 Inserting visitor record:", {
      resident_id: null,
      guard_id: null,
      house_id: houseId,
      visitor_id_card: visitorIDCard,
      license_image: savedImageFilename,
      id_card_image: savedIdCardImageFilename,
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
          license_image: savedImageFilename,
          id_card_image: savedIdCardImageFilename,
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
        idCardImageFilename: savedIdCardImageFilename,
        message: "Visitor record created successfully",
      };
    } catch (dbError) {
      console.error("Database insertion failed:", dbError);
      return { error: "Failed to save visitor record to database" };
    }
  }
)

export default approvalForm;


