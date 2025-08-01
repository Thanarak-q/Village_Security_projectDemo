// Test script for visitor-record-yearly API endpoint
const testYearlyAPI = async () => {
  try {
    console.log('🧪 Testing /api/visitor-record-yearly endpoint...');
    
    const response = await fetch('http://localhost:3001/api/visitor-record-yearly');
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ API test successful!');
      console.log(`📈 Total years found: ${data.data.totalYears}`);
      console.log(`📊 Total records: ${data.data.summary.totalRecords}`);
      console.log(`✅ Approved: ${data.data.summary.totalApproved}`);
      console.log(`⏳ Pending: ${data.data.summary.totalPending}`);
      console.log(`❌ Rejected: ${data.data.summary.totalRejected}`);
    } else {
      console.log('❌ API test failed:', data.error);
    }
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
};

// Run the test
testYearlyAPI(); 