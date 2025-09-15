-- Migration: Add admin_notifications table
-- Description: Create admin_notifications table for admin notifications

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "admin_notifications_admin_id_idx" ON "admin_notifications" ("admin_id");
CREATE INDEX IF NOT EXISTS "admin_notifications_village_key_idx" ON "admin_notifications" ("village_key");
CREATE INDEX IF NOT EXISTS "admin_notifications_is_read_idx" ON "admin_notifications" ("is_read");
CREATE INDEX IF NOT EXISTS "admin_notifications_created_at_idx" ON "admin_notifications" ("created_at");
CREATE INDEX IF NOT EXISTS "admin_notifications_type_idx" ON "admin_notifications" ("type");
CREATE INDEX IF NOT EXISTS "admin_notifications_category_idx" ON "admin_notifications" ("category");
