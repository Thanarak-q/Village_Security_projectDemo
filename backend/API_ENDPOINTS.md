# Village Security API Endpoints

## Base URL
```
http://localhost:3001
```

## Health Check
- **GET** `/health` - Check API and database health status

## Villages
- **GET** `/api/villages` - Get all villages
- **POST** `/api/villages` - Create new village

## Houses
- **GET** `/api/houses` - Get all houses
- **GET** `/api/houses/village/:village_key` - Get houses by village
- **GET** `/api/houses/:house_id` - Get single house by ID
- **POST** `/api/houses` - Create new house
- **PUT** `/api/houses/:house_id` - Update house
- **DELETE** `/api/houses/:house_id` - Delete house

## Residents
- **GET** `/api/residents` - Get all residents
- **GET** `/api/residents/village/:village_key` - Get residents by village
- **GET** `/api/residents/:resident_id` - Get single resident by ID
- **GET** `/api/residents/username/:username` - Get resident by username
- **POST** `/api/residents` - Create new resident
- **PUT** `/api/residents/:resident_id` - Update resident
- **DELETE** `/api/residents/:resident_id` - Delete resident

## Guards
- **GET** `/api/guards` - Get all guards
- **GET** `/api/guards/village/:village_key` - Get guards by village
- **GET** `/api/guards/:guard_id` - Get single guard by ID
- **GET** `/api/guards/username/:username` - Get guard by username
- **GET** `/api/guards/status/:status` - Get guards by status
- **POST** `/api/guards` - Create new guard
- **PUT** `/api/guards/:guard_id` - Update guard
- **DELETE** `/api/guards/:guard_id` - Delete guard
- **PATCH** `/api/guards/:guard_id/status` - Update guard status

## Admins
- **GET** `/api/admins` - Get all admins
- **GET** `/api/admins/village/:village_key` - Get admins by village
- **GET** `/api/admins/:admin_id` - Get single admin by ID
- **GET** `/api/admins/username/:username` - Get admin by username
- **GET** `/api/admins/email/:email` - Get admin by email
- **GET** `/api/admins/status/:status` - Get admins by status
- **GET** `/api/admins/count/village/:village_key` - Get admin count by village
- **POST** `/api/admins` - Create new admin
- **PUT** `/api/admins/:admin_id` - Update admin
- **DELETE** `/api/admins/:admin_id` - Delete admin
- **PATCH** `/api/admins/:admin_id/status` - Update admin status

## House Members
- **GET** `/api/house-members` - Get all house members
- **GET** `/api/house-members/village/:village_key` - Get house members by village
- **GET** `/api/house-members/house/:house_id` - Get house members by house
- **GET** `/api/house-members/resident/:resident_id` - Get house members by resident
- **GET** `/api/house-members/:house_member_id` - Get single house member by ID
- **POST** `/api/house-members` - Create new house member
- **DELETE** `/api/house-members/:house_member_id` - Delete house member

## Visitor Records
- **GET** `/api/visitor-records` - Get all visitor records
- **GET** `/api/visitor-records/village/:village_key` - Get visitor records by village
- **GET** `/api/visitor-records/resident/:resident_id` - Get visitor records by resident
- **GET** `/api/visitor-records/guard/:guard_id` - Get visitor records by guard
- **GET** `/api/visitor-records/house/:house_id` - Get visitor records by house
- **GET** `/api/visitor-records/status/:status` - Get visitor records by status
- **GET** `/api/visitor-records/:visitor_record_id` - Get single visitor record by ID
- **POST** `/api/visitor-records` - Create new visitor record
- **PATCH** `/api/visitor-records/:visitor_record_id/status` - Update visitor record status
- **DELETE** `/api/visitor-records/:visitor_record_id` - Delete visitor record

## Response Format

### Success Response
```json
{
  "success": true,
  "data": [...],
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "Village Security API",
  "database": {
    "status": "connected",
    "pool": {
      "totalCount": 5,
      "idleCount": 3,
      "waitingCount": 0
    }
  }
}
```

## Status Values

### User Status
- `verified` - User is verified and active
- `pending` - User is pending verification
- `disable` - User is disabled

### Visitor Record Status
- `approved` - Visitor record is approved
- `pending` - Visitor record is pending approval
- `rejected` - Visitor record is rejected

## Testing the API

You can test the API using curl or any HTTP client:

```bash
# Health check
curl http://localhost:3001/health

# Get all villages
curl http://localhost:3001/api/villages

# Get all houses
curl http://localhost:3001/api/houses
``` 