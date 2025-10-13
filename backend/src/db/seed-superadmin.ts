/**
 * @file Seed script that ensures a super admin account exists.
 * Uses environment variables when available and falls back to safe defaults.
 */

import "../config/env";
import db from "./drizzle";
import { admins } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword, isPasswordHashed } from "../utils/passwordUtils";

const DEFAULT_USERNAME = process.env.SUPERADMIN_USERNAME || "superadmin";
const DEFAULT_EMAIL = process.env.SUPERADMIN_EMAIL || "superadmin@village-security.local";
const DEFAULT_PASSWORD = process.env.SUPERADMIN_PASSWORD || "SuperSecureAdmin123!";

async function ensureSuperAdmin() {
  const username = process.env.SUPERADMIN_USERNAME ?? DEFAULT_USERNAME;
  const email = process.env.SUPERADMIN_EMAIL ?? DEFAULT_EMAIL;
  const rawPassword = process.env.SUPERADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  const phone = process.env.SUPERADMIN_PHONE ?? null;

  const existingAdmin = await db.query.admins.findFirst({
    where: eq(admins.username, username),
  });

  if (existingAdmin) {
    console.log(`ℹ️ Super admin "${username}" already exists. Updating credentials...`);

    const passwordHash = isPasswordHashed(rawPassword)
      ? rawPassword
      : await hashPassword(rawPassword);

    await db
      .update(admins)
      .set({
        email,
        password_hash: passwordHash,
        phone: phone ?? existingAdmin.phone,
        role: "superadmin",
        status: "verified",
      })
      .where(eq(admins.admin_id, existingAdmin.admin_id));

    console.log("✅ Super admin credentials updated.");
    return;
  }

  const passwordHash = isPasswordHashed(rawPassword)
    ? rawPassword
    : await hashPassword(rawPassword);

  await db.insert(admins).values({
    username,
    email,
    password_hash: passwordHash,
    phone,
    role: "superadmin",
    status: "verified",
  });

  console.log(`✅ Super admin "${username}" created successfully.`);
}

ensureSuperAdmin()
  .catch((error) => {
    console.error("❌ Failed to seed super admin:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
