import db  from './drizzle'; // Import your db
import { admins, guards, house_members, houses, residents, roles, users, villages, visitor_records } from "./schema";


const seedRoles: {
  role_id: string;
  role_name: string;

}[] = [
  {
    role_id: '11111',
    role_name: 'resident'
  }
]

const seedVillages: {
  village_id: string;
  village_name: string;
  village_key: string;
}[] = [
  {
    village_id: '456456',
    village_name: 'Pee Sing Village',
    village_key: 'village001',
  }
]

// -----------------------------------------------------------
const seedHouse: {
  house_id: string
  address: string
  village_key: string

} [] = [
  {
    house_id: '54645464',
    address: '65/1',
    village_key: 'village001',
  }
]
const seedUsers: {

    user_id: string;
    username: string;
    email: string;
    fname: string;
    lname: string;
    phone: string;
    password_hash: string;
    role_id: string;
    status: "verified" | "pending";            // เปลี่ยนตรงนี้!!
    village_key: string;
    createdAt: Date;
    updatedAt: Date;

}[] = [

  {
    user_id: '9f96afab-1e4c-4253-90c7-3b8571f70877',
    username: 'chaiwet',
    email: 'chaiwet@example.com',
    fname: 'ชัยเวทย์',
    lname: 'มหานิล',
    phone: '0891234567',
    password_hash: 'hashedpassword1',
    role_id: '11111',
    status: "verified",                      // กำหนดแบบ explicit
    village_key: 'village001',
    createdAt: new Date(),
    updatedAt: new Date(),

  },

  {

    user_id: '2e358e65-c367-4bdf-bb14-31d13ace6fb2',
    username: 'sopa',
    email: 'sopa@example.com',
    fname: 'โสภา',
    lname: 'โพธิ์ทอง',
    phone: '0868887777',
    password_hash: 'hashedpassword2',
    role_id: '22222',
    status: "pending",
    village_key: 'village002',
    createdAt: new Date(),
    updatedAt: new Date(),

  },

{

  user_id: 'f5c33957-bd38-4342-b2af-16d3e8e333da',
  username: 'kanokwan',
  email: 'kanokwan@example.com',
  fname: 'กนกวรรณ',
  lname: 'ศรีจันทร์',
  phone: '0817654321',
  password_hash: 'hashedpassword3',
  role_id: '33333',            
  status: "verified",          
  village_key: 'village001',   
  createdAt: new Date(),
  updatedAt: new Date(),

}


];

// ----------------------------------------------------

// SEED: Residents

const seedResidents: {

  resident_id: string;
  user_id: string;

}[] = [

  {
    resident_id: "res-0001",
    user_id: "9f96afab-1e4c-4253-90c7-3b8571f70877", // chaiwet
  }

];


// SEED: Guards

const seedGuards: {
  guard_id: string;
  user_id: string;
}[] = [
  {
    guard_id: "grd-0001",
    user_id: "2e358e65-c367-4bdf-bb14-31d13ace6fb2", // sopa
  }
];


// SEED: Admins

const seedAdmins: {
  admin_id: string;
  user_id: string;
}[] = [
  {
    admin_id: "adm-0001",
    user_id: "f5c33957-bd38-4342-b2af-16d3e8e333da", // กนกวัน
  }
];

// -------------------------------------------------------------------------------------
// SEED: House Members

const seedHouseMembers: {
  house_member_id: string;
  house_id: string;
  resident_id: string;

}[] = [

  {
    house_member_id: "hm-0001",
    house_id: "54645464", // Pee Sing Village
    resident_id: "res-0001",

  }

];


// SEED: Visitor Records

const seedVisitorRecords: {
  visitor_record_id: string;
  resident_id: string;
  guard_id: string;
  house_id: string;
  picture_key: string;
  license_plate: string;
  entry_time: Date;
  record_status: "approved" | "pending" | "rejected";
  visit_purpose: string;

}[] = [

  {

    visitor_record_id: "vr-0001",
    resident_id: "res-0001",
    guard_id: "grd-0001",
    house_id: "54645464",
    picture_key: "visitor-001.png",
    license_plate: "กข 1234 เชียงใหม่",
    entry_time: new Date("2024-07-23T08:00:00Z"),
    record_status: "approved",
    visit_purpose: "เยี่ยมญาติ",
  },

  {

    visitor_record_id: "vr-0002",
    resident_id: "res-0001",
    guard_id: "grd-0001",
    house_id: "54645464",
    picture_key: "visitor-002.png",
    license_plate: "ขย 2222 เชียงใหม่",
    entry_time: new Date("2024-07-24T09:30:00Z"),
    record_status: "pending",
    visit_purpose: "จัดส่งของ",

  }

];


export {
  seedRoles,
  seedVillages,
  seedHouse,
  seedUsers,
  seedResidents,
  seedGuards,
  seedAdmins,
  seedHouseMembers,
  seedVisitorRecords

};

// ลบลูกก่อน
async function clearAllTables() {
  await db.delete(visitor_records);
  await db.delete(house_members);
  await db.delete(admins);
  await db.delete(guards);
  await db.delete(residents);
  await db.delete(users);
  await db.delete(houses);
  await db.delete(villages);
  await db.delete(roles);
}

// เติมแม่ 
async function seedAll() {
  await db.insert(roles).values(seedRoles);
  await db.insert(villages).values(seedVillages);
  await db.insert(houses).values(seedHouse);
  await db.insert(users).values(seedUsers);
  await db.insert(residents).values(seedResidents);
  await db.insert(guards).values(seedGuards);
  await db.insert(admins).values(seedAdmins);
  await db.insert(house_members).values(seedHouseMembers);
  await db.insert(visitor_records).values(seedVisitorRecords);
}

async function main() {
  try {
    // ลบข้อมูลในตารางลูกก่อน แล้ว เริ่มเติมข้อมูลจากตารางแม่
    await clearAllTables();
    await seedAll();
    console.log("✅ All seed data inserted.");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    process.exit(0);
  }
}

main();

// const seedUsers = [

//   { name: "Alice", age: 25, email: "alice@example.com" },

//   { name: "Bob", age: 30, email: "bob@example.com" },

//   { name: "Charlie", age: 22, email: "charlie@example.com" },

// ];



