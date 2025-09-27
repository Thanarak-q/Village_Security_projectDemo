/**
 * Test script to demonstrate the visitor form fix and show how to get valid IDs
 */

import { getValidGuardIds, getValidHouseIds, getRandomGuardId, getRandomHouseId } from "../utils/getValidIds";

async function testVisitorFormFix() {
  console.log("🔧 Testing Visitor Form Fix");
  console.log("=" .repeat(50));
  
  try {
    // Get valid guard IDs
    console.log("📋 Getting valid guard IDs...");
    const guardIds = await getValidGuardIds();
    console.log(`Found ${guardIds.length} verified guards:`);
    guardIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    
    if (guardIds.length === 0) {
      console.log("❌ No verified guards found in database!");
      console.log("   Please ensure guards are created and verified first.");
      return;
    }
    
    // Get valid house IDs
    console.log("\n📋 Getting valid house IDs...");
    const houseIds = await getValidHouseIds();
    console.log(`Found ${houseIds.length} houses:`);
    houseIds.slice(0, 5).forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    if (houseIds.length > 5) {
      console.log(`  ... and ${houseIds.length - 5} more`);
    }
    
    if (houseIds.length === 0) {
      console.log("❌ No houses found in database!");
      console.log("   Please ensure houses are created first.");
      return;
    }
    
    // Get random valid IDs for testing
    console.log("\n🎲 Getting random valid IDs for testing...");
    const randomGuardId = await getRandomGuardId();
    const randomHouseId = await getRandomHouseId();
    
    console.log(`Random Guard ID: ${randomGuardId}`);
    console.log(`Random House ID: ${randomHouseId}`);
    
    // Show example API call
    console.log("\n📝 Example API call with valid IDs:");
    console.log("POST /api/approvalForms");
    console.log(JSON.stringify({
      guardId: randomGuardId,
      houseId: randomHouseId,
      visitorIDCard: "1234567890123",
      licensePlate: "กข-1234",
      visitPurpose: "เยี่ยมเยียน"
    }, null, 2));
    
    console.log("\n✅ Fix Summary:");
    console.log("1. Added guard existence validation before creating visitor records");
    console.log("2. Added house existence validation before creating visitor records");
    console.log("3. Created utility functions to get valid IDs for testing");
    console.log("4. The error 'Key (guard_id)=... is not present in table guards' should now be prevented");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
if (require.main === module) {
  testVisitorFormFix().catch(console.error);
}

export { testVisitorFormFix };
