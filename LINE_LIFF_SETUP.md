# LINE LIFF Setup Guide

## การตั้งค่า LINE LIFF สำหรับ Resident Page

### 1. สร้าง LINE LIFF App

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider ใหม่หรือเลือก Provider ที่มีอยู่
3. สร้าง Channel ใหม่ประเภท "LINE Login"
4. ในแท็บ "LIFF" ให้เพิ่ม LIFF app ใหม่:
   - **LIFF app name**: Village Security Resident
   - **Size**: Full
   - **Endpoint URL**: `https://your-domain.com/Resident`
   - **Scope**: profile, openid
   - **Bot link feature**: Off (หรือ On ตามต้องการ)

### 2. ตั้งค่า Environment Variables

ใน `frontend/.env.local` ให้เพิ่ม:

```env
NEXT_PUBLIC_LIFF_ID=your-liff-id-here
```

แทนที่ `your-liff-id-here` ด้วย LIFF ID ที่ได้จาก LINE Developers Console

### 3. ตั้งค่า Database

ตรวจสอบให้แน่ใจว่า residents table มี `line_user_id` field:

```sql
ALTER TABLE residents ADD COLUMN line_user_id TEXT UNIQUE;
```

### 4. การเชื่อมโยง LINE User กับ Resident

ต้องมีระบบสำหรับเชื่อมโยง LINE User ID กับ Resident ID ในฐานข้อมูล:

1. **วิธีที่ 1**: ให้ resident ลงทะเบียน LINE ID ผ่าน admin panel
2. **วิธีที่ 2**: สร้างหน้าลงทะเบียนให้ resident กรอก LINE ID
3. **วิธีที่ 3**: ใช้ QR Code หรือ deep link เพื่อเชื่อมโยง

### 5. การทดสอบ

1. เปิด LIFF app ใน LINE app
2. ตรวจสอบว่า authentication ทำงานถูกต้อง
3. ตรวจสอบว่าดึงข้อมูล pending requests ได้ถูกต้อง

### 6. API Endpoints ที่เกี่ยวข้อง

- `GET /api/visitor-requests/pending/line/:line_user_id` - ดึง pending requests ตาม LINE ID
- `GET /api/visitor-requests/history/line/:line_user_id` - ดึงประวัติตาม LINE ID
- `POST /api/visitor-requests/:record_id/approve` - อนุมัติคำขอ
- `POST /api/visitor-requests/:record_id/deny` - ปฏิเสธคำขอ

### 7. Security Considerations

- ตรวจสอบ LIFF ID signature เพื่อความปลอดภัย
- ใช้ HTTPS สำหรับ production
- จำกัด scope ของ LIFF app ให้เหมาะสม
- ตรวจสอบ user authentication ใน backend

### 8. Troubleshooting

**ปัญหา**: LIFF SDK ไม่โหลด
**แก้ไข**: ตรวจสอบ internet connection และ LIFF ID

**ปัญหา**: ไม่พบข้อมูล resident
**แก้ไข**: ตรวจสอบว่า LINE User ID ถูกเชื่อมโยงกับ resident ในฐานข้อมูลแล้ว

**ปัญหา**: Authentication ล้มเหลว
**แก้ไข**: ตรวจสอบ LIFF app configuration และ endpoint URL