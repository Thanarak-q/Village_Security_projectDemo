-- Migration: Add admin_notification_delivery table
-- This table tracks delivery and read status of notifications to individual admins

-- Create the admin_notification_delivery table
CREATE TABLE IF NOT EXISTS "admin_notification_delivery" (
	"delivery_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"seen_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "admin_notification_delivery" ADD CONSTRAINT "admin_notification_delivery_notification_id_admin_notifications_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "admin_notifications"("notification_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "admin_notification_delivery" ADD CONSTRAINT "admin_notification_delivery_admin_id_admins_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "admins"("admin_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for efficient queries
CREATE UNIQUE INDEX IF NOT EXISTS "idx_admin_notification_delivery_unique" ON "admin_notification_delivery" ("notification_id","admin_id");
CREATE INDEX IF NOT EXISTS "idx_admin_notification_delivery_admin_id" ON "admin_notification_delivery" ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_admin_notification_delivery_notification_id" ON "admin_notification_delivery" ("notification_id");
CREATE INDEX IF NOT EXISTS "idx_admin_notification_delivery_read_at" ON "admin_notification_delivery" ("read_at");
CREATE INDEX IF NOT EXISTS "idx_admin_notification_delivery_seen_at" ON "admin_notification_delivery" ("seen_at");
CREATE INDEX IF NOT EXISTS "idx_admin_notification_delivery_admin_read" ON "admin_notification_delivery" ("admin_id","read_at");
CREATE INDEX IF NOT EXISTS "idx_admin_notification_delivery_admin_seen" ON "admin_notification_delivery" ("admin_id","seen_at");

-- Add composite index to admin_notifications for better village + created_at queries
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_village_created" ON "admin_notifications" ("village_key","created_at");
