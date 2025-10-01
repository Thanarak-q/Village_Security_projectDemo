/**
 * @file This file provides a middleware for LIFF-based authentication for guards and residents.
 *
 * The `requireLiffAuth` function is an Elysia hook that can be used to protect routes
 * by ensuring that the authenticated user has the necessary role(s) to access them.
 * It performs comprehensive security checks, including token validation, payload verification,
 * token age checks, and user account status verification.
 * 
 * This hook is specifically designed for guards and residents who authenticate through LIFF.
 * 
 * Role Hierarchy:
 * - guard: ยามรักษาความปลอดภัย (Security Guard) - Access to guard-specific features
 * - resident: ผู้อยู่อาศัย (Resident) - Access to resident-specific features
 */

import db from "../db/drizzle";
import { guards, residents } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Creates an Elysia hook to enforce LIFF-based authentication on a route.
 * It verifies the user's JWT from LIFF session, checks their role against the required roles,
 * and ensures their account is active.
 *
 * @param {string | string[]} [required="*"] - The role or roles required to access the route.
 *   A value of "*" allows any authenticated LIFF user. Defaults to "*".
 * @returns {Function} An Elysia hook function that performs the authorization checks.
 */
export const requireLiffAuth = (required: string | string[] = "*") => {
  const allowedRoles = Array.isArray(required) ? required : [required];

  return async (context: any) => {
    const { jwt, cookie, set } = context;
    // Check for liff_session cookie (used by guards and residents)
    const token = cookie.liff_session?.value;

    if (!token) {
      set.status = 401;
      return { error: "Unauthorized: No LIFF authentication token provided." };
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
    if (tokenAgeInSeconds > 60 * 60) { // 1-hour expiry for LIFF tokens
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

    // Allow pending users for LIFF endpoints (guards and residents)
    // Only block disabled users
    if (user.status === "disable") {
      set.status = 403;
      return { error: "Forbidden: The user account is disabled." };
    }

    if (required !== "*" && !allowedRoles.includes(userRole)) {
      set.status = 403;
      return { error: "Forbidden: You do not have the required role to access this resource." };
    }

    // For guards and residents, use their village_id
    const village_ids = user.village_id ? [user.village_id] : [];

    // Add village_ids to currentUser
    context.currentUser = {
      ...user,
      village_ids,
      role: userRole,
    };
  };
};
