-- Migration: Add Soft Delete Fields
-- Description: Add disable_at field to all main entities for soft delete functionality

-- Add status and disable_at fields to villages table
ALTER TABLE "villages" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';
ALTER TABLE "villages" ADD COLUMN IF NOT EXISTS "disable_at" timestamp;

-- Add disable_at field to houses table
ALTER TABLE "houses" ADD COLUMN IF NOT EXISTS "disable_at" timestamp;

-- Add disable_at field to residents table
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "disable_at" timestamp;

-- Add disable_at field to guards table
ALTER TABLE "guards" ADD COLUMN IF NOT EXISTS "disable_at" timestamp;

-- Add disable_at field to admins table
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "disable_at" timestamp;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS "idx_villages_disable_at" ON "villages" USING btree ("disable_at");
CREATE INDEX IF NOT EXISTS "idx_houses_disable_at" ON "houses" USING btree ("disable_at");
CREATE INDEX IF NOT EXISTS "idx_residents_disable_at" ON "residents" USING btree ("disable_at");
CREATE INDEX IF NOT EXISTS "idx_guards_disable_at" ON "guards" USING btree ("disable_at");
CREATE INDEX IF NOT EXISTS "idx_admins_disable_at" ON "admins" USING btree ("disable_at");
