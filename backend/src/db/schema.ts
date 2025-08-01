import { unique } from "drizzle-orm/gel-core";
import {
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { status } from "elysia";


export const villages = pgTable("villages", {
  village_id: uuid("village_id").primaryKey().defaultRandom(),
  village_name: text("village_name").notNull(),
  village_key: text("village_key").notNull().unique(),
});
export type Village = typeof villages.$inferSelect; 
export type VillageInsert = typeof villages.$inferInsert; 


// -----------------------------------------------------------------------------------

export const houses = pgTable("houses", {
  house_id: uuid("house_id").primaryKey().defaultRandom(),
  address: text("address").notNull(),
  status: text("status").$type<"available" | "occupied" | "disable">().default("available"),
  village_key: text("village_key").references(() => villages.village_key),
});
export type House = typeof houses.$inferSelect;
export type HouseInsert = typeof houses.$inferInsert;

// ----------------------------------------------------------------
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
  status: text("status").$type<"verified" | "pending" | "disable">().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profile_image_url: text("profile_image_url"),
});

export type Resident = typeof residents.$inferSelect;
export type ResidentInsert = typeof residents.$inferInsert;

// ----------------------------------------------------------------------------------

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
  status: text("status").$type<"verified" | "pending" | "disable">().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profile_image_url: text("profile_image_url"),
});

export type Guard = typeof guards.$inferSelect;
export type GuardInsert = typeof guards.$inferInsert; 
// ----------------------------------------------------------------------------------

export const admins = pgTable("admins", {
  admin_id: uuid("admin_id").primaryKey().defaultRandom(),

  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  phone: text("phone").notNull(), 
  village_key: text("village_key").references(() => villages.village_key), // connect village
  status: text("status").$type<"verified" | "pending" | "disable">().default("pending"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Admin = typeof admins.$inferSelect; 
export type AdminInsert = typeof admins.$inferInsert; 

// ---------------------------------------------------------------------------------

export const house_members = pgTable("house_members", {
  house_member_id: uuid("house_member_id").primaryKey().defaultRandom(),
  house_id: uuid("house_id").references(() => houses.house_id),
  resident_id: uuid("resident_id").references(() => residents.resident_id),
});
export type House_member = typeof house_members.$inferSelect;
export type House_memberInsert = typeof house_members.$inferInsert; 




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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

});
export type Visitor_record = typeof visitor_records.$inferSelect;
