/**
 * @file This file defines the database schema for the application using Drizzle ORM.
 * It includes table definitions for all core entities, such as villages, houses, users (residents, guards, admins),
 * and their relationships. It also exports TypeScript types inferred from the schema
 * for type-safe database operations.
 */

import { unique } from "drizzle-orm/gel-core";
import { pgTable, text, timestamp, uuid, date, index } from "drizzle-orm/pg-core";
import { status } from "elysia";

/**
 * Schema for the `villages` table. Represents a distinct village or community.
 */
export const villages = pgTable("villages", {
  village_id: uuid("village_id").primaryKey().defaultRandom(),
  village_name: text("village_name").notNull(),
  village_key: text("village_key").notNull().unique(),
});
/**
 * Represents a selectable village record from the database.
 * @type {typeof villages.$inferSelect}
 */
export type Village = typeof villages.$inferSelect;
/**
 * Represents a new village record to be inserted into the database.
 * @type {typeof villages.$inferInsert}
 */
export type VillageInsert = typeof villages.$inferInsert;

/**
 * Schema for the `houses` table. Represents a physical house within a village.
 */
export const houses = pgTable("houses", {
  house_id: uuid("house_id").primaryKey().defaultRandom(),
  address: text("address").notNull(),
  status: text("status")
    .$type<"available" | "occupied" | "disable">()
    .default("available"),
  village_key: text("village_key").references(() => villages.village_key),
}, (table) => ({
  // Indexes for houses table
  villageKeyIdx: index("idx_houses_village_key").on(table.village_key),
}));
/**
 * Represents a selectable house record.
 * @type {typeof houses.$inferSelect}
 */
export type House = typeof houses.$inferSelect;
/**
 * Represents a new house record for insertion.
 * @type {typeof houses.$inferInsert}
 */
export type HouseInsert = typeof houses.$inferInsert;

/**
 * Schema for the `residents` table. Represents an individual who resides in a house.
 */
export const residents = pgTable("residents", {
  resident_id: uuid("resident_id").primaryKey().defaultRandom(),
  line_user_id: text("line_user_id").unique(),
  line_display_name: text("line_display_name"),
  line_profile_url: text("line_profile_url"),
  email: text("email").notNull().unique(),
  fname: text("fname").notNull(),
  lname: text("lname").notNull(),
  phone: text("phone").notNull(),
  village_key: text("village_key").references(() => villages.village_key),
  status: text("status")
    .$type<"verified" | "pending" | "disable">()
    .default("pending"),
  move_in_date: date("move_in_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for residents table
  statusIdx: index("idx_residents_status").on(table.status),
  villageKeyIdx: index("idx_residents_village_key").on(table.village_key),
  statusVillageKeyIdx: index("idx_residents_status_village_key").on(table.status, table.village_key),
}));

/**
 * Represents a selectable resident record.
 * @type {typeof residents.$inferSelect}
 */
export type Resident = typeof residents.$inferSelect;
/**
 * Represents a new resident for insertion.2. remove exit time
 * @type {typeof residents.$inferInsert}
 */
export type ResidentInsert = typeof residents.$inferInsert;

/**
 * Schema for the `guards` table. Represents a security guard associated with a village.
 */
export const guards = pgTable("guards", {
  guard_id: uuid("guard_id").primaryKey().defaultRandom(),
  line_user_id: text("line_user_id").unique(),
  line_display_name: text("line_display_name"),
  line_profile_url: text("line_profile_url"),
  email: text("email").notNull().unique(),
  fname: text("fname").notNull(),
  lname: text("lname").notNull(),
  phone: text("phone").notNull(),
  village_key: text("village_key").references(() => villages.village_key),
  status: text("status")
    .$type<"verified" | "pending" | "disable">()
    .default("pending"),
  hired_date: date("hired_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for guards table
  statusIdx: index("idx_guards_status").on(table.status),
  villageKeyIdx: index("idx_guards_village_key").on(table.village_key),
  statusVillageKeyIdx: index("idx_guards_status_village_key").on(table.status, table.village_key),
}));

/**
 * Represents a selectable guard record.
 * @type {typeof guards.$inferSelect}
 */
export type Guard = typeof guards.$inferSelect;
/**
 * Represents a new guard for insertion.
 * @type {typeof guards.$inferInsert}
 */
export type GuardInsert = typeof guards.$inferInsert;

/**
 * Schema for the `admins` table. Represents an administrator with system access.
 */
export const admins = pgTable("admins", {
  admin_id: uuid("admin_id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  phone: text("phone").notNull(),
  village_key: text("village_key").references(() => villages.village_key),
  status: text("status")
    .$type<"verified" | "pending" | "disable">()
    .default("pending"),
  role: text("role")
    .$type<"admin" | "staff" | "superadmin">()
    .default("admin")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for admins table
  usernameIdx: index("idx_admins_username").on(table.username),
  villageKeyIdx: index("idx_admins_village_key").on(table.village_key),
}));

/**
 * Represents a selectable admin record.
 * @type {typeof admins.$inferSelect}
 */
export type Admin = typeof admins.$inferSelect;
/**
 * Represents a new admin for insertion.
 * @type {typeof admins.$inferInsert}
 */
export type AdminInsert = typeof admins.$inferInsert;

/**
 * Schema for the `house_members` table. A join table representing the many-to-many
 * relationship between houses and residents.
 */
export const house_members = pgTable("house_members", {
  house_member_id: uuid("house_member_id").primaryKey().defaultRandom(),
  house_id: uuid("house_id").references(() => houses.house_id),
  resident_id: uuid("resident_id").references(() => residents.resident_id),
}, (table) => ({
  // Indexes for house_members table
  residentIdIdx: index("idx_house_members_resident_id").on(table.resident_id),
  houseIdIdx: index("idx_house_members_house_id").on(table.house_id),
}));
/**
 * Represents a selectable house_member record.
 * @type {typeof house_members.$inferSelect}
 */
export type House_member = typeof house_members.$inferSelect;
/**
 * Represents a new house_member for insertion.
 * @type {typeof house_members.$inferInsert}
 */
export type House_memberInsert = typeof house_members.$inferInsert;

/**
 * Schema for the `visitor_records` table. Logs entries and exits of visitors.
 */
export const visitor_records = pgTable("visitor_records", {
  visitor_record_id: uuid("visitor_record_id").primaryKey().defaultRandom(),
  resident_id: uuid("resident_id").references(() => residents.resident_id),
  guard_id: uuid("guard_id").references(() => guards.guard_id),
  house_id: uuid("house_id").references(() => houses.house_id),
  picture_key: text("picture_key"),
  visitor_name: text("visitor_name"),
  visitor_id_card: text("visitor_id_card"),
  license_plate: text("license_plate"),
  entry_time: timestamp("entry_time").defaultNow(),
  record_status: text("record_status")
    .$type<"approved" | "pending" | "rejected">()
    .default("pending"),
  visit_purpose: text("visit_purpose"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for visitor_records table
  statusIdx: index("idx_visitor_records_status").on(table.record_status),
  entryTimeIdx: index("idx_visitor_records_entry_time").on(table.entry_time),
  createdAtIdx: index("idx_visitor_records_created_at").on(table.createdAt),
  statusCreatedAtIdx: index("idx_visitor_records_status_created_at").on(table.record_status, table.createdAt),
  residentIdIdx: index("idx_visitor_records_resident_id").on(table.resident_id),
  guardIdIdx: index("idx_visitor_records_guard_id").on(table.guard_id),
  houseIdIdx: index("idx_visitor_records_house_id").on(table.house_id),
}));
/**
 * Represents a selectable visitor_record.
 * @type {typeof visitor_records.$inferSelect}
 */
export type Visitor_record = typeof visitor_records.$inferSelect;

/**
 * Schema for the `admin_activity_logs` table. Records actions taken by administrators.
 */
export const admin_activity_logs = pgTable("admin_activity_logs", {
  log_id: uuid("log_id").primaryKey().defaultRandom(),
  admin_id: uuid("admin_id").references(() => admins.admin_id).notNull(),
  action_type: text("action_type").notNull(),
  description: text("description").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

/**
 * Represents a selectable admin_activity_log record.
 * @type {typeof admin_activity_logs.$inferSelect}
 */
export type AdminActivityLog = typeof admin_activity_logs.$inferSelect;
/**
 * Represents a new admin_activity_log for insertion.
 * @type {typeof admin_activity_logs.$inferInsert}
 */
export type AdminActivityLogInsert = typeof admin_activity_logs.$inferInsert;

/**
 * Schema for the `admin_notifications` table. Represents notifications for administrators.
 */
export const admin_notifications = pgTable("admin_notifications", {
  notification_id: uuid("notification_id").primaryKey().defaultRandom(),
  admin_id: uuid("admin_id").references(() => admins.admin_id).notNull(),
  village_key: text("village_key").references(() => villages.village_key).notNull(),
  type: text("type")
    .$type<"resident_pending" | "guard_pending" | "admin_pending" | "house_updated" | "member_added" | "member_removed" | "status_changed" | "visitor_pending_too_long" | "visitor_rejected_review">()
    .notNull(),
  category: text("category")
    .$type<"user_approval" | "house_management" | "visitor_management">()
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data").$type<Record<string, any>>(), // JSON data
  is_read: text("is_read").$type<boolean>().default(false),
  priority: text("priority")
    .$type<"low" | "medium" | "high" | "urgent">()
    .default("medium"),
  created_at: timestamp("created_at").defaultNow(),
  read_at: timestamp("read_at"),
}, (table) => ({
  // Indexes for admin_notifications table
  adminIdIdx: index("idx_admin_notifications_admin_id").on(table.admin_id),
  villageKeyIdx: index("idx_admin_notifications_village_key").on(table.village_key),
  isReadIdx: index("idx_admin_notifications_is_read").on(table.is_read),
  createdAtIdx: index("idx_admin_notifications_created_at").on(table.created_at),
  adminIdIsReadIdx: index("idx_admin_notifications_admin_id_is_read").on(table.admin_id, table.is_read),
}));

/**
 * Represents a selectable admin_notification record.
 * @type {typeof admin_notifications.$inferSelect}
 */
export type AdminNotification = typeof admin_notifications.$inferSelect;
/**
 * Represents a new admin_notification for insertion.
 * @type {typeof admin_notifications.$inferInsert}
 */
export type AdminNotificationInsert = typeof admin_notifications.$inferInsert;

/**
 * An object containing all table schemas, used to initialize Drizzle ORM.
 * @type {Object}
 */
export const schema = {
  admins,
  residents,
  guards,
  houses,
  visitor_records,
  admin_activity_logs,
  admin_notifications,
};