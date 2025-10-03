-- Add visitor_id column to visitor_records table
ALTER TABLE "visitor_records" ADD COLUMN "visitor_id" uuid;

-- Add foreign key constraint
ALTER TABLE "visitor_records" ADD CONSTRAINT "visitor_records_visitor_id_visitors_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("visitor_id") ON DELETE no action ON UPDATE no action;

-- Add index for visitor_id
CREATE INDEX "idx_visitor_records_visitor_id" ON "visitor_records" ("visitor_id");

-- Remove visitor_name and visitor_id_card columns
ALTER TABLE "visitor_records" DROP COLUMN "visitor_name";
ALTER TABLE "visitor_records" DROP COLUMN "visitor_id_card";
