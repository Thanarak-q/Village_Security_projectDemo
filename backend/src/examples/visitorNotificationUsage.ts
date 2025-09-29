/**
 * @file Example usage of Visitor Notification System
 * This file demonstrates how to use the visitor notification system
 */

import { notificationService } from '../services/notificationService';
import { type VisitorNotificationData } from '../routes/flexMessage';

// Example 1: Send visitor notification to all residents in a house
export async function sendVisitorNotificationExample() {
  const visitorData: VisitorNotificationData = {
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
    villageName: 'หมู่บ้านสุขสันต์',
    visitorId: 'visitor_001',
    imageUrl: 'https://example.com/visitor-photo.jpg'
  };

  const houseNumber = '123/45';
  const villageKey = 'pha-suk-village-001';
  
  try {
    const result = await notificationService.sendVisitorNotificationToResidents(
      visitorData, 
      houseNumber, 
      villageKey
    );
    
    console.log('Notification result:', result);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Example 2: Send visitor details to a specific resident
export async function sendVisitorDetailsExample() {
  const visitorData: VisitorNotificationData = {
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
    villageName: 'หมู่บ้านสุขสันต์',
    visitorId: 'visitor_001',
    imageUrl: 'https://example.com/visitor-photo.jpg'
  };

  const userId = 'U1234567890abcdef'; // LINE User ID
  
  try {
    const success = await notificationService.sendVisitorDetailsFlexMessage(userId, visitorData);
    console.log('Details sent:', success);
  } catch (error) {
    console.error('Error sending details:', error);
  }
}

// Example 3: Get residents in a house
export async function getResidentsExample() {
  const houseNumber = '123/45';
  const villageKey = 'pha-suk-village-001';
  
  try {
    const residents = await notificationService.getResidentsInHouse(houseNumber, villageKey);
    console.log('Residents in house:', residents);
  } catch (error) {
    console.error('Error getting residents:', error);
  }
}

// Example 4: Using API endpoints
export async function apiEndpointExample() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  
  // Example: Send visitor notification to residents
  const notificationPayload = {
    visitorName: 'สมชาย ใจดี',
    visitorPhone: '081-234-5678',
    houseNumber: '123/45',
    residentName: 'สมหญิง รักบ้าน',
    purpose: 'เยี่ยมเยียนครอบครัว',
    villageKey: 'pha-suk-village-001',
    imageUrl: 'https://example.com/visitor-photo.jpg'
  };

  try {
    const response = await fetch(`${baseUrl}/api/visitor-notification/send-to-residents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN' // Add your JWT token
      },
      body: JSON.stringify(notificationPayload)
    });

    const result = await response.json();
    console.log('API response:', result);
  } catch (error) {
    console.error('Error calling API:', error);
  }
}

// Example 5: Handle resident response
export async function handleResidentResponseExample() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  
  const responsePayload = {
    action: 'approve', // or 'reject'
    visitorId: 'visitor_001',
    userId: 'U1234567890abcdef',
    reason: 'ไม่พบข้อมูลผู้เยี่ยม', // Optional, for rejections
    houseNumber: '123/45',
    villageKey: 'pha-suk-village-001'
  };

  try {
    const response = await fetch(`${baseUrl}/api/visitor-notification/handle-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responsePayload)
    });

    const result = await response.json();
    console.log('Response handling result:', result);
  } catch (error) {
    console.error('Error handling response:', error);
  }
}

// Example 6: Get residents in house via API
export async function getResidentsApiExample() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const houseNumber = '123/45';
  const villageKey = 'pha-suk-village-001';
  
  try {
    const response = await fetch(`${baseUrl}/api/visitor-notification/residents/${houseNumber}/${villageKey}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN' // Add your JWT token
      }
    });

    const result = await response.json();
    console.log('Residents API response:', result);
  } catch (error) {
    console.error('Error getting residents via API:', error);
  }
}

// Example 7: Test notification
export async function testNotificationExample() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  
  const testPayload = {
    userId: 'U1234567890abcdef' // LINE User ID to test with
  };

  try {
    const response = await fetch(`${baseUrl}/api/visitor-notification/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN' // Add your JWT token
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log('Test notification result:', result);
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

// Example 8: Complete workflow
export async function completeWorkflowExample() {
  console.log('🚀 Starting complete visitor notification workflow...');
  
  try {
    // Step 1: Get residents in house
    console.log('📋 Step 1: Getting residents in house...');
    const residents = await getResidentsExample();
    
    // Step 2: Send notification to all residents
    console.log('📱 Step 2: Sending notification to residents...');
    await sendVisitorNotificationExample();
    
    // Step 3: Simulate resident response
    console.log('✅ Step 3: Simulating resident response...');
    await handleResidentResponseExample();
    
    console.log('🎉 Complete workflow finished!');
  } catch (error) {
    console.error('❌ Workflow failed:', error);
  }
}

// Example 9: Batch operations
export async function batchOperationsExample() {
  const houses = ['123/45', '124/45', '125/45'];
  const villageKey = 'pha-suk-village-001';
  
  const visitorData: VisitorNotificationData = {
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
    villageName: 'หมู่บ้านสุขสันต์',
    visitorId: 'visitor_001'
  };

  console.log('🔄 Starting batch operations...');
  
  const results = await Promise.allSettled(
    houses.map(async (houseNumber) => {
      const result = await notificationService.sendVisitorNotificationToResidents(
        { ...visitorData, houseNumber }, 
        houseNumber, 
        villageKey
      );
      return { houseNumber, result };
    })
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ House ${result.value.houseNumber}: ${result.value.result.message}`);
    } else {
      console.error(`❌ House ${houses[index]}: ${result.reason}`);
    }
  });
}

// Example 10: Error handling
export async function errorHandlingExample() {
  try {
    // Test with invalid data
    const invalidData: VisitorNotificationData = {
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
      invalidData, 
      'invalid_house', 
      'invalid_village'
    );
    
    console.log('Invalid data result:', result);
  } catch (error) {
    console.log('✅ Error handled correctly:', error.message);
  }
}

// Export all examples
export const visitorNotificationExamples = {
  sendVisitorNotificationExample,
  sendVisitorDetailsExample,
  getResidentsExample,
  apiEndpointExample,
  handleResidentResponseExample,
  getResidentsApiExample,
  testNotificationExample,
  completeWorkflowExample,
  batchOperationsExample,
  errorHandlingExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🧪 Running Visitor Notification Examples...');
  
  // Run individual examples
  completeWorkflowExample().catch(console.error);
}
