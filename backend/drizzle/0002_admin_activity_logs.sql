CREATE TABLE IF NOT EXISTS "admin_activity_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"old_value" text,
	"new_value" text,
	"description" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_admins_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "admins"("admin_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "admin_activity_logs_admin_id_idx" ON "admin_activity_logs" ("admin_id");
CREATE INDEX IF NOT EXISTS "admin_activity_logs_action_type_idx" ON "admin_activity_logs" ("action_type");
CREATE INDEX IF NOT EXISTS "admin_activity_logs_target_type_idx" ON "admin_activity_logs" ("target_type");
CREATE INDEX IF NOT EXISTS "admin_activity_logs_created_at_idx" ON "admin_activity_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "admin_activity_logs_admin_id_created_at_idx" ON "admin_activity_logs" ("admin_id", "created_at"); 