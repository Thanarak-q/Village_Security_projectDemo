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
import { Edit, Users, Shield, Home, Search, ChevronLeft, ChevronRight } from "lucide-react";
import UserEditForm from "./userEditForm";

// API Response Interface
interface UserTableResponse {
  success: boolean;
  data: {
    residents: Resident[];
    guards: Guard[];
  };
  total: {
    residents: number;
    guards: number;
    total: number;
  };
  error?: string;
}

// Interface for Resident from API
interface Resident {
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
}

// Interface for Guard from API
interface Guard {
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
}

// Interface for User data structure
interface User {
  id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  status: string;
  role: string;
  joinDate: string;
  houseNumber?: string;
  shift?: string;
}



// Main user management table component
export default function UserManagementTable() {
  // State for API data
  const [residentsData, setResidentsData] = useState<Resident[]>([]);
  const [guardsData, setGuardsData] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for managing selected tab (residents or guards)
  const [activeTab, setActiveTab] = useState<'residents' | 'guards'>('residents');
  
  // State for managing selected user for editing
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // State for controlling edit form visibility
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Fetch data from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/userTable");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: UserTableResponse = await response.json();
      
      if (data.success) {
        setResidentsData(data.data.residents);
        setGuardsData(data.data.guards);
      } else {
        throw new Error(data.error || "Failed to fetch users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to handle edit button click
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditFormOpen(true);
  };

  // Function to create avatar initials from name
  const getAvatarInitials = (fname: string, lname: string) => {
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
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
      day: 'numeric'
    });
  };

  // Filter residents by search term
  const filteredResidents = residentsData.filter(user =>
    user.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    user.status.includes(searchTerm)
  );

  // Filter guards by search term
  const filteredGuards = guardsData.filter(user =>
    user.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.status.includes(searchTerm)
  );

  // Function to get current page residents
  const getCurrentResidents = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResidents.slice(startIndex, endIndex).map(resident => ({
      ...resident,
      username: resident.email.split('@')[0],
      houseNumber: resident.house_address || resident.village_key,
      joinDate: resident.createdAt,
      role: "resident"
    }));
  };

  // Function to get current page guards
  const getCurrentGuards = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredGuards.slice(startIndex, endIndex).map(guard => ({
      ...guard,
      username: guard.email.split('@')[0],
      houseNumber: guard.house_address || "-",
      shift: "กะปกติ",
      joinDate: guard.createdAt,
      role: "guard"
    }));
  };

  // Calculate pagination data
  const totalItems = activeTab === 'residents' ? filteredResidents.length : filteredGuards.length;
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
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Function to handle form submission
  const handleFormSubmit = async (formData: { status: string; role: string; houseNumber: string; notes: string }) => {
    try {
      console.log("Updating user:", selectedUser?.id, 'with data:', formData);
      
      // Refresh data after successful update
      await fetchUsers();
      
      setIsEditFormOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
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
            onClick={fetchUsers} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main table section */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        {/* Header with tabs and search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          {/* User type tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            {/* Residents tab */}
            <button
              onClick={() => setActiveTab('residents')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'residents'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>ลูกบ้าน ({residentsData.length})</span>
            </button>
            
            {/* Guards tab */}
            <button
              onClick={() => setActiveTab('guards')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'guards'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>ยาม ({guardsData.length})</span>
            </button>
          </div>
          
          {/* Search box */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-sm"
            />
          </div>
        </div>

        {/* Residents table */}
        {activeTab === 'residents' && (
          <div className="overflow-x-auto">
            <Table>
              {/* Residents table header */}
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">ผู้ใช้งาน</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden sm:table-cell">ข้อมูลติดต่อ</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden md:table-cell">บ้านเลขที่</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden lg:table-cell">วันที่เข้าร่วม</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">สถานะ</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              
              {/* Residents table body */}
              <TableBody>
                {getCurrentResidents().map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    {/* User column - Avatar and name */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {/* Avatar circle with initials */}
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm ${getAvatarColor(
                            user.id
                          )}`}
                        >
                          {getAvatarInitials(user.fname, user.lname)}
                        </div>
                        {/* Name and username */}
                        <div>
                          <div className="font-medium text-gray-900 text-sm sm:text-base">
                            {user.fname} {user.lname}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            @{user.username}
                          </div>
                          {/* Show contact info on mobile */}
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {user.email}<br/>
                            {user.phone}
                          </div>
                          {/* Show house number on mobile */}
                          <div className="md:hidden text-xs text-gray-500 mt-1">
                            บ้านเลขที่: {user.houseNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Contact info column */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </TableCell>
                    
                    {/* House number column */}
                    <TableCell className="text-gray-700 font-medium hidden md:table-cell text-sm">
                      {user.houseNumber}
                    </TableCell>
                    
                    {/* Join date column */}
                    <TableCell className="text-gray-600 hidden lg:table-cell text-sm">
                      {formatDate(user.joinDate)}
                    </TableCell>
                    
                    {/* Status column */}
                    <TableCell>
                      <Badge
                        variant={user.status === "verified" ? "default" : "secondary"}
                        className={`text-xs sm:text-sm ${
                          user.status === "verified"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : user.status === "disable"
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }`}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    
                    {/* Actions column */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs sm:text-sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Guards table */}
        {activeTab === 'guards' && (
          <div className="overflow-x-auto">
            <Table>
              {/* Guards table header */}
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">ผู้ใช้งาน</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden sm:table-cell">ข้อมูลติดต่อ</TableHead>
                  {/* <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">กะ</TableHead> */}
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm hidden lg:table-cell">วันที่เข้าร่วม</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">สถานะ</TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs sm:text-sm">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              
              {/* Guards table body */}
              <TableBody>
                {getCurrentGuards().map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    {/* User column - Avatar and name */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {/* Avatar circle with initials */}
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm ${getAvatarColor(
                            user.id
                          )}`}
                        >
                          {getAvatarInitials(user.fname, user.lname)}
                        </div>
                        {/* Name and username */}
                        <div>
                          <div className="font-medium text-gray-900 text-sm sm:text-base">
                            {user.fname} {user.lname}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            @{user.username}
                          </div>
                          {/* Show contact info on mobile */}
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {user.email}<br/>
                            {user.phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Contact info column */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </TableCell>
                    
                    {/* Shift column */}
                    {/* <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs sm:text-sm ${
                          user.shift === "กะเช้า" 
                            ? "border-blue-200 text-blue-700 bg-blue-50" 
                            : "border-purple-200 text-purple-700 bg-purple-50"
                        }`}
                      >
                        {user.shift}
                      </Badge>
                    </TableCell> */}
                    
                    {/* Join date column */}
                    <TableCell className="text-gray-600 hidden lg:table-cell text-sm">
                      {formatDate(user.joinDate)}
                    </TableCell>
                    
                    {/* Status column */}
                    <TableCell>
                      <Badge
                        variant={user.status === "verified" ? "default" : "secondary"}
                        className={`text-xs sm:text-sm ${
                          user.status === "verified"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : user.status === "disable"
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }`}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    
                    {/* Actions column */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs sm:text-sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* No data message */}
        {((activeTab === 'residents' && filteredResidents.length === 0) ||
          (activeTab === 'guards' && filteredGuards.length === 0)) && (
          <div className="p-8 sm:p-12 text-center">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              ไม่พบข้อมูลผู้ใช้
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ยังไม่มีข้อมูลผู้ใช้ในหมวดหมู่นี้'}
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

      {/* User edit form - Dialog */}
      <UserEditForm
        user={selectedUser}
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}