"use client"

import { useState } from "react"
import { Bell, Users, Home, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// ข้อมูลตัวอย่าง notifications สำหรับ admin
const mockNotifications = [
  // ประเภทที่ 1: การแจ้งเตือนผู้ใช้ใหม่รออนุมัติ
  {
    id: 1,
    type: "new_user",
    icon: Users,
    title: "ผู้ใช้ใหม่รออนุมัติ",
    description: "นาย สมชาย ใจดี (Resident) สมัครเข้าหมู่บ้านบ้านสวนสุข",
    time: "5 นาทีที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "high",
    isRead: false
  },
  {
    id: 2,
    type: "new_user",
    icon: Users,
    title: "ผู้ใช้ใหม่รออนุมัติ",
    description: "นาย ก. วิศวกรรม (Guard) สมัครเข้าหมู่บ้านบ้านสวนสุข",
    time: "15 นาทีที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "high",
    isRead: false
  },
  {
    id: 3,
    type: "new_user",
    icon: Users,
    title: "ผู้ใช้ใหม่รออนุมัติ",
    description: "นางสาวมาลี สุขใส (Resident) สมัครเข้าหมู่บ้านบ้านสวนสุข",
    time: "30 นาทีที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "high",
    isRead: true
  },

  // ประเภทที่ 2: การแจ้งเตือนการเปลี่ยนแปลงข้อมูลบ้าน
  {
    id: 4,
    type: "house_change",
    icon: Home,
    title: "แก้ไขข้อมูลบ้าน",
    description: "แก้ไขที่อยู่บ้านเลขที่ 123/45 ซอยสุขุมวิท",
    time: "1 ชั่วโมงที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "medium",
    isRead: false
  },
  {
    id: 5,
    type: "house_change",
    icon: Home,
    title: "เพิ่มสมาชิกบ้าน",
    description: "เพิ่มสมาชิกใหม่เข้าบ้านเลขที่ 456/78",
    time: "2 ชั่วโมงที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "medium",
    isRead: true
  },
  {
    id: 6,
    type: "house_change",
    icon: Home,
    title: "เปลี่ยนสถานะบ้าน",
    description: "เปลี่ยนสถานะบ้านเลขที่ 789/90 เป็น 'occupied'",
    time: "3 ชั่วโมงที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "medium",
    isRead: true
  },

  // ประเภทที่ 3: การแจ้งเตือน visitor records ที่ต้องตรวจสอบ
  {
    id: 7,
    type: "visitor_pending",
    icon: Clock,
    title: "Visitor รออนุมัตินาน",
    description: "นาย ข. เยี่ยมบ้านเลขที่ 123/45 รอมาแล้ว 2 ชั่วโมง 30 นาที",
    time: "10 นาทีที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "high",
    isRead: false
  },
  {
    id: 8,
    type: "visitor_rejected",
    icon: AlertTriangle,
    title: "Visitor ถูกปฏิเสธ",
    description: "นาง ค. เยี่ยมบ้านเลขที่ 456/78 ถูกปฏิเสธ - ต้องการทบทวน",
    time: "45 นาทีที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "high",
    isRead: false
  },
  {
    id: 9,
    type: "visitor_pending",
    icon: Clock,
    title: "Visitor รออนุมัตินาน",
    description: "นาย ง. เยี่ยมบ้านเลขที่ 789/90 รอมาแล้ว 1 ชั่วโมง 45 นาที",
    time: "1 ชั่วโมงที่แล้ว",
    village: "บ้านสวนสุข",
    priority: "high",
    isRead: true
  }
]

const getIconColor = (type: string) => {
  switch (type) {
    case "new_user":
      return "text-blue-500"
    case "house_change":
      return "text-green-500"
    case "visitor_pending":
      return "text-orange-500"
    case "visitor_rejected":
      return "text-red-500"
    default:
      return "text-muted-foreground"
  }
}


export default function NotificationComponent() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)

  // นับแจ้งเตือนที่ยังไม่ได้อ่าน
  const unreadCount = notifications.filter(n => !n.isRead).length

  // ทำเครื่องหมายว่าอ่านแล้วเมื่อเปิด popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Mark all as read after a short delay
      setTimeout(() => {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        )
      }, 1000)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative hover:bg-muted"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-destructive text-destructive-foreground text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="p-3 sm:p-4 border-b">
          <h3 className="font-semibold text-base sm:text-lg">แจ้งเตือน Admin</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            การแจ้งเตือนสำหรับผู้ดูแลระบบ
          </p>
        </div>
        
        <ScrollArea className="h-80 sm:h-96">
          <div className="p-2">
            {notifications.map((notification, index) => {
              const IconComponent = notification.icon
              return (
                <div key={notification.id}>
                  <div 
                    className={`p-2 sm:p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-primary/10 border-l-4 border-primary dark:bg-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-full bg-muted ${getIconColor(notification.type)}`}>
                        <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full flex-shrink-0 ml-1 sm:ml-2" />
                          )}
                        </div>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1 sm:mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden sm:inline">{notification.village}</span>
                            <span className="sm:hidden">{notification.village.split(' ')[0]}</span>
                          </span>
                          <span className="text-xs">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
        
        <div className="p-2 sm:p-3 border-t">
          <Button variant="ghost" className="w-full text-xs sm:text-sm">
            ดูแจ้งเตือนทั้งหมด
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}