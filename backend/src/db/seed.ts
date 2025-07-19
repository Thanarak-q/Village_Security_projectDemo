import db  from './drizzle'; // Import your db
import { usersTable } from "./schema";


const seedUsers = [

  { name: "Alice", age: 25, email: "alice@example.com" },

  { name: "Bob", age: 30, email: "bob@example.com" },

  { name: "Charlie", age: 22, email: "charlie@example.com" },

];


async function main() {

  try {

    // ลบ users ทั้งหมด (ป้องกันข้อมูลซ้ำ)

    await db.delete(usersTable);


    // เพิ่มข้อมูลใหม่

    await db.insert(usersTable).values(seedUsers);


    console.log("✅ Seed users.done");

  } catch (error) {

    console.error("❌ Error while seeding users:", error);

  } finally {

    // ปิด process หลัง seed เสร็จ

    process.exit(0);

  }

}


main();