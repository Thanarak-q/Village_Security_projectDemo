// apps/api/src/routes/auth.ts
import { Elysia, t } from "elysia";
import { admins, villages } from "../db/schema";
import db from "../db/drizzle";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../utils/passwordUtils";
import { requireRole } from "../hooks/requireRole";

export const authRoutes = new Elysia({ prefix: "/api/auth" })

  .post("/login", async ({ body, jwt, set }: any) => {
    try {
      const { username, password } = body;

      const user = await db.query.admins.findFirst({
        where: eq(admins.username, username),
      });

      if (!user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      // Verify password using bcrypt
      const isPasswordValid = await verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = await jwt.sign({
        id: user.admin_id,
        name: user.username,
        role: user.role,
      });

      set.headers = {
        ...set.headers,
        "Set-Cookie": `auth_token=${token}; HttpOnly; Path=/; Max-Age=${
          60 * 60 * 24 * 7
        }; SameSite=Lax`,
      };

      return { success: true };
    } catch (err) {
      console.error("Login API error:", err);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  })

  .get("/logout", ({ set }: any) => {
    set.headers = {
      ...set.headers,
      "Set-Cookie": `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    };
    set.status = 200;
    return { success: true };
  })

  // .decorate('currentUser', null) // ประกาศว่า context จะมี currentUser (เริ่มเป็น null)
  .onBeforeHandle(requireRole("*"))
  .get("/me", ({ currentUser }: any) => {
    return {
      id: currentUser.admin_id,
      username: currentUser.username,
      role: currentUser.role,
      village_key: currentUser.village_key,
    };
  });

 