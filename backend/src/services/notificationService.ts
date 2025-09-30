/**
 * @file Notification service for creating and managing notifications
 * This service creates notifications in the database
 */

import db from '../db/drizzle';
import { admin_notifications, villages, house_members } from '../db/schema';
import { eq, and, count } from 'drizzle-orm';
import { websocketClient } from './websocketClient';
import { flexMessageService, type VisitorNotificationData, type ApprovalNotificationData, type SecurityAlertData } from '../routes/(line)/flexMessage';

export interface CreateNotificationData {
  village_id: string;
  type: 'resident_pending' | 'guard_pending' | 'admin_pending' | 'house_updated' | 'member_added' | 'member_removed' | 'status_changed' | 'visitor_pending_too_long' | 'visitor_rejected_review';
  category: 'user_approval' | 'house_management' | 'visitor_management';
  title: string;
  message: string;
  data?: Record<string, any>;
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData) {
    try {
      // Safely serialize data field
      let serializedData = null;
      if (data.data) {
        try {
          // Check if data is already a string, if so, parse it first to validate
          if (typeof data.data === 'string') {
            JSON.parse(data.data); // Validate it's valid JSON
            serializedData = data.data; // Use as-is if valid
          } else {
            serializedData = JSON.stringify(data.data);
          }
        } catch (error) {
          console.error('❌ Invalid data field in notification:', error);
          serializedData = null;
        }
      }

      // Insert notification into database
      const [notification] = await db
        .insert(admin_notifications)
        .values({
          village_id: data.village_id,
          type: data.type,
          category: data.category,
          title: data.title,
          message: data.message,
          data: serializedData ? JSON.parse(serializedData) : null,
          created_at: new Date(),
        })
        .returning();

      // Get village name for the notification
      const [village] = await db
        .select({ village_name: villages.village_name })
        .from(villages)
        .where(eq(villages.village_id, data.village_id));


      console.log(`📢 Created notification: ${notification.title} for village ${data.village_id}`);

      // Send via WebSocket to admins
      try {
      const wsNotification = {
        id: notification.notification_id,
        title: notification.title,
        body: notification.message,
        level: this.getNotificationLevel(data.type),
        createdAt: notification.created_at ? notification.created_at.getTime() : Date.now(),
        villageId: notification.village_id,
        type: notification.type,
        category: notification.category,
        data: notification.data
      };
        
        await websocketClient.sendNotification(wsNotification);
        console.log(`📤 WebSocket notification sent: ${notification.title}`);
      } catch (wsError) {
        console.error('❌ WebSocket notification failed:', wsError);
        // Don't throw - database save was successful
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for new resident registration
   */
  async notifyNewResidentRegistration(residentData: {
    resident_id: string;
    fname: string;
    lname: string;
    village_id: string;
  }) {
    return this.createNotification({
      village_id: residentData.village_id,
      type: 'resident_pending',
      category: 'user_approval',
      title: 'ผู้อยู่อาศัยใหม่รอการอนุมัติ',
      message: `มีผู้อยู่อาศัยใหม่ ${residentData.fname} ${residentData.lname} รอการอนุมัติเข้าอยู่ในหมู่บ้าน`,
      data: {
        resident_id: residentData.resident_id,
        resident_name: `${residentData.fname} ${residentData.lname}`,
        registration_date: new Date().toISOString(),
      }
    });
  }

  /**
   * Create notification for new guard registration
   */
  async notifyNewGuardRegistration(guardData: {
    guard_id: string;
    fname: string;
    lname: string;
    village_id: string;
  }) {
    return this.createNotification({
      village_id: guardData.village_id,
      type: 'guard_pending',
      category: 'user_approval',
      title: 'ยามรักษาความปลอดภัยใหม่รอการอนุมัติ',
      message: `มียามรักษาความปลอดภัยใหม่ ${guardData.fname} ${guardData.lname} รอการอนุมัติเข้าทำงาน`,
      data: {
        guard_id: guardData.guard_id,
        guard_name: `${guardData.fname} ${guardData.lname}`,
        registration_date: new Date().toISOString(),
      }
    });
  }

  /**
   * Create notification for user approval
   */
  async notifyUserApproval(userData: {
    user_id: string;
    user_type: 'resident' | 'guard';
    fname: string;
    lname: string;
    village_id: string;
  }) {
    const userTypeText = userData.user_type === 'resident' ? 'ผู้อยู่อาศัย' : 'ยามรักษาความปลอดภัย';
    
    return this.createNotification({
      village_id: userData.village_id,
      type: userData.user_type === 'resident' ? 'member_added' : 'status_changed',
      category: userData.user_type === 'resident' ? 'house_management' : 'user_approval',
      title: `${userTypeText}ได้รับการอนุมัติ`,
      message: `${userTypeText} ${userData.fname} ${userData.lname} ได้รับการอนุมัติแล้ว`,
      data: {
        user_id: userData.user_id,
        user_type: userData.user_type,
        user_name: `${userData.fname} ${userData.lname}`,
        approval_date: new Date().toISOString(),
      }
    });
  }

  /**
   * Create notification for house status change and broadcast to admins.
   */
  async notifyHouseStatusChange(houseData: {
    house_id: string;
    address: string;
    old_status: string;
    new_status: string;
    village_id?: string;
    village_key?: string | null;
  }) {
    let villageKey = houseData.village_key ?? null;

    if ((!villageKey || !villageKey.trim()) && houseData.village_id) {
      const [village] = await db
        .select({ village_key: villages.village_key })
        .from(villages)
        .where(eq(villages.village_id, houseData.village_id));
      villageKey = village?.village_key ?? null;
    }

    return this.createNotification({
      village_key: villageKey ?? houseData.village_id ?? "",
      type: 'house_updated',
      category: 'house_management',
      title: 'สถานะบ้านเปลี่ยนแปลง',
      message: `บ้านเลขที่ ${houseData.address} เปลี่ยนสถานะจาก '${houseData.old_status}' เป็น '${houseData.new_status}'`,
      data: {
        house_id: houseData.house_id,
        house_address: houseData.address,
        old_status: houseData.old_status,
        new_status: houseData.new_status,
        change_date: new Date().toISOString(),
      },
    });
  }

  /**
   * Create notification for visitor pending too long
   */
  async notifyVisitorPendingTooLong(visitorData: {
    visitor_record_id: string;
    visitor_name: string;
    wait_time: string;
    village_id: string;
  }) {
    return this.createNotification({
      village_id: visitorData.village_id,
      type: 'visitor_pending_too_long',
      category: 'visitor_management',
      title: 'ผู้เยี่ยมรอการอนุมัตินานเกินไป',
      message: `ผู้เยี่ยม ${visitorData.visitor_name} รอการอนุมัติเป็นเวลา ${visitorData.wait_time} แล้ว`,
      data: {
        visitor_record_id: visitorData.visitor_record_id,
        visitor_name: visitorData.visitor_name,
        wait_time: visitorData.wait_time,
        pending_since: new Date().toISOString(),
      }
    });
  }

  /**
   * Create notification for visitor rejection
   */
  async notifyVisitorRejection(visitorData: {
    visitor_record_id: string;
    visitor_name: string;
    reason: string;
    village_id: string;
  }) {
    return this.createNotification({
      village_id: visitorData.village_id,
      type: 'visitor_rejected_review',
      category: 'visitor_management',
      title: 'ผู้เยี่ยมถูกปฏิเสธ',
      message: `ผู้เยี่ยม ${visitorData.visitor_name} ถูกปฏิเสธ: ${visitorData.reason}`,
      data: {
        visitor_record_id: visitorData.visitor_record_id,
        visitor_name: visitorData.visitor_name,
        rejection_reason: visitorData.reason,
        rejection_date: new Date().toISOString(),
      }
    });
  }

  /**
   * Create notification for house member added and broadcast to admins.
   */
  async notifyHouseMemberAdded(memberData: {
    house_member_id: string;
    resident_id: string;
    resident_name: string;
    house_address: string;
    village_id: string;
  }) {
    return this.createNotification({
      village_id: memberData.village_id,
      type: 'member_added',
      category: 'house_management',
      title: 'เพิ่มลูกบ้านใหม่',
      message: `เพิ่มลูกบ้าน ${memberData.resident_name} เข้าบ้านเลขที่ ${memberData.house_address}`,
      data: {
        house_member_id: memberData.house_member_id,
        resident_id: memberData.resident_id,
        resident_name: memberData.resident_name,
        house_address: memberData.house_address,
        added_date: new Date().toISOString(),
      },
    });
  }

  /**
   * Create notification for house member removed and broadcast to admins.
   */
  async notifyHouseMemberRemoved(memberData: {
    house_member_id: string;
    resident_id: string;
    resident_name: string;
    house_address: string;
    village_id: string;
  }) {
    return this.createNotification({
      village_id: memberData.village_id,
      type: 'member_removed',
      category: 'house_management',
      title: 'ลบลูกบ้าน',
      message: `ลบลูกบ้าน ${memberData.resident_name} ออกจากบ้านเลขที่ ${memberData.house_address}`,
      data: {
        house_member_id: memberData.house_member_id,
        resident_id: memberData.resident_id,
        resident_name: memberData.resident_name,
        house_address: memberData.house_address,
        removed_date: new Date().toISOString(),
      },
    });
  }

  /**
   * Create notification for resident status change and broadcast to admins.
   */
  async notifyResidentStatusChange(residentData: {
    resident_id: string;
    resident_name: string;
    house_address: string;
    old_status: string;
    new_status: string;
    village_id: string;
  }) {
    return this.createNotification({
      village_id: residentData.village_id,
      type: 'status_changed',
      category: 'house_management',
      title: 'เปลี่ยนสถานะลูกบ้าน',
      message: `ลูกบ้าน ${residentData.resident_name} (บ้านเลขที่ ${residentData.house_address}) เปลี่ยนสถานะจาก '${residentData.old_status}' เป็น '${residentData.new_status}'`,
      data: {
        resident_id: residentData.resident_id,
        resident_name: residentData.resident_name,
        house_address: residentData.house_address,
        old_status: residentData.old_status,
        new_status: residentData.new_status,
        change_date: new Date().toISOString(),
      },
    });
  }

  /**
   * Send visitor approval request via LINE flex message
   */
  async sendVisitorApprovalFlexMessage(userId: string, visitorData: VisitorNotificationData) {
    try {
      const success = await flexMessageService.sendFlexMessage(
        userId,
        flexMessageService.createVisitorApprovalMessage(visitorData)
      );
      
      if (success) {
        console.log(`📱 LINE flex message sent for visitor approval: ${visitorData.visitorName}`);
      } else {
        console.error(`❌ Failed to send LINE flex message for visitor approval: ${visitorData.visitorName}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending visitor approval flex message:', error);
      return false;
    }
  }

  /**
   * Send approval result via LINE flex message
   */
  async sendApprovalResultFlexMessage(userId: string, approvalData: ApprovalNotificationData) {
    try {
      const success = await flexMessageService.sendFlexMessage(
        userId,
        flexMessageService.createApprovalResultMessage(approvalData)
      );
      
      if (success) {
        console.log(`📱 LINE flex message sent for approval result: ${approvalData.visitorName}`);
      } else {
        console.error(`❌ Failed to send LINE flex message for approval result: ${approvalData.visitorName}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending approval result flex message:', error);
      return false;
    }
  }

  /**
   * Send security alert via LINE flex message
   */
  async sendSecurityAlertFlexMessage(userId: string, alertData: SecurityAlertData) {
    try {
      const success = await flexMessageService.sendFlexMessage(
        userId,
        flexMessageService.createSecurityAlertMessage(alertData)
      );
      
      if (success) {
        console.log(`📱 LINE flex message sent for security alert: ${alertData.alertType}`);
      } else {
        console.error(`❌ Failed to send LINE flex message for security alert: ${alertData.alertType}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending security alert flex message:', error);
      return false;
    }
  }

  /**
   * Send welcome message via LINE flex message
   */
  async sendWelcomeFlexMessage(userId: string, residentName: string, villageName: string) {
    try {
      const success = await flexMessageService.sendFlexMessage(
        userId,
        flexMessageService.createWelcomeMessage(residentName, villageName)
      );
      
      if (success) {
        console.log(`📱 LINE welcome message sent to: ${residentName}`);
      } else {
        console.error(`❌ Failed to send LINE welcome message to: ${residentName}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending welcome flex message:', error);
      return false;
    }
  }

  /**
   * Send visitor notification to a specific resident
   */
  async sendVisitorNotification(data: {
    lineUserId: string;
    visitorRecordId: string;
    houseAddress: string;
    visitorIdCard: string;
    licensePlate: string;
    visitPurpose: string;
    guardName: string;
    residentName: string;
    imageUrl?: string | null;
  }) {
    try {
      const visitorData: VisitorNotificationData = {
        visitorName: data.visitorIdCard, // Using ID card as visitor name for now - this should be updated to use visitor name from visitors table
        visitorPhone: 'ไม่ระบุ',
        houseNumber: data.houseAddress,
        residentName: data.residentName,
        purpose: data.visitPurpose,
        entryTime: new Date().toLocaleString('th-TH'),
        villageName: 'หมู่บ้าน', // You might want to get this from house data
        visitorId: data.visitorRecordId,
        imageUrl: data.imageUrl || undefined
      };

      const success = await this.sendVisitorNotificationFlexMessage(data.lineUserId, visitorData);
      
      if (success) {
        console.log(`📱 Visitor notification sent to ${data.residentName} (${data.lineUserId})`);
      } else {
        console.error(`❌ Failed to send visitor notification to ${data.residentName} (${data.lineUserId})`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending visitor notification:', error);
      return false;
    }
  }

  /**
   * Send visitor notification to all residents in a house
   */
  async sendVisitorNotificationToResidents(visitorData: VisitorNotificationData, houseNumber: string, villageKey: string) {
    try {
      // Get all residents in the house
      const residents = await this.getResidentsInHouse(houseNumber, villageKey);
      
      if (residents.length === 0) {
        console.log(`⚠️ No residents found in house ${houseNumber} for village ${villageKey}`);
        return { success: false, message: 'No residents found in house' };
      }

      console.log(`📱 Sending visitor notification to ${residents.length} residents in house ${houseNumber}`);

      // Send notification to all residents
      const results = await Promise.allSettled(
        residents.map(resident => 
          this.sendVisitorNotificationFlexMessage(resident.lineUserId, visitorData)
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      console.log(`📊 Notification results: ${successful} successful, ${failed} failed`);

      return {
        success: successful > 0,
        message: `Sent to ${successful}/${residents.length} residents`,
        successful,
        failed,
        total: residents.length
      };
    } catch (error) {
      console.error('Error sending visitor notification to residents:', error);
      return { success: false, message: 'Failed to send notifications', error: (error as Error).message };
    }
  }

  /**
   * Send visitor notification flex message to a single user
   */
  async sendVisitorNotificationFlexMessage(userId: string, visitorData: VisitorNotificationData) {
    try {
      const success = await flexMessageService.sendFlexMessage(
        userId,
        flexMessageService.createVisitorNotificationMessage(visitorData)
      );
      
      if (success) {
        console.log(`📱 Visitor notification sent to user: ${userId}`);
      } else {
        console.error(`❌ Failed to send visitor notification to user: ${userId}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending visitor notification flex message:', error);
      return false;
    }
  }

  /**
   * Send visitor details flex message to a single user
   */
  async sendVisitorDetailsFlexMessage(userId: string, visitorData: VisitorNotificationData) {
    try {
      const success = await flexMessageService.sendFlexMessage(
        userId,
        flexMessageService.createVisitorDetailsMessage(visitorData)
      );
      
      if (success) {
        console.log(`📱 Visitor details sent to user: ${userId}`);
      } else {
        console.error(`❌ Failed to send visitor details to user: ${userId}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending visitor details flex message:', error);
      return false;
    }
  }

  /**
   * Get all residents in a specific house
   */
  async getResidentsInHouse(houseNumber: string, villageKey: string) {
    try {
      // Mock data for now - replace with actual database query
      // You'll need to implement this based on your actual database schema
      const mockResidents = [
        {
          residentId: 'resident_001',
          name: 'สมหญิง รักบ้าน',
          lineUserId: 'U1234567890abcdef'
        },
        {
          residentId: 'resident_002', 
          name: 'สมชาย รักบ้าน',
          lineUserId: 'U0987654321fedcba'
        }
      ];

      console.log(`📋 Found ${mockResidents.length} residents in house ${houseNumber}`);
      return mockResidents;
    } catch (error) {
      console.error('Error getting residents in house:', error);
      return [];
    }
  }

  /**
   * Get notification level based on type
   */
  private getNotificationLevel(type: string): 'info' | 'warning' | 'critical' {
    switch (type) {
      case 'visitor_pending_too_long':
      case 'visitor_rejected_review':
        return 'warning';
      case 'resident_pending':
      case 'guard_pending':
      case 'admin_pending':
        return 'info';
      case 'house_updated':
      case 'member_added':
      case 'member_removed':
      case 'status_changed':
        return 'info';
      default:
        return 'info';
    }
  }

}

// Export singleton instance
export const notificationService = new NotificationService();

// Export individual functions for easier importing
export const { sendVisitorNotification } = notificationService;
