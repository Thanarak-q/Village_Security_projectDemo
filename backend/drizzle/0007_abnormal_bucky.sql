ALTER TABLE "admins" DROP CONSTRAINT "admins_email_unique";--> statement-breakpoint
DROP INDEX "idx_admins_village_key";--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "phone" DROP NOT NULL;