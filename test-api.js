// Simple test script to check if the API is working
const API_BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing API endpoints...');
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    console.log(`Health status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    }
    
    // Test 2: All visitor records
    console.log('\n2️⃣ Testing all visitor records...');
    const allResponse = await fetch(`${API_BASE_URL}/api/visitor-records`);
    console.log(`All records status: ${allResponse.status}`);
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log(`Total records: ${allData.total}`);
      if (allData.data && allData.data.length > 0) {
        console.log('Sample record:', allData.data[0]);
        console.log('Available resident names:');
        const uniqueNames = [...new Set(allData.data.map(r => r.resident_name))];
        uniqueNames.forEach(name => console.log(`  - ${name}`));
      }
    }
    
    // Test 3: Specific resident
    console.log('\n3️⃣ Testing specific resident: สมชาย ผาสุก');
    const residentName = 'สมชาย ผาสุก';
    const encodedName = encodeURIComponent(residentName);
    const residentResponse = await fetch(`${API_BASE_URL}/api/visitor-records/resident-name/${encodedName}`);
    console.log(`Resident records status: ${residentResponse.status}`);
    
    if (residentResponse.ok) {
      const residentData = await residentResponse.json();
      console.log('Resident data:', residentData);
    } else {
      const errorText = await residentResponse.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();