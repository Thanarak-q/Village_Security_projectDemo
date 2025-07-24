import { Elysia } from "elysia";
import db from "./db/drizzle";
import {
  users,
  roles,
  villages,
  houses,
  residents,
  guards,
  admins,
  house_members,
  visitor_records
} from "./db/schema";
import { cors } from "@elysiajs/cors";

const app = new Elysia();

app.use(cors()); // ใช้ก่อน listen

app.get("/", () => "Hello Elysia!");

// กลุ่มเส้นทางที่เริ่มด้วย /api
app.group("/api", (app) =>
  app
    .get("/", () => "API Root") // /api
    .get("/users", async () => {
      const allUsers = await db.select().from(users);
      return allUsers;
    })
    // body คือ ข้อมูลที่กรอกมา
    .post("/users", async ({ body }) => {
      const {
        user_id,
        username,
        email,
        fname,
        lname,
        phone,
        password_hash,
        role_id,
        status,
        village_key,
      } = body as {
        user_id: string;
        username: string;
        email: string;
        fname: string;
        lname: string;
        phone: string;
        password_hash: string;
        role_id: string;
        status: "verified" | "pending";
        village_key: string;
      };

      if (!user_id || !username || !email || !role_id || !status || !village_key) {
        return { error: "Missing required fields!" };
      }

      const [newUser] = await db
        .insert(users)
        .values({
          user_id,
          username,
          email,
          fname,
          lname,
          phone,
          password_hash,
          role_id,
          status,
          village_key,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newUser;
    })
    
);

app.listen(3001, () => {
  console.log("🦊 Elysia is running at http://localhost:3001");
});
