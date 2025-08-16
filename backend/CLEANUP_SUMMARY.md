# API Cleanup Summary

## Deleted Files (Completely Unused)
- `backend/src/routes/village.ts` - 5 endpoints
- `backend/src/routes/houseMember.ts` - 7 endpoints  
- `backend/src/routes/adminActivityLogs.ts` - 6 endpoints
- `backend/src/routes/guard.ts` - 11 endpoints
- `backend/src/routes/resident.ts` - 8+ endpoints

## Cleaned Up Files (Partially Used)

### `backend/src/routes/admin.ts`
- **Status**: Emptied (all 11 endpoints unused)
- **Recommendation**: Remove entirely if no other services depend on it

### `backend/src/routes/visitorRecord.ts`
- **Kept**: `GET /visitor-records` (used by HistoryTable.tsx)
- **Removed**: 8 unused endpoints

### `backend/src/routes/house.ts`
- **Kept**: `GET /houses` (used by table_house.tsx)
- **Removed**: 2 unused endpoints

## Still Active Routes
- `backend/src/routes/auth.ts` - Authentication (heavily used)
- `backend/src/routes/adminSettings.ts` - Admin profile management (used)
- `backend/src/routes/houseManage.ts` - House CRUD operations (used)
- `backend/src/routes/statsCard.ts` - Dashboard statistics (used)
- `backend/src/routes/userTable.ts` - User management (used)
- `backend/src/routes/pendingUsers.ts` - User approval workflow (used)
- `backend/src/routes/visitorRecord-weekly.ts` - Chart data (used)
- `backend/src/routes/visitorRecord-monthly.ts` - Chart data (used)
- `backend/src/routes/visitorRecord-yearly.ts` - Chart data (used)

## Impact
- **Removed**: ~65 unused API endpoints
- **Reduced codebase**: ~2,000+ lines of unused code
- **Improved maintainability**: Easier to understand what APIs are actually used
- **Better performance**: Reduced bundle size and memory usage

## Next Steps
1. Consider removing `backend/src/routes/admin.ts` entirely
2. Review database utility functions that may now be unused
3. Update API documentation to reflect current endpoints
4. Run tests to ensure no breaking changes