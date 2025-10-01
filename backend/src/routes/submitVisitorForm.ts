import { Elysia } from "elysia";
import db from "../db/drizzle";
import { visitor_records, guards, houses, house_members, villages, visitors } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { saveBase64Image, getImageExtension } from "../utils/imageUtils";
import { requireLiffAuth } from "../hooks/requireLiffAuth";

// Approval form routes for guards to submit visitor forms
const approvalForm = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireLiffAuth(["guard"]))
  .post(
  "/approvalForms",
  async ({ body, currentUser }: any) => {
    type ApprovalFormBody = {
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

    // Get guard ID from authenticated user
    const guardId = currentUser.guard_id;

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

    // Guard is already validated through authentication
    const guard = currentUser;
    console.log(`✅ Authenticated guard: ${guard.fname} ${guard.lname} (${guard.guard_id})`);

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
        .innerJoin(villages, eq(houses.village_id, villages.village_id))
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

        // Find or create visitor record
        let visitorId: string | null = null;
        try {
          // Get village_id from house
          const houseWithVillage = await tx
            .select({ village_id: houses.village_id })
            .from(houses)
            .where(eq(houses.house_id, houseId))
            .limit(1);

          if (houseWithVillage.length > 0 && houseWithVillage[0].village_id) {
            const villageId = houseWithVillage[0].village_id;
            
            // Try to find existing visitor by ID card hash
            const existingVisitor = await tx.query.visitors.findFirst({
              where: and(
                eq(visitors.id_number_hash, visitorIDCard), // Assuming visitorIDCard is already hashed
                eq(visitors.village_id, villageId)
              )
            });

            if (existingVisitor) {
              visitorId = existingVisitor.visitor_id;
              console.log(`✅ Found existing visitor: ${existingVisitor.fname} ${existingVisitor.lname}`);
            } else {
              // Create new visitor record
              const [newVisitor] = await tx
                .insert(visitors)
                .values({
                  fname: "ไม่ระบุ", // We don't have visitor name in the form
                  lname: "ไม่ระบุ",
                  id_number_hash: visitorIDCard,
                  village_id: villageId,
                  risk_status: "clear",
                  visit_count: 0,
                  created_at: new Date(),
                  updated_at: new Date(),
                })
                .returning();
              
              visitorId = newVisitor.visitor_id;
              console.log(`✅ Created new visitor: ${newVisitor.visitor_id}`);
            }
          }
        } catch (visitorError) {
          console.error("Error handling visitor:", visitorError);
          // Continue without visitor_id if there's an error
        }

        console.log("🚀 Inserting visitor record:", {
          visitor_id: visitorId,
          resident_id: primaryResidentId,
          guard_id: guardId,
          house_id: houseId,
          picture_key: savedImageFilename,
          license_plate: licensePlate,
          visit_purpose: visitPurpose,
        });

        const [inserted] = await tx
          .insert(visitor_records)
          .values({
            visitor_id: visitorId,
            resident_id: primaryResidentId,
            guard_id: guardId,
            house_id: houseId,
            picture_key: savedImageFilename,
            license_plate: licensePlate,
            visit_purpose: visitPurpose,
            createdAt: new Date(),
            record_status: "pending",
          })
          .returning();

        return { inserted, residents: residents };
      });

      // Send flex message notifications to residents after successful database insertion
      try {
        console.log(`📱 Sending flex message notifications to house residents`);
        
        // Import flex message notification utility
        const { sendVisitorApprovalToHouseResidents, formatVisitorDataForFlexMessage } = await import('../utils/flexMessageNotification');
        
        // Get village name for the flex message
        const villageInfo = await db.query.villages.findFirst({
          where: eq(villages.village_id, house.village_id || '')
        });
        
        const villageName = villageInfo?.village_name || 'หมู่บ้าน';
        
        // Format visitor data for flex message
        const visitorFlexData = formatVisitorDataForFlexMessage(
          {
            visitor_name: visitorIDCard, // Using ID card as visitor name for now
            visitor_phone: 'ไม่ระบุ',
            visit_purpose: visitPurpose || 'ไม่ระบุวัตถุประสงค์',
            entry_time: result.inserted.entry_time,
            visitor_record_id: result.inserted.visitor_record_id,
            picture_key: savedImageFilename,
            resident_name: result.residents.length > 0 ? 
              `${result.residents[0].fname} ${result.residents[0].lname}` : 
              'ไม่ระบุ'
          },
          house.address,
          villageName
        );
        
        // Send flex messages to all residents with LINE IDs in the house
        const flexResult = await sendVisitorApprovalToHouseResidents(houseId, visitorFlexData);
        
        if (flexResult.success) {
          console.log(`✅ Flex messages sent successfully: ${flexResult.sentCount} residents notified`);
        } else {
          console.log(`⚠️ Flex message sending had issues: ${flexResult.errors.join(', ')}`);
        }
        
      } catch (flexError) {
        console.error("Error sending flex message notifications:", flexError);
        // Don't fail the whole request if flex messages fail
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


