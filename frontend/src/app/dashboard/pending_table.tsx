/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import EditUserDialog from "./user_manage/EditUserDialog";

const approvalRequests = [
  {
    id: 1,
    name: "นายสมชาย ใจดี",
    avatar: "/avatar1.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "123/45",
    status: "pending",
    submittedTime: "15 นาทีที่แล้ว",
    phoneNumber: "081-234-5678",
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
  },
  {
    id: 6,
    name: "นางสาวพิมพ์ใจ สวยงาม",
    avatar: "/avatar6.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "302/15",
    status: "pending",
    submittedTime: "2 วันที่แล้ว",
    phoneNumber: "086-789-0123",
  },
  {
    id: 7,
    name: "นายกิตติ มั่นคง",
    avatar: "/avatar7.jpg",
    requestType: "ขอเปลี่ยนข้อมูลส่วนตัว",
    houseNumber: "198/44",
    status: "urgent",
    submittedTime: "3 วันที่แล้ว",
    phoneNumber: "087-890-1234",
  },
  {
    id: 8,
    name: "นางรัชนี ปลอดภัย",
    avatar: "/avatar8.jpg",
    requestType: "ขอย้ายที่อยู่",
    houseNumber: "567/89",
    status: "review",
    submittedTime: "4 วันที่แล้ว",
    phoneNumber: "088-901-2345",
  },
  {
    id: 9,
    name: "นายอนุชา สดใส",
    avatar: "/avatar9.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "445/22",
    status: "pending",
    submittedTime: "5 วันที่แล้ว",
    phoneNumber: "089-012-3456",
  },
  {
    id: 10,
    name: "นางสาวมนทิรา จันทร์เจ้า",
    avatar: "/avatar10.jpg",
    requestType: "ขอย้ายออก",
    houseNumber: "333/11",
    status: "urgent",
    submittedTime: "1 สัปดาห์ที่แล้ว",
    phoneNumber: "090-123-4567",
  },
  {
    id: 11,
    name: "นายธงชัย รุ่งเรือง",
    avatar: "/avatar11.jpg",
    requestType: "ขอเปลี่ยนข้อมูลส่วนตัว",
    houseNumber: "678/90",
    status: "review",
    submittedTime: "1 สัปดาห์ที่แล้ว",
    phoneNumber: "091-234-5678",
  },
  {
    id: 12,
    name: "นางสาวดาวใส แสงสุก",
    avatar: "/avatar12.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "789/12",
    status: "pending",
    submittedTime: "2 สัปดาห์ที่แล้ว",
    phoneNumber: "092-345-6789",
  },
];

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-800" },
    review: { label: "กำลังตรวจสอบ", className: "bg-blue-100 text-blue-800" },
    urgent: { label: "ด่วน", className: "bg-red-100 text-red-800" },
    approved: {
      label: "อนุมัติแล้ว",
      className: "bg-green-100 text-green-800",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  return (
    <Badge variant="secondary" className={`${config.className} font-normal`}>
      {config.label}
    </Badge>
  );
};

export default function pending_table() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  // Filter data based on status
  const filteredData = approvalRequests.filter((request) => {
    if (statusFilter === "ทั้งหมด") return true;
    return request.status === statusFilter;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* ... Header และ Filters เหมือนเดิม */}

        <div className="w-full border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">ผู้ขออนุมัติ</TableHead>
                <TableHead>ประเภทคำขอ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เวลาที่ส่งคำขอ</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length > 0 ? (
                currentData.map((request) => (
                  <TableRow key={request.id} className="odd:bg-muted/50">
                    <TableCell className="pl-4">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">เปิดเมนู</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setOpenDialogId(request.id)}
                            className="text-green-600"
                          >
                            อนุมัติคำขอ
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            ปฏิเสธ
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>ดูรายละเอียด</DropdownMenuItem>
                          <DropdownMenuItem>ติดต่อผู้ขอ</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Render EditUserDialog นอก DropdownMenu */}
                      <EditUserDialog
                        title="อนุมัติคำขอ"
                        user={{
                          id: request.id,
                          name: request.name,
                          firstName: request.name.split(" ")[0],
                          lastName: request.name.split(" ").slice(1).join(" "),
                          avatarColor: "bg-blue-500",
                          initials: request.name.slice(0, 2).toUpperCase(),
                          email: request.phoneNumber,
                          role: "resident",
                          houseNumber: request.houseNumber,
                        }}
                        isOpen={openDialogId === request.id}
                        onClose={() => setOpenDialogId(null)}
                      />
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

        {/* ... Footer และ Pagination เหมือนเดิม */}
      </div>
    </div>
  );
}
