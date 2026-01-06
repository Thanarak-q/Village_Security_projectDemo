import { Elysia } from "elysia";
import db from "../db/drizzle";
import {
  residents,
  guards,
  villages,
  house_members,
  houses,
} from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { notificationService } from "../services/notificationService";

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
    village_ids: user.village_id ? [user.village_id] : [],
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

      const roles: Array<{
        role: string;
        village_id: string;
        village_name?: string;
        status?: string;
        resident_id?: string;
        guard_id?: string;
        houses?: Array<{ house_id: string; house_address: string | null }>;
      }> = [];

      // Check if user exists as resident
      const residentRecords = await db
        .select({
          resident_id: residents.resident_id,
          status: residents.status,
          village_id: residents.village_id,
        })
        .from(residents)
        .where(eq(residents.line_user_id, lineUserId));

      const residentIds = residentRecords
        .map((res) => res.resident_id)
        .filter((id): id is string => Boolean(id));

      const residentHousesMap = new Map<
        string,
        Array<{ house_id: string; house_address: string | null }>
      >();

      if (residentIds.length > 0) {
        const residentHouses = await db
          .select({
            resident_id: house_members.resident_id,
            house_id: houses.house_id,
            house_address: houses.address,
          })
          .from(house_members)
          .innerJoin(houses, eq(house_members.house_id, houses.house_id))
          .where(inArray(house_members.resident_id, residentIds));

        for (const entry of residentHouses) {
          if (!entry.resident_id) continue;
          if (!residentHousesMap.has(entry.resident_id)) {
            residentHousesMap.set(entry.resident_id, []);
          }
          residentHousesMap.get(entry.resident_id)!.push({
            house_id: entry.house_id,
            house_address: entry.house_address,
          });
        }
      }

      for (const res of residentRecords) {
        if (res.village_id) {
          // Get village name and key
          const village = await db
            .select({
              village_name: villages.village_name,
              village_key: villages.village_key
            })
            .from(villages)
            .where(eq(villages.village_id, res.village_id))
            .limit(1);

          roles.push({
            role: "resident",
            resident_id: res.resident_id,
            village_id: res.village_id || '',
            village_name: village[0]?.village_name || '',
            status: res.status || undefined,
            houses: residentHousesMap.get(res.resident_id) || [],
          });
        }
      }

      // Check if user exists as guard
      const guardRecords = await db
        .select({
          guard_id: guards.guard_id,
          status: guards.status,
          village_id: guards.village_id,
        })
        .from(guards)
        .where(eq(guards.line_user_id, lineUserId));

      for (const g of guardRecords) {
        if (g.village_id) {
          // Get village name and key
          const village = await db
            .select({
              village_name: villages.village_name,
              village_key: villages.village_key
            })
            .from(villages)
            .where(eq(villages.village_id, g.village_id))
            .limit(1);

          roles.push({
            role: "guard",
            guard_id: g.guard_id,
            village_id: g.village_id || '',
            village_name: village[0]?.village_name || '',
            status: g.status || undefined,
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
        move_in_date,
      } = body as {
        lineUserId: string;
        role: "resident" | "guard";
        email: string;
        fname: string;
        lname: string;
        phone: string;
        village_key: string;
        profile_image_url?: string;
        move_in_date?: string;
      };

      if (!lineUserId || !role || !email || !fname || !lname || !phone || !village_key) {
        set.status = 400;
        return {
          success: false,
          error: "Missing required fields",
        };
      }

      // Validate village exists first
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

      const villageId = village[0].village_id;

      // Check if user already has this role in this specific village
      if (role === "resident") {
        const existingResident = await db
          .select()
          .from(residents)
          .where(
            and(
              eq(residents.line_user_id, lineUserId),
              eq(residents.village_id, villageId)
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
              eq(guards.village_id, villageId)
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

      // Create new role entry
      const moveInDateValue = move_in_date
        ? new Date(move_in_date)
        : new Date();

      if (role === "resident") {
        const [newResident] = await db
          .insert(residents)
          .values({
            line_user_id: lineUserId,
            email,
            fname,
            lname,
            phone,
            village_id: village[0].village_id,
            line_profile_url: profile_image_url || null,
            status: "pending", // New role registrations start as pending
            move_in_date: moveInDateValue.toISOString().split('T')[0],
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // 🔔 Send notification to village staff
        try {
          await notificationService.notifyNewResidentRegistration({
            resident_id: newResident.resident_id,
            fname: newResident.fname,
            lname: newResident.lname,
            village_id: newResident.village_id!,
          });
          console.log(`📢 Notification sent for new resident: ${newResident.fname} ${newResident.lname}`);
        } catch (notificationError) {
          console.error('❌ Error creating registration notification:', notificationError);
          // Don't fail the registration if notification fails
        }

        return {
          success: true,
          message: "Resident role registered successfully",
          data: newResident,
        };
      } else if (role === "guard") {
        const [newGuard] = await db
          .insert(guards)
          .values({
            line_user_id: lineUserId,
            email,
            fname,
            lname,
            phone,
            village_id: village[0].village_id,
            line_profile_url: profile_image_url || null,
            status: "pending", // New role registrations start as pending
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // 🔔 Send notification to village staff
        try {
          await notificationService.notifyNewGuardRegistration({
            guard_id: newGuard.guard_id,
            fname: newGuard.fname,
            lname: newGuard.lname,
            village_id: newGuard.village_id!,
          });
          console.log(`📢 Notification sent for new guard: ${newGuard.fname} ${newGuard.lname}`);
        } catch (notificationError) {
          console.error('❌ Error creating registration notification:', notificationError);
          // Don't fail the registration if notification fails
        }

        return {
          success: true,
          message: "Guard role registered successfully",
          data: newGuard,
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
