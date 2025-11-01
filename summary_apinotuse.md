# Unused and Redundant API Routes

This file lists API routes that are defined in the backend but are not currently used in a functional way.

## Unused Routes (Not registered in backend)

The following route files are not imported or used in `backend/src/index.ts`. Although the frontend may attempt to call these endpoints, the calls will fail because the routes are not registered on the backend.

- **`errorMonitoringRoutes`**: Defined in `backend/src/routes/errorMonitoring.ts`
- **`monitoringRoutes`**: Defined in `backend/src/routes/monitoring.ts`

## Redundant Routes

The following route is redundant because its functionality is provided by another route that is in use:

- **`residentApi`**: Defined in `backend/src/routes/residentAPI.ts`. Its endpoints under `/api/visitor-requests/pending/` are also provided by `visitorRecordRoutes` in `backend/src/routes/visitorRecord.ts`, which is used by the application.