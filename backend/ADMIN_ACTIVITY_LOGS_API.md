# Admin Activity Logs API Documentation

## Overview
Admin Activity Logs API ใช้สำหรับเก็บและดูประวัติการทำงานของ admin ในระบบ Village Security

## Base URL
```
http://localhost:3001/api
```

## Authentication
ทุก endpoint ต้องใช้ admin role ในการเข้าถึง

## Endpoints

### 1. Get All Activity Logs
**GET** `/admin-activity-logs`

ดูประวัติการทำงานทั้งหมดของ admin ในหมู่บ้านเดียวกัน

#### Query Parameters
- `page` (optional): หมายเลขหน้า (default: 1)
- `limit` (optional): จำนวนรายการต่อหน้า (default: 20, max: 100)
- `action_type` (optional): กรองตามประเภทการทำงาน
- `admin_id` (optional): กรองตาม admin เฉพาะ
- `start_date` (optional): วันที่เริ่มต้น (format: YYYY-MM-DD)
- `end_date` (optional): วันที่สิ้นสุด (format: YYYY-MM-DD)

#### Example Request
```bash
GET /api/admin-activity-logs?page=1&limit=20&action_type=approve_user
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "log_id": "uuid",
      "admin_id": "uuid",
      "action_type": "approve_user",
      "target_type": "resident",
      "target_id": "uuid",
      "old_value": null,
      "new_value": "verified",
      "description": "อนุมัติ resident",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T10:00:00Z",
      "admin_username": "admin1",
      "admin_fname": "John",
      "admin_lname": "Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 2. Get Activity Logs by Admin
**GET** `/admin-activity-logs/admin/:admin_id`

ดูประวัติการทำงานของ admin เฉพาะคน

#### Path Parameters
- `admin_id`: UUID ของ admin

#### Query Parameters
- `page` (optional): หมายเลขหน้า (default: 1)
- `limit` (optional): จำนวนรายการต่อหน้า (default: 20, max: 100)

#### Example Request
```bash
GET /api/admin-activity-logs/admin/123e4567-e89b-12d3-a456-426614174000?page=1&limit=10
```

### 3. Get Activity Logs by Action Type
**GET** `/admin-activity-logs/action/:action_type`

ดูประวัติการทำงานตามประเภทการทำงาน

#### Path Parameters
- `action_type`: ประเภทการทำงาน

#### Available Action Types
- `approve_user` - อนุมัติผู้ใช้
- `reject_user` - ปฏิเสธผู้ใช้
- `create_house` - เพิ่มบ้าน
- `update_house` - แก้ไขบ้าน
- `delete_house` - ลบบ้าน
- `change_house_status` - เปลี่ยนสถานะบ้าน
- `add_house_member` - เพิ่มสมาชิกบ้าน
- `remove_house_member` - ลบสมาชิกบ้าน
- `change_user_status` - เปลี่ยนสถานะผู้ใช้
- `change_user_role` - เปลี่ยน role ผู้ใช้
- `create_admin` - เพิ่ม admin
- `update_admin` - แก้ไข admin
- `delete_admin` - ลบ admin
- `create_village` - เพิ่มหมู่บ้าน
- `update_village` - แก้ไขหมู่บ้าน
- `delete_village` - ลบหมู่บ้าน
- `view_resident` - ดูข้อมูล resident
- `view_guard` - ดูข้อมูล guard
- `view_visitor_records` - ดู visitor records
- `export_data` - export ข้อมูล
- `system_config` - ตั้งค่าระบบ

#### Example Request
```bash
GET /api/admin-activity-logs/action/approve_user?page=1&limit=20
```

### 4. Get Activity Logs by Date Range
**GET** `/admin-activity-logs/date-range`

ดูประวัติการทำงานในช่วงวันที่ที่กำหนด

#### Query Parameters
- `start_date` (required): วันที่เริ่มต้น (format: YYYY-MM-DD)
- `end_date` (required): วันที่สิ้นสุด (format: YYYY-MM-DD)
- `page` (optional): หมายเลขหน้า (default: 1)
- `limit` (optional): จำนวนรายการต่อหน้า (default: 20, max: 100)

#### Example Request
```bash
GET /api/admin-activity-logs/date-range?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20
```

### 5. Get Activity Statistics
**GET** `/admin-activity-logs/statistics`

ดูสถิติการทำงานของ admin

#### Example Request
```bash
GET /api/admin-activity-logs/statistics
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byActionType": [
      {
        "action_type": "approve_user",
        "count": 45
      },
      {
        "action_type": "view_resident",
        "count": 30
      },
      {
        "action_type": "create_house",
        "count": 25
      }
    ]
  }
}
```

### 6. Get Available Action Types
**GET** `/admin-activity-logs/action-types`

ดูรายการประเภทการทำงานทั้งหมดที่สามารถใช้ได้

#### Example Request
```bash
GET /api/admin-activity-logs/action-types
```

#### Example Response
```json
{
  "success": true,
  "data": [
    "approve_user",
    "reject_user",
    "create_house",
    "update_house",
    "delete_house",
    "change_house_status",
    "add_house_member",
    "remove_house_member",
    "change_user_status",
    "change_user_role",
    "create_admin",
    "update_admin",
    "delete_admin",
    "create_village",
    "update_village",
    "delete_village",
    "view_resident",
    "view_guard",
    "view_visitor_records",
    "export_data",
    "system_config"
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized access"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch activity logs",
  "details": "Database connection error"
}
```

## Data Structure

### Activity Log Object
```typescript
{
  log_id: string;           // UUID
  admin_id: string;         // UUID ของ admin
  action_type: string;      // ประเภทการทำงาน
  target_type: string;      // ประเภทของสิ่งที่ถูกจัดการ
  target_id?: string;       // UUID ของสิ่งที่ถูกจัดการ
  old_value?: string;       // ค่าก่อนการเปลี่ยนแปลง
  new_value?: string;       // ค่าหลังการเปลี่ยนแปลง
  description: string;      // รายละเอียดการกระทำ
  ip_address?: string;      // IP address ของ admin
  user_agent?: string;      // User agent ของ admin
  created_at: string;       // เวลาที่ทำการ
  admin_username: string;   // Username ของ admin
  admin_fname: string;      // ชื่อของ admin
  admin_lname: string;      // นามสกุลของ admin
}
```

### Pagination Object
```typescript
{
  page: number;        // หน้าปัจจุบัน
  limit: number;       // จำนวนรายการต่อหน้า
  total: number;       // จำนวนรายการทั้งหมด
  totalPages: number;  // จำนวนหน้าทั้งหมด
}
```

## Usage Examples

### JavaScript/TypeScript
```javascript
// Get all activity logs
const response = await fetch('/api/admin-activity-logs?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
const data = await response.json();

// Get logs by action type
const logs = await fetch('/api/admin-activity-logs/action/approve_user', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});

// Get statistics
const stats = await fetch('/api/admin-activity-logs/statistics', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### cURL
```bash
# Get all logs
curl -X GET "http://localhost:3001/api/admin-activity-logs?page=1&limit=20" \
  -H "Authorization: Bearer your-jwt-token"

# Get logs by action type
curl -X GET "http://localhost:3001/api/admin-activity-logs/action/approve_user" \
  -H "Authorization: Bearer your-jwt-token"

# Get statistics
curl -X GET "http://localhost:3001/api/admin-activity-logs/statistics" \
  -H "Authorization: Bearer your-jwt-token"
``` 