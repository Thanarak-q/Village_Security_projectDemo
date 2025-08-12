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
- เพิ่มความหลากหลายของ visitor records จาก 1-3 เป็น 2-8 รายการต่อ resident
- เพิ่มการสร้างข้อมูลเพิ่มเติมสำหรับหมู่บ้านที่มีข้อมูลน้อย เพื่อให้มีข้อมูลครบถ้วน

### 4. การปรับปรุงฟังก์ชัน `createVisitorRecordsData()`

#### คุณสมบัติใหม่:
```typescript
// สร้างเวลาที่สมจริงและกระจายข้อมูลทั่วช่วงเวลา
function generateRandomTimestamp(): Date {
  const now = new Date();
  
  // Randomly choose time period: 70% recent (this week), 20% this month, 10% this year
  const periodChoice = Math.random();
  let randomDaysAgo: number;
  
  if (periodChoice < 0.7) {
    // 70% - This week (0-7 days ago)
    randomDaysAgo = Math.floor(Math.random() * 7);
  } else if (periodChoice < 0.9) {
    // 20% - This month (8-30 days ago)
    randomDaysAgo = Math.floor(Math.random() * 22) + 8;
  } else {
    // 10% - This year (31-365 days ago)
    randomDaysAgo = Math.floor(Math.random() * 334) + 31;
  }
  
  // Generate random time with more realistic distribution
  let randomHours: number;
  const hourChoice = Math.random();
  
  if (hourChoice < 0.4) {
    // 40% - Business hours (8:00-18:00)
    randomHours = Math.floor(Math.random() * 10) + 8;
  } else if (hourChoice < 0.7) {
    // 30% - Evening hours (18:00-22:00)
    randomHours = Math.floor(Math.random() * 4) + 18;
  } else if (hourChoice < 0.85) {
    // 15% - Morning hours (6:00-8:00)
    randomHours = Math.floor(Math.random() * 2) + 6;
  } else if (hourChoice < 0.95) {
    // 10% - Late night (22:00-24:00)
    randomHours = Math.floor(Math.random() * 2) + 22;
  } else {
    // 5% - Early morning (0:00-6:00)
    randomHours = Math.floor(Math.random() * 6);
  }
  
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
- **Timestamps จะกระจายทั่วช่วงเวลา:**
  - 70% สัปดาห์นี้ (0-7 วันย้อนหลัง)
  - 20% เดือนนี้ (8-30 วันย้อนหลัง)  
  - 10% ปีนี้ (31-365 วันย้อนหลัง)
- **การกระจายเวลาตามช่วงเวลาจริง:**
  - 40% ชั่วโมงทำงาน (8:00-18:00)
  - 30% ช่วงเย็น (18:00-22:00)
  - 15% ช่วงเช้า (6:00-8:00)
  - 10% ดึก (22:00-24:00)
  - 5% เช้ามืด (0:00-6:00)
- Record ที่ approved จะมี exit_time
- ข้อมูลตัวอย่างมีความหลากหลายมากขึ้น
- มีข้อมูลครบถ้วนสำหรับทุกหมู่บ้าน

## ข้อควรระวัง

- ต้องรัน migration ก่อนรัน seed
- หากมีข้อมูลเดิมในตาราง `visitor_records` ควรลบก่อนรัน seed ใหม่
- ตรวจสอบว่า database connection ทำงานปกติ

## การปรับปรุงในอนาคต

1. เพิ่มฟิลด์ `visitor_name` และ `visitor_phone`
2. เพิ่มฟิลด์ `notes` สำหรับหมายเหตุ
3. เพิ่มการสร้างข้อมูลตามช่วงเวลาต่างๆ (เช้า, บ่าย, เย็น, กลางคืน)
4. เพิ่มการสร้างข้อมูลตามฤดูกาลหรือวันหยุด 