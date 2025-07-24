import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Lock, TrendingUp, ArrowUp,  AlertTriangle, Clock } from "lucide-react"

// Component สำหรับจำนวนผู้อยู่อาศัยโดยประมาณ
export function ResidentsStatCard() {
  return (
    <Card className="shadow transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          จำนวนผู้อยู่อาศัยโดยประมาณ
        </CardTitle>
        <Users className="h-6 w-6 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">1,254</div>
        <div className="flex items-center mt-2">
          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600 font-medium">25%</span>
          <span className="text-sm text-gray-500 ml-1">จากเดือนที่แล้ว</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Component สำหรับเข้า/ออกวันนี้
export function DailyAccessCard() {
  return (
    <Card className="shadow transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          เข้า/ออกวันนี้
        </CardTitle>
        <UserCheck className="h-6 w-6 text-cyan-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">78/65</div>
        <div className="flex items-center mt-2">
          <ArrowUp className="h-4 w-4 text-blue-500 mr-1" />
          <span className="text-sm text-blue-600 font-medium">เพิ่ม</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Component สำหรับปัญหาที่รอดำเนินการ
export function SecurityLevelCard() {
  return (
    <Card className="shadow transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          ปัญหาที่รอดำเนินการ
        </CardTitle>
        <Lock className="h-6 w-6 text-yellow-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">12</div>
        <div className="flex items-center mt-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="text-sm text-yellow-600 font-medium">3 เรื่องสำคัญ</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Component สำหรับกิจกรรมล่าสุด
export function RecentActivityCard() {
  return (
    <Card className="shadow transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          กิจกรรมล่าสุด
        </CardTitle>
        <TrendingUp className="h-6 w-6 text-red-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">24</div>
        <div className="flex items-center mt-2">
          <Clock className="h-4 w-4 text-red-500 mr-1" />
          <span className="text-sm text-red-600 font-medium">ภายใน 24 ชั่วโมง</span>
        </div>
      </CardContent>
    </Card>
  )
}