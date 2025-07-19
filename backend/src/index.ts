import { Elysia } from "elysia";
import db from "./db/drizzle"; // Import your db
import { usersTable, User } from "./db/schema"; // Import table and type
import { cors } from '@elysiajs/cors';
const app = new Elysia();

app.get("/", () => "Hello Elysia!");

app.get("/users", async () => {
  const allUsers = await db.select().from(usersTable);

  return allUsers;
});

app.post("/users", async ({ body }) => {
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
});

app.use(cors()); // เพิ่มก่อน .listen()
app.listen(3001, () => {
  console.log("🦊 Elysia is running at http://localhost:3001");
});
