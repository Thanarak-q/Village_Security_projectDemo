/**
 * @file Notification service for creating and managing notifications
 * This service creates notifications in the database
 */

import db from '../db/drizzle';
import { admin_notifications, villages } from '../db/schema';
import { eq, and, count } from 'drizzle-orm';
import { websocketClient } from './websocketClient';

export interface CreateNotificationData {
  village_key: string;
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
          village_key: data.village_key,
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
        .where(eq(villages.village_key, data.village_key));


      console.log(`📢 Created notification: ${notification.title} for village ${data.village_key}`);

      // Send via WebSocket to admins
      try {
        const wsNotification = {
          id: notification.notification_id,
          title: notification.title,
          body: notification.message,
          level: this.getNotificationLevel(data.type),
          createdAt: notification.created_at ? notification.created_at.getTime() : Date.now()
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
    village_key: string;
  }) {
    return this.createNotification({
      village_key: residentData.village_key,
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
    village_key: string;
  }) {
    return this.createNotification({
      village_key: guardData.village_key,
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
    village_key: string;
  }) {
    const userTypeText = userData.user_type === 'resident' ? 'ผู้อยู่อาศัย' : 'ยามรักษาความปลอดภัย';
    
    return this.createNotification({
      village_key: userData.village_key,
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
   * Create notification for house status change
   */
  async notifyHouseStatusChange(houseData: {
    house_id: string;
    address: string;
    old_status: string;
    new_status: string;
    village_key: string;
  }) {
    return this.createNotification({
      village_key: houseData.village_key,
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
      }
    });
  }

  /**
   * Create notification for visitor pending too long
   */
  async notifyVisitorPendingTooLong(visitorData: {
    visitor_record_id: string;
    visitor_name: string;
    wait_time: string;
    village_key: string;
  }) {
    return this.createNotification({
      village_key: visitorData.village_key,
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
    village_key: string;
  }) {
    return this.createNotification({
      village_key: visitorData.village_key,
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
