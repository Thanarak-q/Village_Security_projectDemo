-- Migration: Add indexes for better performance
-- Description: Create indexes for all tables to improve query performance

-- Houses indexes
CREATE INDEX IF NOT EXISTS "idx_houses_village_key" ON "houses" ("village_key");

-- Residents indexes
CREATE INDEX IF NOT EXISTS "idx_residents_status" ON "residents" ("status");
CREATE INDEX IF NOT EXISTS "idx_residents_village_key" ON "residents" ("village_key");
CREATE INDEX IF NOT EXISTS "idx_residents_status_village_key" ON "residents" ("status", "village_key");

-- Guards indexes
CREATE INDEX IF NOT EXISTS "idx_guards_status" ON "guards" ("status");
CREATE INDEX IF NOT EXISTS "idx_guards_village_key" ON "guards" ("village_key");
CREATE INDEX IF NOT EXISTS "idx_guards_status_village_key" ON "guards" ("status", "village_key");

-- Admins indexes
CREATE INDEX IF NOT EXISTS "idx_admins_username" ON "admins" ("username");
CREATE INDEX IF NOT EXISTS "idx_admins_village_key" ON "admins" ("village_key");

-- House members indexes
CREATE INDEX IF NOT EXISTS "idx_house_members_resident_id" ON "house_members" ("resident_id");
CREATE INDEX IF NOT EXISTS "idx_house_members_house_id" ON "house_members" ("house_id");

-- Visitor records indexes
CREATE INDEX IF NOT EXISTS "idx_visitor_records_status" ON "visitor_records" ("record_status");
CREATE INDEX IF NOT EXISTS "idx_visitor_records_entry_time" ON "visitor_records" ("entry_time");
CREATE INDEX IF NOT EXISTS "idx_visitor_records_created_at" ON "visitor_records" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_visitor_records_status_created_at" ON "visitor_records" ("record_status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_visitor_records_resident_id" ON "visitor_records" ("resident_id");
CREATE INDEX IF NOT EXISTS "idx_visitor_records_guard_id" ON "visitor_records" ("guard_id");
CREATE INDEX IF NOT EXISTS "idx_visitor_records_house_id" ON "visitor_records" ("house_id");
