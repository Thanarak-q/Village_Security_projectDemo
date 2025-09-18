"use client"

import { useState, useCallback } from "react"
import { Bell, Users, Home, Clock, AlertTriangle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useHybridNotifications } from "@/hooks/useHybridNotifications"
import { getNotificationIcon } from "@/lib/notifications"

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} วินาทีที่แล้ว`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} นาทีที่แล้ว`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ชั่วโมงที่แล้ว`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} วันที่แล้ว`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} เดือนที่แล้ว`;
  }
}

// Icon mapping for notification types
const iconMap = {
  Users,
  Home,
  AlertTriangle,
  Settings,
  Bell,
  Clock
};

// Get icon component by name
function getIconComponent(iconName: string) {
  return iconMap[iconName as keyof typeof iconMap] || Bell;
}

// Get color class for notification type
function getIconColor(type: string) {
  switch (type) {
    case 'resident_pending':
    case 'guard_pending':
    case 'admin_pending':
      return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
    case 'house_updated':
    case 'member_added':
    case 'member_removed':
      return 'text-green-500 bg-green-100 dark:bg-green-900/20';
    case 'visitor_pending_too_long':
    case 'visitor_rejected_review':
      return 'text-red-500 bg-red-100 dark:bg-red-900/20';
    case 'status_changed':
      return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
    default:
      return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
  }
}

export default function NotificationComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    counts,
    loading,
    error
  } = useHybridNotifications();

  // Refresh notifications when popover opens

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);





  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 sm:w-96" align="end">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">การแจ้งเตือน</h3>
          </div>
        </div>
        
        <Separator className="mb-4" />
        
        <ScrollArea className="h-80 sm:h-96">
          <div className="p-2">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-500">เกิดข้อผิดพลาด: {error}</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">ไม่มีการแจ้งเตือน</div>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const IconComponent = getIconComponent(getNotificationIcon(notification.type));
                
                return (
                  <div key={notification.notification_id}>
                    <div className="p-3 rounded-lg transition-colors hover:bg-muted/50">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className={`p-1.5 sm:p-2 rounded-full bg-muted ${getIconColor(notification.type)}`}>
                          <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs sm:text-sm font-medium truncate">
                              {notification.title}
                            </h4>
                          </div>
                          
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {notification.village_name || 'ไม่ระบุหมู่บ้าน'}
                            </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {index < notifications.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator className="mt-4" />
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>ทั้งหมด {counts?.total || 0} รายการ</span>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
