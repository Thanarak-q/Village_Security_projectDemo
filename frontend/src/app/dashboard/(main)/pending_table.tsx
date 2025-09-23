"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Settings, ChevronLeft, ChevronRight, Search } from "lucide-react";
import ApprovalForm from "./ApprovalForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  village_key: string;
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
  village_key: string;
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
}

// Interface สำหรับข้อมูลฟอร์มการอนุมัติ
interface ApprovalFormData {
  approvedRole: string;  // บทบาทที่อนุมัติ
  houseNumber?: string;  // บ้านเลขที่
  notes?: string;        // หมายเหตุ
}

// ฟังก์ชันหลักสำหรับแสดงตารางผู้ใช้ที่รออนุมัติ
export default function PendingTable() {
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
    // Get saved itemsPerPage from localStorage, default to 2
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('pendingTable_itemsPerPage');
      return saved ? parseInt(saved, 10) : 2;
    }
    return 2;
  });      // จำนวนรายการต่อหน้า
  const [searchTerm, setSearchTerm] = useState("");         // คำค้นหา
  
  // State สำหรับการ refresh ข้อมูล
  const [refreshing, setRefreshing] = useState(false);

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
      const selectedVillage = typeof window !== 'undefined' ? sessionStorage.getItem('selectedVillage') : null;
      const url = selectedVillage 
        ? `/api/pendingUsers?village_key=${encodeURIComponent(selectedVillage)}`
        : '/api/pendingUsers';
        
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

  // Refetch when selected village changes
  useEffect(() => {
    const handleStorageChange = () => {
      fetchPendingUsers();
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event when village changes in same tab
    window.addEventListener('villageChanged', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('villageChanged', handleStorageChange)
    }
  }, []);

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
            houseNumber: formData.approvedRole === 'ลูกบ้าน' ? formData.houseNumber : undefined,
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


        // Refresh data after successful approval/rejection
        await fetchPendingUsers(true);

        setIsApprovalFormOpen(false);
        setSelectedUser(null);
      } else {
        console.error(`Failed to ${action} user:`, result.error);
        alert(`Failed to ${action} user: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`An error occurred while ${action}ing the user`);
    }
  };

  // ฟังก์ชันสำหรับสร้างตัวอักษรย่อจากชื่อและนามสกุล (สำหรับ Avatar)
  const getAvatarInitials = (fname: string, lname: string) => {
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
  };

  // ฟังก์ชันสำหรับกำหนดสี Avatar ตาม ID ของผู้ใช้
  const getAvatarColor = (userId: string) => {
    const colors = [
      "bg-blue-500",
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
      profile_image_url: data.profile_image_url
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>
          <button 
            onClick={() => fetchPendingUsers()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow-sm border">
      {/* ส่วนหัวของตาราง */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* ส่วนแสดงชื่อและจำนวนรายการ */}
          <div className="flex items-center space-x-3">
            <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              ผู้ใช้ใหม่รออนุมัติ
            </h2>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs sm:text-sm">
              {allPendingUsers.length} รายการ
            </Badge>
          </div>
          
          {/* ส่วนค้นหาและเวลาอัปเดต */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* ช่องค้นหา */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent w-full sm:w-64 text-sm"
              />
            </div>
            {/* แสดงเวลาอัปเดตล่าสุด */}
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              {refreshing && (
                <div className="flex items-center gap-1 text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span>กำลังอัปเดต...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ส่วนตารางแสดงข้อมูล */}
      <div className="overflow-x-auto rounded-lg border border-border bg-background shadow-sm hover:shadow-md transition-shadow duration-200">
        <Table>
          {/* หัวตาราง */}
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border">
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">ผู้สมัคร</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden sm:table-cell">ข้อมูลติดต่อ</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">บทบาท</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden md:table-cell">บ้านเลขที่</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden lg:table-cell">วันที่สมัคร</TableHead>
              {/* <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm">สถานะ</TableHead> */}
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          
          {/* เนื้อหาตาราง */}
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                {/* คอลัมน์ผู้สมัคร - แสดง Avatar และชื่อ */}
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-4">
                    {/* Avatar วงกลมที่มีตัวอักษรย่อ */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${getAvatarColor(
                        user.id
                      )}`}
                    >
                      {getAvatarInitials(user.fname, user.lname)}
                    </div>
                    {/* ชื่อและ username */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-base">
                        {user.fname} {user.lname}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{user.username}
                      </div>
                      {/* แสดงข้อมูลติดต่อในมือถือ */}
                      <div className="sm:hidden text-xs text-muted-foreground mt-1 space-y-1">
                        <div>{user.email}</div>
                        <div>{user.phone}</div>
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                {/* คอลัมน์ข้อมูลติดต่อ - แสดงอีเมลและเบอร์โทร */}
                <TableCell className="hidden sm:table-cell">
                  <div className="space-y-1">
                    <div className="text-sm text-foreground">{user.email}</div>
                    <div className="text-sm text-muted-foreground">{user.phone}</div>
                  </div>
                </TableCell>
                
                {/* คอลัมน์บทบาท - แสดง Badge สีตามบทบาท */}
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs sm:text-sm ${
                      user.role === "guard" 
                        ? "border-blue-200 text-blue-700 bg-blue-50" 
                        : "border-green-200 text-green-700 bg-green-50"
                    }`}
                  >
                    {user.role === "guard" ? "ยาม" : "ลูกบ้าน"}
                  </Badge>
                </TableCell>
                
                {/* คอลัมน์บ้านเลขที่ */}
                <TableCell className="text-gray-700 hidden md:table-cell text-sm">
                  {user.houseNumber !== "-" ? user.houseNumber : "-"}
                </TableCell>
                
                {/* คอลัมน์วันที่สมัคร - แสดงในรูปแบบภาษาไทย */}
                <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                  {formatDate(user.requestDate)}
                </TableCell>
                
                {/* คอลัมน์สถานะ - แสดง Badge สีส้มพร้อมไอคอนนาฬิกา */}
                {/* <TableCell>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs sm:text-sm">
                    <Clock className="w-3 h-3 mr-1" />
                    {user.status}
                  </Badge>
                </TableCell> */}
                
                {/* คอลัมน์การดำเนินการ - ปุ่มสำหรับเปิดฟอร์มอนุมัติ */}
                <TableCell>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
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

      {/* ส่วนแสดงเมื่อไม่มีข้อมูล */}
      {filteredUsers.length === 0 && (
        <div className="p-8 sm:p-12 text-center">
          <UserPlus className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
            {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีผู้ใช้ใหม่รออนุมัติ'}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ผู้ใช้ใหม่ที่สมัครเข้ามาจะปรากฏที่นี่'}
          </p>
        </div>
      )}

      {/* ส่วนควบคุมการแบ่งหน้า */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t bg-muted gap-4">
          {/* ส่วนซ้าย - แสดงการตั้งค่าจำนวนรายการต่อหน้าและข้อมูลการแสดงผล */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {/* ตัวเลือกจำนวนรายการต่อหน้า */}
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
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs sm:text-sm text-muted-foreground">รายการต่อหน้า</span>
            </div>
            
            {/* แสดงข้อมูลการแบ่งหน้า */}
            <div className="text-xs sm:text-sm text-muted-foreground">
              แสดง {startIndex + 1} ถึง {Math.min(endIndex, totalItems)} จาก {totalItems} รายการ
            </div>
          </div>
          
          {/* ส่วนขวา - ปุ่มนำทางระหว่างหน้า */}
          <div className="flex items-center space-x-2">
            {/* ปุ่มไปหน้าก่อนหน้า */}
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
            
            {/* ปุ่มหมายเลขหน้า */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                // ตรรกะการแสดงหมายเลขหน้า
                if (totalPages <= 5) {
                  // ถ้ามีหน้าไม่เกิน 5 หน้า แสดงทุกหน้า
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  // ถ้าอยู่หน้าแรกๆ แสดงหน้า 1-5
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // ถ้าอยู่หน้าท้ายๆ แสดงหน้า 5 หน้าสุดท้าย
                  pageNum = totalPages - 4 + i;
                } else {
                  // ถ้าอยู่ตรงกลาง แสดงหน้า 2 หน้าแรกและหลังหน้าปัจจุบัน
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                      currentPage === pageNum 
                        ? "bg-blue-600 text-white" 
                        : "text-muted-foreground hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            {/* ปุ่มไปหน้าถัดไป */}
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

      {/* ฟอร์มอนุมัติ - แสดงเป็น Dialog */}
      <ApprovalForm
        user={selectedUser}
        isOpen={isApprovalFormOpen}
        onClose={() => {
          setIsApprovalFormOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleApprovalSubmit}
      />
    </div>
  );
}