import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents, guards, villages, houses, house_members, visitor_records } from "../db/schema";
import { eq, sql } from "drizzle-orm";

// Interface for update request
interface UpdateUserRequest {
  userId: string;
  role: 'resident' | 'guard';
  status: string;
  houseNumber?: string;
  notes?: string;
}

// Interface for role change request
interface ChangeRoleRequest {
  userId: string;
  currentRole: 'resident' | 'guard';
  newRole: 'resident' | 'guard';
  status: string;
  houseNumber?: string;
  notes?: string;
}


// Helper functions
async function getResident(userId: string) {
  const result = await db
    .select()
    .from(residents)
    .where(eq(residents.resident_id, userId));
  return result[0] || null;
}

async function getGuard(userId: string) {
  const result = await db
    .select()
    .from(guards)
    .where(eq(guards.guard_id, userId));
  return result[0] || null;
}

async function removeHouseRelationships(userId: string) {
  const houseMemberData = await db
    .select()
    .from(house_members)
    .where(eq(house_members.resident_id, userId));

  if (houseMemberData.length > 0) {
    await db
      .delete(house_members)
      .where(eq(house_members.resident_id, userId));
  }

  return houseMemberData[0] || null;
}

async function cleanupVisitorRecords(userId: string, role: 'resident' | 'guard') {
  if (role === 'resident') {
    await db
      .delete(visitor_records)
      .where(eq(visitor_records.resident_id, userId));
  } else if (role === 'guard') {
    await db
      .delete(visitor_records)
      .where(eq(visitor_records.guard_id, userId));
  }
}

async function createGuardFromResident(resident: any, status: string) {
  
  const result = await db
    .insert(guards)
    .values({
      line_user_id: resident.line_user_id,
      email: resident.email,
      fname: resident.fname,
      lname: resident.lname,
      username: resident.username,
      password_hash: resident.password_hash,
      phone: resident.phone,
      village_key: resident.village_key,
      status: status as "verified" | "pending" | "disable",
      profile_image_url: resident.profile_image_url
    })
    .returning();
  return result[0] || null;
}

async function createResidentFromGuard(guard: any, status: string) {
  
  const result = await db
    .insert(residents)
    .values({
      line_user_id: guard.line_user_id,
      email: guard.email,
      fname: guard.fname,
      lname: guard.lname,
      username: guard.username,
      password_hash: guard.password_hash,
      phone: guard.phone,
      village_key: guard.village_key,
      status: status as "verified" | "pending" | "disable",
      profile_image_url: guard.profile_image_url
    })
    .returning();
  return result[0] || null;
}

async function cleanupOrphanedHouse(houseId: string) {
  const remainingResidents = await db
    .select()
    .from(house_members)
    .where(eq(house_members.house_id, houseId));

  if (remainingResidents.length === 0) {
    await db.delete(houses).where(eq(houses.house_id, houseId));
  }
}

async function createHouseForResident(residentId: string, houseNumber: string, villageKey: string | null) {
  if (!villageKey) return null;
  
  const newHouse = await db
    .insert(houses)
    .values({
      address: houseNumber,
      village_key: villageKey
    })
    .returning();

  await db
    .insert(house_members)
    .values({
      house_id: newHouse[0].house_id,
      resident_id: residentId
    });

  return newHouse[0];
}

export const userTableRoutes = new Elysia({ prefix: "/api" })
  .get("/userTable", async () => {
    try {
      // Get residents data with house address
      const residentsData = await db
        .select({
          id: residents.resident_id,
          fname: residents.fname,
          lname: residents.lname,
          email: residents.email,
          phone: residents.phone,
          status: residents.status,
          role: sql`'resident'`.as('role'),
          village_key: residents.village_key,
          house_address: houses.address,
          createdAt: residents.createdAt,
          updatedAt: residents.updatedAt,
        })
        .from(residents)
        .leftJoin(house_members, eq(residents.resident_id, house_members.resident_id))
        .leftJoin(houses, eq(house_members.house_id, houses.house_id));

      // Get guards data
      const guardsData = await db
        .select({
          id: guards.guard_id,
          fname: guards.fname,
          lname: guards.lname,
          email: guards.email,
          phone: guards.phone,
          status: guards.status,
          role: sql`'guard'`.as('role'),
          village_key: guards.village_key,
          house_address: sql`NULL`.as('house_address'),
          createdAt: guards.createdAt,
          updatedAt: guards.updatedAt,
        })
        .from(guards);
        

      return {
        success: true,
        data: {
          residents: residentsData,
          guards: guardsData,
        },
        total: {
          residents: residentsData.length,
          guards: guardsData.length,
          total: residentsData.length + guardsData.length,
        },
      };
    } catch (error) {
      return { 
        success: false, 
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
  })
  .put("/updateUser", async ({ body }) => {
    try {
      const { userId, role, status, houseNumber, notes }: UpdateUserRequest = body as UpdateUserRequest;

      // Validate required fields
      if (!userId || !role || !status) {
        return {
          success: false,
          error: "Missing required fields: userId, role, status"
        };
      }

      // Update based on role
      if (role === 'resident') {
        // Update resident
        const updateResult = await db
          .update(residents)
          .set({
            status: status as "verified" | "pending" | "disable",
            updatedAt: new Date()
          })
          .where(eq(residents.resident_id, userId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            error: "Resident not found"
          };
        }

        // If houseNumber is provided, update house address
        if (houseNumber) {
          // First, get the current house_id for this resident
          const currentHouseMember = await db
            .select()
            .from(house_members)
            .where(eq(house_members.resident_id, userId));

          if (currentHouseMember.length > 0 && currentHouseMember[0].house_id) {
            // Update existing house address
            await db
              .update(houses)
              .set({ address: houseNumber })
              .where(eq(houses.house_id, currentHouseMember[0].house_id));
          } else {
            // Create new house and house_member record
            const villageKey = updateResult[0].village_key;
            
            // Create new house
            const newHouse = await db
              .insert(houses)
              .values({
                address: houseNumber,
                village_key: villageKey
              })
              .returning();

            // Create house_member relationship
            await db
              .insert(house_members)
              .values({
                house_id: newHouse[0].house_id,
                resident_id: userId
              });
          }
        }

        return {
          success: true,
          message: "Resident updated successfully",
          data: updateResult[0]
        };

      } else if (role === 'guard') {
        // Update guard
        const updateResult = await db
          .update(guards)
          .set({
            status: status as "verified" | "pending" | "disable",
            updatedAt: new Date()
          })
          .where(eq(guards.guard_id, userId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            error: "Guard not found"
          };
        }

        return {
          success: true,
          message: "Guard updated successfully",
          data: updateResult[0]
        };

      } else {
        return {
          success: false,
          error: "Invalid role specified"
        };
      }

    } catch (error) {
      console.error("Error updating user:", error);
      return {
        success: false,
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
  })
  .put("/changeUserRole", async ({ body }) => {
    try {
      const { userId, currentRole, newRole, status, houseNumber, notes }: ChangeRoleRequest = body as ChangeRoleRequest;

      // Validate required fields
      if (!userId || !currentRole || !newRole || !status) {
        return {
          success: false,
          error: "Missing required fields: userId, currentRole, newRole, status"
        };
      }

      // Don't allow same role
      if (currentRole === newRole) {
        return {
          success: false,
          error: "Current role and new role cannot be the same"
        };
      }

      // Validate roles
      if (!['resident', 'guard'].includes(currentRole) || !['resident', 'guard'].includes(newRole)) {
        return {
          success: false,
          error: "Invalid role specified. Must be 'resident' or 'guard'"
        };
      }

      if (currentRole === 'resident' && newRole === 'guard') {
        // Convert resident to guard
        const resident = await getResident(userId);
        if (!resident) {
          return { success: false, error: "Resident not found" };
        }

        try {
          // Remove house relationships first
          const houseMemberData = await removeHouseRelationships(userId);

          // Clean up visitor records for this resident
          await cleanupVisitorRecords(userId, 'resident');

          // Create new guard
          const newGuard = await createGuardFromResident(resident, status);
          if (!newGuard) {
            throw new Error("Failed to create guard");
          }

          // Delete old resident
          const deleteResult = await db
            .delete(residents)
            .where(eq(residents.resident_id, userId))
            .returning();

          if (deleteResult.length === 0) {
            throw new Error("Failed to delete resident");
          }

          // Clean up orphaned houses
          if (houseMemberData?.house_id) {
            await cleanupOrphanedHouse(houseMemberData.house_id);
          }

          // Verify the conversion was successful
          const remainingResident = await getResident(userId);
          if (remainingResident) {
            throw new Error("Resident still exists after conversion");
          }

          const newGuardExists = await getGuard(newGuard.guard_id);
          if (!newGuardExists) {
            throw new Error("New guard was not created properly");
          }

          return {
            success: true,
            message: "Resident successfully converted to guard",
            data: newGuard
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
              .where(eq(guards.email, resident.email))
              .limit(1);
            
            if (newGuard.length > 0) {
              await db.delete(guards).where(eq(guards.guard_id, newGuard[0].guard_id));
            }
          } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
          }

          return { 
            success: false, 
            error: "Failed to convert resident to guard",
            details: error instanceof Error ? error.message : "Unknown error"
          };
        }

      } else if (currentRole === 'guard' && newRole === 'resident') {
        // Convert guard to resident
        const guard = await getGuard(userId);
        if (!guard) {
          return { success: false, error: "Guard not found" };
        }

        // Validate house number is provided when converting to resident
        if (!houseNumber || houseNumber.trim() === '') {
          return { 
            success: false, 
            error: "House number is required when converting guard to resident" 
          };
        }

        try {
          // Clean up visitor records for this guard
          await cleanupVisitorRecords(userId, 'guard');

          // Create new resident
          const newResident = await createResidentFromGuard(guard, status);
          if (!newResident) {
            throw new Error("Failed to create resident");
          }

          // Delete old guard
          const deleteResult = await db
            .delete(guards)
            .where(eq(guards.guard_id, userId))
            .returning();

          if (deleteResult.length === 0) {
            throw new Error("Failed to delete guard");
          }

          // Create house if houseNumber provided
          if (houseNumber && newResident.resident_id) {
            await createHouseForResident(newResident.resident_id, houseNumber, guard.village_key);
          }

          // Verify the conversion was successful
          const remainingGuard = await getGuard(userId);
          if (remainingGuard) {
            throw new Error("Guard still exists after conversion");
          }

          const newResidentExists = await getResident(newResident.resident_id);
          if (!newResidentExists) {
            throw new Error("New resident was not created properly");
          }

          return {
            success: true,
            message: "Guard successfully converted to resident",
            data: newResident
          };

        } catch (error) {
          // If any step fails, we need to clean up
          console.error("Error during guard to resident conversion:", error);
          
          // Try to clean up any partial changes
          try {
            // If resident was created but guard deletion failed, delete the resident
            const newResident = await db
              .select()
              .from(residents)
              .where(eq(residents.email, guard.email))
              .limit(1);
            
            if (newResident.length > 0) {
              await db.delete(residents).where(eq(residents.resident_id, newResident[0].resident_id));
            }
          } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
          }

          return { 
            success: false, 
            error: "Failed to convert guard to resident",
            details: error instanceof Error ? error.message : "Unknown error"
          };
        }

      } else {
        return {
          success: false,
          error: "Invalid role conversion"
        };
      }

    } catch (error) {
      console.error("Error changing user role:", error);
      return {
        success: false,
        error: "Failed to change user role",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });