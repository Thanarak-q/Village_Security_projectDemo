import { Elysia } from "elysia";
import db from "../db/drizzle";
import { visitor_records, houses, villages } from "../db/schema";
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
      guardId: string;
      houseId: string;
      licenseImage?: string;
      idCardImage?: string;
      licensePlate?: string;
      visitPurpose?: string;
    };

    const {
      visitorIDCard,
      houseId,
      guardId,
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
    if (!guardId || typeof guardId !== "string" || !guardId.trim()) {
      errors.push("Guard ID is required and must be a non-empty string.");
    }
    if (errors.length > 0) {
      return { error: errors };
    }

    let savedImageFilename: string | null = null;
    let savedIdCardImageFilename: string | null = null;

    // Build hierarchical path: house_address/house_id/YYYY/MM/DD/<type>
    const now = new Date();
    const bangkokFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = bangkokFmt.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    const yyyy = getPart('year');
    const mm = getPart('month');
    const dd = getPart('day');
    const hh = getPart('hour');
    const min = getPart('minute');
    const ss = getPart('second');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const timePart = `${hh}_${min}_${ss}_${ms}`;

    const safeSegment = (s: string) =>
      s.trim().replace(/[\\/]+/g, "-").replace(/\s+/g, "_");

    // Look up house address and village name for the provided houseId
    let houseAddressForPath = "unknown_house";
    let villageNameForPath = "unknown_village";
    try {
      const rows = await db
        .select({ address: houses.address, village_name: villages.village_name })
        .from(houses)
        .innerJoin(villages, eq(houses.village_key, villages.village_key))
        .where(eq(houses.house_id, houseId));
      if (rows && rows[0]?.address) houseAddressForPath = rows[0].address;
      if (rows && rows[0]?.village_name) villageNameForPath = rows[0].village_name;
    } catch (e) {
      // Fallback if lookup fails
      console.error("Failed to resolve house address/village for house:", e);
    }

    const basePrefix = `${safeSegment(villageNameForPath)}/${safeSegment(houseAddressForPath)}/${yyyy}/${mm}/${dd}`;

    // Save base64 image to disk and store filename
    if (licenseImage && licenseImage.trim()) {
      try {
        const imageExtension = getImageExtension(licenseImage);
        savedImageFilename = await saveBase64Image(
          licenseImage,
          `visitor_license_${timePart}.${imageExtension}`,
          `${basePrefix}/license_images`
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
          `visitor_id_card_${timePart}.${imageExtension}`,
          `${basePrefix}/id_card_images`
        );
      } catch (err) {
        console.error("Failed to save ID card image:", err);
        return { error: "Failed to save ID card image file" };
      }
    }

    try {

    console.log("🚀 Inserting visitor record:", {
      resident_id: null,
      guard_id: guardId,
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
          guard_id: guardId,
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


