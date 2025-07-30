import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Clock, ArrowUp, AlertTriangle, Plus } from "lucide-react"

// 1. Card แสดงจำนวน user ทั้งหมด
export function TotalUsersCard() {
  return (
    <Card className="shadow transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          จำนวนผู้ใช้ทั้งหมด
        </CardTitle>
        <Users className="h-6 w-6 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">1,247</div>
        <div className="flex items-center mt-2">
          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600 font-medium">+12</span>
          <span className="text-sm text-gray-500 ml-1">จากเดือนที่แล้ว</span>
        </div>
      </CardContent>
    </Card>
  )
}

// 2. Card แสดงจำนวนเข้าออกวันนี้
export function DailyAccessCard() {
  return (
    <Card className="shadow transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          เข้า/ออกวันนี้
        </CardTitle>
        <UserCheck className="h-6 w-6 text-cyan-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">156/142</div>
        <div className="flex items-center mt-2">
          <ArrowUp className="h-4 w-4 text-blue-500 mr-1" />
          <span className="text-sm text-blue-600 font-medium">+14</span>
          <span className="text-sm text-gray-500 ml-1">จากเมื่อวาน</span>
        </div>
      </CardContent>
    </Card>
  )
}

// 3. Card แสดงกิจกรรมที่รอดำเนินการ
export function PendingTasksCard() {
  return (
    <Card className="shadow transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          กิจกรรมที่รอดำเนินการ
        </CardTitle>
        <AlertTriangle className="h-6 w-6 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">8</div>
        <div className="flex items-center mt-2">
          <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
          <span className="text-sm text-orange-600 font-medium">2 เรื่องเร่งด่วน</span>
        </div>
      </CardContent>
    </Card>
  )
}

// 4. Card ว่างเปล่า (สำหรับอนาคต)
export function EmptyCard() {
  return (
    <Card className="shadow transition-shadow hover:shadow-md border-dashed border-2 border-gray-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          รอการเพิ่มข้อมูล
        </CardTitle>
        <Plus className="h-6 w-6 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-400">-</div>
        <div className="flex items-center mt-2">
          <span className="text-sm text-gray-400">พร้อมใช้งาน</span>
        </div>
      </CardContent>
    </Card>
  )
}