/**
 * @file This script seeds the admin_notifications table with comprehensive mock data.
 * It creates realistic notification data for various scenarios including user approvals,
 * house management, and visitor management notifications.
 */

import db from "./drizzle";
import { admin_notifications, admins, villages } from "./schema";
import { eq } from "drizzle-orm";

/**
 * An array of mock notification data for admin notifications.
 * @type {Array<Object>}
 */
const notificationData = [
  // User Approval Notifications
  {
    type: "resident_pending",
    category: "user_approval",
    title: "ผู้อยู่อาศัยใหม่รอการอนุมัติ",
    message: "มีผู้อยู่อาศัยใหม่ 3 คน รอการอนุมัติเข้าอยู่ในหมู่บ้าน",
    priority: "high",
    is_read: false,
    data: JSON.stringify({
      pending_count: 3,
      residents: ["สมชาย ผาสุก", "สมหญิง ผาสุก", "อริสา รัตนา"]
    })
  },
  {
    type: "guard_pending", 
    category: "user_approval",
    title: "ยามรักษาความปลอดภัยรอการอนุมัติ",
    message: "มียามรักษาความปลอดภัยใหม่ 2 คน รอการอนุมัติเข้าทำงาน",
    priority: "medium",
    is_read: false,
    data: JSON.stringify({
      pending_count: 2,
      guards: ["ประสิทธิ์ ผาสุก", "กนกวรรณ รัตนา"]
    })
  },
  {
    type: "admin_pending",
    category: "user_approval", 
    title: "ผู้ดูแลระบบรอการอนุมัติ",
    message: "มีผู้ดูแลระบบใหม่ 1 คน รอการอนุมัติเข้าทำงาน",
    priority: "urgent",
    is_read: false,
    data: JSON.stringify({
      pending_count: 1,
      admins: ["admin_bang"]
    })
  },

  // House Management Notifications
  {
    type: "house_updated",
    category: "house_management",
    title: "ข้อมูลบ้านได้รับการอัปเดต",
    message: "บ้านเลขที่ 123/45 ได้รับการอัปเดตสถานะเป็น 'occupied'",
    priority: "low",
    is_read: true,
    data: JSON.stringify({
      house_address: "123/45",
      old_status: "available",
      new_status: "occupied",
      updated_by: "admin_pha"
    })
  },
  {
    type: "member_added",
    category: "house_management",
    title: "สมาชิกใหม่เข้าอยู่ในบ้าน",
    message: "บ้านเลขที่ 67/89 มีสมาชิกใหม่เข้าอยู่: สมชาย ผาสุก",
    priority: "medium",
    is_read: false,
    data: JSON.stringify({
      house_address: "67/89",
      new_member: "สมชาย ผาสุก",
      move_in_date: "2024-01-15"
    })
  },
  {
    type: "member_removed",
    category: "house_management",
    title: "สมาชิกย้ายออกจากบ้าน",
    message: "บ้านเลขที่ 12/34 สมาชิก สมหญิง ผาสุก ย้ายออกแล้ว",
    priority: "medium",
    is_read: false,
    data: JSON.stringify({
      house_address: "12/34",
      removed_member: "สมหญิง ผาสุก",
      move_out_date: "2024-02-01"
    })
  },
  {
    type: "status_changed",
    category: "house_management",
    title: "สถานะบ้านเปลี่ยนแปลง",
    message: "บ้านเลขที่ 456/78 เปลี่ยนสถานะจาก 'available' เป็น 'disable'",
    priority: "high",
    is_read: false,
    data: JSON.stringify({
      house_address: "456/78",
      old_status: "available",
      new_status: "disable",
      reason: "การบำรุงรักษา"
    })
  },

  // Visitor Management Notifications
  {
    type: "visitor_pending_too_long",
    category: "visitor_management",
    title: "ผู้เยี่ยมรอการอนุมัตินานเกินไป",
    message: "มีผู้เยี่ยม 5 คน รอการอนุมัติมากกว่า 2 ชั่วโมงแล้ว",
    priority: "urgent",
    is_read: false,
    data: JSON.stringify({
      pending_visitors: 5,
      longest_wait_time: "3 ชั่วโมง 45 นาที",
      visitors: [
        { name: "นาย ก", purpose: "เยี่ยมญาติ", wait_time: "3:45" },
        { name: "นาง ข", purpose: "ส่งของ", wait_time: "2:30" },
        { name: "นาย ค", purpose: "ซ่อมแซม", wait_time: "2:15" }
      ]
    })
  },
  {
    type: "visitor_rejected_review",
    category: "visitor_management",
    title: "ผู้เยี่ยมถูกปฏิเสธ - ต้องการการตรวจสอบ",
    message: "มีผู้เยี่ยม 2 คน ถูกปฏิเสธและต้องการการตรวจสอบเพิ่มเติม",
    priority: "high",
    is_read: false,
    data: JSON.stringify({
      rejected_count: 2,
      reason: "เอกสารไม่ครบถ้วน",
      visitors: [
        { name: "นาย ง", id_card: "1234567890123", reason: "บัตรประชาชนไม่ชัด" },
        { name: "นาง จ", id_card: "9876543210987", reason: "ไม่มีใบอนุญาตเข้าพื้นที่" }
      ]
    })
  },

  // Additional realistic notifications
  {
    type: "resident_pending",
    category: "user_approval",
    title: "ผู้อยู่อาศัยใหม่รอการอนุมัติ",
    message: "มีผู้อยู่อาศัยใหม่ 1 คน รอการอนุมัติเข้าอยู่ในหมู่บ้าน",
    priority: "medium",
    is_read: true,
    data: JSON.stringify({
      pending_count: 1,
      residents: ["ณัฐพงศ์ ศรีสุข"]
    })
  },
  {
    type: "house_updated",
    category: "house_management",
    title: "ข้อมูลบ้านได้รับการอัปเดต",
    message: "บ้านเลขที่ 789/01 ได้รับการอัปเดตสถานะเป็น 'available'",
    priority: "low",
    is_read: true,
    data: JSON.stringify({
      house_address: "789/01",
      old_status: "occupied",
      new_status: "available",
      updated_by: "admin_rom"
    })
  },
  {
    type: "visitor_pending_too_long",
    category: "visitor_management",
    title: "ผู้เยี่ยมรอการอนุมัตินานเกินไป",
    message: "มีผู้เยี่ยม 3 คน รอการอนุมัติมากกว่า 1 ชั่วโมงแล้ว",
    priority: "medium",
    is_read: false,
    data: JSON.stringify({
      pending_visitors: 3,
      longest_wait_time: "1 ชั่วโมง 30 นาที",
      visitors: [
        { name: "นาย ฉ", purpose: "ประชุม", wait_time: "1:30" },
        { name: "นาง ช", purpose: "ส่งเอกสาร", wait_time: "1:15" },
        { name: "นาย ซ", purpose: "ตรวจสอบ", wait_time: "1:00" }
      ]
    })
  },
  {
    type: "guard_pending",
    category: "user_approval",
    title: "ยามรักษาความปลอดภัยรอการอนุมัติ",
    message: "มียามรักษาความปลอดภัยใหม่ 1 คน รอการอนุมัติเข้าทำงาน",
    priority: "medium",
    is_read: false,
    data: JSON.stringify({
      pending_count: 1,
      guards: ["สันติ ทองหล่อ"]
    })
  },
  {
    type: "member_added",
    category: "house_management",
    title: "สมาชิกใหม่เข้าอยู่ในบ้าน",
    message: "บ้านเลขที่ 234/56 มีสมาชิกใหม่เข้าอยู่: พิมพ์ชนก ศรีสุข",
    priority: "low",
    is_read: true,
    data: JSON.stringify({
      house_address: "234/56",
      new_member: "พิมพ์ชนก ศรีสุข",
      move_in_date: "2024-02-05"
    })
  },
  {
    type: "visitor_rejected_review",
    category: "visitor_management",
    title: "ผู้เยี่ยมถูกปฏิเสธ - ต้องการการตรวจสอบ",
    message: "มีผู้เยี่ยม 1 คน ถูกปฏิเสธและต้องการการตรวจสอบเพิ่มเติม",
    priority: "medium",
    is_read: false,
    data: JSON.stringify({
      rejected_count: 1,
      reason: "ไม่ได้รับอนุญาตจากเจ้าของบ้าน",
      visitors: [
        { name: "นาย ฌ", id_card: "1111111111111", reason: "เจ้าของบ้านไม่อยู่" }
      ]
    })
  },
  {
    type: "status_changed",
    category: "house_management",
    title: "สถานะบ้านเปลี่ยนแปลง",
    message: "บ้านเลขที่ 345/67 เปลี่ยนสถานะจาก 'disable' เป็น 'available'",
    priority: "medium",
    is_read: false,
    data: JSON.stringify({
      house_address: "345/67",
      old_status: "disable",
      new_status: "available",
      reason: "การบำรุงรักษาเสร็จสิ้น"
    })
  },
  {
    type: "resident_pending",
    category: "user_approval",
    title: "ผู้อยู่อาศัยใหม่รอการอนุมัติ",
    message: "มีผู้อยู่อาศัยใหม่ 2 คน รอการอนุมัติเข้าอยู่ในหมู่บ้าน",
    priority: "high",
    is_read: false,
    data: JSON.stringify({
      pending_count: 2,
      residents: ["สุรศักดิ์ ธนารมย์", "กนกวรรณ ธนารมย์"]
    })
  },
  {
    type: "visitor_pending_too_long",
    category: "visitor_management",
    title: "ผู้เยี่ยมรอการอนุมัตินานเกินไป",
    message: "มีผู้เยี่ยม 4 คน รอการอนุมัติมากกว่า 2 ชั่วโมงแล้ว",
    priority: "urgent",
    is_read: false,
    data: JSON.stringify({
      pending_visitors: 4,
      longest_wait_time: "2 ชั่วโมง 15 นาที",
      visitors: [
        { name: "นาย ญ", purpose: "ติดตั้งอุปกรณ์", wait_time: "2:15" },
        { name: "นาง ฎ", purpose: "ตรวจสอบระบบ", wait_time: "2:10" },
        { name: "นาย ฏ", purpose: "เยี่ยมเพื่อน", wait_time: "2:05" },
        { name: "นาง ฐ", purpose: "ธุรกิจ", wait_time: "2:00" }
      ]
    })
  },
  {
    type: "member_removed",
    category: "house_management",
    title: "สมาชิกย้ายออกจากบ้าน",
    message: "บ้านเลขที่ 567/89 สมาชิก จิรวัฒน์ สวนสวรรค์ ย้ายออกแล้ว",
    priority: "low",
    is_read: true,
    data: JSON.stringify({
      house_address: "567/89",
      removed_member: "จิรวัฒน์ สวนสวรรค์",
      move_out_date: "2024-02-15"
    })
  }
];

/**
 * Clears all data from the admin_notifications table.
 * @returns {Promise<void>} A promise that resolves when the table has been cleared.
 */
export async function clearNotifications() {
  console.log("Clearing admin_notifications table");
  const existingNotifications = await db
    .select()
    .from(admin_notifications)
    .limit(1);
  if (existingNotifications.length > 0) {
    await db.delete(admin_notifications);
    console.log("Cleared admin_notifications table");
  } else {
    console.log("admin_notifications table is already empty");
  }
}

/**
 * Creates notification data with proper admin_id and village_key references.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of notification data objects.
 */
async function createNotificationData() {
  console.log("Creating notification data...");

  // Fetch all admins and villages from database
  const allAdmins = await db.select().from(admins);
  const allVillages = await db.select().from(villages);

  if (allAdmins.length === 0) {
    console.log("No admins found. Please seed admins first.");
    return [];
  }

  if (allVillages.length === 0) {
    console.log("No villages found. Please seed villages first.");
    return [];
  }

  const notificationDataWithReferences: Array<{
    admin_id: string;
    village_key: string;
    type: string;
    category: string;
    title: string;
    message: string;
    data?: string;
    is_read: boolean;
    priority: string;
    created_at?: Date;
    read_at?: Date;
  }> = [];

  // Generate timestamps for notifications (spread across the last 30 days)
  function generateRandomTimestamp(): Date {
    const now = new Date();
    const randomDaysAgo = Math.floor(Math.random() * 30); // Last 30 days
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);

    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - randomDaysAgo);
    timestamp.setHours(randomHours, randomMinutes, 0, 0);

    return timestamp;
  }

  // Create notifications for each admin
  for (const admin of allAdmins) {
    // Find villages that this admin manages
    const adminVillages = allVillages.filter(
      (village) => village.village_key === admin.village_key
    );

    if (adminVillages.length === 0) {
      console.log(`No villages found for admin: ${admin.username}`);
      continue;
    }

    // Create 3-8 notifications per admin
    const numNotifications = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < numNotifications; i++) {
      const randomNotification = notificationData[
        Math.floor(Math.random() * notificationData.length)
      ];
      
      const createdTime = generateRandomTimestamp();
      const isRead = Math.random() < 0.6; // 60% chance of being read
      const readTime = isRead ? new Date(createdTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined;

      notificationDataWithReferences.push({
        admin_id: admin.admin_id,
        village_key: admin.village_key!,
        type: randomNotification.type,
        category: randomNotification.category,
        title: randomNotification.title,
        message: randomNotification.message,
        data: randomNotification.data,
        is_read: isRead,
        priority: randomNotification.priority,
        created_at: createdTime,
        read_at: readTime,
      });
    }
  }

  console.log(`Created ${notificationDataWithReferences.length} notification records`);
  return notificationDataWithReferences;
}

/**
 * Main function to seed the admin_notifications table.
 * @returns {Promise<void>} A promise that resolves when seeding is complete.
 */
export async function seedNotifications() {
  console.log("Starting notification seeding...");
  
  await clearNotifications();
  
  const notificationDataWithReferences = await createNotificationData();
  
  if (notificationDataWithReferences.length > 0) {
    await db.insert(admin_notifications).values(notificationDataWithReferences);
    console.log("Completed inserting admin_notifications");
  } else {
    console.log("No notification data to insert");
  }
  
  console.log("Notification seeding completed successfully!");
}

// Execute the seeding process if this file is run directly
if (require.main === module) {
  seedNotifications()
    .then(() => {
      console.log("Notification seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Notification seeding failed:", error);
      process.exit(1);
    });
}
