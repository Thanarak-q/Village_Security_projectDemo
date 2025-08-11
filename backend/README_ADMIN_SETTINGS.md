# Admin Settings API - คู่มือการใช้งาน

## ภาพรวม
Admin Settings API เป็น API สำหรับการจัดการข้อมูลส่วนตัวของ Admin รวมถึงการเปลี่ยนแปลง:
- **Username** - ชื่อผู้ใช้
- **Email** - อีเมล
- **เบอร์มือถือ** - หมายเลขโทรศัพท์
- **รหัสผ่าน** - รหัสผ่านใหม่

## การติดตั้ง

### 1. ตรวจสอบ Dependencies
```bash
npm install
```

### 2. รันเซิร์ฟเวอร์
```bash
npm run dev
```

เซิร์ฟเวอร์จะรันที่ `http://localhost:3001`

## API Endpoints

### 🔍 Get Admin Profile
```
GET /api/admin/profile/:admin_id
```
ดึงข้อมูลโปรไฟล์ของ admin สำหรับหน้า settings

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

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

### ✏️ Update Admin Profile
```
PUT /api/admin/profile/:admin_id
```
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

### 🔐 Change Admin Password
```
PUT /api/admin/password/:admin_id
```
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

### ⚙️ Update Admin Settings (Complete)
```
PUT /api/admin/settings/:admin_id
```
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

## การใช้งานใน Frontend

### ตัวอย่างการใช้งานด้วย JavaScript/TypeScript

```typescript
class AdminSettingsAPI {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  // Get admin profile
  async getProfile(adminId: string) {
    const response = await fetch(`${this.baseURL}/admin/profile/${adminId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  // Update profile
  async updateProfile(adminId: string, data: {
    username?: string;
    email?: string;
    phone?: string;
  }) {
    const response = await fetch(`${this.baseURL}/admin/profile/${adminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  // Change password
  async changePassword(adminId: string, currentPassword: string, newPassword: string) {
    const response = await fetch(`${this.baseURL}/admin/password/${adminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return response.json();
  }

  // Update all settings
  async updateSettings(adminId: string, settings: {
    username?: string;
    email?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const response = await fetch(`${this.baseURL}/admin/settings/${adminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    return response.json();
  }
}

// ตัวอย่างการใช้งาน
const adminAPI = new AdminSettingsAPI('http://localhost:3001/api', 'your-jwt-token');

// ดึงข้อมูลโปรไฟล์
const profile = await adminAPI.getProfile('admin-uuid');

// อัปเดตข้อมูลโปรไฟล์
const updateResult = await adminAPI.updateProfile('admin-uuid', {
  username: 'new_username',
  email: 'new@example.com'
});

// เปลี่ยนรหัสผ่าน
const passwordResult = await adminAPI.changePassword('admin-uuid', 'old_pass', 'new_pass');
```

### ตัวอย่างการใช้งานด้วย React

```tsx
import React, { useState, useEffect } from 'react';

interface AdminProfile {
  admin_id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

const AdminSettingsForm: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile/your-admin-id', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setFormData(prev => ({
          ...prev,
          username: data.data.username,
          email: data.data.email,
          phone: data.data.phone
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings/your-admin-id', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Settings updated successfully!');
        fetchProfile(); // Refresh profile data
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('An error occurred while updating settings');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Settings</h2>
      
      {message && (
        <div className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Current Password</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              minLength={6}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Save Changes'}
      </button>
    </form>
  );
};

export default AdminSettingsForm;
```

## การทดสอบ

### 1. รัน Test Script
```bash
node test-admin-settings-api.js
```

### 2. ทดสอบด้วย Postman หรือ cURL

**Get Profile:**
```bash
curl -X GET "http://localhost:3001/api/admin/profile/your-admin-id" \
  -H "Authorization: Bearer your-jwt-token"
```

**Update Profile:**
```bash
curl -X PUT "http://localhost:3001/api/admin/profile/your-admin-id" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_username",
    "email": "new@example.com",
    "phone": "086-999-8888"
  }'
```

**Change Password:**
```bash
curl -X PUT "http://localhost:3001/api/admin/password/your-admin-id" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "old_password",
    "newPassword": "new_password_123"
  }'
```

## ข้อกำหนดและข้อจำกัด

### Validation Rules
- **Username**: ไม่สามารถเป็นค่าว่างได้ และต้องไม่ซ้ำกับ username อื่น
- **Email**: ไม่สามารถเป็นค่าว่างได้ และต้องไม่ซ้ำกับ email อื่น
- **Phone**: ไม่สามารถเป็นค่าว่างได้
- **Password**: รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร

### Security
- ทุก endpoint ต้องมี JWT token ที่ถูกต้อง
- ต้องมี role เป็น `admin` หรือ `superadmin`
- รหัสผ่านจะถูก hash ด้วย bcrypt ก่อนบันทึกลงฐานข้อมูล
- ต้องกรอกรหัสผ่านปัจจุบันให้ถูกต้องก่อนเปลี่ยนรหัสผ่านใหม่

### Database
- ข้อมูลจะถูกบันทึกลงตาราง `admins`
- `updatedAt` field จะถูกอัปเดตอัตโนมัติทุกครั้งที่มีการเปลี่ยนแปลง

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **401 Unauthorized**: ตรวจสอบ JWT token และ role
2. **404 Not Found**: ตรวจสอบ admin_id ที่ส่งไป
3. **400 Bad Request**: ตรวจสอบข้อมูลที่ส่งไปและ validation rules
4. **500 Internal Server Error**: ตรวจสอบ server logs

### Debug Mode
เปิด debug mode ใน development:
```typescript
// ในไฟล์ index.ts
const app = new Elysia()
  .use(cors())
  .use(cookie())
  .use(jwt({ name: "jwt", secret: "super-secret", exp: "7d" }))
  .onError(({ code, error, set }) => {
    console.error(`Error ${code}:`, error);
    set.status = 500;
    return { error: "Internal server error" };
  });
```

## การพัฒนาต่อ

### Features ที่อาจเพิ่มในอนาคต
- การอัปโหลดรูปโปรไฟล์
- การส่งอีเมลยืนยันเมื่อเปลี่ยนข้อมูลสำคัญ
- การบันทึกประวัติการเปลี่ยนแปลง
- การตั้งค่าการแจ้งเตือน
- การเชื่อมต่อกับระบบ authentication อื่นๆ

### การปรับแต่ง
- เปลี่ยน validation rules ตามความต้องการ
- เพิ่ม fields ใหม่ในตาราง admins
- ปรับแต่ง response format
- เพิ่ม rate limiting
- เพิ่ม caching 