# Chart API Integration

## การเชื่อมต่อ Chart กับ API จริง

ไฟล์ `chart.tsx` ได้รับการอัปเดตให้ดึงข้อมูลจริงจาก API แทนข้อมูลจำลอง

### API Endpoints ที่ใช้

1. **Weekly Data**: `GET /api/visitor-record-weekly`
2. **Monthly Data**: `GET /api/visitor-record-monthly` 
3. **Yearly Data**: `GET /api/visitor-record-yearly`

### ข้อมูลที่แสดง

- **อนุมัติ (Approved)**: จำนวนผู้มาเยือนที่ได้รับอนุมัติ
- **ปฏิเสธ (Rejected)**: จำนวนผู้มาเยือนที่ถูกปฏิเสธ

### การจัดการข้อผิดพลาด

1. **Loading State**: แสดง spinner ขณะโหลดข้อมูล
2. **Error Handling**: แสดงข้อความข้อผิดพลาดและปุ่มลองใหม่
3. **Fallback Data**: ใช้ข้อมูลจำลองเมื่อไม่สามารถเชื่อมต่อ API ได้
4. **Authentication**: จัดการกรณีที่ไม่ได้รับอนุญาต (401)

### การตั้งค่า Proxy

ใน `next.config.ts` ได้เพิ่ม proxy configuration:

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://backend:3001/api/:path*',
    },
  ];
}
```

### การใช้งาน

1. Chart จะโหลดข้อมูลอัตโนมัติเมื่อเปิดหน้า
2. สามารถเปลี่ยนช่วงเวลา (สัปดาห์/เดือน/ปี) ได้
3. ข้อมูลจะอัปเดตทันทีเมื่อเปลี่ยนช่วงเวลา

### หมายเหตุ

- ต้องเข้าสู่ระบบก่อนจึงจะเห็นข้อมูลจริง
- หากไม่สามารถเชื่อมต่อ API ได้ จะแสดงข้อมูลจำลองพร้อมข้อความเตือน
- ข้อมูลจะแสดงเป็นภาษาไทยตามการแปลงที่กำหนด