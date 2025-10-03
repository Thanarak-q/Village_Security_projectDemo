-- Migration: Migrate village_key to village_id for residents and guards tables
-- Description: Update residents and guards tables to use village_id instead of village_key for consistency
-- Date: 2024-12-19

-- Step 1: Add village_id column to residents table (if not exists)
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "village_id" uuid;

-- Step 2: Add village_id column to guards table (if not exists)
ALTER TABLE "guards" ADD COLUMN IF NOT EXISTS "village_id" uuid;

-- Step 3: Update village_id in residents table from villages table based on village_key
UPDATE "residents" 
SET "village_id" = (
  SELECT "village_id" 
  FROM "villages" 
  WHERE "villages"."village_key" = "residents"."village_key"
)
WHERE "village_id" IS NULL AND "village_key" IS NOT NULL;

-- Step 4: Update village_id in guards table from villages table based on village_key
UPDATE "guards" 
SET "village_id" = (
  SELECT "village_id" 
  FROM "villages" 
  WHERE "villages"."village_key" = "guards"."village_key"
)
WHERE "village_id" IS NULL AND "village_key" IS NOT NULL;

-- Step 5: Add foreign key constraints for village_id
DO $$ BEGIN
 ALTER TABLE "residents" ADD CONSTRAINT "residents_village_id_villages_village_id_fk" FOREIGN KEY ("village_id") REFERENCES "villages"("village_id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "guards" ADD CONSTRAINT "guards_village_id_villages_village_id_fk" FOREIGN KEY ("village_id") REFERENCES "villages"("village_id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 6: Create indexes for village_id
CREATE INDEX IF NOT EXISTS "idx_residents_village_id_new" ON "residents" USING btree ("village_id");
CREATE INDEX IF NOT EXISTS "idx_guards_village_id_new" ON "guards" USING btree ("village_id");

-- Step 7: Create composite indexes for status and village_id
CREATE INDEX IF NOT EXISTS "idx_residents_status_village_id_new" ON "residents" USING btree ("status", "village_id");
CREATE INDEX IF NOT EXISTS "idx_guards_status_village_id_new" ON "guards" USING btree ("status", "village_id");

-- Step 8: Remove old village_key columns and constraints from residents table
ALTER TABLE "residents" DROP CONSTRAINT IF EXISTS "residents_village_key_villages_village_key_fk";
DROP INDEX IF EXISTS "idx_residents_village_key";
DROP INDEX IF EXISTS "idx_residents_status_village_key";
ALTER TABLE "residents" DROP COLUMN IF EXISTS "village_key";

-- Step 9: Remove old village_key columns and constraints from guards table
ALTER TABLE "guards" DROP CONSTRAINT IF EXISTS "guards_village_key_villages_village_key_fk";
DROP INDEX IF EXISTS "idx_guards_village_key";
DROP INDEX IF EXISTS "idx_guards_status_village_key";
ALTER TABLE "guards" DROP COLUMN IF EXISTS "village_key";

-- Step 10: Update admin_notifications table to use village_id instead of village_key
-- Add village_id column to admin_notifications table
ALTER TABLE "admin_notifications" ADD COLUMN IF NOT EXISTS "village_id" uuid;

-- Update village_id from villages table based on village_key
UPDATE "admin_notifications" 
SET "village_id" = (
  SELECT "village_id" 
  FROM "villages" 
  WHERE "villages"."village_key" = "admin_notifications"."village_key"
)
WHERE "village_id" IS NULL AND "village_key" IS NOT NULL;

-- Make village_id NOT NULL after data migration
ALTER TABLE "admin_notifications" ALTER COLUMN "village_id" SET NOT NULL;

-- Add foreign key constraint for village_id
DO $$ BEGIN
 ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_village_id_villages_village_id_fk" FOREIGN KEY ("village_id") REFERENCES "villages"("village_id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index for village_id
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_village_id_new" ON "admin_notifications" USING btree ("village_id");

-- Remove old village_key column and constraints from admin_notifications table
ALTER TABLE "admin_notifications" DROP CONSTRAINT IF EXISTS "admin_notifications_village_key_villages_village_key_fk";
DROP INDEX IF EXISTS "idx_admin_notifications_village_key";
DROP INDEX IF EXISTS "idx_admin_notifications_village_created";
ALTER TABLE "admin_notifications" DROP COLUMN IF EXISTS "village_key";

-- Step 11: Update houses table to use village_id instead of village_key (if it still has village_key)
-- Check if houses table has village_key column and migrate if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'village_key') THEN
        -- Add village_id column if not exists
        ALTER TABLE "houses" ADD COLUMN IF NOT EXISTS "village_id" uuid;
        
        -- Update village_id from villages table based on village_key
        UPDATE "houses" 
        SET "village_id" = (
          SELECT "village_id" 
          FROM "villages" 
          WHERE "villages"."village_key" = "houses"."village_key"
        )
        WHERE "village_id" IS NULL AND "village_key" IS NOT NULL;
        
        -- Add foreign key constraint for village_id
        ALTER TABLE "houses" ADD CONSTRAINT "houses_village_id_villages_village_id_fk" FOREIGN KEY ("village_id") REFERENCES "villages"("village_id") ON DELETE CASCADE ON UPDATE no action;
        
        -- Create index for village_id
        CREATE INDEX IF NOT EXISTS "idx_houses_village_id_new" ON "houses" USING btree ("village_id");
        
        -- Remove old village_key column and constraints
        ALTER TABLE "houses" DROP CONSTRAINT IF EXISTS "houses_village_key_villages_village_key_fk";
        DROP INDEX IF EXISTS "idx_houses_village_key";
        ALTER TABLE "houses" DROP COLUMN IF EXISTS "village_key";
    END IF;
END $$;

-- Step 12: Update admins table to use village_id instead of village_key (if it still has village_key)
-- Check if admins table has village_key column and migrate if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'village_key') THEN
        -- Add village_id column if not exists
        ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "village_id" uuid;
        
        -- Update village_id from villages table based on village_key
        UPDATE "admins" 
        SET "village_id" = (
          SELECT "village_id" 
          FROM "villages" 
          WHERE "villages"."village_key" = "admins"."village_key"
        )
        WHERE "village_id" IS NULL AND "village_key" IS NOT NULL;
        
        -- Add foreign key constraint for village_id
        ALTER TABLE "admins" ADD CONSTRAINT "admins_village_id_villages_village_id_fk" FOREIGN KEY ("village_id") REFERENCES "villages"("village_id") ON DELETE CASCADE ON UPDATE no action;
        
        -- Create index for village_id
        CREATE INDEX IF NOT EXISTS "idx_admins_village_id_new" ON "admins" USING btree ("village_id");
        
        -- Remove old village_key column and constraints
        ALTER TABLE "admins" DROP CONSTRAINT IF EXISTS "admins_village_key_villages_village_key_fk";
        DROP INDEX IF EXISTS "idx_admins_village_key";
        ALTER TABLE "admins" DROP COLUMN IF EXISTS "village_key";
    END IF;
END $$;
