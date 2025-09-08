/**
 * @file This file provides a middleware for role-based access control (RBAC).
 *
 * The `requireRole` function is an Elysia hook that can be used to protect routes
 * by ensuring that the authenticated user has the necessary role(s) to access them.
 * It performs comprehensive security checks, including token validation, payload verification,
 * token age checks, and user account status verification.
 */

import db from "../db/drizzle";
import { admins } from "../db/schema";
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

    const user = await db.query.admins.findFirst({
      where: eq(admins.admin_id, payload.id),
    });

    if (!user) {
      set.status = 401;
      return { error: "Unauthorized: User associated with the token not found." };
    }

    if (user.status !== "verified") {
      set.status = 403;
      return { error: "Forbidden: The user account is not active." };
    }

    if (required !== "*" && !allowedRoles.includes(user.role)) {
      set.status = 403;
      return { error: "Forbidden: You do not have the required role to access this resource." };
    }

    context.currentUser = user;
  };
};
