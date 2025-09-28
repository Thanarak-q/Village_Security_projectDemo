import { Elysia } from "elysia";
import db from "../db/drizzle";
import { visitor_records, houses, villages } from "../db/schema";
import { eq } from "drizzle-orm";
import { visitor_records, guards, houses, house_members } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { saveBase64Image, getImageExtension } from "../utils/imageUtils";

// Note: This route is intentionally left unauthenticated to support the
// current mock frontend flow. Add role checks later if required.
const approvalForm = new Elysia({ prefix: "/api" })
  .get("/guards", async () => {
    try {
      const guardsList = await db.query.guards.findMany({
        where: eq(guards.status, "verified"),
        columns: {
          guard_id: true,
          fname: true,
          lname: true,
          email: true,
        }
      });
      
      return {
        success: true,
        guards: guardsList,
      };
    } catch (error) {
      console.error("Error fetching guards:", error);
      return {
        success: false,
        error: "Failed to fetch guards",
      };
    }
  })
  .get("/test-visitor-records", async () => {
    try {
      const records = await db.query.visitor_records.findMany({
        with: {
          guard: true,
          house: true,
        },
        limit: 10,
        orderBy: (visitor_records, { desc }) => [desc(visitor_records.createdAt)]
      });
      
      return {
        success: true,
        records: records,
        total: records.length,
      };
    } catch (error) {
      console.error("Error fetching visitor records:", error);
      return {
        success: false,
        error: "Failed to fetch visitor records",
      };
    }
  })
  .post(
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

    // Validate that guard exists
    let guard;
    try {
      guard = await db.query.guards.findFirst({
        where: eq(guards.guard_id, guardId),
      });
      
      if (!guard) {
        return { 
          error: `Guard with ID ${guardId} not found. Please use a valid guard ID from the /api/guards endpoint.` 
        };
      }
      
      console.log(`✅ Guard found: ${guard.fname} ${guard.lname} (${guard.guard_id})`);
    } catch (guardError) {
      console.error("Error validating guard:", guardError);
      return { error: "Failed to validate guard ID" };
    }

    // Validate that house exists
    let house;
    try {
      house = await db.query.houses.findFirst({
        where: eq(houses.house_id, houseId),
      });
      
      if (!house) {
        return { 
          error: `House with ID ${houseId} not found. Please provide a valid house ID.` 
        };
      }
      
      console.log(`✅ House found: ${house.address} (${house.house_id})`);
    } catch (houseError) {
      console.error("Error validating house:", houseError);
      return { error: "Failed to validate house ID" };
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
      // Use a transaction to ensure data consistency
      const result = await db.transaction(async (tx) => {
        // Re-validate guard exists within transaction
        const guardInTx = await tx.query.guards.findFirst({
          where: eq(guards.guard_id, guardId),
        });
        
        if (!guardInTx) {
          throw new Error(`Guard with ID ${guardId} not found during transaction. Please use a valid guard ID from the /api/guards endpoint.`);
        }

        // Re-validate house exists within transaction
        const houseInTx = await tx.query.houses.findFirst({
          where: eq(houses.house_id, houseId),
        });
        
        if (!houseInTx) {
          throw new Error(`House with ID ${houseId} not found during transaction. Please provide a valid house ID.`);
        }

        // Find all residents associated with this house
        let residents: any[] = [];
        try {
          const houseMembers = await tx.query.house_members.findMany({
            where: eq(house_members.house_id, houseId),
            with: {
              resident: true
            }
          });
          
          residents = houseMembers.map(member => member.resident).filter(Boolean);
          console.log(`✅ Found ${residents.length} residents for house ${houseId}:`, 
            residents.map((r: any) => `${r.fname} ${r.lname} (${r.line_user_id})`));
        } catch (residentError) {
          console.error("Error finding residents for house:", residentError);
        }

        // Use the first resident found as the primary resident for this visitor record
        const primaryResidentId = residents.length > 0 ? residents[0].resident_id : null;

        console.log("🚀 Inserting visitor record:", {
          resident_id: primaryResidentId,
          guard_id: guardId,
          house_id: houseId,
          visitor_id_card: visitorIDCard,
          picture_key: savedImageFilename,
          license_plate: licensePlate,
          visit_purpose: visitPurpose,
        });

        const [inserted] = await tx
          .insert(visitor_records)
          .values({
            resident_id: primaryResidentId,
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

        return { inserted, residents: residents };
      });

      // Send notifications to residents after successful database insertion
      if (result.residents && result.residents.length > 0) {
        try {
          console.log(`📱 Sending notifications to ${result.residents.length} residents`);
          
          // Import notification service
          const { sendVisitorNotification } = await import('../services/notificationService');
          
          for (const resident of result.residents) {
            if (resident.line_user_id) {
              try {
                await sendVisitorNotification({
                  lineUserId: resident.line_user_id,
                  visitorRecordId: result.inserted.visitor_record_id,
                  houseAddress: house.address,
                  visitorIdCard: visitorIDCard,
                  licensePlate: licensePlate || 'ไม่ระบุ',
                  visitPurpose: visitPurpose || 'ไม่ระบุ',
                  guardName: guard.fname + ' ' + guard.lname,
                  residentName: resident.fname + ' ' + resident.lname,
                  imageUrl: savedImageFilename ? `/images/${savedImageFilename}` : null
                });
                
                console.log(`✅ Notification sent to ${resident.fname} ${resident.lname} (${resident.line_user_id})`);
              } catch (notifError) {
                console.error(`❌ Failed to send notification to ${resident.fname} ${resident.lname}:`, notifError);
              }
            } else {
              console.log(`⚠️ No LINE user ID for resident ${resident.fname} ${resident.lname}`);
            }
          }
        } catch (notificationError) {
          console.error("Error sending notifications:", notificationError);
          // Don't fail the whole request if notifications fail
        }
      } else {
        console.log("⚠️ No residents found for this house, no notifications sent");
      }

      return {
        success: true,
        visitorId: result.inserted?.visitor_record_id,
        imageFilename: savedImageFilename,
        idCardImageFilename: savedIdCardImageFilename,
        message: "Visitor record created successfully",
        residentsNotified: result.residents?.length || 0,
      };
    } catch (dbError) {
      console.error("Database insertion failed:", dbError);
      return { error: `Failed to save visitor record to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` };
    }
  }
)

export default approvalForm;


