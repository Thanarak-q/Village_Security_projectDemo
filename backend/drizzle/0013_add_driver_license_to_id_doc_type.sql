-- Migration: Add 'driver_license' as a valid option for id_doc_type in visitors table
-- This allows visitors to be identified by their driver license as well as ID card

-- Note: In PostgreSQL, TEXT columns don't have CHECK constraints by default,
-- so we're just documenting that 'driver_license' is now a valid value.
-- The TypeScript type system enforces this at the application level.

-- No ALTER TABLE needed since id_doc_type is a TEXT field without constraints.
-- This migration serves as documentation for the schema change.

-- Valid values for id_doc_type are now:
-- - 'thai_id' (Thai National ID Card)
-- - 'passport' (Passport)
-- - 'driver_license' (Driver License) -- NEW
-- - 'other' (Other document types)

