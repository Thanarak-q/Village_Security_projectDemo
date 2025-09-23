/**
 * @file This script seeds the database with a comprehensive set of mock data.
 * It is designed to be run to populate a fresh database for development or testing purposes.
 * The script clears existing data and then inserts new records for villages, houses,
 * users (residents, guards, admins), and their relationships, ensuring a realistic
 * and varied dataset.
 */

import db from "./drizzle";
import {
  villages,
  houses,
  residents,
  guards,
  admins,
  admin_villages,
  house_members,
  visitor_records,
  admin_activity_logs,
  admin_notifications,
} from "./schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "../utils/passwordUtils";

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
    is_read: false,
    data: {
      pending_count: 3,
      residents: [
        { id: "res_1", name: "สมชาย ผาสุก" },
        { id: "res_2", name: "สมหญิง ผาสุก" },
        { id: "res_3", name: "อีกคนหนึ่ง" },
      ],
    },
  },
  {
    type: "guard_pending",
    category: "user_approval",
    title: "ยามรักษาความปลอดภัยรอการอนุมัติ",
    message: "มียามรักษาความปลอดภัยใหม่ 2 คน รอการอนุมัติเข้าทำงาน",
    is_read: false,
    data: { pending_count: 2 },
  },
  {
    type: "admin_pending",
    category: "user_approval",
    title: "ผู้ดูแลระบบรอการอนุมัติ",
    message: "มีผู้ดูแลระบบใหม่ 1 คน รอการอนุมัติเข้าทำงาน",
    is_read: false,
    data: { pending_count: 1 },
  },
  // House Management Notifications
  {
    type: "house_updated",
    category: "house_management",
    title: "ข้อมูลบ้านได้รับการอัปเดต",
    message: "บ้านเลขที่ 123/45 ได้รับการอัปเดตสถานะเป็น 'occupied'",
    is_read: true,
    data: { house_id: "house_12345", new_status: "occupied" },
  },
  {
    type: "member_added",
    category: "house_management",
    title: "สมาชิกใหม่เข้าอยู่ในบ้าน",
    message: "บ้านเลขที่ 67/89 มีสมาชิกใหม่เข้าอยู่: สมชาย ผาสุก",
    is_read: false,
    data: { house_id: "house_6789", member_name: "สมชาย ผาสุก" },
  },
  {
    type: "member_removed",
    category: "house_management",
    title: "สมาชิกย้ายออกจากบ้าน",
    message: "บ้านเลขที่ 12/34 สมาชิก สมหญิง ผาสุก ย้ายออกแล้ว",
    is_read: false,
    data: { house_id: "house_1234", member_name: "สมหญิง ผาสุก" },
  },
  {
    type: "status_changed",
    category: "house_management",
    title: "สถานะบ้านเปลี่ยนแปลง",
    message: "บ้านเลขที่ 456/78 เปลี่ยนสถานะจาก 'available' เป็น 'disable'",
    is_read: false,
    data: { house_id: "house_45678", from: "available", to: "disable" },
  },
  // Visitor Management Notifications
  {
    type: "visitor_pending_too_long",
    category: "visitor_management",
    title: "ผู้เยี่ยมรอการอนุมัตินานเกินไป",
    message: "มีผู้เยี่ยม 5 คน รอการอนุมัติมากกว่า 2 ชั่วโมงแล้ว",
    is_read: false,
    data: { pending_count: 5, wait_time: "> 2 hours" },
  },
  {
    type: "visitor_rejected_review",
    category: "visitor_management",
    title: "ผู้เยี่ยมถูกปฏิเสธ - ต้องการการตรวจสอบ",
    message: "มีผู้เยี่ยม 2 คน ถูกปฏิเสธและต้องการการตรวจสอบเพิ่มเติม",
    is_read: false,
    data: { rejected_count: 2 },
  },
];

/**
 * An array of mock data for villages.
 * @type {Array<Object>}
 */
const villageData = [
  {
    village_name: "หมู่บ้านผาสุก",
    village_key: "pha-suk-village-001",
  },
  {
    village_name: "หมู่บ้านสุขสันต์",
    village_key: "suk-san-village-002",
  },
  {
    village_name: "หมู่บ้านร่มเย็น",
    village_key: "rom-yen-village-003",
  },
  {
    village_name: "หมู่บ้านสวนทอง",
    village_key: "suan-thong-village-004",
  },
  {
    village_name: "หมู่บ้านลุมพินี",
    village_key: "lumphini-village-005",
  },
  {
    village_name: "หมู่บ้านรัตนา",
    village_key: "rattana-village-006",
  },
  {
    village_name: "หมู่บ้านศรีสุข",
    village_key: "sri-suk-village-007",
  },
  {
    village_name: "หมู่บ้านธนารมย์",
    village_key: "thanarom-village-008",
  },
  {
    village_name: "หมู่บ้านสวนสวรรค์",
    village_key: "suan-sawan-village-009",
  },
  {
    village_name: "หมู่บ้านสุขุมวิท",
    village_key: "sukhumvit-village-010",
  },
  {
    village_name: "หมู่บ้านรัชดา",
    village_key: "ratchada-village-011",
  },
  {
    village_name: "หมู่บ้านลาดพร้าว",
    village_key: "ladprao-village-012",
  },
  {
    village_name: "หมู่บ้านบางนา",
    village_key: "bangna-village-013",
  },
  {
    village_name: "หมู่บ้านอโศก",
    village_key: "asoke-village-014",
  },
  {
    village_name: "หมู่บ้านทองหล่อ",
    village_key: "thonglor-village-015",
  },
];

/**
 * An array of mock data for houses, associated with villages by `village_key`.
 * @type {Array<Object>}
 */
const houseData = [
  // หมู่บ้านผาสุก
  {
    address: "123/45",
    village_key: "pha-suk-village-001",
    status: "available",
  },
  {
    address: "67/89",
    village_key: "pha-suk-village-001",
    status: "available",
  },
  {
    address: "12/34",
    village_key: "pha-suk-village-001",
    status: "available",
  },

  // หมู่บ้านสุขสันต์
  {
    address: "456/78",
    village_key: "suk-san-village-002",
    status: "available",
  },
  {
    address: "90/12",
    village_key: "suk-san-village-002",
    status: "available",
  },

  // หมู่บ้านร่มเย็น
  {
    address: "789/01",
    village_key: "rom-yen-village-003",
    status: "available",
  },
  {
    address: "23/45",
    village_key: "rom-yen-village-003",
    status: "available",
  },
  {
    address: "67/89",
    village_key: "rom-yen-village-003",
    status: "available",
  },

  // หมู่บ้านสวนทอง
  {
    address: "234/56",
    village_key: "suan-thong-village-004",
    status: "available",
  },
  {
    address: "78/90",
    village_key: "suan-thong-village-004",
    status: "available",
  },

  // หมู่บ้านลุมพินี
  {
    address: "345/67",
    village_key: "lumphini-village-005",
    status: "available",
  },
  {
    address: "89/01",
    village_key: "lumphini-village-005",
    status: "available",
  },
  {
    address: "12/34",
    village_key: "lumphini-village-005",
    status: "available",
  },

  // หมู่บ้านรัตนา
  {
    address: "456/78",
    village_key: "rattana-village-006",
    status: "available",
  },
  {
    address: "90/12",
    village_key: "rattana-village-006",
    status: "available",
  },

  // หมู่บ้านศรีสุข
  {
    address: "567/89",
    village_key: "sri-suk-village-007",
    status: "available",
  },
  {
    address: "01/23",
    village_key: "sri-suk-village-007",
    status: "available",
  },
  {
    address: "45/67",
    village_key: "sri-suk-village-007",
    status: "available",
  },

  // หมู่บ้านธนารมย์
  {
    address: "678/90",
    village_key: "thanarom-village-008",
    status: "available",
  },
  {
    address: "12/34",
    village_key: "thanarom-village-008",
    status: "available",
  },

  // หมู่บ้านสวนสวรรค์
  {
    address: "789/01",
    village_key: "suan-sawan-village-009",
    status: "available",
  },
  {
    address: "23/45",
    village_key: "suan-sawan-village-009",
    status: "available",
  },
  {
    address: "67/89",
    village_key: "suan-sawan-village-009",
    status: "available",
  },

  // หมู่บ้านสุขุมวิท
  {
    address: "890/12",
    village_key: "sukhumvit-village-010",
    status: "available",
  },
  {
    address: "34/56",
    village_key: "sukhumvit-village-010",
    status: "available",
  },

  // หมู่บ้านรัชดา
  {
    address: "901/23",
    village_key: "ratchada-village-011",
    status: "available",
  },
  {
    address: "45/67",
    village_key: "ratchada-village-011",
    status: "available",
  },
  {
    address: "89/01",
    village_key: "ratchada-village-011",
    status: "available",
  },

  // หมู่บ้านลาดพร้าว
  {
    address: "012/34",
    village_key: "ladprao-village-012",
    status: "available",
  },
  {
    address: "56/78",
    village_key: "ladprao-village-012",
    status: "available",
  },

  // หมู่บ้านบางนา
  {
    address: "123/45",
    village_key: "bangna-village-013",
    status: "available",
  },
  {
    address: "67/89",
    village_key: "bangna-village-013",
    status: "available",
  },
  {
    address: "01/23",
    village_key: "bangna-village-013",
    status: "available",
  },

  // หมู่บ้านอโศก
  {
    address: "234/56",
    village_key: "asoke-village-014",
    status: "available",
  },
  {
    address: "78/90",
    village_key: "asoke-village-014",
    status: "available",
  },

  // หมู่บ้านทองหล่อ
  {
    address: "345/67",
    village_key: "thonglor-village-015",
    status: "available",
  },
  {
    address: "89/01",
    village_key: "thonglor-village-015",
    status: "available",
  },
  {
    address: "12/34",
    village_key: "thonglor-village-015",
    status: "available",
  },
];

/**
 * An array of mock data for residents. Passwords are provided in plain text
 * and will be hashed before insertion.
 * @type {Array<Object>}
 */
const residentData = [
  // หมู่บ้านผาสุก
  {
    email: "somchai.pha@email.com",
    fname: "สมชาย",
    lname: "ผาสุก",
    phone: "0812345678",
    village_key: "pha-suk-village-001",
    status: "verified",
    line_user_id: "Ue529194c37fd43a24cf96d8648299d90",
    line_display_name: "สมชาย ผาสุก",
    line_profile_url: "https://profile.line-scdn.net/0h/somchai_pha",
    move_in_date: "2024-01-15",
  },
  {
    email: "somying.pha@email.com",
    fname: "สมหญิง",
    lname: "ผาสุก",
    phone: "0812345678",
    village_key: "pha-suk-village-001",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-02-01",
  },
  // หมู่บ้านรัตนา
  {
    email: "arisa.rat@email.com",
    fname: "อริสา",
    lname: "รัตนา",
    phone: "0823456789",
    village_key: "rattana-village-006",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-01-20",
  },

  // หมู่บ้านศรีสุข
  {
    email: "nattapong.sri@email.com",
    fname: "ณัฐพงศ์",
    lname: "ศรีสุข",
    phone: "0845678901",
    village_key: "sri-suk-village-007",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-01-25",
  },
  {
    email: "pimchanok.sri@email.com",
    fname: "พิมพ์ชนก",
    lname: "ศรีสุข",
    phone: "0856789012",
    village_key: "sri-suk-village-007",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-02-05",
  },

  // หมู่บ้านธนารมย์
  {
    email: "surasak.thana@email.com",
    fname: "สุรศักดิ์",
    lname: "ธนารมย์",
    phone: "0867890123",
    village_key: "thanarom-village-008",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-01-30",
  },
  {
    email: "kanokwan.thana@email.com",
    fname: "กนกวรรณ",
    lname: "ธนารมย์",
    phone: "0878901234",
    village_key: "thanarom-village-008",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-02-10",
  },

  // หมู่บ้านสวนสวรรค์
  {
    email: "jirawat.suan@email.com",
    fname: "จิรวัฒน์",
    lname: "สวนสวรรค์",
    phone: "0889012345",
    village_key: "suan-sawan-village-009",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-02-15",
  },
  {
    email: "supaporn.suan@email.com",
    fname: "สุภาภรณ์",
    lname: "สวนสวรรค์",
    phone: "0890123456",
    village_key: "suan-sawan-village-009",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-02-20",
  },

  // หมู่บ้านสุขุมวิท
  {
    email: "anucha.suk@email.com",
    fname: "อนุชา",
    lname: "สุขุมวิท",
    phone: "0801234567",
    village_key: "sukhumvit-village-010",
    status: "pending",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-02-25",
  },
  {
    email: "benjawan.suk@email.com",
    fname: "เบญจวรรณ",
    lname: "สุขุมวิท",
    phone: "0812345679",
    village_key: "sukhumvit-village-010",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-03-01",
  },

  // หมู่บ้านรัชดา
  {
    email: "prasert.ratc@email.com",
    fname: "ประเสริฐ",
    lname: "รัชดา",
    phone: "0823456790",
    village_key: "ratchada-village-011",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-03-05",
  },
  {
    email: "sirilak.ratc@email.com",
    fname: "ศิริลักษณ์",
    lname: "รัชดา",
    phone: "0834567901",
    village_key: "ratchada-village-011",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-03-10",
  },

  // หมู่บ้านลาดพร้าว
  {
    email: "pongsak.lad@email.com",
    fname: "พงศักดิ์",
    lname: "ลาดพร้าว",
    phone: "0845679012",
    village_key: "ladprao-village-012",
    status: "pending",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-03-15",
  },

  // หมู่บ้านบางนา
  {
    email: "nattaya.bang@email.com",
    fname: "ณัฐยา",
    lname: "บางนา",
    phone: "0856790123",
    village_key: "bangna-village-013",
    status: "pending",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-03-20",
  },

  // หมู่บ้านทองหล่อ
  {
    email: "wirote.thong@email.com",
    fname: "วิโรจน์",
    lname: "ทองหล่อ",
    phone: "0867901234",
    village_key: "thonglor-village-015",
    status: "pending",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    move_in_date: "2024-03-25",
  },
];

/**
 * An array of mock data for security guards.
 * @type {Array<Object>}
 */
const guardData = [
  // หมู่บ้านผาสุก
  {
    email: "prasit.pha@email.com",
    fname: "ประสิทธิ์",
    lname: "ผาสุก",
    phone: "0891234567",
    village_key: "pha-suk-village-001",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    hired_date: "2024-01-01",
  },
  // หมู่บ้านรัตนา
  {
    email: "kanokwan.rat@email.com",
    fname: "กนกวรรณ",
    lname: "รัตนา",
    phone: "0892345678",
    village_key: "rattana-village-006",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    hired_date: "2024-01-15",
  },
  // หมู่บ้านทองหล่อ
  {
    email: "santi.thong@email.com",
    fname: "สันติ",
    lname: "ทองหล่อ",
    phone: "0893456789",
    village_key: "thonglor-village-015",
    status: "verified",
    line_user_id: null,
    line_display_name: null,
    line_profile_url: null,
    hired_date: "2024-02-01",
  },
];

/**
 * An array of mock data for administrators.
 * @type {Array<Object>}
 */
const adminData = [
  // Super Admin
  {
    email: "superadmin@email.com",
    username: "superadmin",
    password_hash: "password123",
    phone: "0890000000",
    status: "verified",
    role: "superadmin",
  },
  // หมู่บ้านผาสุก
  {
    email: "admin.pha@email.com",
    username: "admin_pha",
    password_hash: "password123",
    phone: "0891234567",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านสุขสันต์
  {
    email: "admin.suk@email.com",
    username: "admin_suk",
    password_hash: "password123",
    phone: "0891234568",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านร่มเย็น
  {
    email: "admin.rom@email.com",
    username: "admin_rom",
    password_hash: "password123",
    phone: "0891234569",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านสวนทอง
  {
    email: "admin.suan@email.com",
    username: "admin_suan",
    password_hash: "password123",
    phone: "0891234570",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านลุมพินี
  {
    email: "admin.lum@email.com",
    username: "admin_lum",
    password_hash: "password123",
    phone: "0891234571",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านรัตนา
  {
    email: "admin.rat@email.com",
    username: "admin_rat",
    password_hash: "password123",
    phone: "0891234572",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านศรีสุข
  {
    email: "admin.sri@email.com",
    username: "admin_sri",
    password_hash: "password123",
    phone: "0891234573",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านธนารมย์
  {
    email: "admin.thana@email.com",
    username: "admin_thana",
    password_hash: "password123",
    phone: "0891234574",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านสวนสวรรค์
  {
    email: "admin.sawan@email.com",
    username: "admin_sawan",
    password_hash: "password123",
    phone: "0891234575",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านสุขุมวิท
  {
    email: "admin.sukhumvit@email.com",
    username: "admin_sukhumvit",
    password_hash: "password123",
    phone: "0891234576",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านรัชดา
  {
    email: "admin.ratchada@email.com",
    username: "admin_ratchada",
    password_hash: "password123",
    phone: "0891234577",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านลาดพร้าว
  {
    email: "admin.lad@email.com",
    username: "admin_lad",
    password_hash: "password123",
    phone: "0891234578",
    status: "verified",
    role: "admin",
  },
  // หมู่บ้านบางนา
  {
    email: "admin.bang@email.com",
    username: "admin_bang",
    password_hash: "password123",
    phone: "0891234579",
    status: "pending",
    role: "admin",
  },
  // หมู่บ้านอโศก
  {
    email: "admin.asoke@email.com",
    username: "admin_asoke",
    password_hash: "password123",
    phone: "0891234580",
    status: "pending",
    role: "admin",
  },
  // หมู่บ้านทองหล่อ
  {
    email: "admin.thong@email.com",
    username: "admin_thong",
    password_hash: "password123",
    phone: "0891234581",
    status: "pending",
    role: "admin",
  },
];

/**
 * Creates admin_villages data based on the original admin-village relationships
 * @returns {Promise<Array>} Array of admin_villages data
 */
async function createAdminVillagesData() {
  const adminVillagesData = [];
  
  // Mapping of admin usernames to their original village_keys
  const adminVillageMapping = [
    { username: "admin_pha", village_key: "pha-suk-village-001" },
    { username: "admin_suk", village_key: "suk-san-village-002" },
    { username: "admin_rom", village_key: "rom-yen-village-003" },
    { username: "admin_suan", village_key: "suan-thong-village-004" },
    { username: "admin_lum", village_key: "lumphini-village-005" },
    { username: "admin_rat", village_key: "rattana-village-006" },
    { username: "admin_sri", village_key: "sri-suk-village-007" },
    { username: "admin_thana", village_key: "thanarom-village-008" },
    { username: "admin_sawan", village_key: "suan-sawan-village-009" },
    { username: "admin_sukhumvit", village_key: "sukhumvit-village-010" },
    { username: "admin_ratchada", village_key: "ratchada-village-011" },
    { username: "admin_lad", village_key: "ladprao-village-012" },
    { username: "admin_bang", village_key: "bangna-village-013" },
    { username: "admin_asoke", village_key: "asoke-village-014" },
    { username: "admin_thong", village_key: "thonglor-village-015" },
  ];

  // Get all admins from database
  const allAdmins = await db.select().from(admins);
  
  for (const mapping of adminVillageMapping) {
    const admin = allAdmins.find((a: any) => a.username === mapping.username);
    if (admin) {
      adminVillagesData.push({
        admin_id: admin.admin_id,
        village_key: mapping.village_key,
      });
    }
  }

  return adminVillagesData;
}

/**
 * Clears all data from the database tables in the correct order to avoid foreign key constraints.
 * This function is idempotent and checks for the existence of data before attempting to delete.
 * @returns {Promise<void>} A promise that resolves when the database has been cleared.
 */
export async function clearDb() {
  // Check if villages or houses exist before deleting
  console.log("Clearing database");

  // Clear admin_notifications first (has foreign key to admins)
  console.log("Clearing admin_notifications");
  try {
    await db.delete(admin_notifications);
    console.log("Cleared admin_notifications");
  } catch (error) {
    // Table might not exist yet, ignore error
    console.log("admin_notifications table doesn't exist yet, skipping...");
  }

  console.log("Clearing admin_activity_logs");
  try {
    await db.delete(admin_activity_logs);
    console.log("Cleared admin_activity_logs");
  } catch (error) {
    console.log("admin_activity_logs table doesn't exist yet, skipping...");
  }

  console.log("Clearing visitor_records");
  try {
    await db.delete(visitor_records);
    console.log("Cleared visitor_records");
  } catch (error) {
    console.log("visitor_records table doesn't exist yet, skipping...");
  }

  console.log("Clearing house_members");
  try {
    await db.delete(house_members);
    console.log("Cleared house_members");
  } catch (error) {
    console.log("house_members table doesn't exist yet, skipping...");
  }

  console.log("Clearing admin_villages");
  try {
    await db.delete(admin_villages);
    console.log("Cleared admin_villages");
  } catch (error) {
    console.log("admin_villages table doesn't exist yet, skipping...");
  }

  console.log("Clearing admins");
  try {
    await db.delete(admins);
    console.log("Cleared admins");
  } catch (error) {
    console.log("admins table doesn't exist yet, skipping...");
  }

  console.log("Clearing guards");
  try {
    await db.delete(guards);
    console.log("Cleared guards");
  } catch (error) {
    console.log("guards table doesn't exist yet, skipping...");
  }

  console.log("Clearing residents");
  try {
    await db.delete(residents);
    console.log("Cleared residents");
  } catch (error) {
    console.log("residents table doesn't exist yet, skipping...");
  }

  console.log("Clearing houses");
  try {
    await db.delete(houses);
    console.log("Cleared houses");
  } catch (error) {
    console.log("houses table doesn't exist yet, skipping...");
  }

  console.log("Clearing villages");
  try {
    // First try to disable foreign key checks temporarily
    await db.execute(sql`SET session_replication_role = replica`);
    await db.delete(villages);
    await db.execute(sql`SET session_replication_role = DEFAULT`);
    console.log("Cleared villages");
  } catch (error) {
    console.log("Error clearing villages:", error);
    // Try to clear with CASCADE if there are foreign key constraints
    try {
      await db.execute(sql`DELETE FROM villages CASCADE`);
      console.log("Cleared villages with CASCADE");
    } catch (cascadeError) {
      console.log("Could not clear villages:", cascadeError);
      // Last resort: truncate with CASCADE
      try {
        await db.execute(sql`TRUNCATE TABLE villages CASCADE`);
        console.log("Truncated villages with CASCADE");
      } catch (truncateError) {
        console.log("Could not truncate villages:", truncateError);
      }
    }
  }
}

/**
 * Dynamically creates house member relationships by associating residents with houses
 * within the same village using a round-robin distribution.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of house member data objects.
 */
async function createHouseMembersData() {
  console.log("Creating house_members data...");

  // Fetch all houses and residents from database
  const allHouses = await db.select().from(houses);
  const allResidents = await db.select().from(residents);

  const houseMembersData: Array<{ house_id: string; resident_id: string }> = [];

  // Group residents by village
  const residentsByVillage: Record<string, typeof allResidents> = {};
  for (const resident of allResidents) {
    if (resident.village_key && !residentsByVillage[resident.village_key]) {
      residentsByVillage[resident.village_key] = [];
    }
    if (resident.village_key) {
      residentsByVillage[resident.village_key].push(resident);
    }
  }

  // Group houses by village
  const housesByVillage: Record<string, typeof allHouses> = {};
  for (const house of allHouses) {
    if (house.village_key && !housesByVillage[house.village_key]) {
      housesByVillage[house.village_key] = [];
    }
    if (house.village_key) {
      housesByVillage[house.village_key].push(house);
    }
  }

  // Assign residents to houses in their village
  for (const villageKey in residentsByVillage) {
    const villageResidents = residentsByVillage[villageKey];
    const villageHouses = housesByVillage[villageKey] || [];

    if (villageHouses.length === 0) {
      console.log(`No houses found for village: ${villageKey}`);
      continue;
    }

    // Distribute residents across houses in the village
    for (let i = 0; i < villageResidents.length; i++) {
      const resident = villageResidents[i];
      const houseIndex = i % villageHouses.length; // Round-robin distribution
      const assignedHouse = villageHouses[houseIndex];

      houseMembersData.push({
        house_id: assignedHouse.house_id,
        resident_id: resident.resident_id,
      });
    }
  }

  console.log(`Created ${houseMembersData.length} house_members records`);
  return houseMembersData;
}

/**
 * Generates a large and varied set of mock visitor records. This function creates
 * realistic data by randomly assigning visitors to residents, guards, and houses
 * within the same village, and by generating plausible timestamps and other details.
 * It also includes logic to boost data volume for smaller villages to ensure
 * comprehensive test coverage.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of visitor record data objects.
 */
async function createVisitorRecordsData() {
  console.log("Creating visitor_records data...");

  // Fetch all required data from database
  const allResidents = await db.select().from(residents);
  const allGuards = await db.select().from(guards);
  const allHouses = await db.select().from(houses);

  const visitorRecordsData: Array<{
    resident_id: string;
    guard_id: string;
    house_id: string;
    picture_key?: string;
    license_plate?: string;
    record_status: "approved" | "pending" | "rejected";
    visit_purpose?: string;
    entry_time?: Date;
  }> = [];

  // Sample data for non-ID fields
  const samplePictureKeys = [
    "visitor_photo_001.jpg",
    "visitor_photo_002.jpg",
    "visitor_photo_003.jpg",
    "visitor_photo_004.jpg",
    "visitor_photo_005.jpg",
    null,
  ];

  const sampleLicensePlates = [
    "กข-1234",
    "คง-5678",
    "จฉ-9012",
    "ชซ-3456",
    "ญฎ-7890",
    "ฏฐ-1234",
    "ฑฒ-5678",
    "ณด-9012",
    "ตถ-3456",
    "ทธ-7890",
    "นบ-1234",
    "ปผ-5678",
    "ฝพ-9012",
    "ฟภ-3456",
    "มย-7890",
    "รล-1234",
    "วศ-5678",
    "สษ-9012",
    "หส-3456",
    "ฬอ-7890",
    null,
  ];

  const sampleVisitPurposes = [
    "เยี่ยมญาติ",
    "ส่งของ",
    "ซ่อมแซม",
    "ทำความสะอาด",
    "ตรวจสอบ",
    "ประชุม",
    "ติดตั้งอุปกรณ์",
    "ตรวจสอบระบบ",
    "เยี่ยมเพื่อน",
    "ธุรกิจ",
    "ส่งเอกสาร",
    "ตรวจสอบมิเตอร์",
    "ซ่อมแซมไฟฟ้า",
    "ทำสวน",
    "ส่งพัสดุ",
  ];

  const recordStatuses: Array<"approved" | "pending" | "rejected"> = [
    "approved",
    "pending",
    "rejected",
  ];

  // Generate realistic timestamps distributed across different time periods
  function generateRandomTimestamp(): Date {
    const now = new Date();

    // Randomly choose time period: 70% recent (this week), 20% this month, 10% this year
    const periodChoice = Math.random();
    let randomDaysAgo: number;

    if (periodChoice < 0.7) {
      // 70% - This week (0-7 days ago)
      randomDaysAgo = Math.floor(Math.random() * 7);
    } else if (periodChoice < 0.9) {
      // 20% - This month (8-30 days ago)
      randomDaysAgo = Math.floor(Math.random() * 22) + 8;
    } else {
      // 10% - This year (31-365 days ago)
      randomDaysAgo = Math.floor(Math.random() * 334) + 31;
    }

    // Generate random time with more realistic distribution
    let randomHours: number;
    const hourChoice = Math.random();

    if (hourChoice < 0.4) {
      // 40% - Business hours (8:00-18:00)
      randomHours = Math.floor(Math.random() * 10) + 8;
    } else if (hourChoice < 0.7) {
      // 30% - Evening hours (18:00-22:00)
      randomHours = Math.floor(Math.random() * 4) + 18;
    } else if (hourChoice < 0.85) {
      // 15% - Morning hours (6:00-8:00)
      randomHours = Math.floor(Math.random() * 2) + 6;
    } else if (hourChoice < 0.95) {
      // 10% - Late night (22:00-24:00)
      randomHours = Math.floor(Math.random() * 2) + 22;
    } else {
      // 5% - Early morning (0:00-6:00)
      randomHours = Math.floor(Math.random() * 6);
    }

    const randomMinutes = Math.floor(Math.random() * 60);

    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - randomDaysAgo);
    timestamp.setHours(randomHours, randomMinutes, 0, 0);

    return timestamp;
  }

  // Create visitor records for each resident
  for (const resident of allResidents) {
    // Find guards in the same village as the resident
    const guardsInSameVillage = allGuards.filter(
      (guard) => guard.village_key === resident.village_key
    );

    // Find houses in the same village as the resident
    const housesInSameVillage = allHouses.filter(
      (house) => house.village_key === resident.village_key
    );

    if (guardsInSameVillage.length > 0 && housesInSameVillage.length > 0) {
      // Create 8-25 visitor records per resident for massive data variety
      const numRecords = Math.floor(Math.random() * 18) + 8;

      for (let i = 0; i < numRecords; i++) {
        const randomGuard =
          guardsInSameVillage[
            Math.floor(Math.random() * guardsInSameVillage.length)
          ];
        const randomHouse =
          housesInSameVillage[
            Math.floor(Math.random() * housesInSameVillage.length)
          ];
        const randomPictureKey =
          samplePictureKeys[Math.floor(Math.random() * samplePictureKeys.length)];
        const randomLicensePlate =
          sampleLicensePlates[
            Math.floor(Math.random() * sampleLicensePlates.length)
          ];
        const randomVisitPurpose =
          sampleVisitPurposes[
            Math.floor(Math.random() * sampleVisitPurposes.length)
          ];
        const randomStatus =
          recordStatuses[Math.floor(Math.random() * recordStatuses.length)];

        // Generate realistic timestamps
        const entryTime = generateRandomTimestamp();

        // For rejected records, no exit time
        // For pending records, no exit time

        visitorRecordsData.push({
          resident_id: resident.resident_id,
          guard_id: randomGuard.guard_id,
          house_id: randomHouse.house_id,
          picture_key: randomPictureKey || undefined,
          license_plate: randomLicensePlate || undefined,
          record_status: randomStatus,
          visit_purpose: randomVisitPurpose,
          entry_time: entryTime,

        });
      }
    }
  }

  console.log(`Created ${visitorRecordsData.length} visitor_records`);

  // Add additional records for villages with fewer residents to ensure data coverage
  console.log("Adding additional records for data coverage...");

  // Get all villages
  const allVillages = await db.select().from(villages);

  for (const village of allVillages) {
    const villageResidents = allResidents.filter(
      (r) => r.village_key === village.village_key
    );
    const villageGuards = allGuards.filter(
      (g) => g.village_key === village.village_key
    );
    const villageHouses = allHouses.filter(
      (h) => h.village_key === village.village_key
    );

    // If village has very few records, add some more
    const existingRecordsForVillage = visitorRecordsData.filter((record) => {
      const resident = allResidents.find(
        (r) => r.resident_id === record.resident_id
      );
      return resident?.village_key === village.village_key;
    });

    if (
      existingRecordsForVillage.length < 40 &&
      villageResidents.length > 0 &&
      villageGuards.length > 0 &&
      villageHouses.length > 0
    ) {
      // Add 25-50 more records for this village
      const additionalRecords = Math.floor(Math.random() * 26) + 25;

      for (let i = 0; i < additionalRecords; i++) {
        const randomResident =
          villageResidents[Math.floor(Math.random() * villageResidents.length)];
        const randomGuard =
          villageGuards[Math.floor(Math.random() * villageGuards.length)];
        const randomHouse =
          villageHouses[Math.floor(Math.random() * villageHouses.length)];
        const randomPictureKey =
          samplePictureKeys[Math.floor(Math.random() * samplePictureKeys.length)];
        const randomLicensePlate =
          sampleLicensePlates[
            Math.floor(Math.random() * sampleLicensePlates.length)
          ];
        const randomVisitPurpose =
          sampleVisitPurposes[
            Math.floor(Math.random() * sampleVisitPurposes.length)
          ];
        const randomStatus =
          recordStatuses[Math.floor(Math.random() * recordStatuses.length)];

        // Generate realistic timestamps
        const entryTime = generateRandomTimestamp();
        let exitTime: Date | undefined;

        // For approved records, generate exit time (1-8 hours later)
        if (randomStatus === "approved") {
          exitTime = new Date(entryTime);
          exitTime.setHours(
            exitTime.getHours() + Math.floor(Math.random() * 8) + 1
          );
        }

        visitorRecordsData.push({
          resident_id: randomResident.resident_id,
          guard_id: randomGuard.guard_id,
          house_id: randomHouse.house_id,
          picture_key: randomPictureKey || undefined,
          license_plate: randomLicensePlate || undefined,
          record_status: randomStatus,
          visit_purpose: randomVisitPurpose,
          entry_time: entryTime,
        });
      }

      console.log(
        `Added ${additionalRecords} additional records for village: ${village.village_name}`
      );
    }
  }

  console.log(
    `Total visitor records after coverage: ${visitorRecordsData.length}`
  );

  // Add extra records for villages with very few residents to boost data volume
  console.log("Adding extra records for data volume boost...");

  for (const village of allVillages) {
    const villageResidents = allResidents.filter(
      (r) => r.village_key === village.village_key
    );
    const villageGuards = allGuards.filter(
      (g) => g.village_key === village.village_key
    );
    const villageHouses = allHouses.filter(
      (h) => h.village_key === village.village_key
    );

    if (
      villageResidents.length > 0 &&
      villageGuards.length > 0 &&
      villageHouses.length > 0
    ) {
      // Add extra records based on village size
      let extraRecords = 0;

      if (villageResidents.length <= 2) {
        // Small villages: add 60-90 extra records
        extraRecords = Math.floor(Math.random() * 31) + 60;
      } else if (villageResidents.length <= 5) {
        // Medium villages: add 45-75 extra records
        extraRecords = Math.floor(Math.random() * 31) + 45;
      } else {
        // Large villages: add 35-65 extra records
        extraRecords = Math.floor(Math.random() * 31) + 35;
      }

      for (let i = 0; i < extraRecords; i++) {
        const randomResident =
          villageResidents[Math.floor(Math.random() * villageResidents.length)];
        const randomGuard =
          villageGuards[Math.floor(Math.random() * villageGuards.length)];
        const randomHouse =
          villageHouses[Math.floor(Math.random() * villageHouses.length)];
        const randomPictureKey =
          samplePictureKeys[Math.floor(Math.random() * samplePictureKeys.length)];
        const randomLicensePlate =
          sampleLicensePlates[
            Math.floor(Math.random() * sampleLicensePlates.length)
          ];
        const randomVisitPurpose =
          sampleVisitPurposes[
            Math.floor(Math.random() * sampleVisitPurposes.length)
          ];
        const randomStatus =
          recordStatuses[Math.floor(Math.random() * recordStatuses.length)];

        // Generate realistic timestamps
        const entryTime = generateRandomTimestamp();

        visitorRecordsData.push({
          resident_id: randomResident.resident_id,
          guard_id: randomGuard.guard_id,
          house_id: randomHouse.house_id,
          picture_key: randomPictureKey || undefined,
          license_plate: randomLicensePlate || undefined,
          record_status: randomStatus,
          visit_purpose: randomVisitPurpose,
          entry_time: entryTime,
        });
      }

      console.log(
        `Added ${extraRecords} extra records for village: ${village.village_name}`
      );
    }
  }

  console.log(`Final total visitor records: ${visitorRecordsData.length}`);

  // Add final boost records to reach target volume
  console.log("Adding final boost records to reach target volume...");

  // Calculate how many more records we need to reach target
  const targetRecords = 1000; // Target for 1000 records total
  const currentRecords = visitorRecordsData.length;
  const neededRecords = Math.max(0, targetRecords - currentRecords);

  if (neededRecords > 0) {
    console.log(`Adding ${neededRecords} final boost records...`);

    // Add records in batches for better performance
    const batchSize = 100; // Increased batch size for 1000 records
    const batches = Math.ceil(neededRecords / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(
        batchSize,
        neededRecords - batch * batchSize
      );
      console.log(
        `Processing batch ${batch + 1}/${batches} with ${currentBatchSize} records...`
      );

      for (let i = 0; i < currentBatchSize; i++) {
        // Randomly select a village
        const randomVillage =
          allVillages[Math.floor(Math.random() * allVillages.length)];
        const villageResidents = allResidents.filter(
          (r) => r.village_key === randomVillage.village_key
        );
        const villageGuards = allGuards.filter(
          (g) => g.village_key === randomVillage.village_key
        );
        const villageHouses = allHouses.filter(
          (h) => h.village_key === randomVillage.village_key
        );

        if (
          villageResidents.length > 0 &&
          villageGuards.length > 0 &&
          villageHouses.length > 0
        ) {
          const randomResident =
            villageResidents[
              Math.floor(Math.random() * villageResidents.length)
            ];
          const randomGuard =
            villageGuards[Math.floor(Math.random() * villageGuards.length)];
          const randomHouse =
            villageHouses[Math.floor(Math.random() * villageHouses.length)];
          const randomPictureKey =
            samplePictureKeys[
              Math.floor(Math.random() * samplePictureKeys.length)
            ];
          const randomLicensePlate =
            sampleLicensePlates[
              Math.floor(Math.random() * sampleLicensePlates.length)
            ];
          const randomVisitPurpose =
            sampleVisitPurposes[
              Math.floor(Math.random() * sampleVisitPurposes.length)
            ];
          const randomStatus =
            recordStatuses[Math.floor(Math.random() * recordStatuses.length)];
// admin_suk
          // Generate realistic timestamps
          const entryTime = generateRandomTimestamp();

          visitorRecordsData.push({
            resident_id: randomResident.resident_id,
            guard_id: randomGuard.guard_id,
            house_id: randomHouse.house_id,
            picture_key: randomPictureKey || undefined,
            license_plate: randomLicensePlate || undefined,
            record_status: randomStatus,
            visit_purpose: randomVisitPurpose,
            entry_time: entryTime,
          });
        }
      }

      console.log(
        `Batch ${batch + 1} complete. Current total: ${visitorRecordsData.length}`
      );
    }

    console.log(
      `Final boost complete. Total records: ${visitorRecordsData.length}`
    );
  }

  return visitorRecordsData;
}

/**
 * Creates notification data with proper village_key references.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of notification data objects.
 */
async function createNotificationData() {
  console.log("Creating notification data...");

  // Fetch all villages from database
  const allVillages = await db.select().from(villages);

  if (allVillages.length === 0) {
    console.log("No villages found. Please seed villages first.");
    return [];
  }

  const notificationDataWithReferences: Array<{
    village_key: string;
    type: string;
    category: string;
    title: string;
    message: string;
    data?: string;
    created_at?: Date;
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

  // Create notifications for each village
  for (const village of allVillages) {
    // Create 3-8 notifications per village
    const numNotifications = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < numNotifications; i++) {
      const randomNotification = notificationData[
        Math.floor(Math.random() * notificationData.length)
      ];
      
      const createdTime = generateRandomTimestamp();

      notificationDataWithReferences.push({
        village_key: village.village_key,
        type: randomNotification.type,
        category: randomNotification.category,
        title: randomNotification.title,
        message: randomNotification.message,
        data: randomNotification.data,
        created_at: createdTime,
      });
    }
  }

  console.log(`Created ${notificationDataWithReferences.length} notification records`);
  return notificationDataWithReferences;
}

// Function to create admin_activity_logs data by fetching existing data

/**
 * Main function to seed the database. It orchestrates the process of clearing
 * the database and then populating it with data in the correct order.
 * @returns {Promise<void>} A promise that resolves when seeding is complete.
 */
async function seed() {
  await clearDb();
  console.log("Cleared database");
  
  // Check if villages already exist before inserting
  console.log("Checking existing villages...");
  const existingVillages = await db.select().from(villages);
  if (existingVillages.length > 0) {
    console.log(`Found ${existingVillages.length} existing villages. Clearing them...`);
    await db.delete(villages);
    console.log("Cleared existing villages");
  }
  
  console.log("Inserting villages");
  try {
    await db.insert(villages).values(villageData);
    console.log("Completed inserting villages");
  } catch (error) {
    console.log("Error inserting villages:", error);
    // If there are still conflicts, try to insert one by one with conflict handling
    console.log("Attempting to insert villages one by one...");
    for (const village of villageData) {
      try {
        await db.insert(villages).values(village);
        console.log(`Inserted village: ${village.village_name}`);
      } catch (insertError) {
        console.log(`Skipped duplicate village: ${village.village_name} (${village.village_key})`);
      }
    }
    console.log("Completed inserting villages (with conflict handling)");
  }

  console.log("Inserting houses");
  await db.insert(houses).values(houseData as any);
  console.log("Completed inserting houses");

  console.log("Inserting residents");
  await db.insert(residents).values(residentData as any);
  console.log("Completed inserting residents");

  console.log("Inserting guards");
  await db.insert(guards).values(guardData as any);
  console.log("Completed inserting guards");

  console.log("Inserting admins");
  // Hash passwords before inserting admins
  const hashedAdminData = await Promise.all(
    adminData.map(async (admin) => ({
      ...admin,
      password_hash: await hashPassword(admin.password_hash),
    }))
  );
  await db.insert(admins).values(hashedAdminData as any);
  console.log("Completed inserting admins");

  console.log("Creating and inserting admin_villages");
  const adminVillagesData = await createAdminVillagesData();
  if (adminVillagesData.length > 0) {
    await db.insert(admin_villages).values(adminVillagesData);
    console.log("Completed inserting admin_villages");
  } else {
    console.log("No admin_villages data to insert");
  }

  console.log("Creating and inserting house_members");
  const houseMembersData = await createHouseMembersData();
  if (houseMembersData.length > 0) {
    await db.insert(house_members).values(houseMembersData);
    console.log("Completed inserting house_members");
  } else {
    console.log("No house_members data to insert");
  }

  console.log("Creating and inserting visitor_records");
  const visitorRecordsData = await createVisitorRecordsData();
  if (visitorRecordsData.length > 0) {
    await db.insert(visitor_records).values(visitorRecordsData);
    console.log("Completed inserting visitor_records");
  } else {
    console.log("No visitor_records data to insert");
  }

  console.log("Creating and inserting admin_notifications");
  const notificationDataWithReferences = await createNotificationData();
  if (notificationDataWithReferences.length > 0) {
    await db.insert(admin_notifications).values(notificationDataWithReferences);
    console.log("Completed inserting admin_notifications");
  } else {
    console.log("No notification data to insert");
  }
}

// Execute the seeding process only when this file is run directly
if (require.main === module) {
  seed().then(() => {
    console.log("Database seeding completed successfully!");
    process.exit(0);
  }).catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}
