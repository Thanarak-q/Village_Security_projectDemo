import { Elysia, t } from "elysia";
import { requireLiffAuth } from "../hooks/requireLiffAuth";
import axios from "axios";
import FormData from "form-data";

/**
 * Thai National ID Card OCR API Routes
 * Handles OCR processing for Thai National ID cards
 * Accessible by: guard only
 */
export const ocrIdCardRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireLiffAuth(["guard"]))
  
  // POST /api/ocr/id-card - Process Thai National ID card image
  .post("/ocr/id-card", async ({ body, set }: any) => {
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
        filename: "id-card.jpg",
        contentType: "image/jpeg",
      });
      form.append("options", "get_bbox,get_image");

      console.log("📤 Sending image to OCR API...");

      // Call Thai ID OCR API
      const response = await axios.post(
        "https://api.iapp.co.th/thai-national-id-card/v3.5/front",
        form,
        {
          headers: {
            apikey: apiKey,
            ...form.getHeaders(),
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("✅ OCR API response received:");
      console.log("Response status:", response.status);
      console.log("Response data:", JSON.stringify(response.data, null, 2));

      // Check if the API returned an error
      if (response.data && response.data.status === false) {
        console.error("❌ OCR API returned error:", response.data.message || response.data);
        set.status = 422;
        return {
          success: false,
          error: response.data.message || "OCR processing failed"
        };
      }

      // Extract ID card number from response
      // Based on actual API response format from iApp.co.th
      const idNumber = response.data?.id_number || 
                      response.data?.id || 
                      response.data?.identification_number;
      
      if (idNumber) {
        console.log("✅ Successfully extracted ID number:", idNumber);
        
        // Extract other fields from the actual API response format
        const thaiName = response.data?.th_name || 
                        (response.data?.th_init && response.data?.th_fname && response.data?.th_lname 
                          ? `${response.data.th_init} ${response.data.th_fname} ${response.data.th_lname}` 
                          : null);
        
        return {
          success: true,
          data: {
            idCardNumber: idNumber,
            // Thai name information
            thaiName: thaiName,
            thaiFirstName: response.data?.th_fname || null,
            thaiLastName: response.data?.th_lname || null,
            thaiInitial: response.data?.th_init || null,
            // English name information
            englishName: response.data?.en_name || null,
            englishFirstName: response.data?.en_fname || null,
            englishLastName: response.data?.en_lname || null,
            englishInitial: response.data?.en_init || null,
            // Date information
            birthDate: response.data?.th_dob || response.data?.en_dob || null,
            issueDate: response.data?.th_issue || response.data?.en_issue || null,
            expiryDate: response.data?.th_expire || response.data?.en_expire || null,
            // Address information
            address: response.data?.address || null,
            houseNo: response.data?.house_no || null,
            villageNo: response.data?.village_no || null,
            village: response.data?.village || null,
            alley: response.data?.alley || null,
            lane: response.data?.lane || null,
            road: response.data?.road || null,
            subDistrict: response.data?.sub_district || null,
            district: response.data?.district || null,
            province: response.data?.province || null,
            postalCode: response.data?.postal_code || null,
            // Other information
            gender: response.data?.gender || null,
            religion: response.data?.religion || null,
            detectionScore: response.data?.detection_score || null,
            processTime: response.data?.process_time || null,
            // Face image (base64)
            faceImage: response.data?.face || null,
          }
        };
      } else {
        console.error("❌ OCR API returned no ID number. Full response:", JSON.stringify(response.data, null, 2));
        set.status = 422;
        return {
          success: false,
          error: "Could not extract ID card number from image",
          debug: response.data // Include for debugging
        };
      }
    } catch (error: any) {
      console.error("❌ Error processing OCR:", error);

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

