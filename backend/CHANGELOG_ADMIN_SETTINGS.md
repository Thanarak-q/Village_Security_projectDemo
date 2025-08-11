# Changelog - Admin Settings API

## [1.0.0] - 2024-01-XX

### Added
- ✨ **Admin Settings API** - API ใหม่สำหรับการจัดการข้อมูลส่วนตัวของ Admin
- 🔍 **GET /api/admin/profile/:admin_id** - ดึงข้อมูลโปรไฟล์ของ admin
- ✏️ **PUT /api/admin/profile/:admin_id** - อัปเดตข้อมูลโปรไฟล์ (username, email, phone)
- 🔐 **PUT /api/admin/password/:admin_id** - เปลี่ยนรหัสผ่าน
- ⚙️ **PUT /api/admin/settings/:admin_id** - อัปเดตข้อมูลทั้งหมดพร้อมกัน

### Features
- การเปลี่ยนแปลง username, email, เบอร์มือถือ และรหัสผ่าน
- การตรวจสอบความถูกต้องของรหัสผ่านปัจจุบัน
- การ hash รหัสผ่านใหม่ด้วย bcrypt
- การตรวจสอบข้อมูลซ้ำ (username, email)
- การอัปเดต `updatedAt` field อัตโนมัติ
- การจัดการ error และ validation

### Security
- JWT authentication สำหรับทุก endpoint
- Role-based access control (admin, superadmin)
- Password verification ก่อนเปลี่ยนรหัสผ่าน
- Secure password hashing

### Files Added
- `src/routes/adminSettings.ts` - API routes สำหรับ admin settings
- `ADMIN_SETTINGS_API.md` - API documentation
- `README_ADMIN_SETTINGS.md` - คู่มือการใช้งาน
- `test-admin-settings-api.js` - Test script
- `CHANGELOG_ADMIN_SETTINGS.md` - ไฟล์นี้

### Files Modified
- `src/index.ts` - เพิ่ม adminSettingsRoutes

### Dependencies
- ใช้ `bcryptjs` สำหรับ password hashing
- ใช้ `drizzle-orm` สำหรับ database operations
- ใช้ `elysia` สำหรับ web framework

### Database Schema
- ใช้ตาราง `admins` ที่มีอยู่แล้ว
- Fields: `admin_id`, `username`, `email`, `phone`, `password_hash`, `role`, `status`, `village_key`, `createdAt`, `updatedAt`

### Validation Rules
- Username: ไม่สามารถเป็นค่าว่างได้, ต้องไม่ซ้ำ
- Email: ไม่สามารถเป็นค่าว่างได้, ต้องไม่ซ้ำ
- Phone: ไม่สามารถเป็นค่าว่างได้
- Password: ความยาวอย่างน้อย 6 ตัวอักษร

### Response Format
```json
{
  "success": true/false,
  "data": {...},
  "message": "Success message",
  "error": "Error message"
}
```

### Error Handling
- 400 Bad Request: Validation errors
- 401 Unauthorized: Authentication/Authorization errors
- 404 Not Found: Admin not found
- 500 Internal Server Error: Server errors

### Testing
- Test script สำหรับทดสอบทุก endpoint
- ตัวอย่างการใช้งานด้วย JavaScript/TypeScript
- ตัวอย่างการใช้งานด้วย React
- cURL commands สำหรับการทดสอบ

### Documentation
- API endpoints และ parameters
- Request/Response examples
- Frontend integration examples
- Troubleshooting guide
- Future development roadmap

### Next Steps
- [ ] ทดสอบ API ด้วยข้อมูลจริง
- [ ] เพิ่ม unit tests
- [ ] เพิ่ม integration tests
- [ ] เพิ่ม API rate limiting
- [ ] เพิ่ม API caching
- [ ] เพิ่ม admin activity logging
- [ ] เพิ่ม email verification
- [ ] เพิ่ม profile image upload

### Breaking Changes
- ไม่มี breaking changes

### Migration Guide
- ไม่ต้องทำการ migration
- เพียงแค่ restart server หลังจากเพิ่ม routes ใหม่

### Support
- สำหรับคำถามหรือปัญหาติดต่อ development team
- ตรวจสอบ logs สำหรับ debugging
- ใช้ test script สำหรับการทดสอบเบื้องต้น 