import { Elysia } from "elysia";
import db from "../db/drizzle";
import {
  residents,
  guards,
  villages,
} from "../db/schema";
import { eq, and } from "drizzle-orm";

// LIFF Authentication middleware for cookie-based sessions
const requireLiffAuth = async (context: any) => {
  const { jwt, cookie, set } = context;
  const token = cookie.liff_session?.value;

  if (!token) {
    set.status = 401;
    return { error: "Unauthorized: No LIFF session token provided." };
  }

  let payload;
  try {
    payload = await jwt.verify(token);
  } catch {
    set.status = 401;
    return { error: "Unauthorized: The provided LIFF token is invalid." };
  }

  if (!payload?.id || !payload?.iat) {
    set.status = 401;
    return { error: "Unauthorized: The LIFF token payload is malformed." };
  }

  const tokenAgeInSeconds = Date.now() / 1000 - payload.iat;
  if (tokenAgeInSeconds > 60 * 60) { // 1 hour expiry for LIFF sessions
    set.status = 401;
    return { error: "Unauthorized: The provided LIFF token has expired." };
  }

  // Determine user type from JWT payload
  const userRole = payload.role;
  let user = null;

  // Find user in the appropriate table based on their role
  if (userRole === 'guard') {
    user = await db.query.guards.findFirst({
      where: eq(guards.guard_id, payload.id),
    });
  } else if (userRole === 'resident') {
    user = await db.query.residents.findFirst({
      where: eq(residents.resident_id, payload.id),
    });
  }

  if (!user) {
    set.status = 401;
    return { error: "Unauthorized: User associated with the LIFF token not found." };
  }

  // Allow pending users to access role-related endpoints
  // Only block disabled users
  if (user.status === "disable") {
    set.status = 403;
    return { error: "Forbidden: The user account is disabled." };
  }

  // Add user to context
  context.currentUser = {
    ...user,
    village_keys: user.village_key ? [user.village_key] : [],
  };
};

/**
 * User role registration routes.
 * These routes allow users to register for additional roles without admin authentication.
 * @type {Elysia}
 */
export const userRoleRegistrationRoutes = new Elysia({ prefix: "/api" })

  // Get user's existing roles
  .get("/users/roles", async (context: any) => {
    // Apply LIFF authentication middleware
    const authResult = await requireLiffAuth(context);
    if (authResult) {
      return authResult;
    }
    
    const { query, set } = context;
    try {
      const { lineUserId } = query as { lineUserId: string };

      if (!lineUserId) {
        set.status = 400;
        return {
          success: false,
          error: "Line User ID is required",
        };
      }

      const roles: Array<{role: string, village_key: string, village_name?: string, status?: string}> = [];

      // Check if user exists as resident
      const resident = await db
        .select({
          status: residents.status,
          village_key: residents.village_key,
        })
        .from(residents)
        .where(eq(residents.line_user_id, lineUserId));

      for (const res of resident) {
        if (res.village_key) {
          // Get village name
          const village = await db
            .select({ village_name: villages.village_name })
            .from(villages)
            .where(eq(villages.village_key, res.village_key))
            .limit(1);

          roles.push({
            role: "resident",
            village_key: res.village_key,
            village_name: village[0]?.village_name || res.village_key,
            status: res.status || undefined
          });
        }
      }

      // Check if user exists as guard
      const guard = await db
        .select({
          status: guards.status,
          village_key: guards.village_key,
        })
        .from(guards)
        .where(eq(guards.line_user_id, lineUserId));

      for (const g of guard) {
        if (g.village_key) {
          // Get village name
          const village = await db
            .select({ village_name: villages.village_name })
            .from(villages)
            .where(eq(villages.village_key, g.village_key))
            .limit(1);

          roles.push({
            role: "guard",
            village_key: g.village_key,
            village_name: village[0]?.village_name || g.village_key,
            status: g.status || undefined
          });
        }
      }

      return {
        success: true,
        roles,
      };
    } catch (error) {
      console.error("Error getting user roles:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to get user roles",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Register additional role for existing user
  .post("/users/register-role", async ({ body, set }) => {
    try {
      const {
        lineUserId,
        role,
        email,
        fname,
        lname,
        phone,
        village_key,
        profile_image_url,
      } = body as {
        lineUserId: string;
        role: "resident" | "guard";
        email: string;
        fname: string;
        lname: string;
        phone: string;
        village_key: string;
        profile_image_url?: string;
      };

      if (!lineUserId || !role || !email || !fname || !lname || !phone || !village_key) {
        set.status = 400;
        return {
          success: false,
          error: "Missing required fields",
        };
      }

      // Check if user already has this role in this specific village
      if (role === "resident") {
        const existingResident = await db
          .select()
          .from(residents)
          .where(
            and(
              eq(residents.line_user_id, lineUserId),
              eq(residents.village_key, village_key)
            )
          )
          .limit(1);

        if (existingResident.length > 0) {
          set.status = 400;
          return {
            success: false,
            error: "User already has resident role in this village",
          };
        }
      } else if (role === "guard") {
        const existingGuard = await db
          .select()
          .from(guards)
          .where(
            and(
              eq(guards.line_user_id, lineUserId),
              eq(guards.village_key, village_key)
            )
          )
          .limit(1);

        if (existingGuard.length > 0) {
          set.status = 400;
          return {
            success: false,
            error: "User already has guard role in this village",
          };
        }
      }

      // Validate village exists
      const village = await db
        .select()
        .from(villages)
        .where(eq(villages.village_key, village_key))
        .limit(1);

      if (village.length === 0) {
        set.status = 400;
        return {
          success: false,
          error: "Invalid village key",
        };
      }

      // Create new role entry
      if (role === "resident") {
        const newResident = await db
          .insert(residents)
          .values({
            line_user_id: lineUserId,
            email,
            fname,
            lname,
            phone,
            village_key,
            line_profile_url: profile_image_url || null,
            status: "pending", // New role registrations start as pending
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return {
          success: true,
          message: "Resident role registered successfully",
          data: newResident[0],
        };
      } else if (role === "guard") {
        const newGuard = await db
          .insert(guards)
          .values({
            line_user_id: lineUserId,
            email,
            fname,
            lname,
            phone,
            village_key,
            line_profile_url: profile_image_url || null,
            status: "pending", // New role registrations start as pending
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return {
          success: true,
          message: "Guard role registered successfully",
          data: newGuard[0],
        };
      } else {
        set.status = 400;
        return {
          success: false,
          error: "Invalid role",
        };
      }
    } catch (error) {
      console.error("Error registering role:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to register role",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
