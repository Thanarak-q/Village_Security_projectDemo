"use client"

import { useState } from "react"
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
import { Users, Calendar} from "lucide-react"

// ข้อมูลการเข้าออกตามช่วงเวลาต่างๆ - ข้อมูลที่ดูง่ายขึ้น
const weeklyData = [
  { period: "จันทร์", entry: 45, exit: 42 },
  { period: "อังคาร", entry: 58, exit: 49 },
  { period: "พุธ", entry: 62, exit: 57 },
  { period: "พฤหัสบดี", entry: 43, exit: 38 },
  { period: "ศุกร์", entry: 67, exit: 62 },
  { period: "เสาร์", entry: 89, exit: 84 },
  { period: "อาทิตย์", entry: 101, exit: 95 }
]

const monthlyData = [
  { period: "ม.ค.", entry: 1250, exit: 1200 },
  { period: "ก.พ.", entry: 1180, exit: 1150 },
  { period: "มี.ค.", entry: 1350, exit: 1300 },
  { period: "เม.ย.", entry: 1150, exit: 1100 },
  { period: "พ.ค.", entry: 1450, exit: 1400 },
  { period: "มิ.ย.", entry: 1200, exit: 1150 },
  { period: "ก.ค.", entry: 1600, exit: 1550 },
  { period: "ส.ค.", entry: 1300, exit: 1250 },
  { period: "ก.ย.", entry: 1250, exit: 1200 },
  { period: "ต.ค.", entry: 1400, exit: 1350 },
  { period: "พ.ย.", entry: 1350, exit: 1300 },
  { period: "ธ.ค.", entry: 1500, exit: 1450 }
]

const yearlyData = [
  { period: "2020", entry: 15000, exit: 14200 },
  { period: "2021", entry: 18500, exit: 17800 },
  { period: "2022", entry: 22000, exit: 21200 },
  { period: "2023", entry: 24500, exit: 23700 },
  { period: "2024", entry: 26800, exit: 25900 }
]



// Chart config
const chartConfig = {
  entry: {
    label: "เข้าหมู่บ้าน",
    color: "hsl(220, 70%, 50%)", // Blue
  },
  exit: {
    label: "ออกหมู่บ้าน",
    color: "hsl(142, 76%, 36%)", // Green
  },
}

export default function WeeklyAccessBarChart() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  
  // Function to get data based on selected period
  const getChartData = () => {
    switch(selectedPeriod) {
      case "week": return weeklyData
      case "month": return monthlyData
      case "year": return yearlyData
      default: return weeklyData
    }
  }

  const chartData = getChartData()
  const totalEntry = chartData.reduce((sum, item) => sum + item.entry, 0)
  const totalExit = chartData.reduce((sum, item) => sum + item.exit, 0)

  // Get average text based on period
  const getAverageText = () => {
    const total = totalEntry + totalExit
    const count = chartData.length
    const average = Math.round(total / count)

    switch(selectedPeriod) {
      case "week":
        return `เฉลี่ย: ${Math.round(total / 7)} คน/วัน`
      case "month":
        return `เฉลี่ย: ${Math.round(average)} คน/เดือน`
      case "year":
        return `เฉลี่ย: ${Math.round(average).toLocaleString()} คน/ปี`
      default:
        return `เฉลี่ย: ${Math.round(total / 7)} คน/วัน`
    }
  }

  // Function to handle period change
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    console.log("Selected period:", value)
  }

  // Get period display text
  const getPeriodText = () => {
    const currentDate = new Date()
    switch(selectedPeriod) {
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
    switch(selectedPeriod) {
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
              <span className="text-base sm:text-lg">สถิติการเข้า/ออก</span>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs sm:text-sm text-gray-500">ช่วงเวลา:</span>
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
          
          <CardDescription className="flex items-center gap-1 mt-2 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            {getPeriodText()}
          </CardDescription>
        </div>
        
        {/* Stats Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-600">เข้า: {totalEntry.toLocaleString()} คน</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-600">ออก: {totalExit.toLocaleString()} คน</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-600">รวม: {(totalEntry + totalExit).toLocaleString()} คน</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm w-fit">
            {getAverageText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
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
            <Bar dataKey="entry" fill="var(--color-entry)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="exit" fill="var(--color-exit)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}