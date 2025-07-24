import { Elysia } from "elysia";
import db from "./db/drizzle";
import { usersTable } from "./db/schema";
import { cors } from "@elysiajs/cors";

const app = new Elysia();

app.use(cors());

app.get("/", () => "Hello Elysia!");

// mount group แล้ว return กลับ
app
  .group("/api", (api) =>
    api
      .get("/", () => "API Root")
      .get("/users", async () => {
        const allUsers = await db.select().from(usersTable);
        return allUsers;
      })
      .post("/users", async ({ body }) => {
        const { name, age, email } = body as {
          name: string;
          age: number;
          email: string;
        };

        if (!name || !age || !email) {
          return { error: "Missing fields!" };
        }

        const [newUser] = await db
          .insert(usersTable)
          .values({ name, age, email })
          .returning();

        return newUser;
      })
  )
  .listen(3001, () => {
    console.log("🦊 Elysia is running at http://localhost:3001");
  });
