# การปรับปรุงฟังก์ชัน SEED VISITOR RECORDS

## สรุปการปรับปรุง

### 1. การเพิ่มฟิลด์ `exit_time`
- เพิ่มฟิลด์ `exit_time` ในตาราง `visitor_records` เพื่อติดตามเวลาที่ผู้เยี่ยมออกจากหมู่บ้าน
- ฟิลด์นี้จะถูกเติมเฉพาะเมื่อ `record_status` เป็น "approved"

### 2. การปรับปรุงการสร้าง Timestamp
- **เดิม**: ใช้ `defaultNow()` ซึ่งทำให้ทุก record มีเวลาเดียวกัน
- **ใหม่**: สร้างเวลาที่หลากหลายในช่วง 30 วันย้อนหลัง
- สร้าง `entry_time` แบบสุ่ม
- สร้าง `exit_time` สำหรับ record ที่ approved (1-8 ชั่วโมงหลังจาก entry_time)

### 3. การเพิ่มข้อมูลตัวอย่าง
- เพิ่มป้ายทะเบียนรถจาก 10 เป็น 20 แบบ
- เพิ่มวัตถุประสงค์การเยี่ยมจาก 10 เป็น 15 แบบ
- เพิ่มความหลากหลายของ visitor records จาก 1-3 เป็น 1-4 รายการต่อ resident

### 4. การปรับปรุงฟังก์ชัน `createVisitorRecordsData()`

#### คุณสมบัติใหม่:
```typescript
// สร้างเวลาที่สมจริง
function generateRandomTimestamp(): Date {
  const now = new Date();
  const randomDaysAgo = Math.floor(Math.random() * 30);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  
  const timestamp = new Date(now);
  timestamp.setDate(timestamp.getDate() - randomDaysAgo);
  timestamp.setHours(randomHours, randomMinutes, 0, 0);
  
  return timestamp;
}

// จัดการ exit_time ตาม status
if (randomStatus === "approved") {
  exitTime = new Date(entryTime);
  exitTime.setHours(exitTime.getHours() + Math.floor(Math.random() * 8) + 1);
}
```

## ไฟล์ที่ถูกปรับปรุง

1. **`backend/src/db/seed.ts`** - ปรับปรุงฟังก์ชัน `createVisitorRecordsData()`
2. **`backend/src/db/schema.ts`** - เพิ่มฟิลด์ `exit_time`
3. **`backend/drizzle/0003_add_exit_time_to_visitor_records.sql`** - Migration file
4. **`backend/drizzle/meta/_journal.json`** - อัปเดต journal
5. **`backend/drizzle/meta/0003_snapshot.json`** - สร้าง snapshot ใหม่

## วิธีการใช้งาน

### 1. รัน Migration
```bash
cd backend
npm run db:migrate
```

### 2. รัน Seed
```bash
npm run db:seed
```

## ผลลัพธ์ที่คาดหวัง

- Visitor records จะมีข้อมูลที่สมจริงมากขึ้น
- Timestamps จะกระจายในช่วง 30 วันย้อนหลัง
- Record ที่ approved จะมี exit_time
- ข้อมูลตัวอย่างมีความหลากหลายมากขึ้น

## ข้อควรระวัง

- ต้องรัน migration ก่อนรัน seed
- หากมีข้อมูลเดิมในตาราง `visitor_records` ควรลบก่อนรัน seed ใหม่
- ตรวจสอบว่า database connection ทำงานปกติ

## การปรับปรุงในอนาคต

1. เพิ่มฟิลด์ `visitor_name` และ `visitor_phone`
2. เพิ่มฟิลด์ `notes` สำหรับหมายเหตุ
3. เพิ่มการสร้างข้อมูลตามช่วงเวลาต่างๆ (เช้า, บ่าย, เย็น, กลางคืน)
4. เพิ่มการสร้างข้อมูลตามฤดูกาลหรือวันหยุด 