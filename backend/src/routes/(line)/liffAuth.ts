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
    // Default to resident for LINE Login channel
    return 'resident';
  }
  
  // Fallback to resident for unknown channels
  console.warn(`Unknown channel for channel ID: ${channelId}, defaulting to resident`);
  return 'resident';
};

// LINE LIFF Authentication Routes
export const liffAuthRoutes = new Elysia({ prefix: "/api/liff" })

  // Test route to verify the API is working
  .get("/test", () => {
    return { message: "LIFF API is working!", timestamp: new Date().toISOString() };
  })

  // Verify LINE ID Token and authenticate user
  .post("/verify", async ({ body, set, jwt }: any) => {
    try {
      console.log('🔍 LIFF verify endpoint called');
      console.log('🔍 Request body:', body);
      console.log('🔍 Body type:', typeof body);
      
      const { idToken } = body as { idToken: string };
      console.log('🔍 Extracted idToken:', idToken ? 'present' : 'missing');

      if (!idToken) {
        console.log('❌ No ID token provided');
        set.status = 400;
        return { error: "ID token is required" };
      }

      // Verify LINE ID token with LINE API
      console.log('🔍 Verifying with LINE API...');
      console.log('🔍 LINE_CHANNEL_ID:', process.env.LINE_CHANNEL_ID);
      
      const verifyResponse = await fetch("https://api.line.me/oauth2/v2.1/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: process.env.LINE_CHANNEL_ID!,
        }),
      });

      console.log('🔍 LINE API response status:', verifyResponse.status);
      console.log('🔍 LINE API response ok:', verifyResponse.ok);

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.log('❌ LINE API error response:', errorText);
        set.status = 401;
        return { error: "Invalid ID token" };
      }

      const lineUserInfo = await verifyResponse.json();
      const lineUserId = lineUserInfo.sub;
      const channelId = lineUserInfo.aud; // Audience contains the channel ID

      // Determine user role based on the LINE channel ID
      const expectedRole = getUserRole(channelId);
      console.log('🔍 Expected role determined:', expectedRole, 'for channel ID:', channelId);

      // Check if user exists in residents table
      console.log('🔍 Checking residents table for lineUserId:', lineUserId);
      const resident = await db.query.residents.findFirst({
        where: eq(residents.line_user_id, lineUserId),
      });

      if (resident) {
        console.log('✅ Found resident in database:', resident.resident_id);
        
        // Verify that the user is using the correct bot for their role
        if (expectedRole !== 'resident') {
          console.log('❌ Role mismatch: user is resident but using', expectedRole, 'bot');
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
      console.log('🔍 Checking guards table for lineUserId:', lineUserId);
      const guard = await db.query.guards.findFirst({
        where: eq(guards.line_user_id, lineUserId),
      });

      if (guard) {
        console.log('✅ Found guard in database:', guard.guard_id);
        
        // Verify that the user is using the correct bot for their role
        if (expectedRole !== 'guard') {
          console.log('❌ Role mismatch: user is guard but using', expectedRole, 'bot');
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
      console.log('❌ User not found in database, lineUserId:', lineUserId);
      set.status = 404;
      const response = {
        success: false,
        error: "User not found. Please register first.",
        lineUserId,
      };
      console.log('🔍 Returning response:', response);
      return response;
    } catch (error) {
      console.error("LIFF verification error:", error);
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  // Register new user with LINE ID
  .post("/register", async ({ body, set, jwt }: any) => {
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

      // Verify LINE ID token
      console.log('🔍 LINE_CHANNEL_ID:', process.env.LINE_CHANNEL_ID);
      console.log('🔍 ID Token (first 50 chars):', idToken.substring(0, 50) + '...');
      
      const verifyResponse = await fetch("https://api.line.me/oauth2/v2.1/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: process.env.LINE_CHANNEL_ID!,
        }),
      });

      console.log('🔍 LINE API Response Status:', verifyResponse.status);
      console.log('🔍 LINE API Response OK:', verifyResponse.ok);

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.log('🔍 LINE API Error Response:', errorText);
        set.status = 401;
        return { error: "Invalid ID token" };
      }

      const lineUserInfo = await verifyResponse.json();
      const lineUserId = lineUserInfo.sub;
      const channelId = lineUserInfo.aud; // Audience contains the channel ID

      // Determine user role - use provided role parameter or determine from channel ID
      const expectedRole = role || getUserRole(channelId);
      console.log('🔍 Registration - Expected role determined:', expectedRole, 'for channel ID:', channelId, 'role param:', role);

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
        console.log('❌ User type mismatch:', userType, 'vs expected role:', expectedRole);
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
