import {
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { status } from "elysia";


export const roles = pgTable("roles", {
  role_id: uuid("role_id").primaryKey().defaultRandom(),
  role_name: text("role_name").notNull(),
});
export type Role = typeof roles.$inferSelect;


export const villages = pgTable("villages", {
  village_id: uuid("village_id").primaryKey().defaultRandom(),
  village_name: text("village_name").notNull(),
  village_key: text("village_key").notNull().unique(),
});
export type Village = typeof villages.$inferSelect;

// -----------------------------------------------------------------------------------

export const houses = pgTable("houses", {
  house_id: uuid("house_id").primaryKey().defaultRandom(),
  address: text("address").notNull(),
  village_key: text("village_key").references(() => villages.village_key),
});
export type House = typeof houses.$inferSelect;

export const users = pgTable("users", {
  user_id: uuid("user_id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fname: text("fname").notNull(),
  lname: text("lname").notNull(),
  phone: text("phone").notNull(),
  password_hash: text("password_hash").notNull(),
  role_id: uuid("role_id").references(() => roles.role_id),
  status: text("status").$type<"verified" | "pending">().default("pending"),

  village_key: text("village_key").references(() => villages.village_key), // connect village
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;

// ----------------------------------------------------------------------------------
export const residents = pgTable("residents", {
  resident_id: uuid("resident_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.user_id),
});
export type Resident = typeof residents.$inferSelect;


export const guards = pgTable("guards", {
  guard_id: uuid("guard_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.user_id),
});
export type Guard = typeof guards.$inferSelect;


export const admins = pgTable("admins", {
  admin_id: uuid("admin_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.user_id),
});
export type Admin = typeof admins.$inferSelect;




// ---------------------------------------------------------------------------------

export const house_members = pgTable("house_members", {
  house_member_id: uuid("house_member_id").primaryKey().defaultRandom(),
  house_id: uuid("house_id").references(() => houses.house_id),
  resident_id: uuid("resident_id").references(() => residents.resident_id),
});
export type House_member = typeof house_members.$inferSelect;




export const visitor_records = pgTable("visitor_records", {
  visitor_record_id: uuid("visitor_record_id").primaryKey().defaultRandom(),
  resident_id: uuid("resident_id").references(() => residents.resident_id),
  guard_id: uuid("guard_id").references(() => guards.guard_id),
  house_id: uuid("house_id").references(() => houses.house_id),
  picture_key: text("picture_key"),
  license_plate: text("license_plate"),
  entry_time: timestamp("entry_time").defaultNow(),
  record_status: text("record_status")
    .$type<"approved" | "pending" | "rejected">()
    .default("pending"),
  visit_purpose: text("visit_purpose"),
});
export type Visitor_record = typeof visitor_records.$inferSelect;
