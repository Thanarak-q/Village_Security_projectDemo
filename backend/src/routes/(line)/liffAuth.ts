import { Elysia, t } from "elysia";
import { residents, guards, admins, villages, house_members, houses } from "../../db/schema";
import db from "../../db/drizzle";
import { eq } from "drizzle-orm";
import { validateLiffRegistration, sanitizeString, isValidEmail, isValidPhone, isValidVillageKey } from "../../utils/zodValidation";
import { notificationService } from "../../services/notificationService";
import { rateLimit } from "../../middleware/rateLimiter";
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
  .post("/verify", async ({ body, set, jwt, request, headers }: any) => {
    try {
      // Basic per-IP rate limit: 30 req/min per endpoint
      const limiter = rateLimit({ windowMs: 60_000, max: 30 });
      const limited = await limiter({ set, request });
      if (limited) return limited;

      const { 
        idToken, 
        role: requestRole,
        residentId,
        guardId,
        villageId,
        houseId
      } = body as { 
        idToken: string; 
        role?: 'resident' | 'guard';
        residentId?: string;
        guardId?: string;
        villageId?: string;
        houseId?: string;
      };

      // Validate input
      if (!idToken || typeof idToken !== 'string') {
        set.status = 400;
        return { success: false, error: "ID token is required and must be a string" };
      }

      if (requestRole && !['resident', 'guard'].includes(requestRole)) {
        set.status = 400;
        return { success: false, error: "Invalid role. Must be 'resident' or 'guard'" };
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
      // Note: Using unified LIFF system, role is determined by user's actual roles in database
      const isGuardRequest = requestRole === 'guard';
      const isResidentRequest = requestRole === 'resident';
      
      console.log('🔍 Role Detection:', {
        isGuardRequest,
        isResidentRequest,
        requestRole
      });

      // Both guard and resident use the same LINE channel ID
      const clientId = process.env.LINE_CHANNEL_ID;
      
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
        return { success: false, error: "Invalid ID token" };
      }

      const lineUserInfo = await verifyResponse.json();
      const lineUserId = lineUserInfo.sub;
      const channelId = lineUserInfo.aud; // Audience contains the channel ID

      // Validate audience strictly
      if (channelId !== clientId) {
        console.log('🔍 Token audience mismatch:', { expected: clientId, received: channelId });
        set.status = 401;
        return { success: false, error: "Token audience mismatch" };
      }

      // Check both tables to find the user and determine their role
      const residentRecords = await db.query.residents.findMany({
        where: eq(residents.line_user_id, lineUserId),
      });

      const guardRecords = await db.query.guards.findMany({
        where: eq(guards.line_user_id, lineUserId),
      });

      // Determine user's actual role(s)
      const existingRoles: string[] = [];
      if (guardRecords.length > 0) existingRoles.push('guard');
      if (residentRecords.length > 0) existingRoles.push('resident');

      if (existingRoles.length === 0) {
        // User not found in any table
        set.status = 404;
        return {
          success: false,
          error: "User not found. Please register first.",
          lineUserId,
        };
      }

      // If user has multiple roles, determine which one to use based on request context
      const selectResident = () => {
        if (residentRecords.length === 0) return null;
        if (residentId) {
          const match = residentRecords.find((r) => r.resident_id === residentId);
          if (match) return match;
        }
        if (villageId) {
          const match = residentRecords.find((r) => r.village_id === villageId);
          if (match) return match;
        }
        return residentRecords[0];
      };

      const selectGuard = () => {
        if (guardRecords.length === 0) return null;
        if (guardId) {
          const match = guardRecords.find((g) => g.guard_id === guardId);
          if (match) return match;
        }
        if (villageId) {
          const match = guardRecords.find((g) => g.village_id === villageId);
          if (match) return match;
        }
        return guardRecords[0];
      };

      let userRole: 'resident' | 'guard';
      let user: any;

      if (requestRole && existingRoles.includes(requestRole)) {
        userRole = requestRole;
        user = requestRole === 'guard' ? selectGuard() : selectResident();
      } else if (isGuardRequest && existingRoles.includes('guard')) {
        userRole = 'guard';
        user = selectGuard();
      } else if (isResidentRequest && existingRoles.includes('resident')) {
        userRole = 'resident';
        user = selectResident();
      } else {
        if (existingRoles.includes('guard')) {
          userRole = 'guard';
          user = selectGuard();
        } else {
          userRole = existingRoles[0] as 'resident' | 'guard';
          user = userRole === 'guard' ? selectGuard() : selectResident();
        }
      }

      if (!user) {
        set.status = 400;
        return {
          success: false,
          error: "Unable to determine user for the selected role",
        };
      }

      let selectedHouse: { house_id: string; address: string | null } | null = null;
      if (userRole === 'resident') {
        const residentIdForSelection = user.resident_id;
        if (!residentIdForSelection) {
          set.status = 400;
          return {
            success: false,
            error: "Resident record is missing required identifier",
          };
        }

        const residentHouseRows = await db
          .select({
            house_id: houses.house_id,
            address: houses.address,
          })
          .from(house_members)
          .innerJoin(houses, eq(house_members.house_id, houses.house_id))
          .where(eq(house_members.resident_id, residentIdForSelection));

        if (houseId) {
          selectedHouse = residentHouseRows.find((row) => row.house_id === houseId) || null;
          if (!selectedHouse) {
            set.status = 400;
            return {
              success: false,
              error: "Selected house is not associated with this resident",
            };
          }
        } else if (residentHouseRows.length === 1) {
          selectedHouse = residentHouseRows[0];
        }
      }

      // User found, create token and return user data
      const id = userRole === 'guard' ? (user as any).guard_id : (user as any).resident_id;
      const now = Math.floor(Date.now() / 1000);
      const tokenPayload: Record<string, any> = {
        id,
        lineUserId: user.line_user_id,
        role: userRole,
        village_id: user.village_id,
        iat: now,
        exp: now + 60 * 60, // 1 hour expiration
      };

      if (userRole === 'resident') {
        tokenPayload.resident_id = user.resident_id;
        tokenPayload.selected_house_id = selectedHouse?.house_id ?? null;
      } else if (userRole === 'guard') {
        tokenPayload.guard_id = user.guard_id;
      }

      const token = await jwt.sign(tokenPayload);

      // Set HttpOnly cookie for session
      const isProd = process.env.NODE_ENV === 'production';
      const cookie = [`liff_session=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', isProd ? 'Secure' : '', 'Max-Age=3600']
        .filter(Boolean)
        .join('; ');
      set.headers = { ...(set.headers || {}), 'Set-Cookie': cookie };

      const userResponse: Record<string, any> = {
        id,
        lineUserId: user.line_user_id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        phone: user.phone,
        village_id: user.village_id,
        status: user.status,
        line_profile_url: user.line_profile_url,
        role: userRole,
      };

      if (userRole === 'resident') {
        userResponse.resident_id = id;
        userResponse.selected_house_id = selectedHouse?.house_id ?? null;
        userResponse.selected_house_address = selectedHouse?.address ?? null;
      } else if (userRole === 'guard') {
        userResponse.guard_id = id;
      }

      return {
        success: true,
        user: userResponse,
        token,
        availableRoles: existingRoles, // All available roles
      };
    } catch (error) {
      console.error('LIFF verification error:', error);
      set.status = 500;
      return { success: false, error: "Internal server error" };
    }
  })

  // Register new user with LINE ID
  .post("/register", async ({ body, set, jwt, request, headers }: any) => {
    try {
      // Basic per-IP rate limit: 10 req/min per endpoint
      const limiter = rateLimit({ windowMs: 60_000, max: 10 });
      const limited = await limiter({ set, request });
      if (limited) return limited;
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
      // Note: Using unified LIFF system, role is determined by userType parameter
      const isGuardRequest = userType === 'guard';
      const isResidentRequest = userType === 'resident';

      const fullChannelId = process.env.LINE_CHANNEL_ID || '';
      const clientId = fullChannelId.split('-')[0]; // Extract client ID part
      
      console.log('🔍 Registration - Using Channel ID:', fullChannelId, 'Client ID:', clientId, 'for', isGuardRequest ? 'guard' : isResidentRequest ? 'resident' : 'default');

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
        return { success: false, error: "Invalid ID token" };
      }

      const lineUserInfo = await verifyResponse.json();
      const lineUserId = lineUserInfo.sub;
      const channelId = lineUserInfo.aud; // Audience contains the channel ID

      if (channelId !== clientId) {
        set.status = 401;
        return { success: false, error: "Token audience mismatch" };
      }

      // Use userType as the declared role
      const expectedRole: 'resident' | 'guard' = userType || 'resident';

      // Validate village_key existence server-side and get village_id
      let village = null;
      if (village_key) {
        village = await db.query.villages.findFirst({
          where: eq(villages.village_key, sanitizeString(village_key)),
        });
        if (!village) {
          set.status = 400;
          return { success: false, error: "Invalid village key" };
        }
      } else {
        set.status = 400;
        return { success: false, error: "Village key is required" };
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
          canRegisterAs: existingGuard ? [] : ['guard']
        };
      }

      if (userType === 'guard' && existingGuard) {
        set.status = 409;
        return { 
          error: "User already registered as guard",
          existingRoles: ['guard'],
          canRegisterAs: existingResident ? [] : ['resident']
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

      // Allow registration for any role since we're using unified authentication
      // No need to validate against expected role from channel

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
            village_id: village.village_id,
            status: "pending",
            line_profile_url: profile_image_url ? sanitizeString(profile_image_url) : null,
            move_in_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
          })
          .returning();

        // Create notification for new resident registration
        try {
          // Find admin for this village
          if (newResident.village_id) {
            const [villageAdmin] = await db
              .select()
              .from(admins)
              .where(eq(admins.village_id, newResident.village_id))
              .limit(1);

            if (villageAdmin) {
              await notificationService.notifyNewResidentRegistration({
                resident_id: newResident.resident_id,
                fname: newResident.fname,
                lname: newResident.lname,
                village_id: newResident.village_id,
              });
            }
          }
        } catch (notificationError) {
          console.error('Error creating registration notification:', notificationError);
        }

        // Generate JWT token for the new user
        const token = await jwt.sign({
          id: newResident.resident_id,
          lineUserId: newResident.line_user_id,
          role: "resident",
          village_id: newResident.village_id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60),
        });

        const isProd = process.env.NODE_ENV === 'production';
        const cookie = [`liff_session=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', isProd ? 'Secure' : '', 'Max-Age=3600']
          .filter(Boolean)
          .join('; ');
        set.headers = { ...(set.headers || {}), 'Set-Cookie': cookie };

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
            village_id: newResident.village_id,
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
            village_id: village.village_id,
            status: "pending",
            line_profile_url: profile_image_url ? sanitizeString(profile_image_url) : null,
          })
          .returning();

        // Create notification for new guard registration
        try {
          // Find admin for this village
          if (newGuard.village_id) {
            const [villageAdmin] = await db
              .select()
              .from(admins)
              .where(eq(admins.village_id, newGuard.village_id))
              .limit(1);

            if (villageAdmin && villageAdmin.admin_id) {
              await notificationService.notifyNewGuardRegistration({
                guard_id: newGuard.guard_id,
                fname: newGuard.fname,
                lname: newGuard.lname,
                village_id: newGuard.village_id,
              });
            }
          }
        } catch (notificationError) {
          console.error('Error creating registration notification:', notificationError);
        }

        // Generate JWT token for the new user
        const token = await jwt.sign({
          id: newGuard.guard_id,
          lineUserId: newGuard.line_user_id,
          role: "guard",
          village_id: newGuard.village_id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60),
        });

        const isProd = process.env.NODE_ENV === 'production';
        const cookie = [`liff_session=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', isProd ? 'Secure' : '', 'Max-Age=3600']
          .filter(Boolean)
          .join('; ');
        set.headers = { ...(set.headers || {}), 'Set-Cookie': cookie };

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
            village_id: newGuard.village_id,
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
        return { success: false, error: "Invalid user type" };
      }
    } catch (error) {
      console.error("LIFF registration error:", error);
      set.status = 500;
      return { success: false, error: "Internal server error" };
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
            village_id: resident.village_id,
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
            village_id: guard.village_id,
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
