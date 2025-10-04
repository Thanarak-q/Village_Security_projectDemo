import { Elysia, t } from "elysia";
import { requireLiffAuth } from "../hooks/requireLiffAuth";
import axios from "axios";
import FormData from "form-data";

/**
 * License Plate Recognition OCR API Routes
 * Handles OCR processing for vehicle license plates
 * Accessible by: guard only
 */
export const ocrLicensePlateRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireLiffAuth(["guard"]))
  
  // POST /api/ocr/license-plate - Process vehicle license plate image
  .post("/ocr/license-plate", async ({ body, set }: any) => {
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
      const apiKey = process.env.THAI_OCR_API_KEY; // Same API key as ID card
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
        filename: "license-plate.jpg",
        contentType: "image/jpeg",
      });

      console.log("📤 Sending license plate image to OCR API...");

      // Call License Plate Recognition API
      const response = await axios.post(
        "https://api.iapp.co.th/license-plate-recognition/file",
        form,
        {
          headers: {
            apikey: apiKey,
            ...form.getHeaders(),
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("✅ License Plate OCR API response received:");
      console.log("Response status:", response.status);
      console.log("Response data:", JSON.stringify(response.data, null, 2));

      // Check if the API returned an error
      if (response.data && response.data.status !== 200) {
        console.error("❌ OCR API returned error:", response.data.message || response.data);
        set.status = 422;
        return {
          success: false,
          error: response.data.message || "OCR processing failed"
        };
      }

      // Check if vehicle detected
      if (response.data?.is_vehicle === "no") {
        console.error("❌ No vehicle detected in image");
        set.status = 422;
        return {
          success: false,
          error: "No vehicle detected in image"
        };
      }

      // Check if license plate detected
      if (response.data?.is_missing_plate === "yes") {
        console.error("❌ No license plate detected in image");
        set.status = 422;
        return {
          success: false,
          error: "No license plate detected in image"
        };
      }

      // Extract license plate number from response
      const licensePlate = response.data?.lp_number;
      
      if (licensePlate) {
        console.log("✅ Successfully extracted license plate:", licensePlate);
        
        return {
          success: true,
          data: {
            licensePlate: licensePlate,
            // Vehicle information
            vehicleBrand: response.data?.vehicle_brand || null,
            vehicleModel: response.data?.vehicle_model || null,
            vehicleColor: response.data?.vehicle_color || null,
            vehicleBodyType: response.data?.vehicle_body_type || null,
            vehicleYear: response.data?.vehicle_year || null,
            vehicleOrientation: response.data?.vehicle_orientation || null,
            // Detection information
            confidence: response.data?.conf || null,
            country: response.data?.country || null,
            province: response.data?.province || null,
            inferTime: response.data?.["infer_time(s)"] || null,
            // Status
            isVehicle: response.data?.is_vehicle || null,
            isMissingPlate: response.data?.is_missing_plate || null,
            message: response.data?.message || null,
          }
        };
      } else {
        console.error("❌ OCR API returned no license plate. Full response:", JSON.stringify(response.data, null, 2));
        set.status = 422;
        return {
          success: false,
          error: "Could not extract license plate from image",
          debug: response.data // Include for debugging
        };
      }
    } catch (error: any) {
      console.error("❌ Error processing license plate OCR:", error);

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

