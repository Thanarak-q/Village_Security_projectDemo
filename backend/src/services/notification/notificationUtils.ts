/**
 * @file Utility functions for the notification system
 * This file contains helper functions for creating notifications, fanning them out to admins,
 * and querying notification data with proper read/unread tracking.
 */

import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { db } from "../../db/drizzle";
import { 
  admin_notifications, 
  admin_notification_delivery, 
  admins,
  villages,
  type AdminNotification,
  type AdminNotificationDelivery,
  type AdminNotificationInsert,
  type AdminNotificationDeliveryInsert
} from "../../db/schema";
import { NOTIFICATION_TYPES, type NotificationType } from "../../types/notification.types";

/**
 * Creates a new notification and fans it out to all admins in the village
 */
export async function createNotificationForVillage(
  villageKey: string,
  notificationData: Omit<AdminNotificationInsert, 'village_key'>
): Promise<AdminNotification> {
  // Create the notification
  const [notification] = await db
    .insert(admin_notifications)
    .values({
      ...notificationData,
      village_key: villageKey,
    })
    .returning();

  // Get all admins in the village
  const villageAdmins = await db
    .select({ admin_id: admins.admin_id })
    .from(admins)
    .where(and(
      eq(admins.village_key, villageKey),
      eq(admins.status, 'verified')
    ));

  // Fan out to all admins
  if (villageAdmins.length > 0) {
    const deliveryRecords: AdminNotificationDeliveryInsert[] = villageAdmins.map(admin => ({
      notification_id: notification.notification_id,
      admin_id: admin.admin_id,
    }));

    await db
      .insert(admin_notification_delivery)
      .values(deliveryRecords);
  }

  return notification;
}

/**
 * Gets notifications for a specific admin with read/unread status
 */
export async function getNotificationsForAdmin(
  adminId: string,
  limit: number = 50,
  offset: number = 0
) {
  return await db
    .select({
      notification_id: admin_notifications.notification_id,
      village_key: admin_notifications.village_key,
      village_name: villages.village_name,
      type: admin_notifications.type,
      category: admin_notifications.category,
      title: admin_notifications.title,
      message: admin_notifications.message,
      data: admin_notifications.data,
      created_at: admin_notifications.created_at,
      seen_at: admin_notification_delivery.seen_at,
      read_at: admin_notification_delivery.read_at,
    })
    .from(admin_notifications)
    .innerJoin(admin_notification_delivery, 
      eq(admin_notifications.notification_id, admin_notification_delivery.notification_id)
    )
    .innerJoin(villages, 
      eq(admin_notifications.village_key, villages.village_key)
    )
    .where(eq(admin_notification_delivery.admin_id, adminId))
    .orderBy(desc(admin_notifications.created_at))
    .limit(limit)
    .offset(offset);
}

/**
 * Gets unread notification count for a specific admin
 */
export async function getUnreadNotificationCount(adminId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(admin_notification_delivery)
    .where(and(
      eq(admin_notification_delivery.admin_id, adminId),
      isNull(admin_notification_delivery.read_at)
    ));

  return result.count;
}

/**
 * Marks a notification as seen (when admin opens notification panel)
 */
export async function markNotificationAsSeen(
  notificationId: string,
  adminId: string
): Promise<void> {
  await db
    .update(admin_notification_delivery)
    .set({ seen_at: new Date() })
    .where(and(
      eq(admin_notification_delivery.notification_id, notificationId),
      eq(admin_notification_delivery.admin_id, adminId),
      isNull(admin_notification_delivery.seen_at)
    ));
}

/**
 * Marks a notification as read (when admin clicks on notification)
 */
export async function markNotificationAsRead(
  notificationId: string,
  adminId: string
): Promise<void> {
  await db
    .update(admin_notification_delivery)
    .set({ read_at: new Date() })
    .where(and(
      eq(admin_notification_delivery.notification_id, notificationId),
      eq(admin_notification_delivery.admin_id, adminId)
    ));
}

/**
 * Marks all notifications as read for a specific admin
 */
export async function markAllNotificationsAsRead(adminId: string): Promise<void> {
  await db
    .update(admin_notification_delivery)
    .set({ read_at: new Date() })
    .where(and(
      eq(admin_notification_delivery.admin_id, adminId),
      isNull(admin_notification_delivery.read_at)
    ));
}

/**
 * Gets notification statistics for a specific admin
 */
export async function getNotificationStats(adminId: string) {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      unread: sql<number>`count(*) filter (where ${admin_notification_delivery.read_at} is null)`,
      unseen: sql<number>`count(*) filter (where ${admin_notification_delivery.seen_at} is null)`,
    })
    .from(admin_notification_delivery)
    .where(eq(admin_notification_delivery.admin_id, adminId));

  return stats;
}

/**
 * Gets notifications by type for a specific admin
 */
export async function getNotificationsByType(
  adminId: string,
  type: NotificationType,
  limit: number = 20
) {
  return await db
    .select({
      notification_id: admin_notifications.notification_id,
      village_key: admin_notifications.village_key,
      village_name: villages.village_name,
      type: admin_notifications.type,
      category: admin_notifications.category,
      title: admin_notifications.title,
      message: admin_notifications.message,
      data: admin_notifications.data,
      created_at: admin_notifications.created_at,
      seen_at: admin_notification_delivery.seen_at,
      read_at: admin_notification_delivery.read_at,
    })
    .from(admin_notifications)
    .innerJoin(admin_notification_delivery, 
      eq(admin_notifications.notification_id, admin_notification_delivery.notification_id)
    )
    .innerJoin(villages, 
      eq(admin_notifications.village_key, villages.village_key)
    )
    .where(and(
      eq(admin_notification_delivery.admin_id, adminId),
      eq(admin_notifications.type, type)
    ))
    .orderBy(desc(admin_notifications.created_at))
    .limit(limit);
}

/**
 * Example usage functions for common notification scenarios
 */
export const NotificationExamples = {
  /**
   * Create a notification when a new resident registers
   */
  async residentRegistrationNotification(villageKey: string, residentName: string) {
    return await createNotificationForVillage(villageKey, {
      type: 'resident_pending',
      category: 'user_approval',
      title: 'New Resident Registration',
      message: `${residentName} has registered and is waiting for approval`,
      data: { resident_name: residentName }
    });
  },

  /**
   * Create a notification when a visitor is pending too long
   */
  async visitorPendingTooLongNotification(villageKey: string, visitorName: string, minutes: number) {
    return await createNotificationForVillage(villageKey, {
      type: 'visitor_pending_too_long',
      category: 'visitor_management',
      title: 'Visitor Pending Too Long',
      message: `Visitor ${visitorName} has been waiting for ${minutes} minutes`,
      data: { visitor_name: visitorName, wait_time_minutes: minutes }
    });
  },

  /**
   * Create a notification when house status changes
   */
  async houseStatusChangeNotification(villageKey: string, houseAddress: string, newStatus: string) {
    return await createNotificationForVillage(villageKey, {
      type: 'house_updated',
      category: 'house_management',
      title: 'House Status Updated',
      message: `House at ${houseAddress} status changed to ${newStatus}`,
      data: { house_address: houseAddress, new_status: newStatus }
    });
  }
};
