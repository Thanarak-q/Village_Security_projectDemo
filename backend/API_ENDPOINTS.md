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

### Get All Visitor Records
- **GET** `/api/visitor-records`
- **Description**: Get all visitor records with related data
- **Response**: Array of visitor records with resident, guard, and house information

### Get Visitor Records by Village
- **GET** `/api/visitor-records/village/:village_key`
- **Description**: Get visitor records for a specific village
- **Parameters**: `village_key` (string)
- **Response**: Array of visitor records for the specified village

### Get Visitor Records by Resident
- **GET** `/api/visitor-records/resident/:resident_id`
- **Description**: Get visitor records for a specific resident
- **Parameters**: `resident_id` (string)
- **Response**: Array of visitor records for the specified resident

### Get Visitor Records by Guard
- **GET** `/api/visitor-records/guard/:guard_id`
- **Description**: Get visitor records for a specific guard
- **Parameters**: `guard_id` (string)
- **Response**: Array of visitor records for the specified guard

### Get Visitor Records by House
- **GET** `/api/visitor-records/house/:house_id`
- **Description**: Get visitor records for a specific house
- **Parameters**: `house_id` (string)
- **Response**: Array of visitor records for the specified house

### Get Visitor Records by Status
- **GET** `/api/visitor-records/status/:status`
- **Description**: Get visitor records by status (approved, pending, rejected)
- **Parameters**: `status` (string) - must be "approved", "pending", or "rejected"
- **Response**: Array of visitor records with the specified status

### Get Single Visitor Record
- **GET** `/api/visitor-records/:visitor_record_id`
- **Description**: Get a single visitor record by ID
- **Parameters**: `visitor_record_id` (string)
- **Response**: Single visitor record object

### Create Visitor Record
- **POST** `/api/visitor-records`
- **Description**: Create a new visitor record
- **Body**:
  ```json
  {
    "resident_id": "string",
    "guard_id": "string",
    "house_id": "string",
    "picture_key": "string (optional)",
    "license_plate": "string (optional)",
    "record_status": "approved|pending|rejected (optional)",
    "visit_purpose": "string (optional)"
  }
  ```
- **Response**: Created visitor record object

### Update Visitor Record Status
- **PATCH** `/api/visitor-records/:visitor_record_id/status`
- **Description**: Update the status of a visitor record
- **Parameters**: `visitor_record_id` (string)
- **Body**:
  ```json
  {
    "status": "approved|pending|rejected"
  }
  ```
- **Response**: Updated visitor record object

### Delete Visitor Record
- **DELETE** `/api/visitor-records/:visitor_record_id`
- **Description**: Delete a visitor record
- **Parameters**: `visitor_record_id` (string)
- **Response**: Deleted visitor record object

## Visitor Records Statistics

### Get Weekly Visitor Records Statistics
- **GET** `/api/visitor-record-weekly`
- **Description**: Get visitor records statistics for the current week (Sunday to Saturday)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "weekStart": "2024-01-07T00:00:00.000Z",
      "weekEnd": "2024-01-13T23:59:59.999Z",
      "currentDate": "2024-01-10T12:00:00.000Z",
      "weeklyData": [
        {
          "day": "Sunday",
          "approved": 5,
          "pending": 2,
          "rejected": 1,
          "total": 8
        },
        // ... other days
      ],
      "summary": {
        "totalApproved": 25,
        "totalPending": 10,
        "totalRejected": 5,
        "totalRecords": 40
      }
    }
  }
  ```

### Get Monthly Visitor Records Statistics
- **GET** `/api/visitor-record-monthly`
- **Description**: Get visitor records statistics for the current year, broken down by month
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "year": 2024,
      "yearStart": "2024-01-01T00:00:00.000Z",
      "yearEnd": "2024-12-31T23:59:59.999Z",
      "currentDate": "2024-01-10T12:00:00.000Z",
      "monthlyData": [
        {
          "month": "January",
          "monthNumber": 1,
          "approved": 45,
          "pending": 15,
          "rejected": 8,
          "total": 68
        },
        {
          "month": "February",
          "monthNumber": 2,
          "approved": 0,
          "pending": 0,
          "rejected": 0,
          "total": 0
        },
        // ... other months (showing 0 for future months)
      ],
      "summary": {
        "totalApproved": 45,
        "totalPending": 15,
        "totalRejected": 8,
        "totalRecords": 68
      }
    }
  }
  ```

### Get Yearly Visitor Records Statistics
**GET** `/api/visitor-record-yearly`

Returns yearly statistics for visitor records including approved, pending, and rejected counts for each year.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentDate": "2024-01-15T10:30:00.000Z",
    "totalYears": 3,
    "yearlyData": [
      {
        "year": 2024,
        "approved": 150,
        "pending": 25,
        "rejected": 10,
        "total": 185
      },
      {
        "year": 2023,
        "approved": 1200,
        "pending": 180,
        "rejected": 75,
        "total": 1455
      },
      {
        "year": 2022,
        "approved": 800,
        "pending": 120,
        "rejected": 50,
        "total": 970
      }
    ],
    "summary": {
      "totalApproved": 2150,
      "totalPending": 325,
      "totalRejected": 135,
      "totalRecords": 2610
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to fetch yearly visitor records"
}
```

**Description:**
- Returns visitor record statistics grouped by year
- Years are sorted in descending order (newest first)
- Includes counts for approved, pending, and rejected records
- Provides summary totals across all years
- Useful for yearly trend analysis and reporting

## Other Endpoints

### Health Check
- **GET** `/api/health`
- **Description**: Check the health status of the API and database connection
- **Response**: Health status information

### Root
- **GET** `/`
- **Description**: Welcome message
- **Response**: "Hello Village Security API!"

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Notes

- **Monthly Statistics**: The monthly endpoint shows data for all 12 months of the current year. Months that haven't occurred yet (future months) will show 0 for all counts.
- **Weekly Statistics**: The weekly endpoint shows data for the current week (Sunday to Saturday). Future days in the current week will show 0 for all counts.
- **Status Values**: Visitor record status can be "approved", "pending", or "rejected".
- **Authentication**: Some endpoints may require authentication (to be implemented).
- **CORS**: The API supports CORS for cross-origin requests. 