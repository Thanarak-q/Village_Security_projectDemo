/**
 * @file Manual test script for LINE Flex Message Service
 * Run this script to test flex messages with real LINE API
 * 
 * Usage:
 * 1. Set your LINE_CHANNEL_ACCESS_TOKEN in .env
 * 2. Set a valid LINE user ID in USER_ID constant
 * 3. Run: npx tsx src/tests/manualFlexMessageTest.ts
 */

import { flexMessageService, type VisitorNotificationData, type ApprovalNotificationData, type SecurityAlertData } from '../routes/(line)/flexMessage';
import { notificationService } from '../services/notificationService';

// Configuration
const USER_ID = 'U1234567890abcdef'; // Replace with actual LINE user ID
const VILLAGE_NAME = 'หมู่บ้านสุขสันต์';

// Test data
const testVisitorData: VisitorNotificationData = {
  visitorName: 'สมชาย ใจดี',
  visitorPhone: '081-234-5678',
  houseNumber: '123/45',
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

const testApprovalData: ApprovalNotificationData = {
  visitorName: 'สมชาย ใจดี',
  houseNumber: '123/45',
  residentName: 'สมหญิง รักบ้าน',
  status: 'approved',
  villageName: VILLAGE_NAME
};

const testRejectionData: ApprovalNotificationData = {
  visitorName: 'สมชาย ใจดี',
  houseNumber: '123/45',
  residentName: 'สมหญิง รักบ้าน',
  status: 'rejected',
  reason: 'ไม่พบข้อมูลผู้เยี่ยมในระบบ',
  villageName: VILLAGE_NAME
};

const testSecurityAlert: SecurityAlertData = {
  alertType: 'suspicious',
  location: 'ประตูหลัก',
  description: 'พบบุคคลแปลกหน้าเดินวนเวียนบริเวณประตูหลักเป็นเวลานาน',
  timestamp: new Date().toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  }) + ' น.',
  villageName: VILLAGE_NAME,
  severity: 'medium'
};

const testEmergencyAlert: SecurityAlertData = {
  alertType: 'emergency',
  location: 'บริเวณสระว่ายน้ำ',
  description: 'เกิดอุบัติเหตุ มีผู้บาดเจ็บ ต้องการความช่วยเหลือด่วน',
  timestamp: new Date().toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  }) + ' น.',
  villageName: VILLAGE_NAME,
  severity: 'critical'
};

// Test functions
async function testVisitorApprovalMessage() {
  console.log('🧪 Testing Visitor Approval Message...');
  
  try {
    const success = await notificationService.sendVisitorApprovalFlexMessage(USER_ID, testVisitorData);
    
    if (success) {
      console.log('✅ Visitor approval message sent successfully!');
    } else {
      console.log('❌ Failed to send visitor approval message');
    }
  } catch (error) {
    console.error('❌ Error sending visitor approval message:', error);
  }
}

async function testApprovalResultMessage() {
  console.log('🧪 Testing Approval Result Message (Approved)...');
  
  try {
    const success = await notificationService.sendApprovalResultFlexMessage(USER_ID, testApprovalData);
    
    if (success) {
      console.log('✅ Approval result message sent successfully!');
    } else {
      console.log('❌ Failed to send approval result message');
    }
  } catch (error) {
    console.error('❌ Error sending approval result message:', error);
  }
}

async function testRejectionResultMessage() {
  console.log('🧪 Testing Approval Result Message (Rejected)...');
  
  try {
    const success = await notificationService.sendApprovalResultFlexMessage(USER_ID, testRejectionData);
    
    if (success) {
      console.log('✅ Rejection result message sent successfully!');
    } else {
      console.log('❌ Failed to send rejection result message');
    }
  } catch (error) {
    console.error('❌ Error sending rejection result message:', error);
  }
}

async function testSecurityAlertMessage() {
  console.log('🧪 Testing Security Alert Message...');
  
  try {
    const success = await notificationService.sendSecurityAlertFlexMessage(USER_ID, testSecurityAlert);
    
    if (success) {
      console.log('✅ Security alert message sent successfully!');
    } else {
      console.log('❌ Failed to send security alert message');
    }
  } catch (error) {
    console.error('❌ Error sending security alert message:', error);
  }
}

async function testEmergencyAlertMessage() {
  console.log('🧪 Testing Emergency Alert Message...');
  
  try {
    const success = await notificationService.sendSecurityAlertFlexMessage(USER_ID, testEmergencyAlert);
    
    if (success) {
      console.log('✅ Emergency alert message sent successfully!');
    } else {
      console.log('❌ Failed to send emergency alert message');
    }
  } catch (error) {
    console.error('❌ Error sending emergency alert message:', error);
  }
}

async function testWelcomeMessage() {
  console.log('🧪 Testing Welcome Message...');
  
  try {
    const success = await notificationService.sendWelcomeFlexMessage(USER_ID, 'สมชาย ใจดี', VILLAGE_NAME);
    
    if (success) {
      console.log('✅ Welcome message sent successfully!');
    } else {
      console.log('❌ Failed to send welcome message');
    }
  } catch (error) {
    console.error('❌ Error sending welcome message:', error);
  }
}

async function testAllSeverityLevels() {
  console.log('🧪 Testing All Security Alert Severity Levels...');
  
  const severities: Array<SecurityAlertData['severity']> = ['low', 'medium', 'high', 'critical'];
  
  for (const severity of severities) {
    const alertData: SecurityAlertData = {
      ...testSecurityAlert,
      severity,
      description: `ทดสอบระดับความรุนแรง: ${severity}`
    };
    
    try {
      const success = await notificationService.sendSecurityAlertFlexMessage(USER_ID, alertData);
      
      if (success) {
        console.log(`✅ ${severity.toUpperCase()} severity alert sent successfully!`);
      } else {
        console.log(`❌ Failed to send ${severity} severity alert`);
      }
      
      // Wait 2 seconds between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error sending ${severity} severity alert:`, error);
    }
  }
}

async function testAllAlertTypes() {
  console.log('🧪 Testing All Security Alert Types...');
  
  const alertTypes: Array<SecurityAlertData['alertType']> = ['suspicious', 'emergency', 'maintenance'];
  
  for (const alertType of alertTypes) {
    const alertData: SecurityAlertData = {
      ...testSecurityAlert,
      alertType,
      description: `ทดสอบประเภทการแจ้งเตือน: ${alertType}`
    };
    
    try {
      const success = await notificationService.sendSecurityAlertFlexMessage(USER_ID, alertData);
      
      if (success) {
        console.log(`✅ ${alertType} alert sent successfully!`);
      } else {
        console.log(`❌ Failed to send ${alertType} alert`);
      }
      
      // Wait 2 seconds between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error sending ${alertType} alert:`, error);
    }
  }
}

async function testDirectFlexMessageCreation() {
  console.log('🧪 Testing Direct Flex Message Creation...');
  
  try {
    // Test creating messages without sending
    const visitorMessage = flexMessageService.createVisitorApprovalMessage(testVisitorData);
    const approvalMessage = flexMessageService.createApprovalResultMessage(testApprovalData);
    const alertMessage = flexMessageService.createSecurityAlertMessage(testSecurityAlert);
    const welcomeMessage = flexMessageService.createWelcomeMessage('สมชาย ใจดี', VILLAGE_NAME);
    
    console.log('✅ All flex messages created successfully!');
    console.log('📊 Message types created:');
    console.log(`  - Visitor Approval: ${visitorMessage.type}`);
    console.log(`  - Approval Result: ${approvalMessage.type}`);
    console.log(`  - Security Alert: ${alertMessage.type}`);
    console.log(`  - Welcome Message: ${welcomeMessage.type}`);
    
  } catch (error) {
    console.error('❌ Error creating flex messages:', error);
  }
}

async function testBatchSending() {
  console.log('🧪 Testing Batch Sending...');
  
  const userIds = [USER_ID]; // Add more user IDs for batch testing
  
  try {
    const promises = userIds.map(userId => 
      notificationService.sendVisitorApprovalFlexMessage(userId, testVisitorData)
    );
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Message sent to user ${index + 1}: ${result.value}`);
      } else {
        console.error(`❌ Failed to send message to user ${index + 1}: ${result.reason}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error in batch sending:', error);
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');
  
  // Test with invalid user ID
  try {
    const success = await notificationService.sendVisitorApprovalFlexMessage('invalid_user_id', testVisitorData);
    console.log(`Invalid user ID test result: ${success}`);
  } catch (error) {
    console.log('✅ Invalid user ID handled correctly:', (error as Error).message);
  }
  
  // Test with missing data
  try {
    const incompleteData = { ...testVisitorData, visitorName: '' };
    const success = await notificationService.sendVisitorApprovalFlexMessage(USER_ID, incompleteData);
    console.log(`Incomplete data test result: ${success}`);
  } catch (error) {
    console.log('✅ Incomplete data handled correctly:', (error as Error).message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting LINE Flex Message Manual Tests...');
  console.log(`📱 Target User ID: ${USER_ID}`);
  console.log(`🏘️ Village: ${VILLAGE_NAME}`);
  console.log('=' .repeat(50));
  
  // Check environment
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('❌ LINE_CHANNEL_ACCESS_TOKEN not set in environment variables');
    return;
  }
  
  if (USER_ID === 'U1234567890abcdef') {
    console.warn('⚠️  Please update USER_ID constant with a real LINE user ID');
    console.log('   Tests will run but messages won\'t be delivered to a real user');
  }
  
  console.log('');
  
  try {
    // Run individual tests
    await testDirectFlexMessageCreation();
    console.log('');
    
    await testVisitorApprovalMessage();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testApprovalResultMessage();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testRejectionResultMessage();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testSecurityAlertMessage();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testEmergencyAlertMessage();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testWelcomeMessage();
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    await testAllSeverityLevels();
    console.log('');
    
    await testAllAlertTypes();
    console.log('');
    
    await testBatchSending();
    console.log('');
    
    await testErrorHandling();
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
  testVisitorApprovalMessage,
  testApprovalResultMessage,
  testRejectionResultMessage,
  testSecurityAlertMessage,
  testEmergencyAlertMessage,
  testWelcomeMessage,
  testAllSeverityLevels,
  testAllAlertTypes,
  testDirectFlexMessageCreation,
  testBatchSending,
  testErrorHandling,
  runAllTests
};
