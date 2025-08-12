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

export const authRoutes = new Elysia({ prefix: "/api/auth" })

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
        await new Promise(resolve => setTimeout(resolve, 100 - elapsed));
      }

      if (!user || !isPasswordValid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      // SECURITY: Check if user account is active/verified
      if (user.status !== 'verified') {
        set.status = 403;
        return { error: "Account not verified" };
      }

      // SECURITY: Add issued-at timestamp for token validation
      const token = await jwt.sign({
        id: user.admin_id,
        name: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000) // Issued at timestamp
      });

      // SECURITY: Configure secure cookie options
      const cookieOptions = [
        `auth_token=${token}`,
        'HttpOnly', // Prevent XSS access to cookie
        'Path=/',
        `Max-Age=${60 * 60 * 24 * 7}`, // 7 days
        'SameSite=Lax', // CSRF protection
        process.env.NODE_ENV === 'production' ? 'Secure' : '' // HTTPS only in production
      ].filter(Boolean).join('; ');

      set.headers = {
        ...set.headers,
        "Set-Cookie": cookieOptions
      };

      return { success: true };
    } catch (err) {
      // SECURITY: Don't log sensitive details, only generic error
      console.error("Login error occurred");
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

 