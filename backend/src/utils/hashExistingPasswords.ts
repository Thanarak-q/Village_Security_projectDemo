/**
 * @file This file provides a script for migrating plain text passwords to hashed passwords.
 * It should be executed as a one-time operation to enhance security by ensuring all
 * user passwords stored in the database are properly hashed. The script is designed
 * to be idempotent, meaning it can be run multiple times without re-hashing already
 * secured passwords.
 */

import db from "../db/drizzle";
import { residents, guards, admins } from "../db/schema";
import { hashPassword } from "./passwordUtils";
import { eq } from "drizzle-orm";

/**
 * Iterates through resident, guard, and admin records in the database and
 * hashes any passwords that are not already hashed. This function is intended
 * for a one-time migration from plain text passwords to bcrypt-hashed passwords.
 *
 * @returns {Promise<void>} A promise that resolves when the migration is complete.
 * @throws {Error} Throws an error if the database connection or hashing process fails.
 */
export async function hashExistingPasswords(): Promise<void> {
  try {
    console.log("Starting password hashing migration...");

    // Hash existing resident passwords
    const existingResidents = await db.select().from(residents);
    for (const resident of existingResidents) {
      // Check if password is not already hashed (assumes bcrypt hashes start with '$2b$')
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
      // Check if password is not already hashed
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
      // Check if password is not already hashed
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