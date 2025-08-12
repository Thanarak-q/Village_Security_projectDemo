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
**GET** `/admin/profile`

ดึงข้อมูลโปรไฟล์ของ admin ปัจจุบันที่ login อยู่ (แก้ไขข้อมูลของตัวเองเท่านั้น)

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
**PUT** `/admin/profile`

อัปเดตข้อมูลโปรไฟล์ของ admin ปัจจุบัน (username, email, phone)

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
**PUT** `/admin/password`

เปลี่ยนรหัสผ่านของ admin ปัจจุบัน

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
**PUT** `/admin/settings`

อัปเดตข้อมูลโปรไฟล์และรหัสผ่านพร้อมกันของ admin ปัจจุบัน

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

## Security Features

### ✅ **แก้ไขข้อมูลของตัวเองเท่านั้น**
- ไม่ต้องส่ง admin_id ใน URL หรือ request body
- ระบบจะใช้ admin_id จาก JWT token อัตโนมัติ
- แอดมินไม่สามารถแก้ไขข้อมูลของแอดมินคนอื่นได้

### ✅ **Authentication Required**
- ต้องมี JWT token ที่ถูกต้อง
- ต้องมี role เป็น admin หรือ superadmin

## Usage Examples

### Frontend Integration

```typescript
// Get admin profile (current user)
const getProfile = async () => {
  const response = await fetch(`/api/admin/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Update profile (current user)
const updateProfile = async (data: any) => {
  const response = await fetch(`/api/admin/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Change password (current user)
const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await fetch(`/api/admin/password`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return response.json();
};

// Update all settings (current user)
const updateSettings = async (settings: any) => {
  const response = await fetch(`/api/admin/settings`, {
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
- **แอดมินแก้ไขได้เฉพาะข้อมูลของตัวเองเท่านั้น ไม่สามารถแก้ไขข้อมูลของแอดมินคนอื่นได้** 