"use client"

import { useState, useCallback, useEffect } from "react"
import { Bell, Search, Filter, CheckCircle, Trash2, RefreshCw, Users, Home, AlertTriangle, Settings, Clock, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHybridNotifications } from "@/hooks/useHybridNotifications"
import { getNotificationIcon, getNotificationColor } from "@/lib/notifications"

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

// Notification type labels
const notificationTypeLabels = {
  resident_pending: "รออนุมัติผู้อยู่อาศัย",
  guard_pending: "รออนุมัติยาม",
  admin_pending: "รออนุมัติผู้ดูแล",
  house_updated: "อัปเดตบ้าน",
  member_added: "เพิ่มสมาชิก",
  member_removed: "ลบสมาชิก",
  status_changed: "เปลี่ยนสถานะ",
  visitor_pending_too_long: "ผู้เยี่ยมรอนานเกินไป",
  visitor_rejected_review: "ผู้เยี่ยมถูกปฏิเสธ"
};

// Category labels
const categoryLabels = {
  user_approval: "การอนุมัติผู้ใช้",
  house_management: "การจัดการบ้าน",
  visitor_management: "การจัดการผู้เยี่ยม"
};

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const {
    notifications,
    counts,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotificationById
  } = useHybridNotifications();

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchTerm === "" || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.village_name && notification.village_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === "all" || notification.type === selectedType;
    const matchesCategory = selectedCategory === "all" || notification.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "read" && notification.is_read) ||
      (selectedStatus === "unread" && !notification.is_read);

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // Handle individual notification actions
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [markAsRead]);

  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationById(notificationId);
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [deleteNotificationById]);

  // Handle bulk actions
  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.length === paginatedNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(paginatedNotifications.map(n => n.notification_id));
    }
  }, [selectedNotifications.length, paginatedNotifications]);

  const handleBulkMarkAsRead = useCallback(async () => {
    try {
      for (const notificationId of selectedNotifications) {
        await markAsRead(notificationId);
      }
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [selectedNotifications, markAsRead]);

  const handleBulkDelete = useCallback(async () => {
    try {
      for (const notificationId of selectedNotifications) {
        await deleteNotificationById(notificationId);
      }
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  }, [selectedNotifications, deleteNotificationById]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [markAllAsRead]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory, selectedStatus]);

  // Get unique types and categories for filter dropdowns
  const uniqueTypes = Array.from(new Set(notifications.map(n => n.type)));
  const uniqueCategories = Array.from(new Set(notifications.map(n => n.category)));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">การแจ้งเตือน</h1>
          <p className="text-muted-foreground">
            จัดการการแจ้งเตือนทั้งหมดของคุณ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshNotifications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={loading || counts?.unread === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            อ่านทั้งหมด
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ทั้งหมด</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยังไม่อ่าน</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts?.unread || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อ่านแล้ว</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(counts?.total || 0) - (counts?.unread || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">แสดงผล</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredNotifications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรองและค้นหา</CardTitle>
          <CardDescription>
            ใช้ตัวกรองเพื่อค้นหาการแจ้งเตือนที่คุณต้องการ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="ค้นหาการแจ้งเตือน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {notificationTypeLabels[type as keyof typeof notificationTypeLabels] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {categoryLabels[category as keyof typeof categoryLabels] || category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="unread">ยังไม่อ่าน</SelectItem>
                  <SelectItem value="read">อ่านแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  เลือกแล้ว {selectedNotifications.length} รายการ
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  อ่านที่เลือก
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบที่เลือก
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการการแจ้งเตือน</CardTitle>
              <CardDescription>
                แสดง {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} จาก {filteredNotifications.length} รายการ
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedNotifications.length === paginatedNotifications.length && paginatedNotifications.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">เลือกทั้งหมด</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">เกิดข้อผิดพลาด: {error}</div>
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">ไม่พบการแจ้งเตือน</div>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {paginatedNotifications.map((notification, index) => {
                  const IconComponent = getIconComponent(getNotificationIcon(notification.type));
                  const isSelected = selectedNotifications.includes(notification.notification_id);
                  
                  return (
                    <div key={notification.notification_id}>
                      <div className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                        isSelected ? 'bg-muted/50 border-primary' : ''
                      } ${!notification.is_read ? 'border-l-4 border-l-blue-500' : ''}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedNotifications(prev => [...prev, notification.notification_id]);
                              } else {
                                setSelectedNotifications(prev => prev.filter(id => id !== notification.notification_id));
                              }
                            }}
                          />
                          
                          <div className={`p-2 rounded-full bg-muted ${getNotificationColor(notification.type)}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium truncate">
                                    {notification.title}
                                  </h4>
                                  {!notification.is_read && (
                                    <Badge variant="secondary" className="text-xs">
                                      ใหม่
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {notificationTypeLabels[notification.type as keyof typeof notificationTypeLabels] || notification.type}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-4">
                                    <span>{notification.village_name || 'ไม่ระบุหมู่บ้าน'}</span>
                                    <span>{categoryLabels[notification.category as keyof typeof categoryLabels] || notification.category}</span>
                                  </div>
                                  <span>{formatTimeAgo(notification.created_at)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-2">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.notification_id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.is_read && (
                                      <DropdownMenuItem onClick={() => handleMarkAsRead(notification.notification_id)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        ทำเครื่องหมายว่าอ่านแล้ว
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(notification.notification_id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      ลบ
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < paginatedNotifications.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">แสดงต่อหน้า:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ก่อนหน้า
                </Button>
                <span className="text-sm text-muted-foreground">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
