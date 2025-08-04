import db from "../db/drizzle";
import { admins } from "../db/schema";
import { eq } from "drizzle-orm";

export const requireRole = (required: string | string[] = "*") => {
  const allowedRoles = Array.isArray(required) ? required : [required];

  return async (context: any) => {
    console.log("Middleware เริ่มทำงาน");

    const { jwt, cookie, set } = context;
    const token = cookie.auth_token?.value;

    if (!token) {
      set.status = 401;
      return { error: "Unauthorized: No token" };
    }

    let payload;
    try {
      payload = await jwt.verify(token);
    } catch {
      set.status = 401;
      return { error: "Unauthorized: Invalid token" };
    }

    if (!payload?.id) {
      set.status = 401;
      return { error: "Unauthorized: Invalid payload" };
    }

    const user = await db.query.admins.findFirst({
      where: eq(admins.admin_id, payload.id),
    });

    if (!user) {
      set.status = 401;
      return { error: "Unauthorized: User not found" };
    }

    if (required !== "*" && !allowedRoles.includes(user.role)) {
      set.status = 403;
      return { error: "Forbidden: Insufficient role" };
    }

    console.log("Middleware พบ user:", user);

    context.currentUser = user;

    console.log("Middleware เซ็ต currentUser แล้ว");
  };
};
