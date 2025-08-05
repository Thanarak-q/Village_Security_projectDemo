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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Users, Shield, Home, Search, ChevronLeft, ChevronRight, Clock, Car } from "lucide-react";

// API Response Interface
interface HistoryTableResponse {
  success: boolean;
  data: {
    adminHistory: AdminHistory[];
    visitorHistory: VisitorHistory[];
  };
  total: {
    adminHistory: number;
    visitorHistory: number;
    total: number;
  };
  error?: string;
}

// Visitor Records API Response Interface
interface VisitorRecordAPIResponse {
  success: boolean;
  data: VisitorRecordAPI[];
  error?: string;
}

interface VisitorRecordAPI {
  visitor_record_id: string;
  resident_id: string;
  guard_id: string;
  house_id: string;
  picture_key: string;
  license_plate: string;
  entry_time: string;
  record_status: string;
  visit_purpose: string;
  createdAt: string;
  updatedAt: string;
  resident_name: string;
  resident_email: string;
  guard_name: string;
  guard_email: string;
  house_address: string;
  village_key: string;
}

// Interface for Admin History from API
interface AdminHistory {
  id: string;
  name: string;
  action: string;
  note: string;
  timestamp: string;
  user_role: string;
  user_email: string;
}

// Interface for Visitor History from API
interface VisitorHistory {
  id: string;
  license_plate: string;
  entry_time: string;
  record_status: string;
  visit_purpose: string;
  resident_name: string;
  resident_email: string;
  guard_name: string;
  guard_email: string;
  house_address: string;
  picture_key: string;
  exit_time?: string;
}

// Interface for History data structure
interface HistoryItem {
  id: string;
  name: string;
  action: string;
  note: string;
  timestamp: string;
  status: string;
  type: string;
  details?: string;
}

// Main history table component
export default function HistoryTable() {
  // State for API data
  const [adminHistoryData, setAdminHistoryData] = useState<AdminHistory[]>([]);
  const [visitorHistoryData, setVisitorHistoryData] = useState<VisitorHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for managing selected tab (admin history or visitor history)
  const [activeTab, setActiveTab] = useState<'adminHistory' | 'visitorHistory'>('adminHistory');
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Get saved itemsPerPage from localStorage, default to 5
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('historyTable_itemsPerPage');
      return saved ? parseInt(saved, 10) : 5;
    }
    return 5;
  });
  
  // State สำหรับการ refresh ข้อมูล
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data from API
  const fetchHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Dummy admin history data (keeping as dummy for now)
      const dummyAdminHistory: AdminHistory[] = [
        {
          id: "1",
          name: "สมชาย ใจดี",
          action: "แก้ไขข้อมูลผู้ใช้",
          note: "อัปเดตข้อมูลบ้านเลขที่",
          timestamp: "2024-01-15T10:30:00Z",
          user_role: "admin",
          user_email: "somchai@example.com"
        },
        {
          id: "2",
          name: "สมหญิง รักดี",
          action: "เพิ่มผู้ใช้ใหม่",
          note: "เพิ่มยามใหม่เข้าสู่ระบบ",
          timestamp: "2024-01-14T14:20:00Z",
          user_role: "admin",
          user_email: "somying@example.com"
        },
        {
          id: "3",
          name: "สมศักดิ์ มั่นคง",
          action: "ลบผู้ใช้",
          note: "ลบผู้ใช้ที่หมดอายุ",
          timestamp: "2024-01-13T09:15:00Z",
          user_role: "admin",
          user_email: "somsak@example.com"
        }
      ];

      // Fetch real visitor records from API
      const visitorResponse = await fetch("/api/visitor-records");
      if (!visitorResponse.ok) {
        throw new Error(`HTTP error! status: ${visitorResponse.status}`);
      }
      
      const visitorData: VisitorRecordAPIResponse = await visitorResponse.json();
      
      if (visitorData.success) {
        // Transform API data to match our interface
        const transformedVisitorHistory: VisitorHistory[] = visitorData.data.map((record: VisitorRecordAPI) => ({
          id: record.visitor_record_id,
          license_plate: record.license_plate,
          entry_time: record.entry_time,
          record_status: record.record_status,
          visit_purpose: record.visit_purpose,
          resident_name: record.resident_name,
          resident_email: record.resident_email,
          guard_name: record.guard_name,
          guard_email: record.guard_email,
          house_address: record.house_address,
          picture_key: record.picture_key,
          exit_time: undefined // Not provided in API response
        }));
        
        setVisitorHistoryData(transformedVisitorHistory);
      } else {
        throw new Error("Failed to fetch visitor records");
      }

      setAdminHistoryData(dummyAdminHistory);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Function to create avatar initials from name
  const getAvatarInitials = (name: string) => {
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase();
  };

  // Function to get avatar color based on user ID
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

  // Function to format date in Thai
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter admin history by search term
  const filteredAdminHistory = adminHistoryData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter visitor history by search term
  const filteredVisitorHistory = visitorHistoryData.filter(item =>
    item.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.resident_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.guard_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.visit_purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.record_status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to get current page admin history
  const getCurrentAdminHistory = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAdminHistory.slice(startIndex, endIndex).map(item => ({
      ...item,
      type: "admin",
      status: "completed"
    }));
  };

  // Function to get current page visitor history
  const getCurrentVisitorHistory = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVisitorHistory.slice(startIndex, endIndex).map(item => ({
      ...item,
      type: "visitor",
      status: item.record_status
    }));
  };

  // Calculate pagination data
  const totalItems = activeTab === 'adminHistory' ? filteredAdminHistory.length : filteredVisitorHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when changing tab or search
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Function to go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Function to go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Function to change items per page
  const handleItemsPerPageChange = (value: string) => {
    const newValue = Number(value);
    setItemsPerPage(newValue);
    setCurrentPage(1);
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('historyTable_itemsPerPage', newValue.toString());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
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
            onClick={() => fetchHistory()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 m-20">
      {/* Main table section */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        {/* Header with tabs and search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          {/* History type tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            {/* Admin History tab */}
            <button
              onClick={() => setActiveTab('adminHistory')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'adminHistory'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>ประวัติผู้ดูแล ({adminHistoryData.length})</span>
            </button>
            
            {/* Visitor History tab */}
            <button
              onClick={() => setActiveTab('visitorHistory')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'visitorHistory'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Car className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>ประวัติผู้เยี่ยม ({visitorHistoryData.length})</span>
            </button>
          </div>
          
          {/* Search box and refresh indicator */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาประวัติ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-sm"
              />
            </div>
            
            {/* Refresh indicator */}
            {refreshing && (
              <div className="flex items-center gap-1 text-blue-600 text-sm">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span>กำลังอัปเดต...</span>
              </div>
            )}
          </div>
        </div>

        {/* Admin History table */}
        {activeTab === 'adminHistory' && (
          <div className="overflow-x-auto">
            <Table>
              {/* Admin History table header */}
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">ผู้ดำเนินการ</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden sm:table-cell">การดำเนินการ</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden md:table-cell">หมายเหตุ</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden lg:table-cell">วันที่ดำเนินการ</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              
              {/* Admin History table body */}
              <TableBody>
                {getCurrentAdminHistory().map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    {/* User column - Avatar and name */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {/* Avatar circle with initials */}
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm ${getAvatarColor(
                            item.id
                          )}`}
                        >
                          {getAvatarInitials(item.name)}
                        </div>
                        {/* Name and email */}
                        <div>
                          <div className="font-medium text-gray-900 text-sm sm:text-base">
                            {item.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {item.user_email}
                          </div>
                          {/* Show action on mobile */}
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {item.action}<br/>
                            {item.note}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Action column */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{item.action}</div>
                        <div className="text-sm text-gray-500">{item.note}</div>
                      </div>
                    </TableCell>
                    
                    {/* Note column */}
                    <TableCell className="text-gray-700 hidden md:table-cell text-sm">
                      {item.note}
                    </TableCell>
                    
                    {/* Timestamp column */}
                    <TableCell className="text-gray-600 hidden lg:table-cell text-sm">
                      {formatDate(item.timestamp)}
                    </TableCell>
                    
                    {/* Status column */}
                    <TableCell>
                      <Badge
                        variant="default"
                        className="text-xs sm:text-sm bg-green-100 text-green-800 hover:bg-green-100"
                      >
                        เสร็จสิ้น
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Visitor History table */}
        {activeTab === 'visitorHistory' && (
          <div className="overflow-x-auto">
            <Table>
              {/* Visitor History table header */}
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">ข้อมูลผู้เยี่ยม</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden sm:table-cell">วัตถุประสงค์</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden md:table-cell">บ้านที่เยี่ยม</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden lg:table-cell">เวลาที่เข้า</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              
              {/* Visitor History table body */}
              <TableBody>
                {getCurrentVisitorHistory().map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    {/* Visitor info column - License plate and resident */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {/* Avatar circle with car icon */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm bg-blue-500">
                          <Car className="w-4 h-4" />
                        </div>
                        {/* License plate and resident info */}
                        <div>
                          <div className="font-medium text-gray-900 text-sm sm:text-base">
                            {item.license_plate}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            เยี่ยม: {item.resident_name}
                          </div>
                          {/* Show purpose on mobile */}
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {item.visit_purpose}<br/>
                            บ้าน: {item.house_address}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Purpose column */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-sm text-gray-900">{item.visit_purpose}</div>
                    </TableCell>
                    
                    {/* House address column */}
                    <TableCell className="text-gray-700 hidden md:table-cell text-sm">
                      {item.house_address}
                    </TableCell>
                    
                    {/* Entry time column */}
                    <TableCell className="text-gray-600 hidden lg:table-cell text-sm">
                      {formatDate(item.entry_time)}
                    </TableCell>
                    
                    {/* Status column */}
                    <TableCell>
                      <Badge
                        variant={item.status === "completed" ? "default" : "secondary"}
                        className={`text-xs sm:text-sm ${
                          item.status === "completed"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : item.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {item.status === "completed" ? "เสร็จสิ้น" : 
                         item.status === "in_progress" ? "กำลังดำเนินการ" : 
                         item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* No data message */}
        {((activeTab === 'adminHistory' && filteredAdminHistory.length === 0) ||
          (activeTab === 'visitorHistory' && filteredVisitorHistory.length === 0)) && (
          <div className="p-8 sm:p-12 text-center">
            <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              ไม่พบข้อมูลประวัติ
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ยังไม่มีข้อมูลประวัติในหมวดหมู่นี้'}
            </p>
          </div>
        )}

        {/* Pagination controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t bg-gray-50 gap-4">
            {/* Left section - Items per page and pagination info */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {/* Items per page selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-gray-600">แสดง</span>
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
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs sm:text-sm text-gray-600">รายการต่อหน้า</span>
              </div>
              
              {/* Pagination info */}
              <div className="text-xs sm:text-sm text-gray-600">
                แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
              </div>
            </div>
            
            {/* Right section - Navigation buttons */}
            <div className="flex items-center space-x-2">
              {/* Previous page button */}
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
              
              {/* Page number buttons */}
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
                      className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                        currentPage === pageNum 
                          ? "bg-blue-600 text-white" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              {/* Next page button */}
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
    </div>
  );
}
