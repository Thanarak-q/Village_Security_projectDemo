# Password Hashing Guide

คู่มือการใช้งาน Password Hashing ในระบบ Village Security

## ภาพรวม

ระบบนี้ใช้ **bcryptjs** สำหรับการ hash password เพื่อความปลอดภัย โดยจะ hash password ทั้งในกรณี:
- สร้าง user ใหม่
- อัปเดต password
- ข้อมูล seed ที่มีอยู่

## ไฟล์ที่เกี่ยวข้อง

### 1. Utility Functions
- `src/utils/passwordUtils.ts` - ฟังก์ชันหลักสำหรับ hash และ verify password

### 2. Schema
- `src/db/schema.ts` - กำหนดโครงสร้างฐานข้อมูลที่มีฟิลด์ `password_hash`

### 3. Routes ที่แก้ไขแล้ว
- `src/routes/auth.ts` - ใช้ bcrypt.compare() สำหรับ login
- `src/routes/resident.ts` - hash password ก่อนบันทึก/อัปเดต
- `src/routes/guard.ts` - hash password ก่อนบันทึก/อัปเดต  
- `src/routes/admin.ts` - hash password ก่อนบันทึก/อัปเดต

### 4. Seed Data
- `src/db/seed.ts` - hash password ก่อนบันทึกลงฐานข้อมูล

## การใช้งาน

### การสร้าง User ใหม่
```typescript
import { hashPassword } from "../utils/passwordUtils";

// Hash password ก่อนบันทึก
const hashedPassword = await hashPassword(plainTextPassword);

// บันทึกลงฐานข้อมูล
await db.insert(users).values({
  username: "user123",
  password_hash: hashedPassword,
  // ... other fields
});
```

### การ Verify Password (Login)
```typescript
import { verifyPassword } from "../utils/passwordUtils";

// ตรวจสอบ password
const isValid = await verifyPassword(plainTextPassword, hashedPassword);
if (isValid) {
  // Login สำเร็จ
}
```

### การอัปเดต Password
```typescript
// Hash password ใหม่ก่อนอัปเดต
if (password_hash !== undefined) {
  updateData.password_hash = await hashPassword(password_hash);
}
```

## การ Migrate ข้อมูลที่มีอยู่

### 1. รัน Migration Script
```bash
cd backend
npm run hash-passwords
```

หรือ

```bash
cd backend
bun run hash-passwords
```

### 2. หรือรัน Seed ใหม่
```bash
cd backend
bun run src/db/seed.ts
```

## ความปลอดภัย

- **Salt Rounds**: ใช้ 12 rounds (ค่าเริ่มต้นที่แนะนำ)
- **Algorithm**: bcrypt (slow hash function ที่ปลอดภัย)
- **Storage**: เก็บเฉพาะ hash ไม่เก็บ plain text password

## หมายเหตุสำคัญ

1. **ห้ามเก็บ plain text password** ในฐานข้อมูล
2. **ห้ามส่ง plain text password** ผ่าน API response
3. **ใช้ HTTPS** เสมอสำหรับการส่งข้อมูล
4. **ตรวจสอบ password strength** ก่อน hash (ถ้าต้องการ)

## การทดสอบ

### ทดสอบ Login
```bash
# ใช้ username และ password จาก seed data
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin_pha", "password": "password123"}'
```

### ทดสอบการสร้าง User ใหม่
```bash
curl -X POST http://localhost:3000/api/residents \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fname": "Test",
    "lname": "User", 
    "username": "testuser",
    "password_hash": "mypassword123",
    "phone": "0812345678",
    "village_key": "pha-suk-village-001"
  }'
```

## การแก้ไขปัญหา

### Error: "Invalid credentials"
- ตรวจสอบว่า password ในฐานข้อมูลถูก hash แล้ว
- ตรวจสอบว่าใช้ `verifyPassword()` function

### Error: "Password hash cannot be empty"
- ตรวจสอบว่า validation ทำงานถูกต้อง
- ตรวจสอบว่า password ไม่เป็น null หรือ undefined

### Error: "bcrypt is not a function"
- ตรวจสอบว่า import bcrypt ถูกต้อง
- ตรวจสอบว่า package `bcryptjs` ติดตั้งแล้ว 