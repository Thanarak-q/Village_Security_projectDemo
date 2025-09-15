#!/usr/bin/env tsx

/**
 * @file Script to seed admin_notifications table with mock data
 * Usage: npx tsx scripts/seed-notifications.ts
 */

import { seedNotifications } from "../src/db/seedNotifications";

async function main() {
  try {
    console.log("🌱 Starting notification seeding...");
    await seedNotifications();
    console.log("✅ Notification seeding completed successfully!");
  } catch (error) {
    console.error("❌ Notification seeding failed:", error);
    process.exit(1);
  }
}

main();
