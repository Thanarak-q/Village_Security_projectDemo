#!/usr/bin/env tsx

/**
 * @file Script to seed admin notifications
 * Run this script to populate the admin_notifications table with mock data
 */

import { seedNotifications } from '../src/db/seedNotifications';

async function main() {
  console.log('🌱 Starting notification seeding...');
  
  try {
    await seedNotifications();
    console.log('✅ Notification seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Notification seeding failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
