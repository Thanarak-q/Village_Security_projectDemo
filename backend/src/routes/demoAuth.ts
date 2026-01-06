/**
 * @file Demo Authentication Routes
 * Mock authentication for demo mode without LINE LIFF
 */

import { Elysia, t } from "elysia";
import { guards, residents, villages, houses, admins } from "../db/schema";
import db from "../db/drizzle";
import { eq } from "drizzle-orm";

// Check if demo mode is enabled
const isDemoMode = process.env.DEMO_MODE === 'true';

/**
 * Demo authentication routes for testing without LINE LIFF
 */
export const demoAuthRoutes = new Elysia({ prefix: "/api/auth/demo" })
    /**
     * Get available demo users (guards and residents)
     */
    .get("/users", async ({ set }) => {
        if (!isDemoMode) {
            set.status = 403;
            return { error: "Demo mode is not enabled" };
        }

        try {
            // Get all guards with village info
            const guardsList = await db
                .select({
                    id: guards.guard_id,
                    fname: guards.fname,
                    lname: guards.lname,
                    email: guards.email,
                    village_id: guards.village_id,
                    status: guards.status,
                })
                .from(guards)
                .where(eq(guards.status, 'verified'));

            // Get all residents with village info
            const residentsList = await db
                .select({
                    id: residents.resident_id,
                    fname: residents.fname,
                    lname: residents.lname,
                    email: residents.email,
                    village_id: residents.village_id,
                    status: residents.status,
                })
                .from(residents)
                .where(eq(residents.status, 'verified'));

            // Get all villages for reference
            const villagesList = await db
                .select({
                    village_id: villages.village_id,
                    village_name: villages.village_name,
                    village_key: villages.village_key,
                })
                .from(villages);

            // Get all admins (for demo, no password verification needed)
            const adminsList = await db
                .select({
                    id: admins.admin_id,
                    username: admins.username,
                    email: admins.email,
                    role: admins.role,
                    village_id: admins.village_id,
                    status: admins.status,
                })
                .from(admins)
                .where(eq(admins.status, 'verified'));

            return {
                success: true,
                demo_mode: true,
                guards: guardsList.map(g => ({
                    ...g,
                    role: 'guard',
                    display: `${g.fname} ${g.lname} (${villagesList.find(v => v.village_id === g.village_id)?.village_name || 'Unknown'})`,
                })),
                residents: residentsList.map(r => ({
                    ...r,
                    role: 'resident',
                    display: `${r.fname} ${r.lname} (${villagesList.find(v => v.village_id === r.village_id)?.village_name || 'Unknown'})`,
                })),
                admins: adminsList.map(a => ({
                    ...a,
                    fname: a.username, // Use username as display name for admins
                    lname: `(${a.role})`,
                    display: `${a.username} - ${a.role} ${a.village_id ? `(${villagesList.find(v => v.village_id === a.village_id)?.village_name || 'Village'})` : '(Super Admin)'}`,
                })),
                villages: villagesList,
            };
        } catch (error) {
            console.error('Error fetching demo users:', error);
            set.status = 500;
            return { error: 'Failed to fetch demo users' };
        }
    })

    /**
     * Login as a demo user (guard or resident)
     */
    .post("/login", async ({ body, jwt, set }: any) => {
        if (!isDemoMode) {
            set.status = 403;
            return { error: "Demo mode is not enabled" };
        }

        const { role, user_id } = body;

        if (!role || !user_id) {
            set.status = 400;
            return { error: "role and user_id are required" };
        }

        try {
            let user = null;
            let userId = null;
            let adminRole = null; // Track admin role type

            if (role === 'guard') {
                user = await db.query.guards.findFirst({
                    where: eq(guards.guard_id, user_id),
                });
                userId = user?.guard_id;
            } else if (role === 'resident') {
                user = await db.query.residents.findFirst({
                    where: eq(residents.resident_id, user_id),
                });
                userId = user?.resident_id;
            } else if (role === 'admin' || role === 'staff' || role === 'superadmin') {
                user = await db.query.admins.findFirst({
                    where: eq(admins.admin_id, user_id),
                });
                userId = user?.admin_id;
                adminRole = user?.role; // Store the actual admin role
            }

            if (!user) {
                set.status = 404;
                return { error: "User not found" };
            }

            if (user.status === 'disable') {
                set.status = 403;
                return { error: "User account is disabled" };
            }

            // Ensure we have a valid userId
            if (!userId) {
                set.status = 500;
                return { error: "Failed to get user ID" };
            }

            // Determine the actual role for the token (use adminRole for admin types)
            const tokenRole = adminRole || role;

            // Create JWT token (same format as LIFF auth)
            const token = await jwt.sign({
                id: userId,
                role: tokenRole,
                iat: Math.floor(Date.now() / 1000),
                demo: true, // Mark as demo token
            });

            // Set cookie (compatible with existing LIFF auth)
            // For admin roles, also set auth_token cookie for dashboard access
            const cookies = [];

            // LIFF session cookie for guard/resident
            cookies.push([
                `liff_session=${token}`,
                "HttpOnly",
                "Path=/",
                `Max-Age=${60 * 60 * 24}`, // 24 hours for demo
                "SameSite=Lax",
                process.env.NODE_ENV === "production" ? "Secure" : "",
            ].filter(Boolean).join("; "));

            // For admin roles, also set auth_token for dashboard access
            if (adminRole) {
                cookies.push([
                    `auth_token=${token}`,
                    "HttpOnly",
                    "Path=/",
                    `Max-Age=${60 * 60 * 24}`,
                    "SameSite=Lax",
                    process.env.NODE_ENV === "production" ? "Secure" : "",
                ].filter(Boolean).join("; "));
            }

            set.headers = {
                ...set.headers,
                "Set-Cookie": cookies.join(", "),
            };

            // Get village info
            let village_info = null;
            if (user.village_id) {
                village_info = await db.query.villages.findFirst({
                    where: eq(villages.village_id, user.village_id),
                });
            }

            // Build response based on user type
            const isAdmin = !!adminRole;
            const userResponse: Record<string, unknown> = {
                id: userId,
                admin_id: isAdmin ? userId : undefined,
                guard_id: role === 'guard' ? userId : undefined,
                resident_id: role === 'resident' ? userId : undefined,
                fname: isAdmin ? (user as any).username : (user as any).fname,
                lname: isAdmin ? `(${adminRole})` : (user as any).lname,
                email: user.email,
                username: isAdmin ? (user as any).username : undefined,
                role: tokenRole,
                village_id: user.village_id,
                village_name: village_info?.village_name,
                status: user.status,
            };

            return {
                success: true,
                demo_mode: true,
                user: userResponse,
            };
        } catch (error) {
            console.error('Demo login error:', error);
            set.status = 500;
            return { error: "Demo login failed" };
        }
    }, {
        body: t.Object({
            role: t.String(),
            user_id: t.String(),
        }),
    })

    /**
     * Get current demo session user
     */
    .get("/me", async ({ jwt, cookie, set }: any) => {
        if (!isDemoMode) {
            set.status = 403;
            return { error: "Demo mode is not enabled" };
        }

        const token = cookie.liff_session?.value;

        if (!token) {
            set.status = 401;
            return { error: "No demo session found", authenticated: false };
        }

        let payload;
        try {
            payload = await jwt.verify(token);
        } catch {
            set.status = 401;
            return { error: "Invalid demo session", authenticated: false };
        }

        if (!payload?.id || !payload?.role) {
            set.status = 401;
            return { error: "Invalid session payload", authenticated: false };
        }

        try {
            let user = null;

            if (payload.role === 'guard') {
                user = await db.query.guards.findFirst({
                    where: eq(guards.guard_id, payload.id),
                });
            } else if (payload.role === 'resident') {
                user = await db.query.residents.findFirst({
                    where: eq(residents.resident_id, payload.id),
                });
            }

            if (!user) {
                set.status = 404;
                return { error: "User not found" };
            }

            // Get village info
            let village_info = null;
            if (user.village_id) {
                village_info = await db.query.villages.findFirst({
                    where: eq(villages.village_id, user.village_id),
                });
            }

            return {
                authenticated: true,
                demo_mode: true,
                id: payload.role === 'guard' ? (user as any).guard_id : (user as any).resident_id,
                fname: user.fname,
                lname: user.lname,
                email: user.email,
                role: payload.role,
                village_id: user.village_id,
                village_ids: user.village_id ? [user.village_id] : [],
                village_name: village_info?.village_name,
                villages: village_info ? [{
                    village_id: village_info.village_id,
                    village_key: village_info.village_key,
                    village_name: village_info.village_name,
                }] : [],
                status: user.status,
                username: `${user.fname} ${user.lname}`,
                guard_id: payload.role === 'guard' ? (user as any).guard_id : undefined,
                resident_id: payload.role === 'resident' ? (user as any).resident_id : undefined,
            };
        } catch (error) {
            console.error('Error fetching demo user:', error);
            set.status = 500;
            return { error: "Failed to fetch user info" };
        }
    })

    /**
     * Logout demo session
     */
    .post("/logout", ({ set }: any) => {
        set.headers = {
            ...set.headers,
            "Set-Cookie": `liff_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
        };
        return { success: true, demo_mode: true };
    })
    .get("/logout", ({ set }: any) => {
        set.headers = {
            ...set.headers,
            "Set-Cookie": `liff_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
        };
        return { success: true, demo_mode: true };
    })

    /**
     * Check if demo mode is enabled
     */
    .get("/status", () => {
        return {
            demo_mode: isDemoMode,
            message: isDemoMode
                ? "Demo mode is enabled. Use /api/auth/demo/users to get available demo users."
                : "Demo mode is disabled. Set DEMO_MODE=true in .env to enable.",
        };
    });
