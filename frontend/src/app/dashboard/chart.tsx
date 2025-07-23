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

// ข้อมูลการเข้าออกตามช่วงเวลาต่างๆ
const weeklyData = [
  { period: "จันทร์", entry: 145, exit: 132 },
  { period: "อังคาร", entry: 158, exit: 149 },
  { period: "พุธ", entry: 162, exit: 157 },
  { period: "พฤหัสบดี", entry: 143, exit: 138 },
  { period: "ศุกร์", entry: 167, exit: 162 },
  { period: "เสาร์", entry: 189, exit: 184 },
  { period: "อาทิตย์", entry: 201, exit: 195 }
]

const monthlyData = [
  { period: "มกราคม", entry: 4250, exit: 4100 },
  { period: "กุมภาพันธ์", entry: 3980, exit: 3850 },
  { period: "มีนาคม", entry: 4350, exit: 4200 },
  { period: "เมษายน", entry: 4150, exit: 4000 },
  { period: "พฤษภาคม", entry: 4450, exit: 4300 },
  { period: "มิถุนายน", entry: 4200, exit: 4050 },
  { period: "กรกฎาคม", entry: 4600, exit: 4450 },
  { period: "สิงหาคม", entry: 4300, exit: 4150 },
  { period: "กันยายน", entry: 4250, exit: 4100 },
  { period: "ตุลาคม", entry: 4400, exit: 4250 },
  { period: "พฤศจิกายน", entry: 4350, exit: 4200 },
  { period: "ธันวาคม", entry: 4500, exit: 4350 }
]

const yearlyData = [
  { period: "2020", entry: 45000, exit: 44200 },
  { period: "2021", entry: 48500, exit: 47800 },
  { period: "2022", entry: 52000, exit: 51200 },
  { period: "2023", entry: 54500, exit: 53700 },
  { period: "2024", entry: 56800, exit: 55900 }
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
    switch(selectedPeriod) {
      case "week":
        return "สัปดาห์ที่ 1-7 มกราคม 2024"
      case "month":
        return "ข้อมูลรายเดือน ปี 2024"
      case "year":
        return "ข้อมูลรายปี 2020-2024"
      default:
        return "สัปดาห์ที่ 1-7 มกราคม 2024"
    }
  }

  // Get axis label formatter
  const getAxisFormatter = (value: string) => {
    switch(selectedPeriod) {
      case "week":
        return value.slice(0, 3) // จันทร์ -> จัน
      case "month":
        return value.slice(0, 4) // มกราคม -> มกรา
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
          <CardTitle className="grid grid-cols-2 items-center">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              สถิติการเข้า/ออก
            </div>
            
            <div className="flex items-center gap-2 justify-self-end">
              <span className="text-sm text-gray-500">ช่วงเวลา:</span>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-32">
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
          
          <CardDescription className="flex items-center gap-1 mt-2">
            <Calendar className="h-4 w-4" />
            {getPeriodText()}
          </CardDescription>
        </div>
        
        {/* Stats Summary */}
        <div className="flex items-center gap-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-sm text-gray-600">เข้า: {totalEntry.toLocaleString()} คน</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-sm text-gray-600">ออก: {totalExit.toLocaleString()} คน</span>
          </div>
          <Badge variant="outline">
            {getAverageText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={getAxisFormatter}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="entry" fill="var(--color-entry)" radius={4} />
            <Bar dataKey="exit" fill="var(--color-exit)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}