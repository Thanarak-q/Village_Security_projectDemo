"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Settings, ChevronLeft, ChevronRight, Search, CheckCircle, XCircle } from "lucide-react";
import ApprovalForm from "../(main)/ApprovalForm";

// API Response Interface
interface PendingUsersResponse {
  success: boolean;
  data: {
    residents: PendingResident[];
    guards: PendingGuard[];
  };
  total: {
    residents: number;
    guards: number;
    total: number;
  };
  error?: string;
}

// Interface for Pending Resident from API
interface PendingResident {
  id: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  village_id: string;
  house_address: string | null;
  createdAt: string;
  updatedAt: string;
  profile_image_url: string | null;
}

// Interface for Pending Guard from API
interface PendingGuard {
  id: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  village_id: string;
  house_address: string | null;
  createdAt: string;
  updatedAt: string;
  profile_image_url: string | null;
}

// Interface สำหรับกำหนดโครงสร้างข้อมูลผู้ใช้ที่รออนุมัติ
interface PendingUser {
  id: string;           // รหัสผู้ใช้
  username: string;     // ชื่อผู้ใช้
  email: string;        // อีเมล
  fname: string;        // ชื่อจริง
  lname: string;        // นามสกุล
  phone: string;        // เบอร์โทรศัพท์
  role: string;         // บทบาท (resident/guard)
  houseNumber: string;  // บ้านเลขที่
  requestDate: string;  // วันที่สมัคร
  status: string;       // สถานะ
  profile_image_url?: string | null;  // รูปโปรไฟล์
  village_id: string;   // รหัสหมู่บ้าน
}

// Interface สำหรับข้อมูลฟอร์มการอนุมัติ
interface ApprovalFormData {
  approvedRole: string;  // บทบาทที่อนุมัติ
  houseNumber?: string;  // บ้านเลขที่
  notes?: string;        // หมายเหตุ
}

interface PendingUsersDialogProps {
  children?: React.ReactNode;
  onRefresh?: () => void;
  isOpen?: boolean;
  pendingCount?: number;
}

export default function PendingUsersDialog({
  children,
  onRefresh,
  pendingCount = 0,
}: PendingUsersDialogProps) {
  // State for API data
  const [residentsData, setResidentsData] = useState<PendingResident[]>([]);
  const [guardsData, setGuardsData] = useState<PendingGuard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับจัดการผู้ใช้ที่เลือกเพื่ออนุมัติ
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);

  // State สำหรับควบคุมการแสดง/ซ่อนฟอร์มอนุมัติ
  const [isApprovalFormOpen, setIsApprovalFormOpen] = useState(false);

  // State สำหรับการแบ่งหน้า (Pagination)
  const [currentPage, setCurrentPage] = useState(1);        // หน้าปัจจุบัน
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Get saved itemsPerPage from localStorage, default to 5
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('pendingTable_itemsPerPage');
      return saved ? parseInt(saved, 10) : 5;
    }
    return 5;
  });      // จำนวนรายการต่อหน้า
  const [searchTerm, setSearchTerm] = useState("");         // คำค้นหา

  // State สำหรับการ refresh ข้อมูล
  const [refreshing, setRefreshing] = useState(false);

  // State for dialog open/close
  const [dialogOpen, setDialogOpen] = useState(false);

  // State for success/error notification dialog
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    userName?: string;
  } | null>(null);

  // Fetch data from API
  const fetchPendingUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get selected village from sessionStorage (with SSR safety check)
      const selectedVillage = typeof window !== 'undefined' ? sessionStorage.getItem("selectedVillage") : null;
      const url = selectedVillage ? `/api/pendingUsers?village_id=${encodeURIComponent(selectedVillage)}` : "/api/pendingUsers";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PendingUsersResponse = await response.json();

      if (data.success) {
        setResidentsData(data.data.residents);
        setGuardsData(data.data.guards);
      } else {
        throw new Error(data.error || "Failed to fetch pending users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching pending users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Listen for village changes and refresh data
  useEffect(() => {
    const handleVillageChange = () => {
      fetchPendingUsers(true);
    };

    window.addEventListener('villageChanged', handleVillageChange);

    return () => {
      window.removeEventListener('villageChanged', handleVillageChange);
    };
  }, []);

  // Refresh data when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      fetchPendingUsers(true);
    }
  }, [dialogOpen]);

  // ฟังก์ชันสำหรับเปิดฟอร์มอนุมัติเมื่อคลิกปุ่ม "ดำเนินการ"
  const handleProcess = (user: PendingUser) => {
    setSelectedUser(user);           // เก็บข้อมูลผู้ใช้ที่เลือก
    setIsApprovalFormOpen(true);     // เปิดฟอร์มอนุมัติ
  };

  // ฟังก์ชันสำหรับจัดการการส่งฟอร์มอนุมัติ (อนุมัติหรือปฏิเสธ)
  const handleApprovalSubmit = async (action: 'approve' | 'reject', formData: ApprovalFormData) => {
    if (!selectedUser) return;

    console.log(`${action} user:`, selectedUser.id, 'with data:', formData);

    try {
      let response;

      if (action === 'approve') {
        response = await fetch('/api/approveUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            currentRole: selectedUser.role,
            approvedRole: formData.approvedRole === 'ลูกบ้าน' ? 'resident' : 'guard',
            houseAddress: formData.approvedRole === 'ลูกบ้าน' ? formData.houseNumber : undefined,
            notes: formData.notes
          }),
        });
      } else {
        response = await fetch('/api/rejectUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            currentRole: selectedUser.role,
            reason: 'Rejected by administrator',
            notes: formData.notes,
          }),
        });
      }

      const result = await response.json();

      if (result.success) {
        console.log(`User ${action}d successfully:`, result.message);

        // Show success notification
        setNotificationData({
          type: 'success',
          title: action === 'approve' ? 'อนุมัติผู้ใช้สำเร็จ' : 'ปฏิเสธผู้ใช้สำเร็จ',
          message: action === 'approve'
            ? `ได้ทำการอนุมัติผู้ใช้เรียบร้อยแล้ว ผู้ใช้สามารถเข้าสู่ระบบได้แล้ว`
            : `ได้ทำการปฏิเสธผู้ใช้เรียบร้อยแล้ว`,
          userName: `${selectedUser.fname} ${selectedUser.lname}`
        });
        setShowNotificationDialog(true);

        // Refresh data after successful approval/rejection
        await fetchPendingUsers(true);

        // Call parent refresh if provided
        if (onRefresh) {
          onRefresh();
        }

        setIsApprovalFormOpen(false);
        setSelectedUser(null);
      } else {
        console.error(`Failed to ${action} user:`, result.error);

        // Show error notification
        setNotificationData({
          type: 'error',
          title: action === 'approve' ? 'เกิดข้อผิดพลาดในการอนุมัติ' : 'เกิดข้อผิดพลาดในการปฏิเสธ',
          message: result.error || `ไม่สามารถ${action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}ผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง`,
          userName: `${selectedUser.fname} ${selectedUser.lname}`
        });
        setShowNotificationDialog(true);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);

      // Show error notification
      setNotificationData({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
        userName: selectedUser ? `${selectedUser.fname} ${selectedUser.lname}` : undefined
      });
      setShowNotificationDialog(true);
    }
  };

  // ฟังก์ชันสำหรับสร้างตัวอักษรย่อจากชื่อและนามสกุล (สำหรับ Avatar)
  const getAvatarInitials = (fname: string, lname: string) => {
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
  };

  // ฟังก์ชันสำหรับกำหนดสี Avatar ตาม ID ของผู้ใช้
  const getAvatarColor = (userId: string) => {
    const colors = [
      "bg-primary",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // ฟังก์ชันสำหรับจัดรูปแบบวันที่ให้เป็นภาษาไทย
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to convert API data to PendingUser format
  const convertToPendingUser = (data: PendingResident | PendingGuard): PendingUser => {
    return {
      id: data.id,
      username: data.email.split('@')[0],
      email: data.email,
      fname: data.fname,
      lname: data.lname,
      phone: data.phone,
      role: data.role,
      houseNumber: data.house_address || "-",
      requestDate: data.createdAt,
      status: data.status,
      profile_image_url: data.profile_image_url,
      village_id: data.village_id
    };
  };

  // Combine and filter all pending users
  const allPendingUsers = [
    ...residentsData.map(convertToPendingUser),
    ...guardsData.map(convertToPendingUser)
  ];

  // กรองข้อมูลผู้ใช้ตามคำค้นหา
  // ค้นหาได้จากชื่อ, นามสกุล, อีเมล, บทบาท, และบ้านเลขที่
  const filteredUsers = allPendingUsers.filter(user =>
    user.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.houseNumber.includes(searchTerm)
  );

  // คำนวณข้อมูลสำหรับการแบ่งหน้า
  const totalItems = filteredUsers.length;                    // จำนวนรายการทั้งหมด
  const totalPages = Math.ceil(totalItems / itemsPerPage);    // จำนวนหน้าทั้งหมด
  const startIndex = (currentPage - 1) * itemsPerPage;        // ดัชนีเริ่มต้นของหน้าปัจจุบัน
  const endIndex = startIndex + itemsPerPage;                 // ดัชนีสิ้นสุดของหน้าปัจจุบัน
  const currentUsers = filteredUsers.slice(startIndex, endIndex); // ข้อมูลผู้ใช้ในหน้าปัจจุบัน

  // Effect สำหรับรีเซ็ตหน้าแรกเมื่อมีการค้นหาใหม่
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ฟังก์ชันสำหรับไปหน้าถัดไป
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ฟังก์ชันสำหรับไปหน้าก่อนหน้า
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // ฟังก์ชันสำหรับเปลี่ยนจำนวนรายการต่อหน้า
  const handleItemsPerPageChange = (value: string) => {
    const newValue = Number(value);
    setItemsPerPage(newValue);
    setCurrentPage(1); // รีเซ็ตกลับไปหน้าแรก

    // Save to localStorage for persistence
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('pendingTable_itemsPerPage', newValue.toString());
    }
  };

  return (
    <>
      <Popover open={dialogOpen} onOpenChange={setDialogOpen}>
        <PopoverTrigger asChild>
          {children || (
            <Button className="flex items-center gap-2 relative">
              <UserPlus className="h-4 w-4" />
              ผู้ใช้รออนุมัติ
              {pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                >
                  {pendingCount}
                </Badge>
              )}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[80vw] max-w-6xl p-0" align="start">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">ผู้ใช้ใหม่รออนุมัติ</h2>
            </div>

            <div className="overflow-visible">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">กำลังโหลดข้อมูล...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-destructive text-xl mb-2">⚠️</div>
                    <p className="text-destructive">เกิดข้อผิดพลาด: {error}</p>
                    <Button
                      onClick={() => fetchPendingUsers()}
                      className="mt-2"
                    >
                      ลองใหม่
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search and controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="ค้นหาผู้ใช้..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent w-full text-sm"
                      />
                    </div>

                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-sm">
                      {allPendingUsers.length} รายการ
                    </Badge>

                    {refreshing && (
                      <div className="flex items-center gap-1 text-primary text-sm">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        <span>กำลังอัปเดต...</span>
                      </div>
                    )}
                  </div>

                  {/* Table */}
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">ผู้สมัคร</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden sm:table-cell">ข้อมูลติดต่อ</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">บทบาท</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden md:table-cell">บ้านเลขที่</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden lg:table-cell">วันที่สมัคร</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">การดำเนินการ</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {currentUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${getAvatarColor(
                                    user.id
                                  )}`}
                                >
                                  {getAvatarInitials(user.fname, user.lname)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-foreground text-base">
                                    {user.fname} {user.lname}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    @{user.username}
                                  </div>
                                  <div className="sm:hidden text-xs text-muted-foreground mt-1 space-y-1">
                                    <div>{user.email}</div>
                                    <div>{user.phone}</div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                              <div className="space-y-1">
                                <div className="text-sm text-foreground">{user.email}</div>
                                <div className="text-sm text-muted-foreground">{user.phone}</div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs sm:text-sm ${user.role === "guard"
                                  ? "border-primary/20 text-primary bg-primary/5"
                                  : "border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-900/20"
                                  }`}
                              >
                                {user.role === "guard" ? "ยาม" : "ลูกบ้าน"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-foreground hidden md:table-cell text-sm">
                              {user.houseNumber !== "-" ? user.houseNumber : "-"}
                            </TableCell>

                            <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                              {formatDate(user.requestDate)}
                            </TableCell>

                            <TableCell>
                              <Button
                                size="sm"
                                className="text-xs sm:text-sm"
                                onClick={() => handleProcess(user)}
                              >
                                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">ดำเนินการ</span>
                                <span className="sm:hidden">จัดการ</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* No data message */}
                  {filteredUsers.length === 0 && (
                    <div className="p-8 text-center">
                      <UserPlus className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                        {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีผู้ใช้ใหม่รออนุมัติ'}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ผู้ใช้ใหม่ที่สมัครเข้ามาจะปรากฏที่นี่'}
                      </p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t bg-muted gap-4">
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm text-muted-foreground">แสดง</span>
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={handleItemsPerPageChange}
                          >
                            <SelectTrigger className="w-16 sm:w-20 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs sm:text-sm text-muted-foreground">รายการต่อหน้า</span>
                        </div>

                        <div className="text-xs sm:text-sm text-muted-foreground">
                          แสดง {startIndex + 1} ถึง {Math.min(endIndex, totalItems)} จาก {totalItems} รายการ
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="flex items-center text-xs sm:text-sm"
                        >
                          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">ก่อนหน้า</span>
                          <span className="sm:hidden">ก่อน</span>
                        </Button>

                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${currentPage === pageNum
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted"
                                  }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="flex items-center text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">ถัดไป</span>
                          <span className="sm:hidden">ถัด</span>
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Approval Form Dialog */}
          <ApprovalForm
            user={selectedUser}
            isOpen={isApprovalFormOpen}
            onClose={() => {
              setIsApprovalFormOpen(false);
              setSelectedUser(null);
            }}
            onSubmit={handleApprovalSubmit}
          />
        </PopoverContent>
      </Popover>

      {/* Success/Error Notification Dialog */}
      <AlertDialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center">
              {notificationData?.type === 'success' ? (
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>
            <AlertDialogTitle className={`text-xl font-semibold ${notificationData?.type === 'success'
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
              }`}>
              {notificationData?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              {notificationData?.userName && (
                <span className="font-medium text-foreground">{notificationData.userName}</span>
              )}
              {notificationData?.userName && <br />}
              {notificationData?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center pt-2">
            <AlertDialogAction
              onClick={() => setShowNotificationDialog(false)}
              className={
                notificationData?.type === 'success'
                  ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                  : "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              }
            >
              ตกลง
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
