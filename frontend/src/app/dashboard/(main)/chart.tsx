"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bar, BarChart, XAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Users, Calendar, Loader2 } from "lucide-react"

// Types for API responses
interface WeeklyData {
  day: string;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
}

interface MonthlyData {
  month: string;
  monthNumber: number;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
}

interface YearlyData {
  year: number;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
}

interface ChartDataPoint {
  period: string;
  approved: number;
  rejected: number;
}



// Chart config
const chartConfig = {
  approved: {
    label: "อนุมัติ",
    color: "hsl(142, 76%, 36%)", // Green
  },
  rejected: {
    label: "ปฏิเสธ",
    color: "hsl(0, 84%, 60%)", // Red
  },
}

const WeeklyAccessBarChart = memo(function WeeklyAccessBarChart() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallbackData, setUsingFallbackData] = useState(false)

  // Thai day names mapping - memoized to prevent recreation
  const dayNames = useMemo(() => ({
    'Sunday': 'อาทิตย์',
    'Monday': 'จันทร์',
    'Tuesday': 'อังคาร',
    'Wednesday': 'พุธ',
    'Thursday': 'พฤหัสบดี',
    'Friday': 'ศุกร์',
    'Saturday': 'เสาร์'
  }), [])

  // Thai month names mapping - memoized to prevent recreation
  const monthNames = useMemo(() => ({
    'January': 'ม.ค.',
    'February': 'ก.พ.',
    'March': 'มี.ค.',
    'April': 'เม.ย.',
    'May': 'พ.ค.',
    'June': 'มิ.ย.',
    'July': 'ก.ค.',
    'August': 'ส.ค.',
    'September': 'ก.ย.',
    'October': 'ต.ค.',
    'November': 'พ.ย.',
    'December': 'ธ.ค.'
  }), [])

  // Fetch data from API
  const fetchData = useCallback(async (period: string) => {
    setLoading(true)
    setError(null)

    try {
      let endpoint = ''
      switch (period) {
        case 'week':
          endpoint = '/api/visitor-record-weekly'
          break
        case 'month':
          endpoint = '/api/visitor-record-monthly'
          break
        case 'year':
          endpoint = '/api/visitor-record-yearly'
          break
        default:
          endpoint = '/api/visitor-record-weekly'
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
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

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      // Transform data based on period
      let transformedData: ChartDataPoint[] = []

      if (period === 'week' && result.data.weeklyData) {
        transformedData = result.data.weeklyData.map((item: WeeklyData) => ({
          period: dayNames[item.day as keyof typeof dayNames] || item.day,
          approved: item.approved,
          rejected: item.rejected
        }))
      } else if (period === 'month' && result.data.monthlyData) {
        transformedData = result.data.monthlyData.map((item: MonthlyData) => ({
          period: monthNames[item.month as keyof typeof monthNames] || item.month,
          approved: item.approved,
          rejected: item.rejected
        }))
      } else if (period === 'year' && result.data.yearlyData) {
        transformedData = result.data.yearlyData.map((item: YearlyData) => ({
          period: item.year.toString(),
          approved: item.approved,
          rejected: item.rejected
        }))
      }

      setChartData(transformedData)
      setUsingFallbackData(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')

      // Set fallback data for demo purposes
      const fallbackData = getFallbackData(period)
      setChartData(fallbackData)
      setUsingFallbackData(true)
    } finally {
      setLoading(false)
    }
  }, [dayNames, monthNames])

  // Fallback data for demo purposes
  const getFallbackData = (period: string): ChartDataPoint[] => {
    switch (period) {
      case 'week':
        return [
          { period: "จันทร์", approved: 12, rejected: 3 },
          { period: "อังคาร", approved: 18, rejected: 2 },
          { period: "พุธ", approved: 15, rejected: 4 },
          { period: "พฤหัสบดี", approved: 22, rejected: 1 },
          { period: "ศุกร์", approved: 28, rejected: 5 },
          { period: "เสาร์", approved: 35, rejected: 3 },
          { period: "อาทิตย์", approved: 31, rejected: 2 }
        ]
      case 'month':
        return [
          { period: "ม.ค.", approved: 245, rejected: 15 },
          { period: "ก.พ.", approved: 198, rejected: 12 },
          { period: "มี.ค.", approved: 267, rejected: 18 },
          { period: "เม.ย.", approved: 223, rejected: 14 },
          { period: "พ.ค.", approved: 289, rejected: 21 },
          { period: "มิ.ย.", approved: 234, rejected: 16 },
          { period: "ก.ค.", approved: 312, rejected: 19 },
          { period: "ส.ค.", approved: 278, rejected: 17 },
          { period: "ก.ย.", approved: 256, rejected: 13 },
          { period: "ต.ค.", approved: 298, rejected: 22 },
          { period: "พ.ย.", approved: 267, rejected: 18 },
          { period: "ธ.ค.", approved: 334, rejected: 25 }
        ]
      case 'year':
        return [
          { period: "2020", approved: 2890, rejected: 145 },
          { period: "2021", approved: 3245, rejected: 178 },
          { period: "2022", approved: 3567, rejected: 203 },
          { period: "2023", approved: 3891, rejected: 234 },
          { period: "2024", approved: 4123, rejected: 267 }
        ]
      default:
        return []
    }
  }

  // Fetch data when component mounts or period changes
  useEffect(() => {
    fetchData(selectedPeriod)
  }, [selectedPeriod, fetchData])

  const totalApproved = chartData.reduce((sum, item) => sum + item.approved, 0)
  const totalRejected = chartData.reduce((sum, item) => sum + item.rejected, 0)

  // Get average text based on period
  const getAverageText = () => {
    const total = totalApproved + totalRejected
    const count = chartData.length

    if (count === 0) return "ไม่มีข้อมูล"

    const average = Math.round(total / count)

    switch (selectedPeriod) {
      case "week":
        return `เฉลี่ย: ${average} คน/วัน`
      case "month":
        return `เฉลี่ย: ${average} คน/เดือน`
      case "year":
        return `เฉลี่ย: ${average.toLocaleString()} คน/ปี`
      default:
        return `เฉลี่ย: ${average} คน/วัน`
    }
  }

  // Function to handle period change
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
  }

  // Get period display text
  const getPeriodText = () => {
    const currentDate = new Date()
    switch (selectedPeriod) {
      case "week":
        return `สัปดาห์ที่ ${currentDate.getDate() - 6} - ${currentDate.getDate()} ${currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`
      case "month":
        return `ข้อมูลรายเดือน ปี ${currentDate.getFullYear()}`
      case "year":
        return `ข้อมูลรายปี ${currentDate.getFullYear() - 4} - ${currentDate.getFullYear()}`
      default:
        return `สัปดาห์ที่ ${currentDate.getDate() - 6} - ${currentDate.getDate()} ${currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`
    }
  }

  // Get axis label formatter
  const getAxisFormatter = (value: string) => {
    switch (selectedPeriod) {
      case "week":
        return value.slice(0, 3) // จันทร์ -> จัน
      case "month":
        return value // ม.ค., ก.พ., etc.
      case "year":
        return value // 2024
      default:
        return value.slice(0, 3)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-base sm:text-lg">สถิติผู้มาเยือน</span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs sm:text-sm text-muted-foreground">ช่วงเวลา:</span>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">สัปดาห์</SelectItem>
                  <SelectItem value="month">เดือน</SelectItem>
                  <SelectItem value="year">ปี</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>

          <CardDescription className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              {getPeriodText()}
            </div>
            {usingFallbackData && (
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                ⚠️ แสดงข้อมูลจำลอง (ไม่สามารถเชื่อมต่อ API ได้)
              </div>
            )}
          </CardDescription>
        </div>

        {/* Stats Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-4">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs sm:text-sm text-muted-foreground">กำลังโหลดข้อมูล...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-red-600">เกิดข้อผิดพลาด: {error}</span>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">อนุมัติ: {totalApproved.toLocaleString()} คน</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">ปฏิเสธ: {totalRejected.toLocaleString()} คน</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">รวม: {(totalApproved + totalRejected).toLocaleString()} คน</span>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm w-fit">
                {getAverageText()}
              </Badge>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-sm text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</span>
              <span className="text-xs text-muted-foreground">{error}</span>
              <button
                onClick={() => fetchData(selectedPeriod)}
                className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] w-full flex items-center justify-center">
            <span className="text-sm text-muted-foreground">ไม่มีข้อมูลในช่วงเวลานี้</span>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={getAxisFormatter}
                fontSize={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="approved" fill="var(--color-approved)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="var(--color-rejected)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
})

export default WeeklyAccessBarChart