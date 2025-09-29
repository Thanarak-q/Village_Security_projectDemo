-- Add password_changed_at field to track when staff changed their password
ALTER TABLE "admins" ADD COLUMN "password_changed_at" timestamp;
