# Test History Village Separation

## Overview
This document outlines how to test the village separation functionality in the history module.

## Changes Made

### Backend Changes

1. **Admin Activity Logs Route** (`/api/admin/activity-logs`)
   - Now requires `village_key` query parameter
   - Filters logs by village for regular admins
   - Superadmins can see all logs for a specific village
   - Added access control to ensure admins only see their village's logs

2. **Visitor Records Route** (`/api/visitor-records`)
   - Now requires `village_key` query parameter
   - Uses existing `getVisitorRecordsByVillage()` function
   - Returns only visitor records for the specified village

### Frontend Changes

1. **HistoryTable Component**
   - Gets selected village from `sessionStorage.getItem("selectedVillage")`
   - Passes `village_key` as query parameter to both API endpoints
   - Refreshes data when village selection changes
   - Added refresh button for manual data updates
   - Better error handling for missing village selection

## Testing Steps

### 1. Backend API Testing

#### Test Admin Activity Logs
```bash
# Test with village_key parameter
curl -X GET "http://localhost:3001/api/admin/activity-logs?village_key=test-village-1" \
  -H "Cookie: your-auth-cookie"

# Test without village_key (should return error)
curl -X GET "http://localhost:3001/api/admin/activity-logs" \
  -H "Cookie: your-auth-cookie"
```

#### Test Visitor Records
```bash
# Test with village_key parameter
curl -X GET "http://localhost:3001/api/visitor-records?village_key=test-village-1"

# Test without village_key (should return error)
curl -X GET "http://localhost:3001/api/visitor-records"
```

### 2. Frontend Testing

#### Test Village Selection
1. Login as an admin
2. Select a village from the village selector
3. Navigate to History page
4. Verify that only data for the selected village is displayed
5. Switch to a different village
6. Verify that the history data updates to show only the new village's data

#### Test Error Handling
1. Clear the selected village from sessionStorage
2. Navigate to History page
3. Verify that an appropriate error message is displayed
4. Verify that the error message suggests selecting a village first

#### Test Refresh Functionality
1. Navigate to History page with a village selected
2. Click the refresh button
3. Verify that data is reloaded
4. Verify that the refresh indicator shows during loading

### 3. Data Isolation Testing

#### Test Admin Access Control
1. Login as an admin for Village A
2. Try to access history for Village B by manually changing the village_key parameter
3. Verify that access is denied or only Village A data is returned

#### Test Superadmin Access
1. Login as a superadmin
2. Access history for different villages
3. Verify that superadmin can see data for any village

## Expected Results

### Success Cases
- ✅ History data is filtered by selected village
- ✅ Data refreshes when village selection changes
- ✅ Admin users only see data for their assigned villages
- ✅ Superadmin can see data for any village
- ✅ Proper error handling for missing village selection
- ✅ Refresh functionality works correctly

### Error Cases
- ✅ API returns error when village_key is missing
- ✅ Frontend shows appropriate error message when no village is selected
- ✅ Access denied when admin tries to access other village's data

## Database Verification

To verify data separation at the database level:

```sql
-- Check admin activity logs are properly associated with villages
SELECT 
  aal.log_id,
  aal.action_type,
  aal.description,
  aal.created_at,
  a.username,
  a.village_key
FROM admin_activity_logs aal
JOIN admins a ON aal.admin_id = a.admin_id
WHERE a.village_key = 'your-village-key';

-- Check visitor records are properly associated with villages
SELECT 
  vr.visitor_record_id,
  vr.visitor_name,
  vr.entry_time,
  h.address,
  h.village_key
FROM visitor_records vr
JOIN houses h ON vr.house_id = h.house_id
WHERE h.village_key = 'your-village-key';
```

## Notes

- The implementation ensures that data is properly isolated by village
- Admin users can only access data for villages they are assigned to
- Superadmin users have access to all villages
- The frontend automatically refreshes when village selection changes
- Error handling provides clear feedback to users
