# Visitor Data Refactoring

## Overview
This refactoring removes duplicate visitor data from `visitor_records` table and uses the dedicated `visitors` table instead.

## Changes Made

### 1. Database Schema Changes
- **Added**: `visitor_id` foreign key column to `visitor_records` table
- **Removed**: `visitor_name` and `visitor_id_card` columns from `visitor_records` table
- **Added**: Index on `visitor_id` column for better query performance

### 2. Migration Script
- Created migration file: `drizzle/0010_add_visitor_id_to_visitor_records.sql`
- Adds `visitor_id` column with foreign key constraint
- Removes duplicate columns
- Adds index for performance

### 3. Code Changes

#### Schema Updates (`src/db/schema.ts`)
- Updated `visitor_records` table definition
- Added `visitor_id` foreign key reference
- Removed `visitor_name` and `visitor_id_card` fields
- Added index for `visitor_id`

#### Visitor Record Utils (`src/db/visitorRecordUtils.ts`)
- Updated all query functions to join with `visitors` table
- Added visitor information fields from `visitors` table:
  - `visitor_name` (from `visitors.fname` + `visitors.lname`)
  - `visitor_phone`
  - `visitor_id_doc_type`
  - `visitor_risk_status`
  - `visitor_visit_count`
  - `visitor_last_visit_at`
- Updated `createVisitorRecord` function to accept `visitor_id` parameter

#### Submit Visitor Form (`src/routes/submitVisitorForm.ts`)
- Added logic to find or create visitor records
- Updated visitor record creation to include `visitor_id`
- Added proper error handling for visitor creation

#### Routes (`src/routes/visitorRecord.ts`)
- Updated `CreateVisitorRecordBody` interface to include `visitor_id`

#### Notification Service (`src/services/notificationService.ts`)
- Updated comments to indicate need for future updates to use visitor name from `visitors` table

## Benefits

1. **Data Normalization**: Eliminates duplicate visitor data
2. **Better Data Integrity**: Single source of truth for visitor information
3. **Improved Performance**: Better indexing and query optimization
4. **Enhanced Features**: Access to visitor risk status, visit history, and other visitor-specific data
5. **Future-Proof**: Easier to add visitor-related features

## Migration Instructions

1. **Backup Database**: Always backup your database before running migrations
2. **Run Migration**: Execute the migration script:
   ```bash
   cd backend
   npx drizzle-kit push
   ```
3. **Data Migration**: Existing visitor records will need to be updated to link with visitors table
4. **Test**: Verify all functionality works correctly

## Breaking Changes

- API responses now include visitor information from `visitors` table instead of duplicate fields
- Frontend may need updates to handle new data structure
- Existing visitor records without `visitor_id` will need to be handled gracefully

## Future Improvements

1. **Visitor Management**: Add CRUD operations for visitors
2. **Risk Assessment**: Implement visitor risk status management
3. **Visit History**: Track visitor visit patterns and frequency
4. **Notifications**: Use actual visitor names in notifications instead of ID cards

## Files Modified

- `src/db/schema.ts`
- `src/db/visitorRecordUtils.ts`
- `src/routes/submitVisitorForm.ts`
- `src/routes/visitorRecord.ts`
- `src/services/notificationService.ts`
- `drizzle/0010_add_visitor_id_to_visitor_records.sql`

## Testing

After applying these changes, test the following:
1. Creating new visitor records
2. Retrieving visitor records with visitor information
3. Updating visitor record status
4. Notification sending
5. Statistics and reporting functions
