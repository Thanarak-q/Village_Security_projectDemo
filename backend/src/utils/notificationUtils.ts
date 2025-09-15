/**
 * @file Utility functions for creating admin notifications
 * This file contains helper functions to automatically create notifications
 * when certain events occur in the system.
 */

import db from '../db/drizzle';
import { admin_notifications, admins, villages } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface CreateNotificationParams {
  village_key: string;
  type: 'resident_pending' | 'guard_pending' | 'admin_pending' | 'house_updated' | 'member_added' | 'member_removed' | 'status_changed' | 'visitor_pending_too_long' | 'visitor_rejected_review';
  category: 'user_approval' | 'house_management' | 'visitor_management';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  exclude_admin_id?: string; // Admin who performed the action (don't notify themselves)
}

/**
 * Create notifications for all admins in a village
 */
export async function createNotificationForVillageAdmins(params: CreateNotificationParams) {
  try {
    // Get all admins in the village
    const villageAdmins = await db
      .select({
        admin_id: admins.admin_id,
        username: admins.username,
        role: admins.role
      })
      .from(admins)
      .where(and(
        eq(admins.village_key, params.village_key),
        eq(admins.status, 'verified')
      ));

    // Create notifications for each admin (except the one who performed the action)
    const notifications = villageAdmins
      .filter(admin => admin.admin_id !== params.exclude_admin_id)
      .map(admin => ({
        admin_id: admin.admin_id,
        village_key: params.village_key,
        type: params.type,
        category: params.category,
        title: params.title,
        message: params.message,
        data: params.data,
        priority: params.priority || 'medium',
        is_read: false
      }));

    if (notifications.length > 0) {
      await db.insert(admin_notifications).values(notifications);
      console.log(`✅ Created ${notifications.length} notifications for village ${params.village_key}`);
    }

    return notifications.length;
  } catch (error) {
    console.error('❌ Error creating notifications for village admins:', error);
    throw error;
  }
}

/**
 * Create notification for a specific admin
 */
export async function createNotificationForAdmin(
  admin_id: string,
  params: Omit<CreateNotificationParams, 'exclude_admin_id'>
) {
  try {
    const result = await db
      .insert(admin_notifications)
      .values({
        admin_id,
        village_key: params.village_key,
        type: params.type,
        category: params.category,
        title: params.title,
        message: params.message,
        data: params.data,
        priority: params.priority || 'medium',
        is_read: false
      })
      .returning();

    console.log(`✅ Created notification for admin ${admin_id}`);
    return result[0];
  } catch (error) {
    console.error('❌ Error creating notification for admin:', error);
    throw error;
  }
}

/**
 * Create notification for superadmins (system-wide notifications)
 */
export async function createNotificationForSuperAdmins(params: Omit<CreateNotificationParams, 'exclude_admin_id'>) {
  try {
    // Get all superadmins
    const superAdmins = await db
      .select({
        admin_id: admins.admin_id,
        username: admins.username
      })
      .from(admins)
      .where(and(
        eq(admins.role, 'superadmin'),
        eq(admins.status, 'verified')
      ));

    // Create notifications for each superadmin
    const notifications = superAdmins.map(admin => ({
      admin_id: admin.admin_id,
      village_key: params.village_key,
      type: params.type,
      category: params.category,
      title: params.title,
      message: params.message,
      data: params.data,
      priority: params.priority || 'medium',
      is_read: false
    }));

    if (notifications.length > 0) {
      await db.insert(admin_notifications).values(notifications);
      console.log(`✅ Created ${notifications.length} notifications for superadmins`);
    }

    return notifications.length;
  } catch (error) {
    console.error('❌ Error creating notifications for superadmins:', error);
    throw error;
  }
}

/**
 * Specific notification creators for common events
 */

// User approval notifications
export async function notifyNewUserPending(
  village_key: string,
  userType: 'resident' | 'guard',
  userName: string,
  exclude_admin_id?: string
) {
  const type = userType === 'resident' ? 'resident_pending' : 'guard_pending';
  const title = `ผู้ใช้ใหม่รออนุมัติ`;
  const message = `${userName} (${userType === 'resident' ? 'ลูกบ้าน' : 'ยามรักษาความปลอดภัย'}) สมัครเข้าหมู่บ้าน`;

  return createNotificationForVillageAdmins({
    village_key,
    type,
    category: 'user_approval',
    title,
    message,
    data: { user_type: userType, user_name: userName },
    priority: 'medium',
    exclude_admin_id
  });
}

// House management notifications
export async function notifyHouseUpdated(
  village_key: string,
  houseAddress: string,
  action: 'created' | 'updated' | 'deleted',
  exclude_admin_id?: string
) {
  const title = `ข้อมูลบ้านได้รับการ${action === 'created' ? 'เพิ่ม' : action === 'updated' ? 'แก้ไข' : 'ลบ'}`;
  const message = `บ้าน ${houseAddress} ได้รับการ${action === 'created' ? 'เพิ่ม' : action === 'updated' ? 'แก้ไข' : 'ลบ'}แล้ว`;

  return createNotificationForVillageAdmins({
    village_key,
    type: 'house_updated',
    category: 'house_management',
    title,
    message,
    data: { house_address: houseAddress, action },
    priority: 'low',
    exclude_admin_id
  });
}

// Member management notifications
export async function notifyMemberChange(
  village_key: string,
  memberName: string,
  houseAddress: string,
  action: 'added' | 'removed',
  exclude_admin_id?: string
) {
  const type = action === 'added' ? 'member_added' : 'member_removed';
  const title = `สมาชิก${action === 'added' ? 'ใหม่' : 'ถูก' + action}`;
  const message = `${memberName} ${action === 'added' ? 'ย้ายเข้าบ้าน' : 'ย้ายออกจากบ้าน'} ${houseAddress}`;

  return createNotificationForVillageAdmins({
    village_key,
    type,
    category: 'house_management',
    title,
    message,
    data: { member_name: memberName, house_address: houseAddress, action },
    priority: 'medium',
    exclude_admin_id
  });
}

// Status change notifications
export async function notifyStatusChange(
  village_key: string,
  entityType: 'resident' | 'guard' | 'admin',
  entityName: string,
  oldStatus: string,
  newStatus: string,
  exclude_admin_id?: string
) {
  const title = `สถานะ${entityType === 'resident' ? 'ลูกบ้าน' : entityType === 'guard' ? 'ยามรักษาความปลอดภัย' : 'ผู้ดูแลระบบ'}เปลี่ยนแปลง`;
  const message = `${entityName} เปลี่ยนสถานะจาก ${oldStatus} เป็น ${newStatus}`;

  return createNotificationForVillageAdmins({
    village_key,
    type: 'status_changed',
    category: 'user_approval',
    title,
    message,
    data: { 
      entity_type: entityType, 
      entity_name: entityName, 
      old_status: oldStatus, 
      new_status: newStatus 
    },
    priority: 'medium',
    exclude_admin_id
  });
}

// Visitor management notifications
export async function notifyVisitorPendingTooLong(
  village_key: string,
  visitorName: string,
  houseAddress: string,
  hoursPending: number
) {
  const title = `ผู้เยี่ยมรออนุมัตินานเกินไป`;
  const message = `${visitorName} ที่บ้าน ${houseAddress} รออนุมัติมา ${hoursPending} ชั่วโมงแล้ว`;

  return createNotificationForVillageAdmins({
    village_key,
    type: 'visitor_pending_too_long',
    category: 'visitor_management',
    title,
    message,
    data: { 
      visitor_name: visitorName, 
      house_address: houseAddress, 
      hours_pending: hoursPending 
    },
    priority: 'high'
  });
}

export async function notifyVisitorRejectedReview(
  village_key: string,
  visitorName: string,
  houseAddress: string,
  reason?: string
) {
  const title = `ผู้เยี่ยมถูกปฏิเสธ`;
  const message = `${visitorName} ที่บ้าน ${houseAddress} ถูกปฏิเสธ${reason ? ` เนื่องจาก: ${reason}` : ''}`;

  return createNotificationForVillageAdmins({
    village_key,
    type: 'visitor_rejected_review',
    category: 'visitor_management',
    title,
    message,
    data: { 
      visitor_name: visitorName, 
      house_address: houseAddress, 
      reason 
    },
    priority: 'medium'
  });
}
