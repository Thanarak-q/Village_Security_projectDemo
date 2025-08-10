# Admin Settings API Documentation

API สำหรับการจัดการข้อมูลส่วนตัวของ Admin รวมถึงการเปลี่ยนแปลง username, email, เบอร์มือถือ และรหัสผ่าน

## Base URL
```
http://localhost:3001/api
```

## Authentication
ทุก endpoint ต้องมี JWT token และต้องมี role เป็น `admin` หรือ `superadmin`

## Endpoints

### 1. Get Admin Profile
**GET** `/admin/profile/:admin_id`

ดึงข้อมูลโปรไฟล์ของ admin สำหรับหน้า settings

**Response:**
```json
{
  "success": true,
  "data": {
    "admin_id": "uuid",
    "username": "admin_username",
    "email": "admin@example.com",
    "phone": "086-123-4567",
    "role": "admin",
    "status": "verified",
    "village_key": "village_key",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Update Admin Profile
**PUT** `/admin/profile/:admin_id`

อัปเดตข้อมูลโปรไฟล์ของ admin (username, email, phone)

**Request Body:**
```json
{
  "username": "new_username",
  "email": "newemail@example.com",
  "phone": "086-987-6543"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin_id": "uuid",
    "username": "new_username",
    "email": "newemail@example.com",
    "phone": "086-987-6543",
    "role": "admin",
    "status": "verified",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Change Admin Password
**PUT** `/admin/password/:admin_id`

เปลี่ยนรหัสผ่านของ admin

**Request Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "admin_id": "uuid",
    "username": "admin_username",
    "email": "admin@example.com",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Update Admin Settings (Complete)
**PUT** `/admin/settings/:admin_id`

อัปเดตข้อมูลโปรไฟล์และรหัสผ่านพร้อมกัน

**Request Body:**
```json
{
  "username": "new_username",
  "email": "newemail@example.com",
  "phone": "086-987-6543",
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile and password updated successfully",
  "data": {
    "admin_id": "uuid",
    "username": "new_username",
    "email": "newemail@example.com",
    "phone": "086-987-6543",
    "role": "admin",
    "status": "verified",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

### Validation Errors
```json
{
  "success": false,
  "error": "Username cannot be empty!"
}
```

### Duplicate Data Errors
```json
{
  "success": false,
  "error": "Email already exists!"
}
```

### Authentication Errors
```json
{
  "success": false,
  "error": "Current password is incorrect!"
}
```

### Not Found Errors
```json
{
  "success": false,
  "error": "Admin not found"
}
```

## Validation Rules

### Username
- ไม่สามารถเป็นค่าว่างได้
- ต้องไม่ซ้ำกับ username อื่นในระบบ

### Email
- ไม่สามารถเป็นค่าว่างได้
- ต้องไม่ซ้ำกับ email อื่นในระบบ

### Phone
- ไม่สามารถเป็นค่าว่างได้

### Password
- รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร
- ต้องกรอกรหัสผ่านปัจจุบันให้ถูกต้อง

## Usage Examples

### Frontend Integration

```typescript
// Get admin profile
const getProfile = async (adminId: string) => {
  const response = await fetch(`/api/admin/profile/${adminId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Update profile
const updateProfile = async (adminId: string, data: any) => {
  const response = await fetch(`/api/admin/profile/${adminId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Change password
const changePassword = async (adminId: string, currentPassword: string, newPassword: string) => {
  const response = await fetch(`/api/admin/password/${adminId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return response.json();
};

// Update all settings
const updateSettings = async (adminId: string, settings: any) => {
  const response = await fetch(`/api/admin/settings/${adminId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  });
  return response.json();
};
```

## Notes

- ทุก endpoint จะอัปเดต `updatedAt` field อัตโนมัติ
- การเปลี่ยนรหัสผ่านจะ hash รหัสผ่านใหม่ก่อนบันทึกลงฐานข้อมูล
- สามารถอัปเดตข้อมูลบางส่วนได้โดยไม่ต้องส่งข้อมูลทั้งหมด
- ระบบจะตรวจสอบความถูกต้องของรหัสผ่านปัจจุบันก่อนอนุญาตให้เปลี่ยนรหัสผ่านใหม่ 