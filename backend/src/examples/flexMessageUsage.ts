/**
 * @file Example usage of LINE Flex Message Service
 * This file demonstrates how to use the flex message service for various scenarios
 */

import { flexMessageService, type VisitorNotificationData, type ApprovalNotificationData, type SecurityAlertData } from '../routes/(line)/flexMessage';
import { notificationService } from '../services/notificationService';

// Example 1: Send visitor approval request
export async function sendVisitorApprovalExample() {
  const visitorData: VisitorNotificationData = {
    visitorName: 'สมชาย ใจดี',
    visitorPhone: '081-234-5678',
    houseNumber: '123/45',
    residentName: 'สมหญิง รักบ้าน',
    purpose: 'เยี่ยมเยียนครอบครัว',
    entryTime: '14:30 น.',
    villageName: 'หมู่บ้านสุขสันต์',
    visitorId: 'visitor_001',
    imageUrl: 'https://example.com/visitor-photo.jpg'
  };

  const userId = 'U1234567890abcdef'; // LINE User ID
  
  try {
    const success = await notificationService.sendVisitorApprovalFlexMessage(userId, visitorData);
    console.log('Visitor approval message sent:', success);
  } catch (error) {
    console.error('Error sending visitor approval message:', error);
  }
}

// Example 2: Send approval result notification
export async function sendApprovalResultExample() {
  const approvalData: ApprovalNotificationData = {
    visitorName: 'สมชาย ใจดี',
    houseNumber: '123/45',
    residentName: 'สมหญิง รักบ้าน',
    status: 'approved',
    villageName: 'หมู่บ้านสุขสันต์'
  };

  const userId = 'U1234567890abcdef'; // LINE User ID
  
  try {
    const success = await notificationService.sendApprovalResultFlexMessage(userId, approvalData);
    console.log('Approval result message sent:', success);
  } catch (error) {
    console.error('Error sending approval result message:', error);
  }
}

// Example 3: Send security alert
export async function sendSecurityAlertExample() {
  const alertData: SecurityAlertData = {
    alertType: 'suspicious',
    location: 'ประตูหลัก',
    description: 'พบบุคคลแปลกหน้าเดินวนเวียนบริเวณประตูหลักเป็นเวลานาน',
    timestamp: '15:45 น.',
    villageName: 'หมู่บ้านสุขสันต์',
    severity: 'medium'
  };

  const userId = 'U1234567890abcdef'; // LINE User ID
  
  try {
    const success = await notificationService.sendSecurityAlertFlexMessage(userId, alertData);
    console.log('Security alert message sent:', success);
  } catch (error) {
    console.error('Error sending security alert message:', error);
  }
}

// Example 4: Send welcome message
export async function sendWelcomeMessageExample() {
  const userId = 'U1234567890abcdef'; // LINE User ID
  const residentName = 'สมชาย ใจดี';
  const villageName = 'หมู่บ้านสุขสันต์';
  
  try {
    const success = await notificationService.sendWelcomeFlexMessage(userId, residentName, villageName);
    console.log('Welcome message sent:', success);
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
}

// Example 5: Direct API usage (without notification service)
export async function directFlexMessageExample() {
  const visitorData: VisitorNotificationData = {
    visitorName: 'สมชาย ใจดี',
    visitorPhone: '081-234-5678',
    houseNumber: '123/45',
    residentName: 'สมหญิง รักบ้าน',
    purpose: 'เยี่ยมเยียนครอบครัว',
    entryTime: '14:30 น.',
    villageName: 'หมู่บ้านสุขสันต์',
    visitorId: 'visitor_001'
  };

  const userId = 'U1234567890abcdef'; // LINE User ID
  
  try {
    // Create flex message
    const flexMessage = flexMessageService.createVisitorApprovalMessage(visitorData);
    
    // Send directly
    const success = await flexMessageService.sendFlexMessage(userId, flexMessage);
    console.log('Direct flex message sent:', success);
  } catch (error) {
    console.error('Error sending direct flex message:', error);
  }
}

// Example 6: Using the API endpoints
export async function apiEndpointExample() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  
  // Example visitor approval request
  const visitorApprovalPayload = {
    userId: 'U1234567890abcdef',
    data: {
      visitorName: 'สมชาย ใจดี',
      visitorPhone: '081-234-5678',
      houseNumber: '123/45',
      residentName: 'สมหญิง รักบ้าน',
      purpose: 'เยี่ยมเยียนครอบครัว',
      entryTime: '14:30 น.',
      villageName: 'หมู่บ้านสุขสันต์',
      visitorId: 'visitor_001'
    }
  };

  try {
    const response = await fetch(`${baseUrl}/api/line/send-visitor-approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitorApprovalPayload)
    });

    const result = await response.json();
    console.log('API response:', result);
  } catch (error) {
    console.error('Error calling API endpoint:', error);
  }
}

// Example 7: Batch sending to multiple users
export async function batchSendExample() {
  const userIds = ['U1234567890abcdef', 'U0987654321fedcba', 'U1111111111111111'];
  const visitorData: VisitorNotificationData = {
    visitorName: 'สมชาย ใจดี',
    visitorPhone: '081-234-5678',
    houseNumber: '123/45',
    residentName: 'สมหญิง รักบ้าน',
    purpose: 'เยี่ยมเยียนครอบครัว',
    entryTime: '14:30 น.',
    villageName: 'หมู่บ้านสุขสันต์',
    visitorId: 'visitor_001'
  };

  const results = await Promise.allSettled(
    userIds.map(userId => 
      notificationService.sendVisitorApprovalFlexMessage(userId, visitorData)
    )
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Message sent to user ${index + 1}:`, result.value);
    } else {
      console.error(`Failed to send message to user ${index + 1}:`, result.reason);
    }
  });
}

// Example 8: Error handling and retry logic
export async function sendWithRetry(userId: string, visitorData: VisitorNotificationData, maxRetries = 3) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const success = await notificationService.sendVisitorApprovalFlexMessage(userId, visitorData);
      
      if (success) {
        console.log(`Message sent successfully on attempt ${attempts + 1}`);
        return true;
      }
      
      attempts++;
      if (attempts < maxRetries) {
        console.log(`Attempt ${attempts} failed, retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed with error:`, error);
      
      if (attempts < maxRetries) {
        console.log('Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.error(`Failed to send message after ${maxRetries} attempts`);
  return false;
}

// Export all examples for easy testing
export const flexMessageExamples = {
  sendVisitorApprovalExample,
  sendApprovalResultExample,
  sendSecurityAlertExample,
  sendWelcomeMessageExample,
  directFlexMessageExample,
  apiEndpointExample,
  batchSendExample,
  sendWithRetry
};
