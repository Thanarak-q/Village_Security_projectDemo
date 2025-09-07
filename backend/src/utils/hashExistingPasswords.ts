import db from "../db/drizzle";
import { residents, guards, admins } from "../db/schema";
import { hashPassword } from "./passwordUtils";
import { eq } from "drizzle-orm";

/**
 * Hashes existing plain text passwords in the database.
 * This should be run once to migrate existing plain text passwords to hashed ones.
 * @returns {Promise<void>}
 * @throws {Error} If there is an error during the migration.
 */
export async function hashExistingPasswords() {
  try {
    console.log("Starting password hashing migration...");

    // Hash existing resident passwords
    const existingResidents = await db.select().from(residents);
    for (const resident of existingResidents) {
      // Check if password is already hashed
      if (!resident.password_hash.startsWith("$2b$")) {
        const hashedPassword = await hashPassword(resident.password_hash);
        await db
          .update(residents)
          .set({ password_hash: hashedPassword })
          .where(eq(residents.resident_id, resident.resident_id));
        console.log(`Hashed password for resident: ${resident.username}`);
      }
    }

    // Hash existing guard passwords
    const existingGuards = await db.select().from(guards);
    for (const guard of existingGuards) {
      // Check if password is already hashed
      if (!guard.password_hash.startsWith("$2b$")) {
        const hashedPassword = await hashPassword(guard.password_hash);
        await db
          .update(guards)
          .set({ password_hash: hashedPassword })
          .where(eq(guards.guard_id, guard.guard_id));
        console.log(`Hashed password for guard: ${guard.username}`);
      }
    }

    // Hash existing admin passwords
    const existingAdmins = await db.select().from(admins);
    for (const admin of existingAdmins) {
      // Check if password is already hashed
      if (!admin.password_hash.startsWith("$2b$")) {
        const hashedPassword = await hashPassword(admin.password_hash);
        await db
          .update(admins)
          .set({ password_hash: hashedPassword })
          .where(eq(admins.admin_id, admin.admin_id));
        console.log(`Hashed password for admin: ${admin.username}`);
      }
    }

    console.log("Password hashing migration completed successfully!");
  } catch (error) {
    console.error("Error during password hashing migration:", error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  hashExistingPasswords()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
} 