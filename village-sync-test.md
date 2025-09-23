# การทดสอบการซิงค์ข้อมูลหมู่บ้าน

## สรุปการแก้ไข

### ปัญหาที่พบ
- เมื่อ admin จัดการหลายหมู่บ้าน ข้อมูลสถิติจะรวมกันจากทุกหมู่บ้าน
- ไม่สามารถแยกดูข้อมูลตามหมู่บ้านที่เลือกได้

### การแก้ไข

#### Backend (API Endpoints)
1. **statsCard.ts**: เพิ่มการรับ `village_key` parameter และกรองข้อมูลตามหมู่บ้านที่เลือก
2. **pendingUsers.ts**: เพิ่มการรับ `village_key` parameter และกรองข้อมูลตามหมู่บ้านที่เลือก

#### Frontend
1. **statistic.tsx**: ส่ง `village_key` parameter ไปยัง API
2. **pending_table.tsx**: ส่ง `village_key` parameter ไปยัง API
3. **page.tsx**: แสดงชื่อหมู่บ้านที่เลือกและ refetch ข้อมูลเมื่อเปลี่ยนหมู่บ้าน
4. **admin-village-selection/page.tsx**: dispatch custom event เมื่อเปลี่ยนหมู่บ้าน

### วิธีการทดสอบ

1. **เข้าสู่ระบบด้วย admin account ที่มีหลายหมู่บ้าน**
   - ไปที่ `/admin-village-selection`
   - เลือกหมู่บ้านแรก (เช่น หมู่บ้านผาสุก)
   - ไปที่ `/dashboard` และดูข้อมูลสถิติ

2. **เปลี่ยนหมู่บ้าน**
   - ไปที่ `/admin-village-selection` อีกครั้ง
   - เลือกหมู่บ้านที่สอง (เช่น หมู่บ้านลาดพร้าว)
   - กลับไปที่ `/dashboard` และตรวจสอบว่าข้อมูลเปลี่ยนตามหมู่บ้านที่เลือก

3. **ตรวจสอบการทำงาน**
   - ข้อมูลสถิติควรแสดงเฉพาะหมู่บ้านที่เลือก
   - ข้อมูลผู้ใช้รออนุมัติควรแสดงเฉพาะหมู่บ้านที่เลือก
   - ชื่อหมู่บ้านควรแสดงในหน้า dashboard

### API Endpoints ที่แก้ไข

- `GET /api/statsCard?village_key=<village_key>`
- `GET /api/pendingUsers?village_key=<village_key>`

### การทำงานของระบบ

1. เมื่อ admin เลือกหมู่บ้านในหน้า village selection
2. ระบบจะเก็บ `selectedVillage` ใน `sessionStorage`
3. ระบบจะ dispatch `villageChanged` event
4. หน้า dashboard จะรับ event และ refetch ข้อมูล
5. API จะกรองข้อมูลตาม `village_key` ที่ส่งมา
6. ข้อมูลจะแสดงเฉพาะหมู่บ้านที่เลือก

### ข้อดีของการแก้ไข

- ข้อมูลแยกตามหมู่บ้านชัดเจน
- Admin สามารถจัดการแต่ละหมู่บ้านแยกกันได้
- ระบบยังคงทำงานได้ปกติสำหรับ superadmin (ดูข้อมูลทุกหมู่บ้าน)
- ไม่กระทบต่อการทำงานของระบบเดิม
