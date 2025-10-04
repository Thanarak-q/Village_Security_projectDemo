import { Elysia, t } from "elysia";
import { requireLiffAuth } from "../hooks/requireLiffAuth";
import axios from "axios";
import FormData from "form-data";

/**
 * Thai Driver License OCR API Routes
 * Handles OCR processing for Thai Driver Licenses
 * Accessible by: guard only
 */
export const ocrDriverLicenseRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireLiffAuth(["guard"]))
  
  // POST /api/ocr/driver-license - Process Thai Driver License image
  .post("/ocr/driver-license", async ({ body, set }: any) => {
    try {
      const { image } = body as { image: string };

      // Validate input
      if (!image || typeof image !== 'string') {
        set.status = 400;
        return {
          success: false,
          error: "Image data is required"
        };
      }

      // Check if API key is configured
      const apiKey = process.env.THAI_OCR_API_KEY;
      if (!apiKey) {
        console.error("❌ THAI_OCR_API_KEY is not configured");
        set.status = 500;
        return {
          success: false,
          error: "OCR service is not configured"
        };
      }

      // Convert base64 to buffer
      let imageBuffer: Buffer;
      try {
        // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        const base64Data = image.includes(',') 
          ? image.split(',')[1] 
          : image;
        imageBuffer = Buffer.from(base64Data, 'base64');
      } catch (error) {
        console.error("❌ Failed to decode base64 image:", error);
        set.status = 400;
        return {
          success: false,
          error: "Invalid image format"
        };
      }

      // Create form data for OCR API
      const form = new FormData();
      form.append("file", imageBuffer, {
        filename: "driver-license.jpg",
        contentType: "image/jpeg",
      });

      console.log("📤 Sending driver license image to OCR API...");

      // Call Thai Driver License OCR API
      const response = await axios.post(
        "https://api.iapp.co.th/thai-driver-license-ocr",
        form,
        {
          headers: {
            apikey: apiKey,
            ...form.getHeaders(),
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("✅ Driver License OCR API response received:");
      console.log("Response status:", response.status);
      console.log("Response data:", JSON.stringify(response.data, null, 2));

      // Check if the API returned an error
      if (response.data && response.data.status_code !== 200) {
        console.error("❌ OCR API returned error:", response.data.message || response.data);
        set.status = 422;
        return {
          success: false,
          error: response.data.message || "OCR processing failed"
        };
      }

      // Extract license number from response
      const licenseNumber = response.data?.th_license_no || response.data?.en_license_no;
      
      if (licenseNumber) {
        console.log("✅ Successfully extracted license number:", licenseNumber);
        
        // Extract name from Thai or English fields
        const thaiName = response.data?.th_name;
        const englishName = response.data?.en_name;
        
        // Parse Thai name (format: "คำนำหน้า ชื่อ นามสกุล")
        let thaiFirstName = null;
        let thaiLastName = null;
        if (thaiName) {
          const nameParts = thaiName.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            // Skip title (นาย, นาง, นางสาว, etc.) and get first name and last name
            if (nameParts.length === 2) {
              thaiFirstName = nameParts[0];
              thaiLastName = nameParts[1];
            } else {
              // If 3 or more parts, first is title, second is first name, rest is last name
              thaiFirstName = nameParts[1];
              thaiLastName = nameParts.slice(2).join(' ');
            }
          }
        }
        
        // Parse English name (format: "Title FirstName LastName")
        let englishFirstName = null;
        let englishLastName = null;
        if (englishName) {
          const nameParts = englishName.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            if (nameParts.length === 2) {
              englishFirstName = nameParts[0];
              englishLastName = nameParts[1];
            } else {
              englishFirstName = nameParts[1];
              englishLastName = nameParts.slice(2).join(' ');
            }
          }
        }
        
        return {
          success: true,
          data: {
            licenseNumber: licenseNumber,
            documentType: "driver_license",
            // Thai information
            thaiName: thaiName,
            thaiFirstName: thaiFirstName,
            thaiLastName: thaiLastName,
            thaiDateOfBirth: response.data?.th_dob || null,
            thaiIssueDate: response.data?.th_issue || null,
            thaiExpiryDate: response.data?.th_expiry || null,
            thaiLicenseType: response.data?.th_type || null,
            thaiCountry: response.data?.th_country || null,
            // English information
            englishName: englishName,
            englishFirstName: englishFirstName,
            englishLastName: englishLastName,
            englishDateOfBirth: response.data?.en_dob || null,
            englishIssueDate: response.data?.en_issue || null,
            englishExpiryDate: response.data?.en_expiry || null,
            englishLicenseType: response.data?.en_type || null,
            englishCountry: response.data?.en_country || null,
            // Detection information
            faceDetected: response.data?.face === "Detected",
            flagDetected: response.data?.flag === "Detected",
            signDetected: response.data?.sign === "Detected",
            textIsWhite: response.data?.text_is_white === "Detected",
            licenseType: response.data?.driving_license_type1 === "Detected" ? "type1" : "other",
            confidence: response.data?.inference || null,
          }
        };
      } else {
        console.error("❌ OCR API returned no license number. Full response:", JSON.stringify(response.data, null, 2));
        set.status = 422;
        return {
          success: false,
          error: "Could not extract license number from image",
          debug: response.data // Include for debugging
        };
      }
    } catch (error: any) {
      console.error("❌ Error processing driver license OCR:", error);

      // Handle specific error cases
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          set.status = 504;
          return {
            success: false,
            error: "OCR service timeout. Please try again."
          };
        }

        if (error.response) {
          console.error("❌ OCR API error response:", error.response.data);
          set.status = error.response.status;
          return {
            success: false,
            error: error.response.data?.message || "OCR service error"
          };
        }

        if (error.request) {
          set.status = 503;
          return {
            success: false,
            error: "OCR service is not available"
          };
        }
      }

      set.status = 500;
      return {
        success: false,
        error: "Failed to process image"
      };
    }
  });

