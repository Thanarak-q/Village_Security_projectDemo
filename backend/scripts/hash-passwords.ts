#!/usr/bin/env tsx

import { hashExistingPasswords } from "../src/utils/hashExistingPasswords";

async function main() {
  try {
    console.log("Starting password hashing migration...");
    await hashExistingPasswords();
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main(); 