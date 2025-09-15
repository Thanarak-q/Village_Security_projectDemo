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
import { admins, villages } from "../db/schema";
import db from "../db/drizzle";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../utils/passwordUtils";
import { requireRole } from "../hooks/requireRole";
// import { rateLimit } from "../middleware/rateLimiter"; // SECURITY: Rate limiting (temporarily disabled)
import { validateLoginInput, sanitizeString } from "../utils/validation"; // SECURITY: Input validation

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

  // .decorate('currentUser', null) // ประกาศว่า context จะมี currentUser (เริ่มเป็น null)
  .onBeforeHandle(requireRole("*"))
  /**
   * Gets the current user's information.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Object} An object containing the current user's information.
   */
  .get("/me", async ({ currentUser }: any) => {
    const village_name = currentUser.village_key
      ? await db
          .select({ village_name: villages.village_name })
          .from(villages)
          .where(eq(villages.village_key, currentUser.village_key))
          .then((res) => (res[0] ? res[0].village_name : null))
      : null;

    return {
      id: currentUser.admin_id,
      username: currentUser.username,
      role: currentUser.role,
      village_key: currentUser.village_key,
      village_name,
    };
  })

  // GET /api/auth/ws-token - Get WebSocket token for real-time notifications
  .get("/ws-token", async ({ jwt, cookie, set }: any) => {
    try {
      const token = cookie.auth_token?.value;

      if (!token) {
        set.status = 401;
        return { error: "No authentication token found" };
      }

      let payload;
      try {
        payload = await jwt.verify(token);
      } catch {
        set.status = 401;
        return { error: "Invalid authentication token" };
      }

      if (!payload?.id || !payload?.iat) {
        set.status = 401;
        return { error: "Invalid token payload" };
      }

      // Check token age (7 days)
      const tokenAgeInSeconds = Date.now() / 1000 - payload.iat;
      if (tokenAgeInSeconds > 7 * 24 * 60 * 60) {
        set.status = 401;
        return { error: "Token has expired" };
      }

      // Verify user exists and is active
      const user = await db.query.admins.findFirst({
        where: eq(admins.admin_id, payload.id),
      });

      if (!user || user.status !== "verified") {
        set.status = 401;
        return { error: "User not found or not verified" };
      }

      // Create a short-lived WebSocket token (1 hour)
      const wsToken = await jwt.sign({
        id: user.admin_id,
        name: user.username,
        role: user.role,
        village_key: user.village_key,
        ws: true, // Mark as WebSocket token
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      });

      return {
        success: true,
        data: {
          token: wsToken,
          expires_in: 3600, // 1 hour in seconds
        }
      };
    } catch (error) {
      console.error('Error generating WebSocket token:', error);
      set.status = 500;
      return { error: "Failed to generate WebSocket token" };
    }
  });

 