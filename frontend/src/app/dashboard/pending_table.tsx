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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Search,
  MoreHorizontal
} from "lucide-react";
import ApprovalForm from "./ApprovalForm"; // ✅ Import ApprovalForm

// Interface สำหรับข้อมูลคำขออนุมัติ
interface ApprovalRequest {
  id: number;
  name: string;
  avatar: string;
  requestType: string;
  houseNumber: string;
  status: "pending" | "review" | "urgent" | "approved" | "rejected";
  submittedTime: string;
  phoneNumber: string;
  email?: string;
}

// ✅ Interface สำหรับข้อมูลอัปเดต - แก้ไขให้ตรงกับ ApprovalForm
interface ApprovalDecisionData {
  id: number;
  decision: "approved" | "rejected";
  role?: string; // ✅ เปลี่ยนเป็น optional
  houseNumber?: string;
  note?: string;
}

// ข้อมูลคำขออนุมัติ
const initialApprovalRequests: ApprovalRequest[] = [
  {
    id: 1,
    name: "นายสมชาย ใจดี",
    avatar: "/avatar1.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "123/45",
    status: "pending",
    submittedTime: "15 นาทีที่แล้ว",
    phoneNumber: "081-234-5678",
    email: "somchai@gmail.com",
  },
  {
    id: 2,
    name: "นางมาลี สุขใส",
    avatar: "/avatar2.jpg",
    requestType: "ขอย้ายที่อยู่",
    houseNumber: "246/12",
    status: "review",
    submittedTime: "45 นาทีที่แล้ว",
    phoneNumber: "082-345-6789",
    email: "malee@gmail.com",
  },
  {
    id: 3,
    name: "นายวิชัย รักดี",
    avatar: "/avatar3.jpg",
    requestType: "ขอเปลี่ยนข้อมูลส่วนตัว",
    houseNumber: "78/9",
    status: "pending",
    submittedTime: "2 ชั่วโมงที่แล้ว",
    phoneNumber: "083-456-7890",
    email: "wichai@gmail.com",
  },
  {
    id: 4,
    name: "นางสาวสุดา ใจกว้าง",
    avatar: "/avatar4.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "159/33",
    status: "urgent",
    submittedTime: "5 ชั่วโมงที่แล้ว",
    phoneNumber: "084-567-8901",
    email: "suda@gmail.com",
  },
  {
    id: 5,
    name: "นายประยุทธ สมหวัง",
    avatar: "/avatar5.jpg",
    requestType: "ขอย้ายออก",
    houseNumber: "95/7",
    status: "review",
    submittedTime: "1 วันที่แล้ว",
    phoneNumber: "085-678-9012",
    email: "prayuth@gmail.com",
  },
  {
    id: 6,
    name: "นางสาวจิรา ดีใจ",
    avatar: "/avatar6.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "201/15",
    status: "approved",
    submittedTime: "2 วันที่แล้ว",
    phoneNumber: "086-789-0123",
    email: "jira@gmail.com",
  },
  {
    id: 7,
    name: "นายธนา รวยจริง",
    avatar: "/avatar7.jpg",
    requestType: "ขอเปลี่ยนข้อมูลส่วนตัว",
    houseNumber: "88/22",
    status: "rejected",
    submittedTime: "3 วันที่แล้ว",
    phoneNumber: "087-890-1234",
    email: "thana@gmail.com",
  },
  {
    id: 8,
    name: "นางวิมล สง่างาม",
    avatar: "/avatar8.jpg",
    requestType: "ขอย้ายที่อยู่",
    houseNumber: "305/77",
    status: "urgent",
    submittedTime: "4 วันที่แล้ว",
    phoneNumber: "088-901-2345",
    email: "wimon@gmail.com",
  },
  {
    id: 9,
    name: "นายเจษฎา มีเงิน",
    avatar: "/avatar9.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "77/99",
    status: "pending",
    submittedTime: "5 วันที่แล้ว",
    phoneNumber: "089-012-3456",
    email: "jetsada@gmail.com",
  },
  {
    id: 10,
    name: "นางสาวพิมพ์ใจ สวยงาม",
    avatar: "/avatar10.jpg",
    requestType: "ขอย้ายออก",
    houseNumber: "144/88",
    status: "review",
    submittedTime: "1 สัปดาห์ที่แล้ว",
    phoneNumber: "090-123-4567",
    email: "pimjai@gmail.com",
  },
];

// Function สำหรับแสดง Badge สถานะ
const getStatusBadge = (status: ApprovalRequest['status']) => {
  const statusConfig = {
    pending: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-800" },
    review: { label: "กำลังตรวจสอบ", className: "bg-blue-100 text-blue-800" },
    urgent: { label: "ด่วน", className: "bg-red-100 text-red-800" },
    approved: { label: "อนุมัติแล้ว", className: "bg-green-100 text-green-800" },
    rejected: { label: "ปฏิเสธแล้ว", className: "bg-gray-100 text-gray-800" },
  };

  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={`${config.className} font-normal`}>
      {config.label}
    </Badge>
  );
};

export default function ApprovalRequestsTable() {
  // State Management เหมือน UserManagementTable
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(initialApprovalRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [typeFilter, setTypeFilter] = useState("ทั้งหมด");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null); // ✅ เพิ่ม state สำหรับ approval form

  // ✅ Function สำหรับจัดการการอนุมัติผ่าน Form
  const handleApprovalDecision = async (approvalData: ApprovalDecisionData) => {
    try {
      console.log("Processing approval decision:", approvalData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApprovalRequests(prevData => 
        prevData.map(request => {
          if (request.id === approvalData.id) {
            return {
              ...request,
              status: approvalData.decision, // "approved" หรือ "rejected"
              // ✅ อัปเดตข้อมูลเพิ่มเติมถ้าอนุมัติและมี role
              ...(approvalData.decision === "approved" && approvalData.role && {
                // อัปเดต role และ houseNumber ถ้าอนุมัติ
                assignedRole: approvalData.role,
                assignedHouseNumber: approvalData.role === "resident" ? approvalData.houseNumber : "-",
              })
            };
          }
          return request;
        })
      );

      const actionText = approvalData.decision === "approved" ? "อนุมัติ" : "ปฏิเสธ";
      
      let message = `${actionText}คำขอ ID: ${approvalData.id} สำเร็จ!`;
      
      // ✅ แสดงข้อมูลเพิ่มเติมถ้าอนุมัติและมี role
      if (approvalData.decision === "approved" && approvalData.role) {
        const roleText = approvalData.role === "resident" ? "ผู้อยู่อาศัย" : 
                        approvalData.role === "security" ? "รปภ." : "ผู้จัดการ";
        message += `\nบทบาท: ${roleText}`;
        if (approvalData.role === "resident" && approvalData.houseNumber) {
          message += `\nบ้านเลขที่: ${approvalData.houseNumber}`;
        }
      }
      
      // ✅ แสดงหมายเหตุถ้ามี
      if (approvalData.note) {
        message += `\nหมายเหตุ: ${approvalData.note}`;
      }
      
      alert(message);
      
    } catch (error) {
      console.error("Error processing approval decision:", error);
      throw error;
    }
  };

  // Filter data based on search, status, and type
  const filteredData = approvalRequests.filter((request) => {
    const matchesSearch =
      request.name.includes(searchTerm) ||
      request.phoneNumber.includes(searchTerm) ||
      request.houseNumber.includes(searchTerm) ||
      (request.email && request.email.includes(searchTerm));
    
    const matchesStatus = statusFilter === "ทั้งหมด" || 
      (statusFilter === "รอพิจารณา" && request.status === "pending") ||
      (statusFilter === "กำลังตรวจสอบ" && request.status === "review") ||
      (statusFilter === "ด่วน" && request.status === "urgent") ||
      (statusFilter === "อนุมัติแล้ว" && request.status === "approved") ||
      (statusFilter === "ปฏิเสธแล้ว" && request.status === "rejected");
    
    const matchesType = typeFilter === "ทั้งหมด" || request.requestType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
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

  const handleStatusFilter = (value: SetStateAction<string>) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value: SetStateAction<string>) => {
    setTypeFilter(value);
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

  // ✅ หา request ที่ถูกเลือกสำหรับอนุมัติ
  const approvingRequest = approvalRequests.find(request => request.id === approvingRequestId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight text-gray-900 mb-6">
            จัดการคำขออนุมัติ
          </h1>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาชื่อ, เบอร์โทร, บ้านเลขที่..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">สถานะ</span>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                  <SelectItem value="รอพิจารณา">รอพิจารณา</SelectItem>
                  <SelectItem value="กำลังตรวจสอบ">กำลังตรวจสอบ</SelectItem>
                  <SelectItem value="ด่วน">ด่วน</SelectItem>
                  <SelectItem value="อนุมัติแล้ว">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="ปฏิเสธแล้ว">ปฏิเสธแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">ประเภท</span>
              <Select value={typeFilter} onValueChange={handleTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                  <SelectItem value="ขอเข้าพักใหม่">ขอเข้าพักใหม่</SelectItem>
                  <SelectItem value="ขอย้ายที่อยู่">ขอย้ายที่อยู่</SelectItem>
                  <SelectItem value="ขอเปลี่ยนข้อมูลส่วนตัว">ขอเปลี่ยนข้อมูล</SelectItem>
                  <SelectItem value="ขอย้ายออก">ขอย้ายออก</SelectItem>
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
                <TableHead className="w-16">ผู้ขออนุมัติ</TableHead>
                <TableHead>ประเภทคำขอ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เวลาที่ส่งคำขอ</TableHead>
                <TableHead className="w-20 text-center">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length > 0 ? (
                currentData.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.avatar} />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {request.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">
                            {request.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.requestType}
                        </div>
                        <div className="text-sm text-gray-500">
                          บ้านเลขที่ {request.houseNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {request.submittedTime}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {/* ✅ เหลือแค่ DropdownMenu อย่างเดียว */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">เปิดเมนู</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                            {(request.status === "pending" || request.status === "review" || request.status === "urgent") && (
                              <>
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={() => setApprovingRequestId(request.id)} // ✅ เปิด Approval Form
                                >
                                  อนุมัติ/ปฏิเสธ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem>ดูรายละเอียด</DropdownMenuItem>
                            <DropdownMenuItem>ติดต่อผู้ขอ</DropdownMenuItem>
                            <DropdownMenuItem>ส่งอีเมลแจ้งเตือน</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    ไม่พบข้อมูลคำขออนุมัติ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ✅ Render ApprovalForm เมื่อกด "อนุมัติ/ปฏิเสธ" */}
        {approvingRequest && (
          <ApprovalForm
            title="พิจารณาคำขออนุมัติ"
            request={{
              id: approvingRequest.id,
              name: approvingRequest.name,
              avatar: approvingRequest.avatar,
              requestType: approvingRequest.requestType,
              houseNumber: approvingRequest.houseNumber,
              status: approvingRequest.status,
              submittedTime: approvingRequest.submittedTime,
              phoneNumber: approvingRequest.phoneNumber,
              email: approvingRequest.email,
            }}
            isOpen={approvingRequestId === approvingRequest.id}
            onClose={() => setApprovingRequestId(null)}
            onSave={handleApprovalDecision}
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