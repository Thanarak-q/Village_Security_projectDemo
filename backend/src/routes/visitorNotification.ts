/**
 * @file Visitor Notification Routes
 * Handles visitor notifications to residents via LINE flex messages
 */

import { Elysia } from 'elysia';
import { notificationService } from '../services/notificationService';
import { type VisitorNotificationData } from './(line)/flexMessage';
import { requireRole } from '../hooks/requireRole';

export const visitorNotificationRoutes = new Elysia({ prefix: '/api/visitor-notification' })
  .onBeforeHandle(requireRole(["guard", "admin", "staff"]))

  /**
   * Send visitor notification to all residents in a house
   * POST /api/visitor-notification/send-to-residents
   */
  .post('/send-to-residents', async ({ body, set, currentUser }: any) => {
    try {
      const {
        visitorName,
        visitorPhone,
        houseNumber,
        residentName,
        purpose,
        villageKey,
        imageUrl
      } = body as {
        visitorName: string;
        visitorPhone: string;
        houseNumber: string;
        residentName: string;
        purpose: string;
        villageKey: string;
        imageUrl?: string;
      };

      // Validate required fields
      if (!visitorName || !visitorPhone || !houseNumber || !residentName || !purpose || !villageKey) {
        set.status = 400;
        return {
          success: false,
          error: 'Missing required fields: visitorName, visitorPhone, houseNumber, residentName, purpose, villageKey'
        };
      }

      // Generate visitor ID (you might want to save this to database first)
      const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create visitor notification data
      const visitorData: VisitorNotificationData = {
        visitorName,
        visitorPhone,
        houseNumber,
        residentName,
        purpose,
        entryTime: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Bangkok'
        }) + ' น.',
        villageName: 'หมู่บ้านสุขสันต์', // You might want to get this from database
        visitorId,
        imageUrl
      };

      // Send notification to all residents in the house
      const result = await notificationService.sendVisitorNotificationToResidents(
        visitorData,
        houseNumber,
        villageKey
      );

      // Log the action
      console.log(`Guard ${currentUser.guard_id || currentUser.admin_id} sent visitor notification for ${visitorName} to house ${houseNumber}`);

      return {
        success: result.success,
        message: result.message,
        visitorId,
        notificationResult: result
      };

    } catch (error) {
      console.error('Error sending visitor notification to residents:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  /**
   * Send visitor details to a specific resident
   * POST /api/visitor-notification/send-details
   */
  .post('/send-details', async ({ body, set, currentUser }: any) => {
    try {
      const {
        userId,
        visitorName,
        visitorPhone,
        houseNumber,
        residentName,
        purpose,
        villageKey,
        visitorId,
        imageUrl
      } = body as {
        userId: string;
        visitorName: string;
        visitorPhone: string;
        houseNumber: string;
        residentName: string;
        purpose: string;
        villageKey: string;
        visitorId: string;
        imageUrl?: string;
      };

      // Validate required fields
      if (!userId || !visitorName || !visitorPhone || !houseNumber || !residentName || !purpose || !villageKey || !visitorId) {
        set.status = 400;
        return {
          success: false,
          error: 'Missing required fields: userId, visitorName, visitorPhone, houseNumber, residentName, purpose, villageKey, visitorId'
        };
      }

      // Create visitor notification data
      const visitorData: VisitorNotificationData = {
        visitorName,
        visitorPhone,
        houseNumber,
        residentName,
        purpose,
        entryTime: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Bangkok'
        }) + ' น.',
        villageName: 'หมู่บ้านสุขสันต์', // You might want to get this from database
        visitorId,
        imageUrl
      };

      // Send details to specific user
      const success = await notificationService.sendVisitorDetailsFlexMessage(userId, visitorData);

      // Log the action
      console.log(`Guard ${currentUser.guard_id || currentUser.admin_id} sent visitor details for ${visitorName} to user ${userId}`);

      return {
        success,
        message: success ? 'Visitor details sent successfully' : 'Failed to send visitor details',
        visitorId
      };

    } catch (error) {
      console.error('Error sending visitor details:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  /**
   * Handle resident response to visitor notification
   * POST /api/visitor-notification/handle-response
   */
  .post('/handle-response', async ({ body, set }) => {
    try {
      const {
        action,
        visitorId,
        userId,
        reason,
        houseNumber,
        villageKey
      } = body as {
        action: 'approve' | 'reject' | 'deny_confirm' | 'confirm_deny' | 'cancel_deny';
        visitorId: string;
        userId: string;
        reason?: string;
        houseNumber: string;
        villageKey: string;
      };

      // Validate required fields
      if (!action || !visitorId || !userId || !houseNumber || !villageKey) {
        set.status = 400;
        return {
          success: false,
          error: 'Missing required fields: action, visitorId, userId, houseNumber, villageKey'
        };
      }

      // Import the database utilities
      const { getVisitorRecordByVisitorId, updateVisitorRecordStatus } = await import('../db/visitorRecordUtils');
      const { flexMessageService } = await import('./(line)/flexMessage');

      // Check current visitor record status
      const visitorRecord = await getVisitorRecordByVisitorId(visitorId);

      if (visitorRecord) {
        // If already processed, return status message
        if (visitorRecord.record_status === 'approved' || visitorRecord.record_status === 'rejected') {
          console.log(`⚠️ Visitor ${visitorId} already ${visitorRecord.record_status}, cannot change status`);

          // Send status message showing current state
          const statusMessage = await flexMessageService.getVisitorFlexMessage({
            visitorId,
            visitorName: 'ผู้เยี่ยม', // You might want to get this from the record
            houseNumber,
            residentName: 'ผู้อยู่อาศัย', // You might want to get this from the record
            purpose: visitorRecord.visit_purpose || 'ไม่ระบุ',
            entryTime: visitorRecord.entry_time?.toLocaleString('th-TH') || 'ไม่ระบุ',
            villageName: 'หมู่บ้าน' // You might want to get this from the record
          });

          return {
            success: false,
            error: `Visitor request already ${visitorRecord.record_status}`,
            message: 'Status cannot be changed',
            currentStatus: visitorRecord.record_status,
            statusMessage
          };
        }
      }

      // Handle different actions
      if (action === 'deny_confirm') {
        // Show denial confirmation message
        const confirmationMessage = flexMessageService.createDenialConfirmationMessage({
          visitorId,
          visitorName: 'ผู้เยี่ยม', // You might want to get this from the record
          houseNumber,
          residentName: 'ผู้อยู่อาศัย', // You might want to get this from the record
          purpose: visitorRecord?.visit_purpose || 'ไม่ระบุ',
          entryTime: visitorRecord?.entry_time?.toLocaleString('th-TH') || 'ไม่ระบุ',
          villageName: 'หมู่บ้าน' // You might want to get this from the record
        });

        return {
          success: true,
          message: 'Denial confirmation sent',
          confirmationMessage
        };
      }

      if (action === 'cancel_deny') {
        // Show original approval message
        const approvalMessage = flexMessageService.createVisitorApprovalMessage({
          visitorId,
          visitorName: 'ผู้เยี่ยม', // You might want to get this from the record
          houseNumber,
          residentName: 'ผู้อยู่อาศัย', // You might want to get this from the record
          purpose: visitorRecord?.visit_purpose || 'ไม่ระบุ',
          entryTime: visitorRecord?.entry_time?.toLocaleString('th-TH') || 'ไม่ระบุ',
          villageName: 'หมู่บ้าน' // You might want to get this from the record
        });

        return {
          success: true,
          message: 'Denial cancelled, showing approval message',
          approvalMessage
        };
      }

      // Validate action for approve/reject/confirm_deny
      if (!['approve', 'reject', 'confirm_deny'].includes(action)) {
        set.status = 400;
        return {
          success: false,
          error: 'Invalid action. Must be "approve", "reject", "deny_confirm", "confirm_deny", or "cancel_deny"'
        };
      }

      // Determine final action
      const finalAction = action === 'confirm_deny' ? 'reject' : action;
      const dbStatus = finalAction === 'approve' ? 'approved' : finalAction === 'reject' ? 'rejected' : 'pending';

      // Update visitor record in database
      if (visitorRecord) {
        await updateVisitorRecordStatus(visitorRecord.visitor_record_id, dbStatus as "approved" | "rejected" | "pending");
        console.log(`✅ Updated visitor record ${visitorRecord.visitor_record_id} status to ${dbStatus}`);
      }

      console.log(`Resident ${userId} ${finalAction}d visitor ${visitorId} in house ${houseNumber}${reason ? ` with reason: ${reason}` : ''}`);

      // TODO: Notify guards about the response
      // TODO: Update visitor status

      // Send confirmation message back to resident
      const confirmationMessage = finalAction === 'approve'
        ? `✅ คุณได้ยืนยันการเข้าให้ผู้เยี่ยมแล้ว\n\nผู้เยี่ยมสามารถเข้าบ้านได้แล้ว`
        : `❌ คุณได้ปฏิเสธการเข้าให้ผู้เยี่ยมแล้ว${reason ? `\n\nเหตุผล: ${reason}` : ''}\n\nผู้เยี่ยมจะได้รับแจ้งเตือนและไม่สามารถเข้าบ้านได้`;

      // Send confirmation via LINE
      const textMessage = {
        type: 'text',
        text: confirmationMessage
      };

      // You would use your LINE messaging service here
      // For now, we'll just return success
      console.log(`📱 Confirmation message: ${confirmationMessage}`);

      return {
        success: true,
        message: 'Response processed successfully',
        action: finalAction,
        visitorId,
        userId,
        confirmationMessage
      };

    } catch (error) {
      console.error('Error handling visitor response:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  /**
   * Get residents in a specific house
   * GET /api/visitor-notification/residents/:houseNumber/:villageKey
   */
  .get('/residents/:houseNumber/:villageKey', async ({ params, set, currentUser }: any) => {
    try {
      const { houseNumber, villageKey } = params as { houseNumber: string; villageKey: string };

      // Get residents in the house
      const residents = await notificationService.getResidentsInHouse(houseNumber, villageKey);

      // Log the action
      console.log(`Guard ${currentUser.guard_id || currentUser.admin_id} requested residents for house ${houseNumber}`);

      return {
        success: true,
        houseNumber,
        villageKey,
        residents,
        count: residents.length
      };

    } catch (error) {
      console.error('Error getting residents in house:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  /**
   * Test visitor notification (for development)
   * POST /api/visitor-notification/test
   */
  .post('/test', async ({ body, set }) => {
    try {
      const { userId } = body as { userId: string };

      if (!userId) {
        set.status = 400;
        return { success: false, error: 'userId is required' };
      }

      // Create test visitor data
      const testVisitorData: VisitorNotificationData = {
        visitorName: 'สมชาย ทดสอบ',
        visitorPhone: '081-234-5678',
        houseNumber: '123/45',
        residentName: 'สมหญิง ทดสอบ',
        purpose: 'ทดสอบระบบแจ้งเตือน',
        entryTime: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Bangkok'
        }) + ' น.',
        villageName: 'หมู่บ้านสุขสันต์',
        visitorId: 'test_visitor_001',
        imageUrl: 'https://via.placeholder.com/300x200/1DB446/FFFFFF?text=Test+Visitor'
      };

      // Send test notification
      const success = await notificationService.sendVisitorNotificationFlexMessage(userId, testVisitorData);

      return {
        success,
        message: success ? 'Test notification sent successfully' : 'Failed to send test notification',
        testData: testVisitorData
      };

    } catch (error) {
      console.error('Error sending test notification:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  });
