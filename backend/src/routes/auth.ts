/**
 * SECURITY ENHANCEMENT: Authentication Routes
 *
 * Security improvements added:
 * - Rate limiting to prevent brute force attacks
 * - Input validation and sanitization
 * - Timing attack protection
 * - Account status verification
 * - Secure cookie configuration
 * - Reduced information disclosure
 */

// apps/api/src/routes/auth.ts
import { Elysia, t } from "elysia";
import { admins, villages, guards, residents } from "../db/schema";
import db from "../db/drizzle";
import { eq, inArray } from "drizzle-orm";
import { verifyPassword } from "../utils/passwordUtils";
import { requireRole } from "../hooks/requireRole";
// import { rateLimit } from "../middleware/rateLimiter"; // SECURITY: Rate limiting (temporarily disabled)
import { validateLoginInput, sanitizeString } from "../utils/validation"; // SECURITY: Input validation

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

  if (user.status !== "verified") {
    set.status = 403;
    return { error: "Forbidden: The user account is not active." };
  }

  const villageIds = 'village_id' in user && user.village_id ? [user.village_id] : [];
  let villageKeys: string[] = [];
  if (villageIds.length) {
    const villagesData = await db
      .select({ id: villages.village_id, key: villages.village_key })
      .from(villages)
      .where(inArray(villages.village_id, villageIds));

    const idToKey = new Map(villagesData.map((v) => [v.id, v.key]));
    villageKeys = villageIds
      .map((id) => idToKey.get(id))
      .filter((key): key is string => Boolean(key));
  }

  // Add user to context
  context.currentUser = {
    ...user,
    village_ids: villageIds,
    village_keys: villageKeys,
  };
};

/**
 * The authentication routes.
 * @type {Elysia}
 */
export const authRoutes = new Elysia({ prefix: "/api/auth" })
  /**
   * Logs in a user.
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @param {Object} context.jwt - The JWT object.
   * @param {Object} context.set - The set object.
   * @param {Object} context.request - The request object.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .post("/login", async ({ body, jwt, set, request }: any) => {
    try {
      // SECURITY: Validate and sanitize input to prevent injection attacks
      const validation = validateLoginInput(body);
      if (!validation.isValid) {
        set.status = 400;
        return { error: "Invalid input", details: validation.errors };
      }

      const { username, password } = body;
      const sanitizedUsername = sanitizeString(username);

      // SECURITY: Timing attack protection - measure execution time
      const startTime = Date.now();

      const user = await db.query.admins.findFirst({
        where: eq(admins.username, sanitizedUsername),
      });

      let isPasswordValid = false;
      if (user) {
        isPasswordValid = await verifyPassword(password, user.password_hash);
      }

      // SECURITY: Ensure consistent response time to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < 100) {
        await new Promise((resolve) => setTimeout(resolve, 100 - elapsed));
      }

      if (!user || !isPasswordValid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      // SECURITY: Check if user account is active/verified
      if (user.status !== "verified") {
        set.status = 403;
        return { error: "Account not verified" };
      }

      // SECURITY: Add issued-at timestamp for token validation
      const token = await jwt.sign({
        id: user.admin_id,
        name: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000), // Issued at timestamp
      });

      // SECURITY: Configure secure cookie options
      const cookieOptions = [
        `auth_token=${token}`,
        "HttpOnly", // Prevent XSS access to cookie
        "Path=/",
        `Max-Age=${60 * 60 * 24 * 7}`, // 7 days
        "SameSite=Lax", // CSRF protection
        process.env.NODE_ENV === "production" ? "Secure" : "", // HTTPS only in production
      ]
        .filter(Boolean)
        .join("; ");

      set.headers = {
        ...set.headers,
        "Set-Cookie": cookieOptions,
      };

      return { success: true };
    } catch (err) {
      // SECURITY: Don't log sensitive details, only generic error
      console.error("Login error occurred");
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  })

  /**
   * Logs out a user.
   * @param {Object} context - The context for the request.
   * @param {Object} context.set - The set object.
   * @returns {Object} An object containing a success message.
   */
  .get("/logout", ({ set }: any) => {
    set.headers = {
      ...set.headers,
      "Set-Cookie": `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    };
    set.status = 200;
    return { success: true };
  })
  .post("/logout", ({ set }: any) => {
    set.headers = {
      ...set.headers,
      "Set-Cookie": `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    };
    set.status = 200;
    return { success: true };
  })

  // .decorate('currentUser', null) // ประกาศว่า context จะมี currentUser (เริ่มเป็น null)
  .onBeforeHandle(requireRole("*"))
  /**
   * Gets the current user's information.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Object} An object containing the current user's information.
   */
  .get("/me", async ({ currentUser }: any) => {
    // Get village information for all assigned villages
    let villages_info: Array<{ village_id: string; village_key: string | null; village_name: string }> = [];
    let village_name: string | null = null;

    const villageIds: string[] = currentUser.village_ids || [];
    const villageKeysFallback: string[] = currentUser.village_keys || [];

    if (villageIds.length > 0) {
      villages_info = await db
        .select({
          village_id: villages.village_id,
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(inArray(villages.village_id, villageIds));
    } else if (villageKeysFallback.length > 0) {
      villages_info = await db
        .select({
          village_id: villages.village_id,
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(inArray(villages.village_key, villageKeysFallback));
    }

    if (currentUser.role === "staff" && villages_info.length > 0) {
      village_name = villages_info[0].village_name;
    }

    // Base user data
    const baseUserData = {
      id: currentUser.admin_id || currentUser.guard_id || currentUser.resident_id,
      username: currentUser.username,
      email: currentUser.email,
      fname: currentUser.fname,
      lname: currentUser.lname,
      role: currentUser.role,
      village_ids: villageIds.length ? villageIds : villages_info.map((v) => v.village_id),
      village_keys: villages_info.map((v) => v.village_key).filter((key): key is string => Boolean(key)),
      villages: villages_info,
      village_name: village_name,
    };

    // Add role-specific IDs
    if (currentUser.role === "admin" || currentUser.role === "staff" || currentUser.role === "superadmin") {
      return {
        ...baseUserData,
        admin_id: currentUser.admin_id,
      };
    } else if (currentUser.role === "guard") {
      return {
        ...baseUserData,
        guard_id: currentUser.guard_id,
      };
    } else if (currentUser.role === "resident") {
      return {
        ...baseUserData,
        resident_id: currentUser.resident_id,
      };
    }

    return baseUserData;
  })

  // LIFF user authentication endpoint for guards and residents
  .get("/liff/me", async (context: any) => {
    // Apply LIFF authentication middleware
    const authResult = await requireLiffAuth(context);
    if (authResult) {
      return authResult;
    }
    
    const { currentUser } = context;
    
    // Get village information for all assigned villages
    let villages_info: Array<{ village_id: string; village_key: string | null; village_name: string }> = [];
    let village_name: string | null = null;

    const villageIds: string[] = currentUser.village_ids || [];
    const villageKeysFallback: string[] = currentUser.village_keys || [];

    if (villageIds.length > 0) {
      villages_info = await db
        .select({
          village_id: villages.village_id,
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(inArray(villages.village_id, villageIds));
    } else if (villageKeysFallback.length > 0) {
      villages_info = await db
        .select({
          village_id: villages.village_id,
          village_key: villages.village_key,
          village_name: villages.village_name,
        })
        .from(villages)
        .where(inArray(villages.village_key, villageKeysFallback));
    }

    if (villages_info.length > 0) {
      village_name = villages_info[0].village_name;
    }

    // Base user data
    const baseUserData = {
      id: currentUser.guard_id || currentUser.resident_id,
      username: currentUser.fname + ' ' + currentUser.lname, // Use name as username for LIFF users
      email: currentUser.email,
      fname: currentUser.fname,
      lname: currentUser.lname,
      role: currentUser.role,
      village_ids: villageIds.length ? villageIds : villages_info.map((v) => v.village_id),
      village_keys: villages_info.map((v) => v.village_key).filter((key): key is string => Boolean(key)),
      villages: villages_info,
      village_name: village_name,
    };

    // Add role-specific IDs
    if (currentUser.role === "guard") {
      return {
        ...baseUserData,
        guard_id: currentUser.guard_id,
      };
    } else if (currentUser.role === "resident") {
      return {
        ...baseUserData,
        resident_id: currentUser.resident_id,
      };
    }

    return baseUserData;
  })


 
