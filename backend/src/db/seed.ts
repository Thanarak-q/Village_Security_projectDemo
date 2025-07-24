import db from "./drizzle";
import { eq } from "drizzle-orm";
import {
  roles,
  villages,
  houses,
  users,
  residents,
  guards,
  admins,
  house_members,
  visitor_records,
} from "./schema";

const seedRoles = [
  { role_name: "resident" },
  { role_name: "guard" },
  { role_name: "admin" },
];

const seedVillages = [
  {
    village_name: "Pee Sing Village",
    village_key: "f34e5d7a-3f64-4d63-9b29-1ef0e67a0a11",
  },
  {
    village_name: "Village 2",
    village_key: "1e43c08b-7aaf-41f4-a99e-3a450c21f3a9",
  },
];

const seedHouses = [
  { address: "65/1", village_key: "f34e5d7a-3f64-4d63-9b29-1ef0e67a0a11" },
];

const seedUsers = [
  {
    username: "chaiwet",
    email: "chaiwet@example.com",
    fname: "ชัยเวทย์",
    lname: "มหานิล",
    phone: "0891234567",
    password_hash: "hashedpassword1",
    status: "verified" as const,
    village_key: "f34e5d7a-3f64-4d63-9b29-1ef0e67a0a11",
  },
  {
    username: "sopa",
    email: "sopa@example.com",
    fname: "โสภา",
    lname: "โพธิ์ทอง",
    phone: "0868887777",
    password_hash: "hashedpassword2",
    status: "pending" as const,
    village_key: "1e43c08b-7aaf-41f4-a99e-3a450c21f3a9",
  },
  {
    username: "kanokwan",
    email: "kanokwan@example.com",
    fname: "กนกวรรณ",
    lname: "ศรีจันทร์",
    phone: "0817654321",
    password_hash: "hashedpassword3",
    status: "verified" as const,
    village_key: "f34e5d7a-3f64-4d63-9b29-1ef0e67a0a11",
  },
];

async function clearTables() {
  await db.delete(visitor_records).execute();
  await db.delete(house_members).execute();
  await db.delete(admins).execute();
  await db.delete(guards).execute();
  await db.delete(residents).execute();
  await db.delete(users).execute();
  await db.delete(houses).execute();
  await db.delete(villages).execute();
  await db.delete(roles).execute();
}

async function seed() {
  await clearTables();

  // Insert roles
  await db.insert(roles).values(seedRoles).execute();

  // Fetch roles
  const residentRole = (
    await db
      .select()
      .from(roles)
      .where(eq(roles.role_name, "resident"))
      .execute()
  )[0];
  const guardRole = (
    await db.select().from(roles).where(eq(roles.role_name, "guard")).execute()
  )[0];
  const adminRole = (
    await db.select().from(roles).where(eq(roles.role_name, "admin")).execute()
  )[0];

  // Insert villages
  await db.insert(villages).values(seedVillages).execute();

  // Insert houses
  await db.insert(houses).values(seedHouses).execute();

  // Insert users with role_id from roles
  for (const user of seedUsers) {
    let roleId =
      user.username === "chaiwet"
        ? residentRole?.role_id
        : user.username === "sopa"
        ? guardRole?.role_id
        : adminRole?.role_id;

    await db
      .insert(users)
      .values({
        ...user,
        role_id: roleId!,
      })
      .execute();
  }

  // Fetch users
  const chaiwetUser = (
    await db.select().from(users).where(eq(users.username, "chaiwet")).execute()
  )[0];
  const sopaUser = (
    await db.select().from(users).where(eq(users.username, "sopa")).execute()
  )[0];
  const kanokwanUser = (
    await db
      .select()
      .from(users)
      .where(eq(users.username, "kanokwan"))
      .execute()
  )[0];

  // Insert residents, guards, admins
  await db
    .insert(residents)
    .values([{ user_id: chaiwetUser.user_id }])
    .execute();
  await db
    .insert(guards)
    .values([{ user_id: sopaUser.user_id }])
    .execute();
  await db
    .insert(admins)
    .values([{ user_id: kanokwanUser.user_id }])
    .execute();

  // Fetch resident, guard, house for FKs
  const resident = (
    await db
      .select()
      .from(residents)
      .where(eq(residents.user_id, chaiwetUser.user_id))
      .execute()
  )[0];
  const guard = (
    await db
      .select()
      .from(guards)
      .where(eq(guards.user_id, sopaUser.user_id))
      .execute()
  )[0];
  const house = (
    await db.select().from(houses).where(eq(houses.address, "65/1")).execute()
  )[0];

  // Insert house_members
  await db
    .insert(house_members)
    .values([
      {
        house_id: house.house_id,
        resident_id: resident.resident_id,
      },
    ])
    .execute();

  // Insert visitor_records
  await db
    .insert(visitor_records)
    .values([
      {
        resident_id: resident.resident_id,
        guard_id: guard.guard_id,
        house_id: house.house_id,
        picture_key: "visitor-001.png",
        license_plate: "กข 1234 เชียงใหม่",
        entry_time: new Date("2024-07-23T08:00:00Z"),
        record_status: "approved",
        visit_purpose: "เยี่ยมญาติ",
      },
      {
        resident_id: resident.resident_id,
        guard_id: guard.guard_id,
        house_id: house.house_id,
        picture_key: "visitor-002.png",
        license_plate: "ขย 2222 เชียงใหม่",
        entry_time: new Date("2024-07-24T09:30:00Z"),
        record_status: "pending",
        visit_purpose: "จัดส่งของ",
      },
    ])
    .execute();

  console.log("✅ Seeding complete");
}

seed().catch(console.error);
