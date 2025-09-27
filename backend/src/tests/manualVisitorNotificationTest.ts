/**
 * @file Manual test script for Visitor Notification System
 * Run this script to test visitor notifications with real LINE API
 * 
 * Usage:
 * 1. Set your LINE_CHANNEL_ACCESS_TOKEN in .env
 * 2. Set valid LINE user IDs in USER_IDS array
 * 3. Run: npx tsx src/tests/manualVisitorNotificationTest.ts
 */

import { notificationService } from '../services/notificationService';
import { type VisitorNotificationData } from '../routes/(line)/flexMessage';

// Configuration
const USER_IDS = [
  'U1234567890abcdef', // Replace with actual LINE user IDs
  'U0987654321fedcba'
];

const HOUSE_NUMBER = '123/45';
const VILLAGE_KEY = 'pha-suk-village-001';
const VILLAGE_NAME = 'หมู่บ้านสุขสันต์';

// Test data
const testVisitorData: VisitorNotificationData = {
  visitorName: 'สมชาย ใจดี',
  visitorPhone: '081-234-5678',
  houseNumber: HOUSE_NUMBER,
  residentName: 'สมหญิง รักบ้าน',
  purpose: 'เยี่ยมเยียนครอบครัว',
  entryTime: new Date().toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  }) + ' น.',
  villageName: VILLAGE_NAME,
  visitorId: 'test_visitor_001',
  imageUrl: 'https://via.placeholder.com/300x200/1DB446/FFFFFF?text=Visitor+Photo'
};

// Test functions
async function testSendNotificationToResidents() {
  console.log('🧪 Testing Send Notification to Residents...');
  
  try {
    const result = await notificationService.sendVisitorNotificationToResidents(
      testVisitorData,
      HOUSE_NUMBER,
      VILLAGE_KEY
    );
    
    console.log('📊 Result:', result);
    
    if (result.success) {
      console.log('✅ Notification sent successfully!');
      console.log(`📱 Sent to ${result.successful}/${result.total} residents`);
    } else {
      console.log('❌ Failed to send notification');
      console.log('📝 Error:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}

async function testSendNotificationToSingleUser() {
  console.log('🧪 Testing Send Notification to Single User...');
  
  const userId = USER_IDS[0];
  
  try {
    const success = await notificationService.sendVisitorNotificationFlexMessage(
      userId,
      testVisitorData
    );
    
    if (success) {
      console.log('✅ Notification sent to single user successfully!');
    } else {
      console.log('❌ Failed to send notification to single user');
    }
  } catch (error) {
    console.error('❌ Error sending notification to single user:', error);
  }
}

async function testSendDetailsToUser() {
  console.log('🧪 Testing Send Details to User...');
  
  const userId = USER_IDS[0];
  
  try {
    const success = await notificationService.sendVisitorDetailsFlexMessage(
      userId,
      testVisitorData
    );
    
    if (success) {
      console.log('✅ Details sent to user successfully!');
    } else {
      console.log('❌ Failed to send details to user');
    }
  } catch (error) {
    console.error('❌ Error sending details to user:', error);
  }
}

async function testGetResidentsInHouse() {
  console.log('🧪 Testing Get Residents in House...');
  
  try {
    const residents = await notificationService.getResidentsInHouse(
      HOUSE_NUMBER,
      VILLAGE_KEY
    );
    
    console.log('📋 Residents found:', residents);
    console.log(`👥 Total residents: ${residents.length}`);
    
    residents.forEach((resident, index) => {
      console.log(`  ${index + 1}. ${resident.name} (${resident.residentId})`);
    });
  } catch (error) {
    console.error('❌ Error getting residents:', error);
  }
}

async function testBatchNotifications() {
  console.log('🧪 Testing Batch Notifications...');
  
  try {
    const results = await Promise.allSettled(
      USER_IDS.map(async (userId, index) => {
        const visitorData = {
          ...testVisitorData,
          visitorId: `batch_visitor_${index + 1}`
        };
        
        return notificationService.sendVisitorNotificationFlexMessage(userId, visitorData);
      })
    );
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ User ${index + 1}: ${result.value ? 'Success' : 'Failed'}`);
      } else {
        console.error(`❌ User ${index + 1}: ${result.reason}`);
      }
    });
  } catch (error) {
    console.error('❌ Error in batch notifications:', error);
  }
}

async function testDifferentVisitorTypes() {
  console.log('🧪 Testing Different Visitor Types...');
  
  const visitorTypes = [
    {
      name: 'สมชาย ใจดี',
      purpose: 'เยี่ยมเยียนครอบครัว',
      phone: '081-234-5678'
    },
    {
      name: 'สมหญิง ใจงาม',
      purpose: 'ส่งของ',
      phone: '082-345-6789'
    },
    {
      name: 'สมศักดิ์ ใจกล้า',
      purpose: 'ซ่อมแซม',
      phone: '083-456-7890'
    }
  ];
  
  for (const [index, visitor] of visitorTypes.entries()) {
    console.log(`📝 Testing visitor type ${index + 1}: ${visitor.purpose}`);
    
    const visitorData: VisitorNotificationData = {
      ...testVisitorData,
      visitorName: visitor.name,
      visitorPhone: visitor.phone,
      purpose: visitor.purpose,
      visitorId: `type_test_visitor_${index + 1}`
    };
    
    try {
      const success = await notificationService.sendVisitorNotificationFlexMessage(
        USER_IDS[0],
        visitorData
      );
      
      if (success) {
        console.log(`✅ ${visitor.purpose} notification sent successfully!`);
      } else {
        console.log(`❌ Failed to send ${visitor.purpose} notification`);
      }
      
      // Wait 3 seconds between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`❌ Error sending ${visitor.purpose} notification:`, error);
    }
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');
  
  // Test with invalid user ID
  try {
    const success = await notificationService.sendVisitorNotificationFlexMessage(
      'invalid_user_id',
      testVisitorData
    );
    console.log(`Invalid user ID test result: ${success}`);
  } catch (error) {
    console.log('✅ Invalid user ID handled correctly:', (error as Error).message);
  }
  
  // Test with empty visitor data
  try {
    const emptyData: VisitorNotificationData = {
      visitorName: '',
      visitorPhone: '',
      houseNumber: '',
      residentName: '',
      purpose: '',
      entryTime: '',
      villageName: '',
      visitorId: ''
    };
    
    const result = await notificationService.sendVisitorNotificationToResidents(
      emptyData,
      'invalid_house',
      'invalid_village'
    );
    console.log(`Empty data test result: ${result.success}`);
  } catch (error) {
    console.log('✅ Empty data handled correctly:', (error as Error).message);
  }
}

async function testPerformance() {
  console.log('🧪 Testing Performance...');
  
  const startTime = performance.now();
  
  try {
    // Send 5 notifications concurrently
    const promises = Array.from({ length: 5 }, (_, i) => 
      notificationService.sendVisitorNotificationFlexMessage(
        USER_IDS[0],
        { ...testVisitorData, visitorId: `perf_test_${i + 1}` }
      )
    );
    
    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    const successful = results.filter(result => result === true).length;
    const duration = endTime - startTime;
    
    console.log(`📊 Performance Results:`);
    console.log(`  - Total time: ${duration.toFixed(2)}ms`);
    console.log(`  - Successful: ${successful}/${results.length}`);
    console.log(`  - Average per message: ${(duration / results.length).toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Visitor Notification Manual Tests...');
  console.log(`📱 Target User IDs: ${USER_IDS.join(', ')}`);
  console.log(`🏠 House Number: ${HOUSE_NUMBER}`);
  console.log(`🏘️ Village: ${VILLAGE_NAME}`);
  console.log('=' .repeat(60));
  
  // Check environment
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('❌ LINE_CHANNEL_ACCESS_TOKEN not set in environment variables');
    return;
  }
  
  if (USER_IDS[0] === 'U1234567890abcdef') {
    console.warn('⚠️  Please update USER_IDS array with real LINE user IDs');
    console.log('   Tests will run but messages won\'t be delivered to real users');
  }
  
  console.log('');
  
  try {
    // Run individual tests
    await testGetResidentsInHouse();
    console.log('');
    
    await testSendNotificationToSingleUser();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testSendDetailsToUser();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testSendNotificationToResidents();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testDifferentVisitorTypes();
    console.log('');
    
    await testBatchNotifications();
    console.log('');
    
    await testErrorHandling();
    console.log('');
    
    await testPerformance();
    console.log('');
    
    console.log('🎉 All tests completed!');
    console.log('📱 Check your LINE app to see the messages');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

// Export for use in other test files
export {
  testSendNotificationToResidents,
  testSendNotificationToSingleUser,
  testSendDetailsToUser,
  testGetResidentsInHouse,
  testBatchNotifications,
  testDifferentVisitorTypes,
  testErrorHandling,
  testPerformance,
  runAllTests
};
