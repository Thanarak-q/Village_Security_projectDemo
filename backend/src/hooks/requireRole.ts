import db from "../db/drizzle";
import { admins } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * SECURITY ENHANCEMENT: Role-based Access Control Middleware
 *
 * Security improvements:
 * - Removed sensitive logging (user data exposure)
 * - Added token age validation
 * - Added account status verification
 * - Enhanced payload validation
 * - Proper error handling without information disclosure
 */

/**
 * Middleware to require a specific role or roles for a route.
 * @param {string | string[]} [required="*"] - The required role or roles.
 * @returns {Function} An Elysia hook function.
 */
export const requireRole = (required: string | string[] = "*") => {
  const allowedRoles = Array.isArray(required) ? required : [required];

  return async (context: any) => {
    const { jwt, cookie, set } = context;
    const token = cookie.auth_token?.value;

    // SECURITY: Check if authentication token exists
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

    // SECURITY: Validate token payload structure
    if (!payload?.id || !payload?.iat) {
      set.status = 401;
      return { error: "Unauthorized: Invalid payload" };
    }

    // SECURITY: Check token age to prevent old token usage
    const tokenAge = Date.now() / 1000 - payload.iat;
    if (tokenAge > 7 * 24 * 60 * 60) {
      // 7 days maximum
      set.status = 401;
      return { error: "Unauthorized: Token expired" };
    }

    const user = await db.query.admins.findFirst({
      where: eq(admins.admin_id, payload.id),
    });

    if (!user) {
      set.status = 401;
      return { error: "Unauthorized: User not found" };
    }

    // SECURITY: Verify user account is still active
    if (user.status !== "verified") {
      set.status = 403;
      return { error: "Forbidden: Account not active" };
    }

    // SECURITY: Check role-based permissions
    if (required !== "*" && !allowedRoles.includes(user.role)) {
      set.status = 403;
      return { error: "Forbidden: Insufficient role" };
    }

    // SECURITY: Set current user context (removed sensitive logging)
    context.currentUser = user;
  };
};
