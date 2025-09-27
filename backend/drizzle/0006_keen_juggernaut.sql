ALTER TABLE "admins" ADD COLUMN "village_key" text;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "public"."villages"("village_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admins_village_key" ON "admins" USING btree ("village_key");