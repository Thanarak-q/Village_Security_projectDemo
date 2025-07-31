CREATE TABLE "admins" (
	"admin_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"phone" text NOT NULL,
	"village_key" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email"),
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "guards" (
	"guard_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"fname" text NOT NULL,
	"lname" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"phone" text NOT NULL,
	"village_key" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "guards_email_unique" UNIQUE("email"),
	CONSTRAINT "guards_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "house_members" (
	"house_member_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid,
	"resident_id" uuid
);
--> statement-breakpoint
CREATE TABLE "houses" (
	"house_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"village_key" text
);
--> statement-breakpoint
CREATE TABLE "residents" (
	"resident_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"fname" text NOT NULL,
	"lname" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"phone" text NOT NULL,
	"village_key" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "residents_email_unique" UNIQUE("email"),
	CONSTRAINT "residents_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"village_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"village_name" text NOT NULL,
	"village_key" text NOT NULL,
	CONSTRAINT "villages_village_key_unique" UNIQUE("village_key")
);
--> statement-breakpoint
CREATE TABLE "visitor_records" (
	"visitor_record_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid,
	"guard_id" uuid,
	"house_id" uuid,
	"picture_key" text,
	"license_plate" text,
	"entry_time" timestamp DEFAULT now(),
	"record_status" text DEFAULT 'pending',
	"visit_purpose" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "public"."villages"("village_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guards" ADD CONSTRAINT "guards_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "public"."villages"("village_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_house_id_houses_house_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("house_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_resident_id_residents_resident_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("resident_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "houses" ADD CONSTRAINT "houses_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "public"."villages"("village_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_village_key_villages_village_key_fk" FOREIGN KEY ("village_key") REFERENCES "public"."villages"("village_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_records" ADD CONSTRAINT "visitor_records_resident_id_residents_resident_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("resident_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_records" ADD CONSTRAINT "visitor_records_guard_id_guards_guard_id_fk" FOREIGN KEY ("guard_id") REFERENCES "public"."guards"("guard_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_records" ADD CONSTRAINT "visitor_records_house_id_houses_house_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("house_id") ON DELETE no action ON UPDATE no action;