import { Elysia } from "elysia";
import db from "../db/drizzle";
import {
  residents,
  guards,
  villages,
  houses,
  house_members,
  visitor_records,
} from "../db/schema";
import { eq, sql, and, isNull, or } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { userManagementActivityLogger } from "../utils/activityLogUtils";
import { notificationService } from "../services/notificationService";

// In-memory store to prevent concurrent role conversions
const roleConversionInProgress = new Set<string>();

// LIFF Authentication middleware for cookie-based sessions
const requireLiffAuth = async (context: any) => {
  const { jwt, cookie, set } = context;
  const token = cookie.liff_session?.value;

  if (!token) {
    set.status = 401;
    return { error: "Unauthorized: No LIFF session token provided." };
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
  if (tokenAgeInSeconds > 60 * 60) { // 1 hour expiry for LIFF sessions
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

  // Allow pending users for LIFF authentication
  // Only block disabled users
  if (user.status === "disable") {
    set.status = 403;
    return { error: "Forbidden: The user account is disabled." };
  }

  // Add user to context
  context.currentUser = {
    ...user,
    village_ids: user.village_id ? [user.village_id] : [],
  };
};

/**
 * Interface for the update user request.
 * @interface
 */
interface UpdateUserRequest {
  userId: string;
  role: "resident" | "guard";
  status: string;
  houseId?: string;
  houseNumber?: string;
  notes?: string;
}

/**
 * Interface for the change role request.
 * @interface
 */
interface ChangeRoleRequest {
  userId: string;
  currentRole: "resident" | "guard";
  newRole: "resident" | "guard";
  status: string;
  houseId?: string;
  houseNumber?: string;
  notes?: string;
}

/**
 * Gets a resident by user ID.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object|null>} A promise that resolves to the resident object or null if not found.
 */
async function getResident(userId: string) {
  const result = await db
    .select()
    .from(residents)
    .where(eq(residents.resident_id, userId));
  return result[0] || null;
}
/**
 * Gets a guard by user ID.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object|null>} A promise that resolves to the guard object or null if not found.
 */
async function getGuard(userId: string) {
  const result = await db
    .select()
    .from(guards)
    .where(eq(guards.guard_id, userId));
  return result[0] || null;
}

/**
 * Removes house relationships for a user.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object|null>} A promise that resolves to the house member data or null if not found.
 */
async function removeHouseRelationships(userId: string) {
  const houseMemberData = await db
    .select()
    .from(house_members)
    .where(eq(house_members.resident_id, userId));

  if (houseMemberData.length > 0) {
    await db.delete(house_members).where(eq(house_members.resident_id, userId));
  }

  return houseMemberData[0] || null;
}

/**
 * Cleans up visitor records for a user.
 * @param {string} userId - The user ID.
 * @param {"resident" | "guard"} role - The user's role.
 * @returns {Promise<void>}
 */
async function cleanupVisitorRecords(
  userId: string,
  role: "resident" | "guard"
) {
  if (role === "resident") {
    await db
      .delete(visitor_records)
      .where(eq(visitor_records.resident_id, userId));
  } else if (role === "guard") {
    await db
      .delete(visitor_records)
      .where(eq(visitor_records.guard_id, userId));
  }
}

/**
 * Creates a guard from a resident.
 * @param {any} resident - The resident object.
 * @param {string} status - The status of the new guard.
 * @returns {Promise<Object|null>} A promise that resolves to the new guard object or null if creation fails.
 */
async function createGuardFromResident(resident: any, status: string) {
  try {
    // Debug logging
    console.log("🔍 Creating guard from resident with data:", {
      resident_id: resident.resident_id,
      email: resident.email,
      fname: resident.fname,
      lname: resident.lname,
      phone: resident.phone,
      village_id: resident.village_id,
      line_user_id: resident.line_user_id,
      line_display_name: resident.line_display_name,
      line_profile_url: resident.line_profile_url,
      status: status
    });

    // Check if a guard with the same email or line_user_id already exists (only active guards)
    const existingGuard = await db.query.guards.findFirst({
      where: and(
        or(
          eq(guards.email, resident.email),
          resident.line_user_id ? eq(guards.line_user_id, resident.line_user_id) : sql`1=0`
        ),
        resident.village_id ? eq(guards.village_id, resident.village_id) : sql`1=1`,
        isNull(guards.disable_at) // Only check active guards
      ),
    });

    if (existingGuard) {
      throw new Error(`A guard with this email or LINE user ID already exists`);
    }

    const insertValues = {
      line_user_id: resident.line_user_id || null,
      email: resident.email,
      fname: resident.fname,
      lname: resident.lname,
      phone: resident.phone,
      village_id: resident.village_id,
      status: status as "verified" | "pending" | "disable",
      line_display_name: resident.line_display_name || null,
      line_profile_url: resident.line_profile_url || null,
    };

    console.log("📝 Inserting guard with values:", insertValues);

    const result = await db
      .insert(guards)
      .values(insertValues)
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error("Error creating guard from resident:", error);
    throw error;
  }
}

/**
 * Creates a guard from a resident with transaction support.
 * @param {any} resident - The resident object.
 * @param {string} status - The status of the new guard.
 * @param {any} tx - Database transaction object.
 * @returns {Promise<Object|null>} A promise that resolves to the new guard object or null if creation fails.
 */
async function createGuardFromResidentWithTx(resident: any, status: string, tx: any) {
  try {
    // Validate resident has required village_id
    if (!resident.village_id) {
      throw new Error("Resident must have a valid village_id to convert to guard");
    }

    // Verify village exists
    const village = await tx
      .select()
      .from(villages)
      .where(eq(villages.village_id, resident.village_id))
      .limit(1);

    if (village.length === 0) {
      throw new Error(`Village with ID ${resident.village_id} not found`);
    }

    // Check if a guard with the same email or line_user_id already exists (only active guards)
    console.log("🔍 Checking for existing guards with email:", resident.email);
    const existingGuard = await tx.query.guards.findFirst({
      where: and(
        or(
          eq(guards.email, resident.email),
          resident.line_user_id ? eq(guards.line_user_id, resident.line_user_id) : sql`1=0`
        ),
        resident.village_id ? eq(guards.village_id, resident.village_id) : sql`1=1`,
        isNull(guards.disable_at) // Only check active guards
      ),
    });

    if (existingGuard) {
      console.log("❌ Found existing active guard:", existingGuard);
      throw new Error(`A guard with this email or LINE user ID already exists`);
    }

    console.log("✅ No duplicate guards found, proceeding with creation");

    const insertValues = {
      line_user_id: resident.line_user_id || null,
      email: resident.email,
      fname: resident.fname,
      lname: resident.lname,
      phone: resident.phone,
      village_id: resident.village_id,
      status: status as "verified" | "pending" | "disable",
      line_display_name: resident.line_display_name || null,
      line_profile_url: resident.line_profile_url || null,
    };

    console.log("📝 Inserting guard with values:", insertValues);

    const result = await tx
      .insert(guards)
      .values(insertValues)
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error("Error creating guard from resident:", error);
    throw error;
  }
}

/**
 * Creates a resident from a guard with transaction support.
 * @param {any} guard - The guard object.
 * @param {string} status - The status of the new resident.
 * @param {any} tx - Database transaction object.
 * @returns {Promise<Object|null>} A promise that resolves to the new resident object or null if creation fails.
 */
async function createResidentFromGuardWithTx(guard: any, status: string, tx: any) {
  try {
    // Validate guard has required village_id
    if (!guard.village_id) {
      throw new Error("Guard must have a valid village_id to convert to resident");
    }

    // Verify village exists
    const village = await tx
      .select()
      .from(villages)
      .where(eq(villages.village_id, guard.village_id))
      .limit(1);

    if (village.length === 0) {
      throw new Error(`Village with ID ${guard.village_id} not found`);
    }

    // Check if a resident with the same email or line_user_id already exists (only active residents)
    console.log("🔍 Checking for existing residents with email:", guard.email);
    const existingResident = await tx.query.residents.findFirst({
      where: and(
        or(
          eq(residents.email, guard.email),
          guard.line_user_id ? eq(residents.line_user_id, guard.line_user_id) : sql`1=0`
        ),
        guard.village_id ? eq(residents.village_id, guard.village_id) : sql`1=1`,
        isNull(residents.disable_at) // Only check active residents
      ),
    });

    if (existingResident) {
      console.log("❌ Found existing active resident:", existingResident);
      throw new Error(`A resident with this email or LINE user ID already exists`);
    }

    console.log("✅ No duplicate residents found, proceeding with creation");

    const insertValues = {
      line_user_id: guard.line_user_id || null,
      email: guard.email,
      fname: guard.fname,
      lname: guard.lname,
      phone: guard.phone,
      village_id: guard.village_id,
      status: status as "verified" | "pending" | "disable",
      line_display_name: guard.line_display_name || null,
      line_profile_url: guard.line_profile_url || null,
    };

    console.log("📝 Inserting resident with values:", insertValues);

    const result = await tx
      .insert(residents)
      .values(insertValues)
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error("Error creating resident from guard:", error);
    throw error;
  }
}

/**
 * Creates a resident from a guard.
 * @param {any} guard - The guard object.
 * @param {string} status - The status of the new resident.
 * @returns {Promise<Object|null>} A promise that resolves to the new resident object or null if creation fails.
 */
async function createResidentFromGuard(guard: any, status: string) {
  try {
    // Validate guard has required village_id
    if (!guard.village_id) {
      throw new Error("Guard must have a valid village_id to convert to resident");
    }

    // Verify village exists
    const village = await db
      .select()
      .from(villages)
      .where(eq(villages.village_id, guard.village_id))
      .limit(1);

    if (village.length === 0) {
      throw new Error(`Village with ID ${guard.village_id} not found`);
    }

    // Check if a resident with the same email or line_user_id already exists (only active residents)
    console.log("🔍 Checking for existing residents with email:", guard.email);
    const existingResident = await db.query.residents.findFirst({
      where: and(
        or(
          eq(residents.email, guard.email),
          guard.line_user_id ? eq(residents.line_user_id, guard.line_user_id) : sql`1=0`
        ),
        guard.village_id ? eq(residents.village_id, guard.village_id) : sql`1=1`,
        isNull(residents.disable_at) // Only check active residents
      ),
    });

    if (existingResident) {
      console.log("❌ Found existing active resident:", existingResident);
      throw new Error(`A resident with this email or LINE user ID already exists`);
    }

    console.log("✅ No duplicate residents found, proceeding with creation");

    const result = await db
      .insert(residents)
      .values({
        line_user_id: guard.line_user_id || null,
        email: guard.email,
        fname: guard.fname,
        lname: guard.lname,
        phone: guard.phone,
        village_id: guard.village_id,
        status: status as "verified" | "pending" | "disable",
        line_display_name: guard.line_display_name || null,
        line_profile_url: guard.line_profile_url || null,
      })
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error("Error creating resident from guard:", error);
    throw error;
  }
}

/**
 * Cleans up orphaned houses.
 * @param {string} houseId - The house ID.
 * @returns {Promise<void>}
 */
async function cleanupOrphanedHouse(houseId: string) {
  try {
    // Check for remaining residents
    const remainingResidents = await db
      .select()
      .from(house_members)
      .where(eq(house_members.house_id, houseId));

    // Check for visitor records
    const visitorRecords = await db
      .select()
      .from(visitor_records)
      .where(eq(visitor_records.house_id, houseId));

    if (remainingResidents.length === 0) {
      // No residents left, but check if house has visitor records
      if (visitorRecords.length > 0) {
        // House has visitor records, just mark as available instead of deleting
        await db
          .update(houses)
          .set({ status: "available" })
          .where(eq(houses.house_id, houseId));
        console.log(`🏠 House ${houseId} marked as available (has ${visitorRecords.length} visitor records)`);
      } else {
        // No residents and no visitor records, mark as available but don't delete
        // This preserves the house for potential future use
        await db
          .update(houses)
          .set({ status: "available" })
          .where(eq(houses.house_id, houseId));
        console.log(`🏠 House ${houseId} marked as available (no residents or visitor records)`);
      }
    } else {
      console.log(`🏠 House ${houseId} still has ${remainingResidents.length} residents, not changing status`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning up house ${houseId}:`, error);
    // Don't throw the error - house cleanup failure shouldn't break the main operation
  }
}

/**
 * Creates a house for a resident.
 * @param {string} residentId - The resident ID.
 * @param {string} houseNumber - The house number.
 * @param {string | null} villageKey - The village key.
 * @returns {Promise<Object|null>} A promise that resolves to the new house object or null if creation fails.
 */
async function createHouseForResident(
  residentId: string,
  houseNumber: string,
  villageId: string | null
) {
  if (!villageId) return null;

  // Check if house with this address already exists in the village
  const existingHouse = await db
    .select()
    .from(houses)
    .where(
      and(
        eq(houses.address, houseNumber.trim()),
        eq(houses.village_id, villageId)
      )
    );

  let houseId: string;

  if (existingHouse.length > 0) {
    // Use existing house
    houseId = existingHouse[0].house_id;
    console.log(`🏠 Using existing house: ${houseNumber} (ID: ${houseId})`);
  } else {
    // Create new house
    const newHouse = await db
      .insert(houses)
      .values({
        address: houseNumber.trim(),
        village_id: villageId,
      })
      .returning();
    
    houseId = newHouse[0].house_id;
    console.log(`🏠 Created new house: ${houseNumber} (ID: ${houseId})`);
  }

  await db.insert(house_members).values({
    house_id: houseId,
    resident_id: residentId,
  });

  return { house_id: houseId, address: houseNumber, village_id: villageId };
}

/**
 * The user table routes.
 * Accessible by: admin (เจ้าของโครงการ) and staff (นิติ)
 * @type {Elysia}
 */
export const userTableRoutes = new Elysia({ prefix: "/api" })
  // Get guard by LINE user ID - accessible by guards themselves
  .get("/guards/by-line-user", async (context: any) => {
    // Apply LIFF authentication middleware
    const authResult = await requireLiffAuth(context);
    if (authResult) {
      return authResult;
    }
    
    const { query, set, currentUser } = context;
    try {
      const { lineUserId } = query as { lineUserId: string };

      if (!lineUserId) {
        set.status = 400;
        return {
          success: false,
          error: "Line User ID is required",
        };
      }

      const guard = await db.query.guards.findFirst({
        where: eq(guards.line_user_id, lineUserId),
        columns: {
          guard_id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          village_id: true,
          status: true,
          line_user_id: true,
        }
      });

      if (!guard) {
        set.status = 404;
        return {
          success: false,
          error: "Guard not found",
        };
      }

      // If currentUser is provided (authenticated request), verify it's the same person
      if (currentUser) {
        // Check if the found guard matches the current user's village
        if (currentUser.village_id && guard.village_id !== currentUser.village_id) {
          set.status = 403;
          return {
            success: false,
            error: "Access denied: Guard not in your village",
          };
        }
      }

      return {
        success: true,
        guard: guard,
      };
    } catch (error) {
      console.error("Error fetching guard by LINE user ID:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to fetch guard",
      };
    }
  })
  // Get guard by name - accessible by guards themselves
  .get("/guards/by-name", async ({ query, set, currentUser }: any) => {
    try {
      const { fname, lname } = query as { fname: string; lname: string };

      if (!fname || !lname) {
        set.status = 400;
        return {
          success: false,
          error: "First name and last name are required",
        };
      }

      const guard = await db.query.guards.findFirst({
        where: and(
          eq(guards.fname, fname),
          eq(guards.lname, lname)
        ),
        columns: {
          guard_id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          village_id: true,
          status: true,
          line_user_id: true,
        }
      });

      if (!guard) {
        set.status = 404;
        return {
          success: false,
          error: "Guard not found",
        };
      }

      // If currentUser is provided (authenticated request), verify it's the same person
      if (currentUser) {
        // Check if the found guard matches the current user's village
        if (currentUser.village_id && guard.village_id !== currentUser.village_id) {
          set.status = 403;
          return {
            success: false,
            error: "Access denied: Guard not in your village",
          };
        }
      }

      return {
        success: true,
        guard: guard,
      };
    } catch (error) {
      console.error("Error fetching guard by name:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to fetch guard",
      };
    }
  })
  .onBeforeHandle(requireRole(["staff","admin"]))
  /**
   * Get all users for the current user's village.
   * @param {Object} context - The context for the request.
   * @param {Object} context.currentUser - The current user.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} A promise that resolves to an object containing the user data.
   */
  .get("/userTable", async ({ currentUser, query, request }: any) => {
    try {
      // Extract village_id from query parameters
      let village_id = query?.village_id;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_id && request?.url) {
        const url = new URL(request.url);
        village_id = url.searchParams.get('village_id');
      }
      
      const { village_ids, role } = currentUser;

      console.log("UserTable - Extracted village_id:", village_id);
      console.log("UserTable - Available village_ids:", village_ids);

      // Validate village_id parameter
      if (!village_id || typeof village_id !== 'string') {
        return {
          success: false,
          error: "Village ID is required",
        };
      }

      // Check if admin has access to the specified village
      if (role !== "superadmin" && !village_ids.includes(village_id)) {
        return {
          success: false,
          error: "You don't have access to this village",
        };
      }

      const residentsData = await db
        .select({
          id: residents.resident_id,
          fname: residents.fname,
          lname: residents.lname,
          email: residents.email,
          phone: residents.phone,
          status: residents.status,
          role: sql`'resident'`.as("role"),
          village_id: residents.village_id,
          house_address: houses.address,
          createdAt: residents.createdAt,
          updatedAt: residents.updatedAt,
          line_profile_url: residents.line_profile_url,
        })
        .from(residents)
        .where(
          and(
            role === "superadmin" 
              ? sql`1=1` // Super admin can see all residents
              : eq(residents.village_id, village_id),
            sql`${residents.status} != 'pending'`,
            isNull(residents.disable_at)
          )
        )
        .leftJoin(
          house_members,
          eq(residents.resident_id, house_members.resident_id)
        )
        .leftJoin(houses, eq(house_members.house_id, houses.house_id));

      const guardsData = await db
        .select({
          id: guards.guard_id,
          fname: guards.fname,
          lname: guards.lname,
          email: guards.email,
          phone: guards.phone,
          status: guards.status,
          role: sql`'guard'`.as("role"),
          village_id: guards.village_id,
          house_address: sql`NULL`.as("house_address"),
          createdAt: guards.createdAt,
          updatedAt: guards.updatedAt,
          line_profile_url: guards.line_profile_url,
        })
        .from(guards)
        .where(
          and(
            role === "superadmin" 
              ? sql`1=1` // Super admin can see all guards
              : eq(guards.village_id, village_id),
            sql`${guards.status} != 'pending'`,
            isNull(guards.disable_at)
          )
        );

      return {
        success: true,
        currentUser,
        data: {
          residents: residentsData,
          guards: guardsData,
        },
        total: {
          residents: residentsData.length,
          guards: guardsData.length,
          total: residentsData.length + guardsData.length,
        },
        village_id: village_id,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  /**
   * Update a user.
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .put("/updateUser", async ({ body, currentUser }: any) => {
    try {
      const { userId, role, status, houseId, houseNumber, notes }: UpdateUserRequest =
        body as UpdateUserRequest;

      // Validate required fields
      if (!userId || !role || !status) {
        return {
          success: false,
          error: "Missing required fields: userId, role, status",
        };
      }

      // Update based on role
      if (role === "resident") {
        // Get current resident data for logging
        const currentResident = await getResident(userId);
        if (!currentResident) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

        // Get old status for notification
        const oldResident = await db
          .select({ status: residents.status, fname: residents.fname, lname: residents.lname, village_id: residents.village_id })
          .from(residents)
          .where(eq(residents.resident_id, userId));

        if (oldResident.length === 0) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

        // Update resident
        const updateResult = await db
          .update(residents)
          .set({
            status: status as "verified" | "pending" | "disable",
            updatedAt: new Date(),
          })
          .where(eq(residents.resident_id, userId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            error: "Resident not found",
          };
        }

        // Create notification for resident status change if status actually changed
        if (oldResident[0].status !== status) {
          try {
            // Get house address for notification
            const houseMember = await db
              .select({ address: houses.address })
              .from(house_members)
              .innerJoin(houses, eq(house_members.house_id, houses.house_id))
              .where(eq(house_members.resident_id, userId));

            if (houseMember.length > 0) {
              await notificationService.notifyResidentStatusChange({
                resident_id: userId,
                resident_name: `${oldResident[0].fname} ${oldResident[0].lname}`,
                house_address: houseMember[0].address,
                old_status: oldResident[0].status || 'unknown',
                new_status: status,
                village_id: oldResident[0].village_id || '',
              });
              console.log(`📢 Resident status change notification sent: ${oldResident[0].fname} ${oldResident[0].lname}`);
            }
          } catch (notificationError) {
            console.error('❌ Error sending resident status change notification:', notificationError);
          }
        }

        // If houseId is provided, move resident to the selected house
        let oldHouseAddress = null;
        if (houseId) {
          // Validate that the house exists
          const targetHouse = await db
            .select()
            .from(houses)
            .where(eq(houses.house_id, houseId));

          if (targetHouse.length === 0) {
            return {
              success: false,
              error: `House with ID ${houseId} not found`,
            };
          }

          // First, get the current house_id for this resident
          const currentHouseMember = await db
            .select()
            .from(house_members)
            .where(eq(house_members.resident_id, userId));

          if (currentHouseMember.length > 0 && currentHouseMember[0].house_id) {
            // Check if resident is already assigned to the selected house
            if (currentHouseMember[0].house_id === houseId) {
              console.log(`🏠 Resident is already assigned to house ID: ${houseId}, no change needed`);
              // No need to do anything, resident is already in the correct house
            } else {
              // Get current house address for logging
              const currentHouse = await db
                .select()
                .from(houses)
                .where(eq(houses.house_id, currentHouseMember[0].house_id));
              oldHouseAddress = currentHouse[0]?.address || null;

              // Remove old house_member relationship
              await db
                .delete(house_members)
                .where(eq(house_members.resident_id, userId));

              // Clean up orphaned house if no other residents
              await cleanupOrphanedHouse(currentHouseMember[0].house_id);

              // Create new house_member relationship with the selected house
              await db.insert(house_members).values({
                house_id: houseId,
                resident_id: userId,
              });

              console.log(`🏠 Moved resident from house ${currentHouseMember[0].house_id} to house ID: ${houseId}`);
            }
          } else {
            // Resident has no current house assignment, create new relationship
            await db.insert(house_members).values({
              house_id: houseId,
              resident_id: userId,
            });

            console.log(`🏠 Assigned resident to house ID: ${houseId}`);
            // Update existing house address
            await db
              .update(houses)
              .set({ address: houseNumber })
              .where(eq(houses.house_id, houseId));
          }
        }

        // Log the user update activity
        try {
          const userName = `${currentResident.fname} ${currentResident.lname}`;
          
          // Log status update
          if (currentResident.status !== status) {
            const statusLogResult = await userManagementActivityLogger.logUserStatusUpdated(
              currentUser.admin_id,
              currentUser.username,
              "resident",
              userName,
              currentResident.status || "unknown",
              status
            );
            if (statusLogResult) {
              console.log("User status update logged successfully");
            }
          }

          // Log house update
          if (houseNumber) {
            const houseLogResult = await userManagementActivityLogger.logUserHouseUpdated(
              currentUser.admin_id,
              currentUser.username,
              userName,
              oldHouseAddress,
              houseNumber
            );
            if (houseLogResult) {
              console.log("User house update logged successfully");
            } else {
              console.log("No house change detected, skipping log");
            }
          }
        } catch (logError) {
          console.error("Error logging user update:", logError);
          // Don't fail the request if logging fails
        }

        return {
          success: true,
          message: "Resident updated successfully",
          data: updateResult[0],
        };
      } else if (role === "guard") {
        // Get current guard data for logging
        const currentGuard = await getGuard(userId);
        if (!currentGuard) {
          return {
            success: false,
            error: "Guard not found",
          };
        }

        // Update guard
        const updateResult = await db
          .update(guards)
          .set({
            status: status as "verified" | "pending" | "disable",
            updatedAt: new Date(),
          })
          .where(eq(guards.guard_id, userId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            error: "Guard not found",
          };
        }

        // Log the guard update activity
        try {
          const userName = `${currentGuard.fname} ${currentGuard.lname}`;
          
          // Log status update
          if (currentGuard.status !== status) {
            const statusLogResult = await userManagementActivityLogger.logUserStatusUpdated(
              currentUser.admin_id,
              currentUser.username,
              "guard",
              userName,
              currentGuard.status || "unknown",
              status
            );
            if (statusLogResult) {
              console.log("Guard status update logged successfully");
            }
          }
        } catch (logError) {
          console.error("Error logging guard update:", logError);
          // Don't fail the request if logging fails
        }

        return {
          success: true,
          message: "Guard updated successfully",
          data: updateResult[0],
        };
      } else {
        return {
          success: false,
          error: "Invalid role specified",
        };
      }
    } catch (error) {
      console.error("Error updating user:", error);
      return {
        success: false,
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  /**
   * Change a user's role.
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @param {Object} context.currentUser - The current user.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .put("/changeUserRole", async ({ body, currentUser }: any) => {
    try {
      const {
        userId,
        currentRole,
        newRole,
        status,
        houseId,
        houseNumber,
        notes,
      }: ChangeRoleRequest = body as ChangeRoleRequest;

      // Validate required fields
      if (!userId || !currentRole || !newRole || !status) {
        return {
          success: false,
          error: "ข้อมูลไม่ครบถ้วน กรุณาลองใหม่อีกครั้งในภายหลัง",
        };
      }

      // Check if role conversion is already in progress for this user
      const conversionKey = `role_conversion_${userId}`;
      if (roleConversionInProgress.has(conversionKey)) {
        return {
          success: false,
          error: "กำลังดำเนินการเปลี่ยนบทบาทอยู่ กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
        };
      }

      // Mark role conversion as in progress
      roleConversionInProgress.add(conversionKey);
      console.log(`🔒 Role conversion started for user ${userId}`);

      try {

      // Don't allow same role
      if (currentRole === newRole) {
        return {
          success: false,
          error: "Current role and new role cannot be the same",
        };
      }

      // Validate roles
      if (
        !["resident", "guard"].includes(currentRole) ||
        !["resident", "guard"].includes(newRole)
      ) {
        return {
          success: false,
          error: "Invalid role specified. Must be 'resident' or 'guard'",
        };
      }

      if (currentRole === "resident" && newRole === "guard") {
        // Convert resident to guard
        const resident = await getResident(userId);
        if (!resident) {
          return { success: false, error: "ไม่พบข้อมูลผู้ใช้ กรุณาลองใหม่อีกครั้งในภายหลัง" };
        }

        try {
          // Remove house relationships first
          const houseMemberData = await removeHouseRelationships(userId);

          // Create notification for house member removed if there was a house relationship
          if (houseMemberData?.house_id) {
            try {
              // Get house address for notification
              const houseInfo = await db
                .select({ address: houses.address })
                .from(houses)
                .where(eq(houses.house_id, houseMemberData.house_id));

              if (houseInfo.length > 0) {
                await notificationService.notifyHouseMemberRemoved({
                  house_member_id: houseMemberData.house_member_id,
                  resident_id: userId,
                  resident_name: `${resident.fname} ${resident.lname}`,
                  house_address: houseInfo[0].address,
                  village_id: resident.village_id || '',
                });
                console.log(`📢 House member removed notification sent: ${resident.fname} ${resident.lname}`);
              }
            } catch (notificationError) {
              console.error('❌ Error sending house member removed notification:', notificationError);
            }
          }

          console.log("🚀 Starting resident to guard conversion with retry logic...");

          // Retry logic for role conversion
          const maxRetries = 3;
          let newGuard = null;
          let lastError = null;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`🔄 Resident to guard conversion attempt ${attempt}/${maxRetries}`);
              
              // Use database transaction with timeout to ensure atomicity
              const result = await db.transaction(async (tx) => {
                console.log("📦 Inside transaction, starting operations...");
                
                // Clean up visitor records for this resident
                await cleanupVisitorRecords(userId, "resident");

                // Soft delete old resident FIRST to avoid unique constraint violation
                console.log("🗑️ Disabling resident:", resident.resident_id);
                const deleteResult = await tx
                  .update(residents)
                  .set({ 
                    disable_at: new Date(),
                    status: "disable"
                  })
                  .where(eq(residents.resident_id, userId))
                  .returning();

                if (deleteResult.length === 0) {
                  throw new Error("Failed to delete resident");
                }

                console.log("✅ Resident disabled successfully");

                // Create new guard AFTER deleting the resident
                console.log("👤 Creating new guard from resident data");
                const guard = await createGuardFromResidentWithTx(resident, status, tx);
                if (!guard) {
                  throw new Error("Failed to create guard");
                }

                return guard;
              }); // Database transaction

              newGuard = result;
              console.log(`✅ Resident to guard conversion successful on attempt ${attempt}`);
              break; // Success, exit retry loop

            } catch (error) {
              lastError = error;
              console.error(`❌ Resident to guard conversion attempt ${attempt} failed:`, error);
              
              if (attempt < maxRetries) {
                // Wait before retry with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }

          if (!newGuard) {
            throw new Error(`Resident to guard conversion failed after ${maxRetries} attempts. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
          }

          // Clean up orphaned houses
          if (houseMemberData?.house_id) {
            await cleanupOrphanedHouse(houseMemberData.house_id);
          }

          // Verify the conversion was successful
          const remainingResident = await getResident(userId);
          if (remainingResident && !remainingResident.disable_at) {
            throw new Error("Resident still exists after conversion");
          }

          const newGuardExists = await getGuard((newGuard as any).guard_id);
          if (!newGuardExists) {
            throw new Error("New guard was not created properly");
          }

          // Log the role change activity
          try {
            const userName = `${resident.fname} ${resident.lname}`;
            await userManagementActivityLogger.logUserRoleChanged(
              currentUser.admin_id,
              currentUser.username,
              userName,
              "resident",
              "guard",
              status
            );
          } catch (logError) {
            console.error("Error logging role change:", logError);
            // Don't fail the request if logging fails
          }
            
          return {
            success: true,
            message: "Resident successfully converted to guard",
            data: newGuard,
          };
        } catch (error) {
          // If any step fails, we need to clean up
          console.error("Error during resident to guard conversion:", error);

          // Try to clean up any partial changes
          try {
            // If guard was created but resident deletion failed, delete the guard
            const newGuard = await db
              .select()
              .from(guards)
              .where(
                and(
                  eq(guards.email, resident.email),
                  resident.village_id ? eq(guards.village_id, resident.village_id) : sql`1=1`
                )
              )
              .limit(1);

            if (newGuard.length > 0) {
              await db
                .delete(guards)
                .where(eq(guards.guard_id, newGuard[0].guard_id));
            }
          } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
          }

          // Provide user-friendly error messages
          let errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท กรุณาลองใหม่อีกครั้งในภายหลัง";
          if (error instanceof Error) {
            if (error.message.includes("already exists")) {
              errorMessage = "ไม่สามารถเปลี่ยนบทบาทได้: มีผู้ใช้ที่มีอีเมลหรือ LINE ID เดียวกันอยู่แล้ว กรุณาติดต่อผู้ดูแลระบบ";
            } else if (error.message.includes("unique constraint")) {
              errorMessage = "ไม่สามารถเปลี่ยนบทบาทได้: ข้อมูลซ้ำกับผู้ใช้อื่น กรุณาติดต่อผู้ดูแลระบบ";
            } else if (error.message.includes("Role conversion failed after")) {
              errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท กรุณาลองใหม่อีกครั้งในภายหลัง";
            } else if (error.message.includes("database") || error.message.includes("connection")) {
              errorMessage = "เกิดปัญหาการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้งในภายหลัง";
            } else {
              errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท กรุณาลองใหม่อีกครั้งในภายหลัง";
            }
          }

          return {
            success: false,
            error: errorMessage,
            details: error instanceof Error ? error.message : "Unknown error",
          };
        }
      } else if (currentRole === "guard" && newRole === "resident") {
        // Convert guard to resident
        const guard = await getGuard(userId);
        if (!guard) {
          return { success: false, error: "ไม่พบข้อมูลผู้ใช้ กรุณาลองใหม่อีกครั้งในภายหลัง" };
        }

        // Validate house ID is provided when converting to resident
        if (!houseId || houseId.trim() === "") {
          return {
            success: false,
            error: "กรุณาระบุหมายเลขบ้านเมื่อเปลี่ยนเป็นผู้อยู่อาศัย",
          };
        }

        try {
          // Debug logging
          console.log("🔍 Converting guard to resident:", {
            guard_id: guard.guard_id,
            email: guard.email,
            fname: guard.fname,
            lname: guard.lname,
            village_id: guard.village_id,
            houseId: houseId,
            houseNumber: houseNumber
          });

          console.log("🚀 Starting database transaction with retry logic...");

          // Retry logic for role conversion
          const maxRetries = 3;
          let result = null;
          let lastError = null;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`🔄 Role conversion attempt ${attempt}/${maxRetries}`);
              
              // Use database transaction with timeout to ensure atomicity
              result = await db.transaction(async (tx) => {
                console.log("📦 Inside transaction, starting operations...");
                
                // Clean up visitor records for this guard
                await cleanupVisitorRecords(userId, "guard");

                // Soft delete old guard FIRST to avoid unique constraint violation
                console.log("🗑️ Disabling guard:", guard.guard_id);
                const deleteResult = await tx
                  .update(guards)
                  .set({ 
                    disable_at: new Date(),
                    status: "disable"
                  })
                  .where(eq(guards.guard_id, userId))
                  .returning();

                if (deleteResult.length === 0) {
                  throw new Error("Failed to delete guard");
                }

                console.log("✅ Guard disabled successfully");

                // Create new resident AFTER deleting the guard
                console.log("👤 Creating new resident from guard data");
                const newResident = await createResidentFromGuardWithTx(guard, status, tx);
                if (!newResident) {
                  throw new Error("Failed to create resident");
                }

                return newResident;
              }); // Database transaction

              console.log(`✅ Role conversion successful on attempt ${attempt}`);
              break; // Success, exit retry loop

            } catch (error) {
              lastError = error;
              console.error(`❌ Role conversion attempt ${attempt} failed:`, error);
              
              if (attempt < maxRetries) {
                // Wait before retry with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }

          if (!result) {
            throw new Error(`Role conversion failed after ${maxRetries} attempts. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
          }

          const newResident = result;

          // Assign resident to the selected house
          if (houseId && newResident.resident_id) {
            // Validate that the house exists
            const targetHouse = await db
              .select()
              .from(houses)
              .where(eq(houses.house_id, houseId));

            if (targetHouse.length === 0) {
              throw new Error(`House with ID ${houseId} not found`);
            }

            // Create house_member relationship with the selected house
            await db.insert(house_members).values({
              house_id: houseId,
              resident_id: newResident.resident_id,
            });

            // Get house address for notification
            const houseInfo = await db
              .select({ address: houses.address })
              .from(houses)
              .where(eq(houses.house_id, houseId));

            // Create notification for house member added
            try {
              await notificationService.notifyHouseMemberAdded({
                house_member_id: '', // Will be generated by database
                resident_id: newResident.resident_id,
                resident_name: `${newResident.fname} ${newResident.lname}`,
                house_address: houseInfo[0]?.address || '',
                village_id: guard.village_id || '',
              });
              console.log(`📢 House member added notification sent: ${newResident.fname} ${newResident.lname}`);
            } catch (notificationError) {
              console.error('❌ Error sending house member added notification:', notificationError);
            }
          }

          // Verify the conversion was successful
          const remainingGuard = await getGuard(userId);
          if (remainingGuard && !remainingGuard.disable_at) {
            throw new Error("Guard still exists after conversion");
          }

          const newResidentExists = await getResident((newResident as any).resident_id);
          if (!newResidentExists) {
            throw new Error("New resident was not created properly");
          }

          // Log the role change activity
          try {
            const userName = `${guard.fname} ${guard.lname}`;
            await userManagementActivityLogger.logUserRoleChanged(
              currentUser.admin_id,
              currentUser.username,
              userName,
              "guard",
              "resident",
              status
            );
          } catch (logError) {
            console.error("Error logging role change:", logError);
            // Don't fail the request if logging fails
          }

          return {
            success: true,
            message: "Guard successfully converted to resident",
            data: newResident,
          };
        } catch (error) {
          // If any step fails, we need to clean up
          console.error("❌ Error during guard to resident conversion:", error);
          console.error("❌ Error details:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
          });

          // Try to clean up any partial changes
          try {
            // If resident was created but guard deletion failed, delete the resident
            const newResident = await db
              .select()
              .from(residents)
              .where(eq(residents.email, guard.email))
              .then(results => results[0]);

            if (newResident) {
              await db
                .update(residents)
                .set({ disable_at: new Date() })
                .where(eq(residents.resident_id, newResident.resident_id));
              console.log("🧹 Cleaned up partially created resident");
            }
          } catch (cleanupError) {
            console.error("❌ Error during cleanup:", cleanupError);
          }

          // Determine appropriate error message
          let errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท กรุณาลองใหม่อีกครั้งในภายหลัง";
          if (error instanceof Error) {
            if (error.message.includes("duplicate") || error.message.includes("unique")) {
              errorMessage = "ไม่สามารถเปลี่ยนบทบาทได้: ข้อมูลซ้ำกับผู้ใช้อื่น กรุณาติดต่อผู้ดูแลระบบ";
            } else if (error.message.includes("Role conversion failed after")) {
              errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท กรุณาลองใหม่อีกครั้งในภายหลัง";
            } else if (error.message.includes("database") || error.message.includes("connection")) {
              errorMessage = "เกิดปัญหาการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้งในภายหลัง";
            } else if (error.message.includes("village_id") || error.message.includes("Village")) {
              errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท กรุณาลองใหม่อีกครั้งในภายหลัง";
            } else {
              errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท กรุณาลองใหม่อีกครั้งในภายหลัง";
            }
          }

          return {
            success: false,
            error: errorMessage,
            details: error instanceof Error ? error.message : "Unknown error",
          };
        }
      } else {
        return {
          success: false,
          error: "ไม่สามารถเปลี่ยนบทบาทได้ กรุณาลองใหม่อีกครั้งในภายหลัง",
        };
      }
      } finally {
        // Always remove the conversion lock
        roleConversionInProgress.delete(conversionKey);
        console.log(`🔓 Role conversion completed for user ${userId}`);
      }
    } catch (error) {
      console.error("Error changing user role:", error);
      return {
        success: false,
        error: "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท กรุณาลองใหม่อีกครั้งในภายหลัง",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
