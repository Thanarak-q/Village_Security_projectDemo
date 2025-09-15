/**
 * @file Notification service for creating and managing real-time notifications
 * This service creates notifications in the database and broadcasts them via WebSocket
 */

import db from '../db/drizzle';
import { admin_notifications, villages } from '../db/schema';
// WebSocket enabled
import { webSocketService } from './websocketService';
import { eq, and, count } from 'drizzle-orm';

export interface CreateNotificationData {
  admin_id: string;
  village_key: string;
  type: 'resident_pending' | 'guard_pending' | 'admin_pending' | 'house_updated' | 'member_added' | 'member_removed' | 'status_changed' | 'visitor_pending_too_long' | 'visitor_rejected_review';
  category: 'user_approval' | 'house_management' | 'visitor_management';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

class NotificationService {
  /**
   * Create a new notification and broadcast it via WebSocket
   */
  async createNotification(data: CreateNotificationData) {
    try {
      // Insert notification into database
      const [notification] = await db
        .insert(admin_notifications)
        .values({
          admin_id: data.admin_id,
          village_key: data.village_key,
          type: data.type,
          category: data.category,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
          priority: data.priority || 'medium',
          is_read: false,
          created_at: new Date(),
        })
        .returning();

      // Get village name for the notification
      const [village] = await db
        .select({ village_name: villages.village_name })
        .from(villages)
        .where(eq(villages.village_key, data.village_key));

      // Prepare WebSocket message
      const wsMessage = {
        type: 'notification' as const,
        data: {
          notification_id: notification.notification_id,
          type: notification.type,
          category: notification.category,
          title: notification.title,
          message: notification.message,
          data: data.data,
          is_read: notification.is_read,
          priority: notification.priority,
          created_at: notification.created_at.toISOString(),
          read_at: notification.read_at?.toISOString(),
          village_name: village?.village_name,
        }
      };

      // WebSocket broadcasting enabled
      webSocketService.broadcastToUser(data.admin_id, wsMessage);
      webSocketService.broadcastToVillageAdmins(data.village_key, wsMessage);

      console.log(`📢 Created and broadcasted notification: ${notification.title} to admin ${data.admin_id}`);

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
    admin_id: string;
  }) {
    return this.createNotification({
      admin_id: residentData.admin_id,
      village_key: residentData.village_key,
      type: 'resident_pending',
      category: 'user_approval',
      title: 'ผู้อยู่อาศัยใหม่รอการอนุมัติ',
      message: `มีผู้อยู่อาศัยใหม่ ${residentData.fname} ${residentData.lname} รอการอนุมัติเข้าอยู่ในหมู่บ้าน`,
      priority: 'high',
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
    admin_id: string;
  }) {
    return this.createNotification({
      admin_id: guardData.admin_id,
      village_key: guardData.village_key,
      type: 'guard_pending',
      category: 'user_approval',
      title: 'ยามรักษาความปลอดภัยใหม่รอการอนุมัติ',
      message: `มียามรักษาความปลอดภัยใหม่ ${guardData.fname} ${guardData.lname} รอการอนุมัติเข้าทำงาน`,
      priority: 'medium',
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
    admin_id: string;
  }) {
    const userTypeText = userData.user_type === 'resident' ? 'ผู้อยู่อาศัย' : 'ยามรักษาความปลอดภัย';
    
    return this.createNotification({
      admin_id: userData.admin_id,
      village_key: userData.village_key,
      type: userData.user_type === 'resident' ? 'member_added' : 'status_changed',
      category: userData.user_type === 'resident' ? 'house_management' : 'user_approval',
      title: `${userTypeText}ได้รับการอนุมัติ`,
      message: `${userTypeText} ${userData.fname} ${userData.lname} ได้รับการอนุมัติแล้ว`,
      priority: 'low',
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
    admin_id: string;
  }) {
    return this.createNotification({
      admin_id: houseData.admin_id,
      village_key: houseData.village_key,
      type: 'house_updated',
      category: 'house_management',
      title: 'สถานะบ้านเปลี่ยนแปลง',
      message: `บ้านเลขที่ ${houseData.address} เปลี่ยนสถานะจาก '${houseData.old_status}' เป็น '${houseData.new_status}'`,
      priority: 'medium',
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
    admin_id: string;
  }) {
    return this.createNotification({
      admin_id: visitorData.admin_id,
      village_key: visitorData.village_key,
      type: 'visitor_pending_too_long',
      category: 'visitor_management',
      title: 'ผู้เยี่ยมรอการอนุมัตินานเกินไป',
      message: `ผู้เยี่ยม ${visitorData.visitor_name} รอการอนุมัติเป็นเวลา ${visitorData.wait_time} แล้ว`,
      priority: 'urgent',
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
    admin_id: string;
  }) {
    return this.createNotification({
      admin_id: visitorData.admin_id,
      village_key: visitorData.village_key,
      type: 'visitor_rejected_review',
      category: 'visitor_management',
      title: 'ผู้เยี่ยมถูกปฏิเสธ',
      message: `ผู้เยี่ยม ${visitorData.visitor_name} ถูกปฏิเสธ: ${visitorData.reason}`,
      priority: 'high',
      data: {
        visitor_record_id: visitorData.visitor_record_id,
        visitor_name: visitorData.visitor_name,
        rejection_reason: visitorData.reason,
        rejection_date: new Date().toISOString(),
      }
    });
  }

  /**
   * Update notification counts and broadcast to user
   */
  async updateNotificationCounts(adminId: string) {
    try {
      // Get current counts from database
      const [totalResult, unreadResult] = await Promise.all([
        db.select({ count: count() })
          .from(admin_notifications)
          .where(eq(admin_notifications.admin_id, adminId)),
        
        db.select({ count: count() })
          .from(admin_notifications)
          .where(and(
            eq(admin_notifications.admin_id, adminId),
            eq(admin_notifications.is_read, false)
          ))
      ]);

      const counts = {
        total: totalResult[0]?.count || 0,
        unread: unreadResult[0]?.count || 0
      };

      // WebSocket broadcasting enabled
      const wsMessage = {
        type: 'notification_count' as const,
        data: counts
      };
      webSocketService.broadcastToUser(adminId, wsMessage);

      return counts;
    } catch (error) {
      console.error('Error updating notification counts:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
