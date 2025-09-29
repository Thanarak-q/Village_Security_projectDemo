/**
 * @file This file provides a middleware for role-based access control (RBAC).
 *
 * The `requireRole` function is an Elysia hook that can be used to protect routes
 * by ensuring that the authenticated user has the necessary role(s) to access them.
 * It performs comprehensive security checks, including token validation, payload verification,
 * token age checks, and user account status verification.
 * 
 * Role Hierarchy:
 * - superadmin: เจ้าของ SE (SE Owner) - Full system access
 * - admin: เจ้าของโครงการ (Project Owner) - Project management access
 * - staff: นิติ (Legal Staff) - Read-only access to reports and data
 */

import db from "../db/drizzle";
import { admins, admin_villages, guards, residents } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Creates an Elysia hook to enforce role-based access control on a route.
 * It verifies the user's JWT, checks their role against the required roles,
 * and ensures their account is active.
 *
 * @param {string | string[]} [required="*"] - The role or roles required to access the route.
 *   A value of "*" allows any authenticated user. Defaults to "*".
 * @returns {Function} An Elysia hook function that performs the authorization checks.
 */
export const requireRole = (required: string | string[] = "*") => {
  const allowedRoles = Array.isArray(required) ? required : [required];

  return async (context: any) => {
    const { jwt, cookie, set } = context;
    const token = cookie.auth_token?.value;

    if (!token) {
      set.status = 401;
      return { error: "Unauthorized: No authentication token provided." };
    }

    let payload;
    try {
      payload = await jwt.verify(token);
    } catch {
      set.status = 401;
      return { error: "Unauthorized: The provided token is invalid." };
    }

    if (!payload?.id || !payload?.iat) {
      set.status = 401;
      return { error: "Unauthorized: The token payload is malformed." };
    }

    const tokenAgeInSeconds = Date.now() / 1000 - payload.iat;
    if (tokenAgeInSeconds > 7 * 24 * 60 * 60) { // 7-day expiry
      set.status = 401;
      return { error: "Unauthorized: The provided token has expired." };
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
    } else if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'staff') {
      user = await db.query.admins.findFirst({
        where: eq(admins.admin_id, payload.id),
      });
    }

    if (!user) {
      set.status = 401;
      return { error: "Unauthorized: User associated with the token not found." };
    }

    // Allow pending users for certain roles and endpoints
    // Only block disabled users
    if (user.status === "disable") {
      set.status = 403;
      return { error: "Forbidden: The user account is disabled." };
    }
    
    // For admin endpoints, require verified status
    if ((userRole === 'admin' || userRole === 'superadmin' || userRole === 'staff') && user.status !== "verified") {
      set.status = 403;
      return { error: "Forbidden: The user account is not active." };
    }

    if (required !== "*" && !allowedRoles.includes(userRole)) {
      console.log("Role check failed:", { userRole, allowedRoles, required });
      set.status = 403;
      return { error: "Forbidden: You do not have the required role to access this resource." };
    }

    // Get village_keys from admin_villages table
    let village_keys: string[] = [];
    if (userRole === 'admin' || userRole === 'superadmin') {
      if (userRole !== "superadmin" && 'admin_id' in user) {
        const adminVillages = await db.query.admin_villages.findMany({
          where: eq(admin_villages.admin_id, user.admin_id),
        });
        village_keys = adminVillages.map(av => av.village_key);
      }
    } else {
      // For guards and residents, use their village_key
      village_keys = user.village_key ? [user.village_key] : [];
    }

    // Add village_keys to currentUser
    context.currentUser = {
      ...user,
      role: userRole, // Ensure role is properly set for endpoint access
      village_keys,
    };
  };
};
