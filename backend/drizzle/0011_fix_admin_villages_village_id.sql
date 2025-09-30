-- Migration: Fix admin_villages to use village_id instead of village_key
-- Description: Update admin_villages table to use village_id for consistency

-- Step 1: Add village_id column to admin_villages table
ALTER TABLE "admin_villages" ADD COLUMN IF NOT EXISTS "village_id" uuid;

-- Step 2: Update village_id from villages table based on village_key
UPDATE "admin_villages" 
SET "village_id" = (
  SELECT "village_id" 
  FROM "villages" 
  WHERE "villages"."village_key" = "admin_villages"."village_key"
)
WHERE "village_id" IS NULL;

-- Step 3: Make village_id NOT NULL after data migration
ALTER TABLE "admin_villages" ALTER COLUMN "village_id" SET NOT NULL;

-- Step 4: Add foreign key constraint for village_id
DO $$ BEGIN
 ALTER TABLE "admin_villages" ADD CONSTRAINT "admin_villages_village_id_villages_village_id_fk" FOREIGN KEY ("village_id") REFERENCES "villages"("village_id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 5: Create index for village_id
CREATE INDEX IF NOT EXISTS "idx_admin_villages_village_id_new" ON "admin_villages" USING btree ("village_id");

-- Step 6: Create composite index for admin_id and village_id
CREATE INDEX IF NOT EXISTS "idx_admin_villages_admin_village_id" ON "admin_villages" USING btree ("admin_id", "village_id");

-- Step 7: Remove old village_key column and constraints
ALTER TABLE "admin_villages" DROP CONSTRAINT IF EXISTS "admin_villages_village_key_villages_village_key_fk";
DROP INDEX IF EXISTS "idx_admin_villages_village_key";
DROP INDEX IF EXISTS "idx_admin_villages_admin_village";
ALTER TABLE "admin_villages" DROP COLUMN IF EXISTS "village_key";
