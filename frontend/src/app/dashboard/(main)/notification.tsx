"use client"

import { useState } from "react"
import { Bell, User, FileEdit, Trash2, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// ข้อมูลตัวอย่าง notifications
const mockNotifications = [
  {
    id: 1,
    type: "edit",
    icon: FileEdit,
    title: "แก้ไขข้อมูลผู้อยู่อาศัย",
    description: "แก้ไขข้อมูลนาย สมชาย ใจดี บ้านเลขที่ 123",
    time: "5 นาทีที่แล้ว",
    admin: "ผู้จัดการ A",
    isRead: false
  },
  {
    id: 2,
    type: "delete",
    icon: Trash2,
    title: "ลบข้อมูลครัวเรือน",
    description: "ลบข้อมูลครัวเรือนบ้านเลขที่ 456",
    time: "15 นาทีที่แล้ว",
    admin: "ผู้จัดการ B",
    isRead: false
  },
  {
    id: 3,
    type: "add",
    icon: Plus,
    title: "เพิ่มสมาชิกใหม่",
    description: "เพิ่มสมาชิกใหม่ นางสาวมาลี สุขใส",
    time: "30 นาทีที่แล้ว",
    admin: "ผู้จัดการ A",
    isRead: true
  },
  {
    id: 4,
    type: "settings",
    icon: Settings,
    title: "เปลี่ยนแปลงการตั้งค่า",
    description: "อัพเดทการตั้งค่าระบบความปลอดภัย",
    time: "1 ชั่วโมงที่แล้ว",
    admin: "ผู้จัดการ C",
    isRead: true
  },
  {
    id: 5,
    type: "edit",
    icon: FileEdit,
    title: "แก้ไขข้อมูลที่อยู่",
    description: "แก้ไขที่อยู่บ้านเลขที่ 789 ซอยสุขุมวิท",
    time: "2 ชั่วโมงที่แล้ว",
    admin: "ผู้จัดการ B",
    isRead: true
  }
]

const getIconColor = (type: string) => {
  switch (type) {
    case "edit":
      return "text-blue-500"
    case "delete":
      return "text-red-500"
    case "add":
      return "text-green-500"
    case "settings":
      return "text-orange-500"
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
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="p-3 sm:p-4 border-b">
          <h3 className="font-semibold text-base sm:text-lg">แจ้งเตือน</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            การกระทำล่าสุดของระบบ
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
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
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
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0 ml-1 sm:ml-2" />
                          )}
                        </div>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1 sm:mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden sm:inline">{notification.admin}</span>
                            <span className="sm:hidden">{notification.admin.split(' ')[0]}</span>
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