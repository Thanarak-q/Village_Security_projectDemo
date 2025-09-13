import { Elysia, t } from "elysia";
import { residents, guards } from "../../db/schema";
import db from "../../db/drizzle";
import { eq } from "drizzle-orm";
// JWT will be handled by Elysia's built-in JWT plugin

/**
 * Determines the user role based on the LINE channel ID or request origin.
 * @param channelId - The LINE channel ID from the ID token
 * @param requestOrigin - The origin of the request (optional)
 * @returns The user role ('resident' or 'guard')
 */
const getUserRole = (channelId: string, requestOrigin?: string): 'resident' | 'guard' => {
  // Check if role can be determined from channel ID (legacy support)
  if (channelId === process.env.RESIDENT_LINE_CHANNEL_ID) return 'resident';
  if (channelId === process.env.GUARD_LINE_CHANNEL_ID) return 'guard';
  if (channelId === process.env.LINE_CHANNEL_ID) return 'resident'; // Default to resident for backward compatibility
  
  // For LINE Login channels, determine role from request origin or default to resident
  if (channelId === process.env.LINE_LOGIN_CLIENT_ID) {
    return 'resident';
  }
  
  // Fallback to resident for unknown channels
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

      if (!idToken) {
        set.status = 400;
        return { error: "ID token is required" };
      }

      // Since both guard and resident LIFF apps use the same LINE channel ID,
      // we'll always use the main LINE_CHANNEL_ID for verification
      const clientId = process.env.LINE_CHANNEL_ID;
      const origin = headers.origin || '';
      const referer = headers.referer || '';
      
      // Determine the expected role based on request context
      const isGuardRequest = requestRole === 'guard' || 
                           origin.includes('/liff/guard') || origin.includes('guard') || 
                           referer.includes('/liff/guard') || referer.includes('guard');
      const isResidentRequest = requestRole === 'resident' || 
                              origin.includes('/liff/resident') || origin.includes('resident') || 
                              referer.includes('/liff/resident') || referer.includes('resident');

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
        // Fallback to channel ID detection
        expectedRole = getUserRole(channelId);
      }

      // Check if user exists in residents table
      const resident = await db.query.residents.findFirst({
        where: eq(residents.line_user_id, lineUserId),
      });

      if (resident) {
        // Verify that the user is using the correct bot for their role
        if (expectedRole !== 'resident') {
          set.status = 403;
          return { 
            success: false,
            error: "You are registered as a resident. Please use the resident bot.",
            expectedRole: 'resident'
          };
        }

        // User is a resident
        const token = await jwt.sign({
          id: resident.resident_id,
          lineUserId: resident.line_user_id,
          role: "resident",
          village_key: resident.village_key,
          iat: Math.floor(Date.now() / 1000),
        });

        return {
          success: true,
          user: {
            id: resident.resident_id,
            lineUserId: resident.line_user_id,
            email: resident.email,
            fname: resident.fname,
            lname: resident.lname,
            username: resident.username,
            phone: resident.phone,
            village_key: resident.village_key,
            status: resident.status,
            profile_image_url: resident.profile_image_url,
            role: "resident",
          },
          token,
        };
      }

      // Check if user exists in guards table
      const guard = await db.query.guards.findFirst({
        where: eq(guards.line_user_id, lineUserId),
      });

      if (guard) {
        // Verify that the user is using the correct bot for their role
        if (expectedRole !== 'guard') {
          set.status = 403;
          return { 
            success: false,
            error: "You are registered as a guard. Please use the guard bot.",
            expectedRole: 'guard'
          };
        }

        // User is a guard
        const token = await jwt.sign({
          id: guard.guard_id,
          lineUserId: guard.line_user_id,
          role: "guard",
          village_key: guard.village_key,
          iat: Math.floor(Date.now() / 1000),
        });

        return {
          success: true,
          user: {
            id: guard.guard_id,
            lineUserId: guard.line_user_id,
            email: guard.email,
            fname: guard.fname,
            lname: guard.lname,
            username: guard.username,
            phone: guard.phone,
            village_key: guard.village_key,
            status: guard.status,
            profile_image_url: guard.profile_image_url,
            role: "guard",
          },
          token,
        };
      }

      // User not found in database
      set.status = 404;
      return {
        success: false,
        error: "User not found. Please register first.",
        lineUserId,
      };
    } catch (error) {
      console.error("LIFF verification error:", error);
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
        role
      } = body as {
        idToken: string;
        email: string;
        fname: string;
        lname: string;
        phone: string;
        village_key: string;
        userType: "resident" | "guard";
        profile_image_url: string;
        role?: "resident" | "guard"; // Optional role parameter for LINE Login channels
      };

      if (!idToken) {
        set.status = 400;
        return { error: "ID token is required" };
      }

      // Since both guard and resident LIFF apps use the same LINE channel ID,
      // we'll always use the main LINE_CHANNEL_ID for verification
      const clientId = process.env.LINE_CHANNEL_ID;
      const origin = headers.origin || '';
      const referer = headers.referer || '';
      
      // Determine the expected role based on request context or userType
      const isGuardRequest = userType === 'guard' || 
                           origin.includes('/liff/guard') || origin.includes('guard') || 
                           referer.includes('/liff/guard') || referer.includes('guard');
      const isResidentRequest = userType === 'resident' || 
                              origin.includes('/liff/resident') || origin.includes('resident') || 
                              referer.includes('/liff/resident') || referer.includes('resident');

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

      // Determine user role based on request context or provided role parameter
      let expectedRole: 'resident' | 'guard';
      if (isGuardRequest) {
        expectedRole = 'guard';
      } else if (isResidentRequest) {
        expectedRole = 'resident';
      } else {
        expectedRole = role || getUserRole(channelId);
      }

      // Check if user already exists
      const existingResident = await db.query.residents.findFirst({
        where: eq(residents.line_user_id, lineUserId),
      });

      const existingGuard = await db.query.guards.findFirst({
        where: eq(guards.line_user_id, lineUserId),
      });

      if (existingResident || existingGuard) {
        set.status = 409;
        return { error: "User already registered" };
      }

      // Check if email already exists in both tables
      const existingEmailResident = await db.query.residents.findFirst({
        where: eq(residents.email, email),
      });

      const existingEmailGuard = await db.query.guards.findFirst({
        where: eq(guards.email, email),
      });

      if (existingEmailResident || existingEmailGuard) {
        set.status = 409;
        return { error: "Email already exists" };
      }

      // Validate that the userType matches the expected role from the channel
      if (userType !== expectedRole) {
        set.status = 400;
        return { 
          error: `Invalid user type. This LINE bot is for ${expectedRole}s only.`,
          expectedUserType: expectedRole
        };
      }

      // Generate username from LINE user ID (unique identifier)
      const generatedUsername = `user_${lineUserId}`;

      // Create new user based on type
      if (userType === "resident") {
        const [newResident] = await db
          .insert(residents)
          .values({
            line_user_id: lineUserId,
            email,
            fname,
            lname,
            username: generatedUsername,
            password_hash: "", // No password needed for LINE login
            phone,
            village_key,
            status: "pending",
            profile_image_url: profile_image_url || null,
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
          message: "Resident registered successfully",
          user: {
            id: newResident.resident_id,
            lineUserId: newResident.line_user_id,
            email: newResident.email,
            fname: newResident.fname,
            lname: newResident.lname,
            username: newResident.username,
            phone: newResident.phone,
            village_key: newResident.village_key,
            status: newResident.status,
            profile_image_url: newResident.profile_image_url,
            role: "resident",
          },
          token,
        };
      } else if (userType === "guard") {
        const [newGuard] = await db
          .insert(guards)
          .values({
            line_user_id: lineUserId,
            email,
            fname,
            lname,
            username: generatedUsername,
            password_hash: "", // No password needed for LINE login
            phone,
            village_key,
            status: "pending",
            profile_image_url: profile_image_url || null,
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
          message: "Guard registered successfully",
          user: {
            id: newGuard.guard_id,
            lineUserId: newGuard.line_user_id,
            email: newGuard.email,
            fname: newGuard.fname,
            lname: newGuard.lname,
            username: newGuard.username,
            phone: newGuard.phone,
            village_key: newGuard.village_key,
            status: newGuard.status,
            profile_image_url: newGuard.profile_image_url,
            role: "guard",
          },
          token,
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
            username: resident.username,
            phone: resident.phone,
            village_key: resident.village_key,
            status: resident.status,
            profile_image_url: resident.profile_image_url,
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
            username: guard.username,
            phone: guard.phone,
            village_key: guard.village_key,
            status: guard.status,
            profile_image_url: guard.profile_image_url,
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
