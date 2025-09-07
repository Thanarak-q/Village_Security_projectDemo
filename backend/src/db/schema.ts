import { unique } from "drizzle-orm/gel-core";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { status } from "elysia";

/**
 * The villages table schema.
 * @type {pgTable}
 */
export const villages = pgTable("villages", {
  village_id: uuid("village_id").primaryKey().defaultRandom(),
  village_name: text("village_name").notNull(),
  village_key: text("village_key").notNull().unique(),
});
/**
 * The type for a village record.
 * @type {typeof villages.$inferSelect}
 */
export type Village = typeof villages.$inferSelect;
/**
 * The type for a new village record.
 * @type {typeof villages.$inferInsert}
 */
export type VillageInsert = typeof villages.$inferInsert;

// -----------------------------------------------------------------------------------

/**
 * The houses table schema.
 * @type {pgTable}
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
 * The type for a house record.
 * @type {typeof houses.$inferSelect}
 */
export type House = typeof houses.$inferSelect;
/**
 * The type for a new house record.
 * @type {typeof houses.$inferInsert}
 */
export type HouseInsert = typeof houses.$inferInsert;

// ----------------------------------------------------------------
/**
 * The residents table schema.
 * @type {pgTable}
 */
export const residents = pgTable("residents", {
  resident_id: uuid("resident_id").primaryKey().defaultRandom(),
  line_user_id: text("line_user_id").unique(),
  email: text("email").notNull().unique(),
  fname: text("fname").notNull(),
  lname: text("lname").notNull(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  phone: text("phone").notNull(),
  village_key: text("village_key").references(() => villages.village_key), // connect village
  status: text("status")
    .$type<"verified" | "pending" | "disable">()
    .default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profile_image_url: text("profile_image_url"),
});

/**
 * The type for a resident record.
 * @type {typeof residents.$inferSelect}
 */
export type Resident = typeof residents.$inferSelect;
/**
 * The type for a new resident record.
 * @type {typeof residents.$inferInsert}
 */
export type ResidentInsert = typeof residents.$inferInsert;

// ----------------------------------------------------------------------------------

/**
 * The guards table schema.
 * @type {pgTable}
 */
export const guards = pgTable("guards", {
  guard_id: uuid("guard_id").primaryKey().defaultRandom(),
  line_user_id: text("line_user_id").unique(),
  email: text("email").notNull().unique(),
  fname: text("fname").notNull(),
  lname: text("lname").notNull(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  phone: text("phone").notNull(),
  village_key: text("village_key").references(() => villages.village_key), // connect village
  status: text("status")
    .$type<"verified" | "pending" | "disable">()
    .default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profile_image_url: text("profile_image_url"),
});

/**
 * The type for a guard record.
 * @type {typeof guards.$inferSelect}
 */
export type Guard = typeof guards.$inferSelect;
/**
 * The type for a new guard record.
 * @type {typeof guards.$inferInsert}
 */
export type GuardInsert = typeof guards.$inferInsert;
// ----------------------------------------------------------------------------------

/**
 * The admins table schema.
 * @type {pgTable}
 */
export const admins = pgTable("admins", {
  admin_id: uuid("admin_id").primaryKey().defaultRandom(),

  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  phone: text("phone").notNull(),
  village_key: text("village_key").references(() => villages.village_key), // connect village
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
 * The type for an admin record.
 * @type {typeof admins.$inferSelect}
 */
export type Admin = typeof admins.$inferSelect;
/**
 * The type for a new admin record.
 * @type {typeof admins.$inferInsert}
 */
export type AdminInsert = typeof admins.$inferInsert;

// ---------------------------------------------------------------------------------

/**
 * The house_members table schema.
 * @type {pgTable}
 */
export const house_members = pgTable("house_members", {
  house_member_id: uuid("house_member_id").primaryKey().defaultRandom(),
  house_id: uuid("house_id").references(() => houses.house_id),
  resident_id: uuid("resident_id").references(() => residents.resident_id),
});
/**
 * The type for a house_member record.
 * @type {typeof house_members.$inferSelect}
 */
export type House_member = typeof house_members.$inferSelect;
/**
 * The type for a new house_member record.
 * @type {typeof house_members.$inferInsert}
 */
export type House_memberInsert = typeof house_members.$inferInsert;

/**
 * The visitor_records table schema.
 * @type {pgTable}
 */
export const visitor_records = pgTable("visitor_records", {
  visitor_record_id: uuid("visitor_record_id").primaryKey().defaultRandom(),
  resident_id: uuid("resident_id").references(() => residents.resident_id),
  guard_id: uuid("guard_id").references(() => guards.guard_id),
  house_id: uuid("house_id").references(() => houses.house_id),
  picture_key: text("picture_key"),
  license_plate: text("license_plate"),
  entry_time: timestamp("entry_time").defaultNow(),
  exit_time: timestamp("exit_time"),
  record_status: text("record_status")
    .$type<"approved" | "pending" | "rejected">()
    .default("pending"),
  visit_purpose: text("visit_purpose"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
/**
 * The type for a visitor_record record.
 * @type {typeof visitor_records.$inferSelect}
 */
export type Visitor_record = typeof visitor_records.$inferSelect;

// ---------------------------------------------------------------------------------

/**
 * The admin_activity_logs table schema.
 * @type {pgTable}
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
  description: text("description").notNull(), // รายละเอียดการกระทำ
  created_at: timestamp("created_at").defaultNow(),
});

/**
 * The type for an admin_activity_log record.
 * @type {typeof admin_activity_logs.$inferSelect}
 */
export type AdminActivityLog = typeof admin_activity_logs.$inferSelect;
/**
 * The type for a new admin_activity_log record.
 * @type {typeof admin_activity_logs.$inferInsert}
 */
export type AdminActivityLogInsert = typeof admin_activity_logs.$inferInsert;

/**
 * The database schema.
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