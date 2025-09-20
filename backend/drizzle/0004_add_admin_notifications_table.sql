-- Migration: Add admin_notifications table
-- Description: Create admin_notifications table for storing admin notifications

CREATE TABLE IF NOT EXISTS "admin_notifications" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"village_key" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" text,
	"is_read" boolean DEFAULT false,
	"priority" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_admin_id_admins_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "admins"("admin_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "villages"("village_key") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_admin_id" ON "admin_notifications" USING btree ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_village_key" ON "admin_notifications" USING btree ("village_key");
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_is_read" ON "admin_notifications" USING btree ("is_read");
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_created_at" ON "admin_notifications" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_admin_id_is_read" ON "admin_notifications" USING btree ("admin_id","is_read");
