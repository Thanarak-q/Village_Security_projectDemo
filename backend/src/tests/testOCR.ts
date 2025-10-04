/**
 * Test script to debug Thai ID OCR API
 * Run with: npx tsx src/tests/testOCR.ts
 */
import axios from "axios";
import FormData from "form-data";
import { readFileSync } from "fs";
import { join } from "path";
import "dotenv/config";

async function testOCR() {
  console.log("🧪 Testing Thai National ID Card OCR API\n");

  // Check API key
  const apiKey = process.env.THAI_OCR_API_KEY;
  if (!apiKey) {
    console.error("❌ THAI_OCR_API_KEY not found in environment variables");
    console.log("Please add THAI_OCR_API_KEY=your_api_key to your .env file");
    process.exit(1);
  }

  console.log("✅ API Key found:", apiKey.substring(0, 10) + "...");

  // For testing, you can either:
  // 1. Place a test ID card image at: backend/test-id-card.jpg
  // 2. Or use a base64 string directly

  // Test with sample base64 (you'll need to replace this with actual data)
  const testBase64 = "YOUR_BASE64_IMAGE_HERE"; // Replace with actual base64

  try {
    // If you have a test image file:
    // const imagePath = join(process.cwd(), 'test-id-card.jpg');
    // const imageBuffer = readFileSync(imagePath);
    
    // Or use base64:
    const base64Data = testBase64.includes(',') 
      ? testBase64.split(',')[1] 
      : testBase64;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    console.log("\n📤 Sending request to OCR API...");
    console.log("Image size:", imageBuffer.length, "bytes");

    const form = new FormData();
    form.append("file", imageBuffer, {
      filename: "id-card.jpg",
      contentType: "image/jpeg",
    });
    form.append("options", "get_bbox,get_image");

    const response = await axios.post(
      "https://api.iapp.co.th/thai-national-id-card/v3.5/front",
      form,
      {
        headers: {
          apikey: apiKey,
          ...form.getHeaders(),
        },
        timeout: 30000,
      }
    );

    console.log("\n✅ OCR API Response:");
    console.log("Status:", response.status);
    console.log("\nFull Response Data:");
    console.log(JSON.stringify(response.data, null, 2));

    // Try to extract ID
    const idNumber = response.data?.id || 
                    response.data?.identification_number || 
                    response.data?.data?.id ||
                    response.data?.result?.id;

    if (idNumber) {
      console.log("\n✅ Successfully extracted ID number:", idNumber);
    } else {
      console.log("\n⚠️  Could not find ID number in response");
      console.log("Available fields:", Object.keys(response.data || {}));
    }

  } catch (error: any) {
    console.error("\n❌ Error occurred:");
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("API Error Response:");
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error("No response received from API");
        console.error("Request was made but no response received");
      } else {
        console.error("Error setting up request:", error.message);
      }
    } else {
      console.error(error);
    }
  }
}

// Run the test
testOCR();

