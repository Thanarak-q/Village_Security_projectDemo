"use client"

import { useState, useCallback } from "react"
import { Bell, Users, Home, Clock, AlertTriangle, Settings } from "lucide-react"
import Link from "next/link"

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

// Helper function to check if notification is from today
function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

// Helper function to format time for display
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Helper functions for localStorage
const NOTIFICATION_STATE_KEY = 'notification_state';

interface NotificationState {
  lastSeenNotificationId: string | null;
  lastSeenTimestamp: number;
}

function getNotificationState(): NotificationState {
  if (typeof window === 'undefined') {
    return { lastSeenNotificationId: null, lastSeenTimestamp: 0 };
  }
  
  try {
    const saved = localStorage.getItem(NOTIFICATION_STATE_KEY);
    return saved ? JSON.parse(saved) : { lastSeenNotificationId: null, lastSeenTimestamp: 0 };
  } catch {
    return { lastSeenNotificationId: null, lastSeenTimestamp: 0 };
  }
}

function saveNotificationState(state: NotificationState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save notification state:', error);
  }
}

function hasNewNotifications(notifications: { notification_id: string; created_at: string }[], state: NotificationState): boolean {
  if (!notifications.length) return false;
  
  // Check if there are notifications newer than last seen timestamp
  const latestNotification = notifications[0]; // Assuming notifications are sorted by newest first
  if (!latestNotification) return false;
  
  const notificationTime = new Date(latestNotification.created_at).getTime();
  return notificationTime > state.lastSeenTimestamp;
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
  const [notificationState, setNotificationState] = useState<NotificationState>(() => 
    getNotificationState()
  );
  const {
    notifications,
    counts,
    loading,
    error,
  } = useHybridNotifications();

  // Separate notifications into today and previous days
  const todayNotifications = notifications.filter(notification => 
    isToday(notification.created_at)
  );
  
  const previousNotifications = notifications.filter(notification => 
    !isToday(notification.created_at)
  );

  // Check if there are new notifications
  const hasNew = hasNewNotifications(notifications, notificationState);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    
    // When opening notifications, mark as seen
    if (open && notifications.length > 0) {
      const latestNotification = notifications[0];
      const newState = {
        lastSeenNotificationId: latestNotification.notification_id,
        lastSeenTimestamp: new Date(latestNotification.created_at).getTime()
      };
      
      setNotificationState(newState);
      saveNotificationState(newState);
    }
  }, [notifications]);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNew && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 sm:w-96" align="end">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">การแจ้งเตือน</h3>
              {hasNew && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">ใหม่</span>
                </div>
              )}
            </div>
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
              <>
                {/* ตอนนี้ - Today's notifications */}
                {todayNotifications.length > 0 && (
                  <>
                    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                      <div className="flex items-center gap-2 py-2 px-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">ตอนนี้</span>
                        <span className="text-xs text-muted-foreground">({todayNotifications.length})</span>
                      </div>
                    </div>
                    
                    {todayNotifications.map((notification, index) => {
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
                                    {formatTime(notification.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {index < todayNotifications.length - 1 && (
                            <Separator className="my-2" />
                          )}
                        </div>
                      );
                    })}
                    
                    {previousNotifications.length > 0 && (
                      <Separator className="my-4" />
                    )}
                  </>
                )}
                
                {/* ก่อนหน้านี้ - Previous notifications */}
                {previousNotifications.length > 0 && (
                  <>
                    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                      <div className="flex items-center gap-2 py-2 px-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">ก่อนหน้านี้</span>
                        <span className="text-xs text-muted-foreground">({previousNotifications.length})</span>
                      </div>
                    </div>
                    
                    {previousNotifications.map((notification, index) => {
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
                          
                          {index < previousNotifications.length - 1 && (
                            <Separator className="my-2" />
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator className="mt-4" />
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>ทั้งหมด {counts?.total || 0} รายการ</span>
                {hasNew && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    มีข้อความใหม่
                  </span>
                )}
                {todayNotifications.length > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    ตอนนี้ {todayNotifications.length}
                  </span>
                )}
                {previousNotifications.length > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">
                    ก่อนหน้านี้ {previousNotifications.length}
                  </span>
                )}
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/notification">
                  ดูการแจ้งเตือนทั้งหมด
                </Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
