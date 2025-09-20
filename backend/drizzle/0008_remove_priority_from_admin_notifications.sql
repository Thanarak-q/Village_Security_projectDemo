-- Migration: Remove priority, is_read, read_at, admin_id from admin_notifications
-- Description: Update admin_notifications table to remove individual admin tracking and read status

-- Drop foreign key constraint for admin_id
DO $$ BEGIN
 ALTER TABLE "admin_notifications" DROP CONSTRAINT IF EXISTS "admin_notifications_admin_id_admins_admin_id_fk";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;

-- Drop indexes that reference columns we're removing
DROP INDEX IF EXISTS "idx_admin_notifications_admin_id";
DROP INDEX IF EXISTS "idx_admin_notifications_is_read";
DROP INDEX IF EXISTS "idx_admin_notifications_admin_id_is_read";

-- Drop columns
ALTER TABLE "admin_notifications" DROP COLUMN IF EXISTS "admin_id";
ALTER TABLE "admin_notifications" DROP COLUMN IF EXISTS "is_read";
ALTER TABLE "admin_notifications" DROP COLUMN IF EXISTS "read_at";
ALTER TABLE "admin_notifications" DROP COLUMN IF EXISTS "priority";

-- Change data column from text to jsonb
ALTER TABLE "admin_notifications" ALTER COLUMN "data" TYPE jsonb USING "data"::jsonb;

-- Create new index for type column
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_type" ON "admin_notifications" USING btree ("type");
