import { Elysia, t } from "elysia";
import { residents, guards } from "../../db/schema";
import db from "../../db/drizzle";
import { eq } from "drizzle-orm";
import { validateLiffRegistration, sanitizeString, isValidEmail, isValidPhone, isValidVillageKey } from "../../utils/zodValidation";
// JWT will be handled by Elysia's built-in JWT plugin

/**
 * Determines the user role based on the LINE channel ID or request origin.
 * @param channelId - The LINE channel ID from the ID token
 * @param requestOrigin - The origin of the request (optional)
 * @returns The user role ('resident' or 'guard')
 */
const getUserRole = (channelId: string, requestOrigin?: string): 'resident' | 'guard' => {
  // Since both guard and resident use the same channel ID, we can't determine role from channel alone
  // Role will be determined by request context (URL path, userType parameter, etc.)
  // This function is kept for backward compatibility but won't be used for role determination
  
  // Default to resident for unknown channels
  return 'resident';
};

// LINE LIFF Authentication Routes
export const liffAuthRoutes = new Elysia({ prefix: "/api/liff" })

  // Test route to verify the API is working
  .get("/test", () => {
    return { message: "LIFF API is working!", timestamp: new Date().toISOString() };
  })

  // Verify LINE ID Token and authenticate user
  .post("/verify", async ({ body, set, jwt, headers }: any) => {
    try {
      const { idToken, role: requestRole } = body as { idToken: string; role?: 'resident' | 'guard' };

      // Validate input
      if (!idToken || typeof idToken !== 'string') {
        set.status = 400;
        return { error: "ID token is required and must be a string" };
      }

      if (requestRole && !['resident', 'guard'].includes(requestRole)) {
        set.status = 400;
        return { error: "Invalid role. Must be 'resident' or 'guard'" };
      }

      const origin = headers.origin || '';
      const referer = headers.referer || '';
      
      // Debug logging
      console.log('🔍 LIFF Verify Debug:', {
        requestRole,
        origin,
        referer,
        userAgent: headers['user-agent'] || 'unknown'
      });
      
      // Determine the expected role based on request context
      const isGuardRequest = requestRole === 'guard' || 
                           origin.includes('/liff/guard') || origin.includes('guard') || 
                           referer.includes('/liff/guard') || referer.includes('guard');
      const isResidentRequest = requestRole === 'resident' || 
                              origin.includes('/liff/resident') || origin.includes('resident') || 
                              referer.includes('/liff/resident') || referer.includes('resident');
      
      console.log('🔍 Role Detection:', {
        isGuardRequest,
        isResidentRequest,
        requestRole
      });

      // Both guard and resident use the same LINE channel ID
      const clientId = process.env.LINE_CHANNEL_ID || '2008071362';
      
      console.log('🔍 Using Channel ID:', clientId, 'for', isGuardRequest ? 'guard' : isResidentRequest ? 'resident' : 'default');

      // Verify LINE ID token with LINE API
      
      const verifyResponse = await fetch("https://api.line.me/oauth2/v2.1/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: clientId!,
        }),
      });

      if (!verifyResponse.ok) {
        set.status = 401;
        return { error: "Invalid ID token" };
      }

      const lineUserInfo = await verifyResponse.json();
      const lineUserId = lineUserInfo.sub;
      const channelId = lineUserInfo.aud; // Audience contains the channel ID

      // Determine user role based on request context since both LIFF apps use same channel ID
      let expectedRole: 'resident' | 'guard';
      if (isGuardRequest) {
        expectedRole = 'guard';
      } else if (isResidentRequest) {
        expectedRole = 'resident';
      } else {
        // Fallback: if no clear context, use the role parameter from the request
        expectedRole = requestRole || 'resident';
      }
      
      console.log('🔍 Final Expected Role:', expectedRole);

      // Check only the relevant table based on expected role
      let user = null;
      let userRole = expectedRole;
      
      if (expectedRole === 'guard') {
        user = await db.query.guards.findFirst({
          where: eq(guards.line_user_id, lineUserId),
        });
      } else if (expectedRole === 'resident') {
        user = await db.query.residents.findFirst({
          where: eq(residents.line_user_id, lineUserId),
        });
      }

      if (!user) {
        // User not found in the expected table
        set.status = 404;
        return {
          success: false,
          error: "User not found. Please register first.",
          lineUserId,
        };
      }

      // User found in the expected table, create token and return user data
      const id = userRole === 'guard' ? (user as any).guard_id : (user as any).resident_id;
      const token = await jwt.sign({
        id,
        lineUserId: user.line_user_id,
        role: userRole,
        village_key: user.village_key,
        iat: Math.floor(Date.now() / 1000),
      });

      return {
        success: true,
        user: {
          id: id,
          lineUserId: user.line_user_id,
          email: user.email,
          fname: user.fname,
          lname: user.lname,
          phone: user.phone,
          village_key: user.village_key,
          status: user.status,
          line_profile_url: user.line_profile_url,
          role: userRole,
        },
        token,
        availableRoles: [userRole], // Single role
      };
    } catch (error) {
      console.error('LIFF verification error:', error);
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  // Register new user with LINE ID
  .post("/register", async ({ body, set, jwt, headers }: any) => {
    try {
      const {
        idToken,
        email,
        fname,
        lname,
        phone,
        village_key,
        userType,
        profile_image_url,
        line_display_name
      } = body as {
        idToken: string;
        email: string;
        fname: string;
        lname: string;
        phone: string;
        village_key: string;
        userType: "resident" | "guard";
        profile_image_url: string;
        line_display_name?: string;
      };

      // Validate input data using Zod
      const validation = validateLiffRegistration({
        idToken,
        email: sanitizeString(email),
        fname: sanitizeString(fname),
        lname: sanitizeString(lname),
        phone: sanitizeString(phone),
        village_key: sanitizeString(village_key),
        userType,
        profile_image_url
      });

      if (!validation.isValid) {
        set.status = 400;
        return { 
          error: "Validation failed", 
          details: validation.errors,
          fieldErrors: validation.errors.reduce((acc, err) => {
            acc[err.field] = err.message;
            return acc;
          }, {} as Record<string, string>)
        };
      }

      if (!idToken) {
        set.status = 400;
        return { error: "ID token is required" };
      }

      const origin = headers.origin || '';
      const referer = headers.referer || '';
      
      // Determine the expected role based on request context or userType
      // Prioritize userType parameter as it's more reliable than URL parsing
      const isGuardRequest = userType === 'guard' || 
                           (userType !== 'resident' && (
                             origin.includes('/liff/guard') || origin.includes('guard') || 
                             referer.includes('/liff/guard') || referer.includes('guard')
                           ));
      const isResidentRequest = userType === 'resident' || 
                              (userType !== 'guard' && (
                                origin.includes('/liff/resident') || origin.includes('resident') || 
                                referer.includes('/liff/resident') || referer.includes('resident')
                              ));

      const clientId = process.env.LINE_CHANNEL_ID || '2008071362';
      
      console.log('🔍 Registration - Using Channel ID:', clientId, 'for', isGuardRequest ? 'guard' : isResidentRequest ? 'resident' : 'default');

      // Verify LINE ID token
      
      const verifyResponse = await fetch("https://api.line.me/oauth2/v2.1/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: clientId!,
        }),
      });

      if (!verifyResponse.ok) {
        set.status = 401;
        return { error: "Invalid ID token" };
      }

      const lineUserInfo = await verifyResponse.json();
      const lineUserId = lineUserInfo.sub;
      const channelId = lineUserInfo.aud; // Audience contains the channel ID

      // Determine user role based on request context or userType
      let expectedRole: 'resident' | 'guard';
      if (isGuardRequest) {
        expectedRole = 'guard';
      } else if (isResidentRequest) {
        expectedRole = 'resident';
      } else {
        // Fallback: use the userType from the request
        expectedRole = userType || 'resident';
      }

      // Check if user already exists in the specific role they're trying to register for
      const existingResident = await db.query.residents.findFirst({
        where: eq(residents.line_user_id, lineUserId),
      });

      const existingGuard = await db.query.guards.findFirst({
        where: eq(guards.line_user_id, lineUserId),
      });

      // Check if user is already registered for the specific role they're trying to register for
      if (userType === 'resident' && existingResident) {
        set.status = 409;
        return { 
          error: "User already registered as resident",
          existingRoles: ['resident'],
          canRegisterAs: ['guard']
        };
      }

      if (userType === 'guard' && existingGuard) {
        set.status = 409;
        return { 
          error: "User already registered as guard",
          existingRoles: ['guard'],
          canRegisterAs: ['resident']
        };
      }

      // Check if user has other roles (for better UX)
      const existingRoles: string[] = [];
      const canRegisterAs: string[] = [];
      
      if (existingResident) existingRoles.push('resident');
      if (existingGuard) existingRoles.push('guard');
      
      if (!existingResident) canRegisterAs.push('resident');
      if (!existingGuard) canRegisterAs.push('guard');

      // Note: Email and username can be reused across different roles (different tables)
      // Same person can have different roles with same personal information

      // Validate that the userType matches the expected role from the channel
      // Only enforce this if we have a clear expected role and userType mismatch
      if (expectedRole && userType !== expectedRole && (isGuardRequest || isResidentRequest)) {
        set.status = 400;
        return { 
          error: `Invalid user type. This LINE bot is for ${expectedRole}s only.`,
          expectedUserType: expectedRole
        };
      }

      // Create new user based on type
      if (userType === "resident") {
        const [newResident] = await db
          .insert(residents)
          .values({
            line_user_id: lineUserId,
            line_display_name: line_display_name ? sanitizeString(line_display_name) : null,
            email: sanitizeString(email),
            fname: sanitizeString(fname),
            lname: sanitizeString(lname),
            phone: sanitizeString(phone),
            village_key: sanitizeString(village_key),
            status: "pending",
            line_profile_url: profile_image_url ? sanitizeString(profile_image_url) : null,
            move_in_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
          })
          .returning();

        // Generate JWT token for the new user
        const token = await jwt.sign({
          id: newResident.resident_id,
          lineUserId: newResident.line_user_id,
          role: "resident",
          village_key: newResident.village_key,
          iat: Math.floor(Date.now() / 1000),
        });

        return {
          success: true,
          message: existingRoles.length > 0 
            ? `Registration successful! You are now registered as both ${existingRoles.join(' and ')} and resident.`
            : "Resident registered successfully",
          user: {
            id: newResident.resident_id,
            lineUserId: newResident.line_user_id,
            email: newResident.email,
            fname: newResident.fname,
            lname: newResident.lname,
            phone: newResident.phone,
            village_key: newResident.village_key,
            status: newResident.status,
            line_profile_url: newResident.line_profile_url,
            role: "resident",
          },
          token,
          existingRoles: existingRoles,
          canRegisterAs: canRegisterAs,
        };
      } else if (userType === "guard") {
        const [newGuard] = await db
          .insert(guards)
          .values({
            line_user_id: lineUserId,
            line_display_name: line_display_name ? sanitizeString(line_display_name) : null,
            email: sanitizeString(email),
            fname: sanitizeString(fname),
            lname: sanitizeString(lname),
            phone: sanitizeString(phone),
            village_key: sanitizeString(village_key),
            status: "pending",
            line_profile_url: profile_image_url ? sanitizeString(profile_image_url) : null,
          })
          .returning();

        // Generate JWT token for the new user
        const token = await jwt.sign({
          id: newGuard.guard_id,
          lineUserId: newGuard.line_user_id,
          role: "guard",
          village_key: newGuard.village_key,
          iat: Math.floor(Date.now() / 1000),
        });

        return {
          success: true,
          message: existingRoles.length > 0 
            ? `Registration successful! You are now registered as both ${existingRoles.join(' and ')} and guard.`
            : "Guard registered successfully",
          user: {
            id: newGuard.guard_id,
            lineUserId: newGuard.line_user_id,
            email: newGuard.email,
            fname: newGuard.fname,
            lname: newGuard.lname,
            phone: newGuard.phone,
            village_key: newGuard.village_key,
            status: newGuard.status,
            line_profile_url: newGuard.line_profile_url,
            role: "guard",
          },
          token,
          existingRoles: existingRoles,
          canRegisterAs: canRegisterAs,
        };
      } else {
        set.status = 400;
        return { error: "Invalid user type" };
      }
    } catch (error) {
      console.error("LIFF registration error:", error);
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  // Get user profile by LINE user ID
  .get("/profile/:lineUserId", async ({ params, set }: any) => {
    try {
      const { lineUserId } = params;

      // Check residents table
      const resident = await db.query.residents.findFirst({
        where: eq(residents.line_user_id, lineUserId),
      });

      if (resident) {
        return {
          success: true,
          user: {
            id: resident.resident_id,
            lineUserId: resident.line_user_id,
            email: resident.email,
            fname: resident.fname,
            lname: resident.lname,
            phone: resident.phone,
            village_key: resident.village_key,
            status: resident.status,
            line_profile_url: resident.line_profile_url,
            role: "resident",
          },
        };
      }

      // Check guards table
      const guard = await db.query.guards.findFirst({
        where: eq(guards.line_user_id, lineUserId),
      });

      if (guard) {
        return {
          success: true,
          user: {
            id: guard.guard_id,
            lineUserId: guard.line_user_id,
            email: guard.email,
            fname: guard.fname,
            lname: guard.lname,
            phone: guard.phone,
            village_key: guard.village_key,
            status: guard.status,
            line_profile_url: guard.line_profile_url,
            role: "guard",
          },
        };
      }

      set.status = 404;
      return { error: "User not found" };
    } catch (error) {
      console.error("Get profile error:", error);
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
