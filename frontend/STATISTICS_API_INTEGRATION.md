# Statistics API Integration

## การเชื่อมต่อ Statistics Cards กับ API จริง

ไฟล์ `statistic.tsx` ได้รับการอัปเดตให้ดึงข้อมูลจริงจาก API `statsCard.ts`

### API Endpoint ที่ใช้

- **Endpoint**: `GET /api/statsCard`
- **Authentication**: ต้องเข้าสู่ระบบ (admin หรือ staff)

### ข้อมูลที่ดึงมาจาก API

```typescript
interface StatsData {
  residentCount: number;           // จำนวนผู้อยู่อาศัยทั้งหมด
  residentPendingCount: number;    // ผู้อยู่อาศัยรออนุมัติ
  guardPendingCount: number;       // เจ้าหน้าที่รออนุมัติ
  visitorRecordToday: number;      // ผู้มาเยือนทั้งหมดวันนี้
  visitorApprovedToday: number;    // ผู้มาเยือนที่อนุมัติวันนี้
  visitorPendingToday: number;     // ผู้มาเยือนรออนุมัติวันนี้
  visitorRejectedToday: number;    // ผู้มาเยือนที่ปฏิเสธวันนี้
}
```

### การแมปข้อมูลกับ Cards

#### 1. **TotalUsersCard** (จำนวนผู้อยู่อาศัยทั้งหมด)
- **หลัก**: `data.residentCount`
- **รอง**: `data.residentPendingCount` (แสดงจำนวนรออนุมัติ)

#### 2. **DailyAccessCard** (ผู้มาเยือนวันนี้)
- **หลัก**: `data.visitorApprovedToday + data.visitorRejectedToday`
- **รอง**: แยกแสดงอนุมัติ (`data.visitorApprovedToday`) และปฏิเสธ (`data.visitorRejectedToday`)

#### 3. **PendingTasksCard** (ผู้มาเยือนรอดำเนินการ)
- **หลัก**: `data.visitorPendingToday`
- **รอง**: แสดงข้อความ "รอการอนุมัติวันนี้"

#### 4. **EmptyCard** (ผู้ใช้รอการอนุมัติ)
- **หลัก**: `data.residentPendingCount + data.guardPendingCount`
- **รอง**: แยกแสดงผู้อยู่อาศัย (`data.residentPendingCount`) และเจ้าหน้าที่ (`data.guardPendingCount`)

### Custom Hook: useStatsData()

```typescript
const { data, loading, error, refetch } = useStatsData()
```

#### Returns:
- `data`: ข้อมูลสถิติ (StatsData | null)
- `loading`: สถานะการโหลด (boolean)
- `error`: ข้อความข้อผิดพลาด (string | null)
- `refetch`: ฟังก์ชันสำหรับโหลดข้อมูลใหม่

### การจัดการข้อผิดพลาด

1. **Loading State**: แสดง spinner และข้อความ "กำลังโหลด..."
2. **Error Handling**: แสดงข้อความ "เกิดข้อผิดพลาด"
3. **Fallback Data**: ใช้ข้อมูลจำลองเมื่อไม่สามารถเชื่อมต่อ API ได้
4. **Authentication**: จัดการกรณีที่ไม่ได้รับอนุญาต (401)

### การใช้งานใน Component

```tsx
export default function Page() {
  const { data: statsData, loading: statsLoading, error: statsError } = useStatsData();
  
  return (
    <div>
      <TotalUsersCard data={statsData} loading={statsLoading} error={statsError} />
      <DailyAccessCard data={statsData} loading={statsLoading} error={statsError} />
      <PendingTasksCard data={statsData} loading={statsLoading} error={statsError} />
      <EmptyCard data={statsData} loading={statsLoading} error={statsError} />
    </div>
  );
}
```

### UI Improvements

1. **Icons**: เพิ่ม icons ที่เหมาะสมกับข้อมูลแต่ละประเภท
2. **Colors**: ใช้สีที่สื่อความหมาย (เขียว=อนุมัติ, แดง=ปฏิเสธ, ส้ม=รอดำเนินการ)
3. **Loading States**: แสดง spinner และข้อความที่เหมาะสม
4. **Error States**: แสดงข้อความข้อผิดพลาดที่เข้าใจง่าย
5. **Responsive**: รองรับการแสดงผลในหน้าจอขนาดต่างๆ

### หมายเหตุ

- ข้อมูลจะอัปเดตเมื่อโหลดหน้าใหม่
- หากต้องการ real-time updates สามารถเพิ่ม polling หรือ WebSocket ได้
- ข้อมูลจะแสดงเป็น 0 หากไม่มีข้อมูลในฐานข้อมูล