"use client"

import { useState, useEffect, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, AlertTriangle, Plus, Loader2, CheckCircle, XCircle, Shield } from "lucide-react"

// Types for API response
interface StatsData {
  residentCount: number;
  residentPendingCount: number;
  guardPendingCount: number;
  visitorRecordToday: number;
  visitorApprovedToday: number;
  visitorPendingToday: number;
  visitorRejectedToday: number;
}

// 1. Card แสดงจำนวน user ทั้งหมด
export const TotalUsersCard = memo(function TotalUsersCard({ data, loading, error }: { data: StatsData | null, loading: boolean, error: string | null }) {
  return (
    <Card className="shadow transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          จำนวนผู้อยู่อาศัยทั้งหมด
        </CardTitle>
        <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">เกิดข้อผิดพลาด</div>
        ) : (
          <>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {data?.residentCount?.toLocaleString() || 0}
            </div>
            <div className="flex items-center mt-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1" />
              <span className="text-xs sm:text-sm text-blue-600 font-medium">
                รออนุมัติ: {data?.residentPendingCount || 0}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
})

// 2. Card แสดงจำนวนอนุมัติ/ปฏิเสธวันนี้
export function DailyAccessCard({ data, loading, error }: { data: StatsData | null, loading: boolean, error: string | null }) {
  return (
    <Card className="shadow transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          ผู้มาเยือนวันนี้
        </CardTitle>
        <UserCheck className="h-4 w-4 sm:h-6 sm:w-6 text-cyan-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">เกิดข้อผิดพลาด</div>
        ) : (
          <>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {(data?.visitorApprovedToday || 0) + (data?.visitorRejectedToday || 0)}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                <span className="text-xs sm:text-sm text-green-600 font-medium">
                  อนุมัติ: {data?.visitorApprovedToday || 0}
                </span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
                <span className="text-xs sm:text-sm text-red-600 font-medium">
                  ปฏิเสธ: {data?.visitorRejectedToday || 0}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// 3. Card แสดงผู้มาเยือนที่รอดำเนินการ
export function PendingTasksCard({ data, loading, error }: { data: StatsData | null, loading: boolean, error: string | null }) {
  return (
    <Card className="shadow transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          ผู้มาเยือนรอดำเนินการ
        </CardTitle>
        <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">เกิดข้อผิดพลาด</div>
        ) : (
          <>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {data?.visitorPendingToday || 0}
            </div>
            <div className="flex items-center mt-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 mr-1" />
              <span className="text-xs sm:text-sm text-orange-600 font-medium">
                รอการอนุมัติวันนี้
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// 4. Card แสดงผู้ใช้รอการอนุมัติ
export function EmptyCard({ data, loading, error }: { data: StatsData | null, loading: boolean, error: string | null }) {
  const totalPendingUsers = (data?.residentPendingCount || 0) + (data?.guardPendingCount || 0);

  return (
    <Card className="shadow transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          ผู้ใช้รอการอนุมัติ
        </CardTitle>
        <Plus className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">เกิดข้อผิดพลาด</div>
        ) : (
          <>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {totalPendingUsers}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1" />
                <span className="text-xs sm:text-sm text-blue-600 font-medium">
                  ผู้อยู่อาศัย: {data?.residentPendingCount || 0}
                </span>
              </div>
              <div className="flex items-center">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500 mr-1" />
                <span className="text-xs sm:text-sm text-cyan-600 font-medium">
                  ยาม: {data?.guardPendingCount || 0}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Hook สำหรับดึงข้อมูลสถิติ
export function useStatsData() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get selected village from sessionStorage (with SSR safety check)
      const selectedVillage = typeof window !== 'undefined' ? sessionStorage.getItem('selectedVillage') : null;
      const url = selectedVillage 
        ? `/api/statsCard?village_key=${encodeURIComponent(selectedVillage)}`
        : '/api/statsCard';
        
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบใหม่')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats')
      }

      setData(result.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')

      // Set fallback data for demo purposes
      setData({
        residentCount: 1247,
        residentPendingCount: 12,
        guardPendingCount: 3,
        visitorRecordToday: 45,
        visitorApprovedToday: 38,
        visitorPendingToday: 5,
        visitorRejectedToday: 2,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Refetch when selected village changes
  useEffect(() => {
    const handleStorageChange = () => {
      fetchStats()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event when village changes in same tab
    window.addEventListener('villageChanged', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('villageChanged', handleStorageChange)
    }
  }, [])

  return { data, loading, error, refetch: fetchStats }
}