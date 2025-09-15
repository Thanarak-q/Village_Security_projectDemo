"use client"

import { useState, useMemo, useCallback } from "react"
import { Bell, Users, Home, Clock, AlertTriangle, Settings, CheckCircle2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useNotifications } from "@/hooks/useNotifications"
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
    error,
    isConnected,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotificationById
  } = useNotifications();

  // Only refresh notifications manually since WebSocket provides real-time updates
  // No auto-refresh needed when popover opens

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    await deleteNotificationById(notificationId);
  }, [deleteNotificationById]);

  const handleTestNotification = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test notification');
      }
      
      const result = await response.json();
      console.log('✅ Test notification created:', result);
    } catch (error) {
      console.error('❌ Error creating test notification:', error);
    }
  }, []);

  const unreadCount = useMemo(() => counts?.unread || 0, [counts?.unread]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          <div 
            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
          />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 sm:w-96" align="end">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">การแจ้งเตือน</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                อ่านทั้งหมด
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              disabled={loading}
              className="text-xs"
            >
              รีเฟรช
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                className="text-xs"
              >
                ทดสอบ
              </Button>
            )}
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
                    <div
                      className={`p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                        !notification.is_read ? 'bg-primary/10 border-l-4 border-primary dark:bg-primary/20' : ''
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
                            <div className="flex items-center gap-1">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.notification_id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification.notification_id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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
              <span>ยังไม่อ่าน {unreadCount} รายการ</span>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
