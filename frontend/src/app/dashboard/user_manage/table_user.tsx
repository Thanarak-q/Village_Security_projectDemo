// UserManagementTable.tsx
"use client";

import { SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Users, Filter, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import UserForm from "./userForm";

// ✅ เพิ่ม interface สำหรับข้อมูลอัปเดต
interface UpdateUserData {
  id: number;
  status: string;
  role: string;
  houseNumber?: string;
}

// ✅ เพิ่ม interface สำหรับ user data
interface UserData {
  id: number;
  initials: string;
  firstName: string;
  lastName: string;
  email: string;
  houseNumber: string;
  role: string;
  roleColor: string;
  avatarColor: string;
  status?: string; // ✅ เพิ่ม status field
}

// ข้อมูลผู้ใช้งาน (เพิ่ม status field)
const initialUserData: UserData[] = [
  {
    id: 1,
    initials: "สม",
    firstName: "สมชาย",
    lastName: "ใจดี",
    email: "somchai@gmail.com",
    houseNumber: "123/45",
    role: "ผู้อยู่อาศัย",
    roleColor: "bg-green-100 text-green-800",
    avatarColor: "bg-blue-500",
    status: "active",
  },
  {
    id: 2,
    initials: "สม",
    firstName: "สมหญิง",
    lastName: "รักสวย",
    email: "somying@gmail.com",
    houseNumber: "123/45",
    role: "ผู้อยู่อาศัย",
    roleColor: "bg-green-100 text-green-800",
    avatarColor: "bg-pink-500",
    status: "active",
  },
  {
    id: 3,
    initials: "ว",
    firstName: "วิชัย",
    lastName: "นิมิตร",
    email: "wichai@gmail.com",
    houseNumber: "456/78",
    role: "ผู้อยู่อาศัย",
    roleColor: "bg-green-100 text-green-800",
    avatarColor: "bg-purple-500",
    status: "active",
  },
  {
    id: 4,
    initials: "ส",
    firstName: "สุรชัย",
    lastName: "ฐานสิริ",
    email: "surachai@gmail.com",
    houseNumber: "-",
    role: "รปภ.",
    roleColor: "bg-blue-100 text-blue-800",
    avatarColor: "bg-yellow-500",
    status: "active",
  },
  {
    id: 5,
    initials: "ปร",
    firstName: "ประสิทธิ์",
    lastName: "ปลอดภัย",
    email: "prasit@gmail.com",
    houseNumber: "-",
    role: "รปภ.",
    roleColor: "bg-blue-100 text-blue-800",
    avatarColor: "bg-red-500",
    status: "active",
  },  {
    id: 6,
    initials: "ปร",
    firstName: "ประสิทธิ์",
    lastName: "ปลอดภัย",
    email: "prasit@gmail.com",
    houseNumber: "-",
    role: "รปภ.",
    roleColor: "bg-blue-100 text-blue-800",
    avatarColor: "bg-red-500",
    status: "active",
  },

];

export default function UserManagementTable() {
  // ✅ เปลี่ยนจาก const เป็น state เพื่อให้อัปเดตได้
  const [userData, setUserData] = useState<UserData[]>(initialUserData);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ทั้งหมด");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // ✅ function สำหรับอัปเดตข้อมูล user
  const handleUpdateUser = async (updateData: UpdateUserData) => {
    try {
      // ในการใช้งานจริง ควรส่งข้อมูลไป API
      console.log("Updating user:", updateData);
      
      // จำลองการส่งข้อมูลไป API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // อัปเดตข้อมูลใน state
      setUserData(prevData => 
        prevData.map(user => {
          if (user.id === updateData.id) {
            return {
              ...user,
              status: updateData.status,
              role: updateData.role === "resident" ? "ผู้อยู่อาศัย" : 
                    updateData.role === "security" ? "รปภ." : 
                    updateData.role === "admin" ? "ผู้จัดการ" : user.role,
              houseNumber: updateData.role === "resident" && updateData.houseNumber 
                          ? updateData.houseNumber 
                          : updateData.role === "resident" 
                          ? user.houseNumber 
                          : "-",
              // อัปเดต roleColor ตาม role ใหม่
              roleColor: updateData.role === "resident" ? "bg-green-100 text-green-800" :
                        updateData.role === "security" ? "bg-blue-100 text-blue-800" :
                        updateData.role === "admin" ? "bg-purple-100 text-purple-800" :
                        user.roleColor
            };
          }
          return user;
        })
      );

      // แสดงข้อความสำเร็จ
      alert(`อัปเดตข้อมูลผู้ใช้ ID: ${updateData.id} สำเร็จ!`);
      
    } catch (error) {
      console.error("Error updating user:", error);
      throw error; // ส่งต่อ error ไปให้ UserForm จัดการ
    }
  };

  // Filter data based on search and role
  const filteredData = userData.filter((user) => {
    const matchesSearch =
      user.firstName.includes(searchTerm) ||
      user.lastName.includes(searchTerm) ||
      user.email.includes(searchTerm);
    const matchesRole = roleFilter === "ทั้งหมด" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleSearch = (value: SetStateAction<string>) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (value: SetStateAction<string>) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: SetStateAction<number>) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (startPage > 1) {
        pages.unshift("...");
        pages.unshift(1);
      }

      if (endPage < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // ✅ หา user ที่ถูกเลือกจาก userData ทั้งหมด (ไม่ใช่แค่ currentData)
  const selectedUser = userData.find(user => user.id === editingUserId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight text-gray-900 mb-6">
            การจัดการผู้ใช้งาน
          </h1>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="ค้นหาผู้ใช้งาน..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">ตัวกรอง</span>
              <Select value={roleFilter} onValueChange={handleRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                  <SelectItem value="ผู้อยู่อาศัย">ผู้อยู่อาศัย</SelectItem>
                  <SelectItem value="รปภ.">รปภ.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">แสดง</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">รายการ</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">ชื่อ</TableHead>
                <TableHead>นามสกุล</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>บ้านเลขที่</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-16">แก้ไข</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length > 0 ? (
                currentData.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${user.avatarColor}`}
                        >
                          {user.initials}
                        </div>
                        <span className="font-medium">{user.firstName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{user.lastName}</TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell className="text-gray-600">{user.houseNumber}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${user.roleColor} font-normal`}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${
                          user.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : user.status === "inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        } font-normal`}
                      >
                        {user.status === "active" ? "ใช้งาน" :
                         user.status === "inactive" ? "ไม่ใช้งาน" : "รอการอนุมัติ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUserId(user.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7} 
                    className="text-center py-8 text-gray-500"
                  >
                    ไม่พบข้อมูลผู้ใช้งาน
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {selectedUser && (
          <UserForm
            title="แก้ไขข้อมูลผู้ใช้"
            user={{
              id: selectedUser.id,
              name: `${selectedUser.firstName} ${selectedUser.lastName}`,
              firstName: selectedUser.firstName,
              lastName: selectedUser.lastName,
              avatarColor: selectedUser.avatarColor,
              initials: selectedUser.initials,
              email: selectedUser.email,
              role: selectedUser.role === "ผู้อยู่อาศัย" ? "resident" : "security",
              houseNumber: selectedUser.houseNumber,
            }}
            isOpen={editingUserId === selectedUser.id}
            onClose={() => setEditingUserId(null)}
            onSave={handleUpdateUser}
          />
        )}

        {/* Footer with Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            แสดง <span className="font-medium">{startIndex + 1}</span> ถึง{" "}
            <span className="font-medium">
              {Math.min(endIndex, totalItems)}
            </span>{" "}
            จากทั้งหมด <span className="font-medium">{totalItems}</span> รายการ
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {/* Previous button */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    ก่อนหน้า
                  </Button>
                </PaginationItem>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "..." ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <PaginationLink
                        onClick={() => {
                          if (typeof page === "number") handlePageChange(page);
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                {/* Next button */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    ถัดไป
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}