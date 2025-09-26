CREATE TABLE "admin_villages" (
	"admin_village_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"village_key" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin_notification_delivery" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admin_notification_delivery" CASCADE;--> statement-breakpoint
ALTER TABLE "admins" DROP CONSTRAINT "admins_village_key_villages_village_key_fk";
--> statement-breakpoint
DROP INDEX "idx_admin_notifications_village_created";--> statement-breakpoint
DROP INDEX "idx_admins_village_key";--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE "admin_villages" ADD CONSTRAINT "admin_villages_admin_id_admins_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("admin_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_villages" ADD CONSTRAINT "admin_villages_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "public"."villages"("village_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_villages_admin_id" ON "admin_villages" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_villages_village_key" ON "admin_villages" USING btree ("village_key");--> statement-breakpoint
CREATE INDEX "idx_admin_villages_admin_village" ON "admin_villages" USING btree ("admin_id","village_key");--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN "village_key";