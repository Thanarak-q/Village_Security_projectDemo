/**
 * @file This file defines the database schema for the application using Drizzle ORM.
 * It includes table definitions for all core entities, such as villages, houses, users (residents, guards, admins),
 * and their relationships. It also exports TypeScript types inferred from the schema
 * for type-safe database operations.
 */

import { unique } from "drizzle-orm/gel-core";
import { pgTable, text, timestamp, uuid, date } from "drizzle-orm/pg-core";
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
});
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
  line_picture_url: text("line_picture_url"),
  line_display_name: text("line_display_name"),

  
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
});

/**
 * Represents a selectable resident record.
 * @type {typeof residents.$inferSelect}
 */
export type Resident = typeof residents.$inferSelect;
/**
 * Represents a new resident for insertion.
 * @type {typeof residents.$inferInsert}
 */
export type ResidentInsert = typeof residents.$inferInsert;

/**
 * Schema for the `guards` table. Represents a security guard associated with a village.
 */
export const guards = pgTable("guards", {
  guard_id: uuid("guard_id").primaryKey().defaultRandom(),
  
  line_user_id: text("line_user_id").unique(),
  line_picture_url: text("line_picture_url"),
  line_display_name: text("line_display_name"),

  email: text("email").notNull().unique(),
  fname: text("fname").notNull(),
  lname: text("lname").notNull(),
  phone: text("phone").notNull(),

  village_key: text("village_key").references(() => villages.village_key),
  status: text("status")
    .$type<"verified" | "pending" | "disable">()
    .default("pending"),
  hire_date: date("hire_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  profile_image_url: text("profile_image_url"),
  
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

});

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
});
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

  visitor_name: text("visitor_name").notNull(),
  visitor_id: text("visitor_id").notNull(),

  picture_key: text("picture_key"),
  license_plate: text("license_plate"),
  entry_time: timestamp("entry_time").defaultNow(),
  record_status: text("record_status")
    .$type<"approved" | "pending" | "rejected">()
    .default("pending"),
  visit_purpose: text("visit_purpose"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
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
  action_type: text("action_type").notNull().$type<
    | "approve_user"
    | "reject_user"
    | "create_house"
    | "update_house"
    | "delete_house"
    | "change_house_status"
    | "add_house_member"
    | "remove_house_member"
    | "change_user_status"
    | "change_user_role"
    | "create_admin"
    | "update_admin"
    | "delete_admin"
    | "create_village"
    | "update_village"
    | "delete_village"
    | "export_data"
    | "system_config"
  >(),
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
};