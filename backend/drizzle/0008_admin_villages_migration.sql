-- Migration: Admin Villages Many-to-Many Relationship
-- Description: Remove village_key from admins table and create admin_villages join table

-- Step 1: Create admin_villages table
CREATE TABLE IF NOT EXISTS "admin_villages" (
	"admin_village_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"village_key" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Step 2: Add foreign key constraints for admin_villages
DO $$ BEGIN
 ALTER TABLE "admin_villages" ADD CONSTRAINT "admin_villages_admin_id_admins_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "admins"("admin_id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "admin_villages" ADD CONSTRAINT "admin_villages_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "villages"("village_key") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create indexes for admin_villages
CREATE INDEX IF NOT EXISTS "idx_admin_villages_admin_id" ON "admin_villages" USING btree ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_admin_villages_village_key" ON "admin_villages" USING btree ("village_key");
CREATE INDEX IF NOT EXISTS "idx_admin_villages_admin_village" ON "admin_villages" USING btree ("admin_id","village_key");

-- Step 4: Migrate existing data from admins.village_key to admin_villages
INSERT INTO "admin_villages" ("admin_id", "village_key", "created_at")
SELECT "admin_id", "village_key", "created_at"
FROM "admins"
WHERE "village_key" IS NOT NULL;

-- Step 5: Remove village_key column from admins table
ALTER TABLE "admins" DROP COLUMN IF EXISTS "village_key";

-- Step 6: Remove the old index for village_key
DROP INDEX IF EXISTS "idx_admins_village_key";
