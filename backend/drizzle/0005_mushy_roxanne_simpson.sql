CREATE TABLE "admin_activity_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_notification_delivery" (
	"delivery_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"seen_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_notifications" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"village_key" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "guards" DROP CONSTRAINT "guards_username_unique";--> statement-breakpoint
ALTER TABLE "residents" DROP CONSTRAINT "residents_username_unique";--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "role" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "guards" ADD COLUMN "line_user_id" text;--> statement-breakpoint
ALTER TABLE "guards" ADD COLUMN "line_display_name" text;--> statement-breakpoint
ALTER TABLE "guards" ADD COLUMN "line_profile_url" text;--> statement-breakpoint
ALTER TABLE "guards" ADD COLUMN "hired_date" date;--> statement-breakpoint
ALTER TABLE "houses" ADD COLUMN "status" text DEFAULT 'available';--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "line_user_id" text;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "line_display_name" text;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "line_profile_url" text;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "move_in_date" date;--> statement-breakpoint
ALTER TABLE "visitor_records" ADD COLUMN "visitor_name" text;--> statement-breakpoint
ALTER TABLE "visitor_records" ADD COLUMN "visitor_id_card" text;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_admins_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("admin_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notification_delivery" ADD CONSTRAINT "admin_notification_delivery_notification_id_admin_notifications_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."admin_notifications"("notification_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notification_delivery" ADD CONSTRAINT "admin_notification_delivery_admin_id_admins_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("admin_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "public"."villages"("village_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_admin_notification_delivery_unique" ON "admin_notification_delivery" USING btree ("notification_id","admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_notification_delivery_admin_id" ON "admin_notification_delivery" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_notification_delivery_notification_id" ON "admin_notification_delivery" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "idx_admin_notification_delivery_read_at" ON "admin_notification_delivery" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "idx_admin_notification_delivery_seen_at" ON "admin_notification_delivery" USING btree ("seen_at");--> statement-breakpoint
CREATE INDEX "idx_admin_notification_delivery_admin_read" ON "admin_notification_delivery" USING btree ("admin_id","read_at");--> statement-breakpoint
CREATE INDEX "idx_admin_notification_delivery_admin_seen" ON "admin_notification_delivery" USING btree ("admin_id","seen_at");--> statement-breakpoint
CREATE INDEX "idx_admin_notifications_village_key" ON "admin_notifications" USING btree ("village_key");--> statement-breakpoint
CREATE INDEX "idx_admin_notifications_created_at" ON "admin_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_notifications_type" ON "admin_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_admin_notifications_village_created" ON "admin_notifications" USING btree ("village_key","created_at");--> statement-breakpoint
CREATE INDEX "idx_admins_username" ON "admins" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_admins_village_key" ON "admins" USING btree ("village_key");--> statement-breakpoint
CREATE INDEX "idx_guards_status" ON "guards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_guards_village_key" ON "guards" USING btree ("village_key");--> statement-breakpoint
CREATE INDEX "idx_guards_status_village_key" ON "guards" USING btree ("status","village_key");--> statement-breakpoint
CREATE INDEX "idx_house_members_resident_id" ON "house_members" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "idx_house_members_house_id" ON "house_members" USING btree ("house_id");--> statement-breakpoint
CREATE INDEX "idx_houses_village_key" ON "houses" USING btree ("village_key");--> statement-breakpoint
CREATE INDEX "idx_residents_status" ON "residents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_residents_village_key" ON "residents" USING btree ("village_key");--> statement-breakpoint
CREATE INDEX "idx_residents_status_village_key" ON "residents" USING btree ("status","village_key");--> statement-breakpoint
CREATE INDEX "idx_visitor_records_status" ON "visitor_records" USING btree ("record_status");--> statement-breakpoint
CREATE INDEX "idx_visitor_records_entry_time" ON "visitor_records" USING btree ("entry_time");--> statement-breakpoint
CREATE INDEX "idx_visitor_records_created_at" ON "visitor_records" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_visitor_records_status_created_at" ON "visitor_records" USING btree ("record_status","created_at");--> statement-breakpoint
CREATE INDEX "idx_visitor_records_resident_id" ON "visitor_records" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "idx_visitor_records_guard_id" ON "visitor_records" USING btree ("guard_id");--> statement-breakpoint
CREATE INDEX "idx_visitor_records_house_id" ON "visitor_records" USING btree ("house_id");--> statement-breakpoint
ALTER TABLE "guards" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "guards" DROP COLUMN "password_hash";--> statement-breakpoint
ALTER TABLE "residents" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "residents" DROP COLUMN "password_hash";--> statement-breakpoint
ALTER TABLE "guards" ADD CONSTRAINT "guards_line_user_id_unique" UNIQUE("line_user_id");--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_line_user_id_unique" UNIQUE("line_user_id");