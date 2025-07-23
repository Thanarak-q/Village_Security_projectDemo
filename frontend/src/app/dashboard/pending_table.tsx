"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const approvalRequests = [
  {
    id: 1,
    name: "นายสมชาย ใจดี",
    avatar: "/avatar1.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "123/45",
    status: "pending",
    submittedTime: "15 นาทีที่แล้ว",
    phoneNumber: "081-234-5678"
  },
  {
    id: 2,
    name: "นางมาลี สุขใส",
    avatar: "/avatar2.jpg", 
    requestType: "ขอย้ายที่อยู่",
    houseNumber: "246/12",
    status: "review",
    submittedTime: "45 นาทีที่แล้ว",
    phoneNumber: "082-345-6789"
  },
  {
    id: 3,
    name: "นายวิชัย รักดี",
    avatar: "/avatar3.jpg",
    requestType: "ขอเปลี่ยนข้อมูลส่วนตัว",
    houseNumber: "78/9",
    status: "pending", 
    submittedTime: "2 ชั่วโมงที่แล้ว",
    phoneNumber: "083-456-7890"
  },
  {
    id: 4,
    name: "นางสาวสุดา ใจกว้าง",
    avatar: "/avatar4.jpg",
    requestType: "ขอเข้าพักใหม่",
    houseNumber: "159/33",
    status: "urgent",
    submittedTime: "5 ชั่วโมงที่แล้ว",
    phoneNumber: "084-567-8901"
  },
  {
    id: 5,
    name: "นายประยุทธ สมหวัง",
    avatar: "/avatar5.jpg",
    requestType: "ขอย้ายออก",
    houseNumber: "95/7",
    status: "review",
    submittedTime: "1 วันที่แล้ว",
    phoneNumber: "085-678-9012"
  }
];

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-800" },
    review: { label: "กำลังตรวจสอบ", className: "bg-blue-100 text-blue-800" },
    urgent: { label: "ด่วน", className: "bg-red-100 text-red-800" },
    approved: { label: "อนุมัติแล้ว", className: "bg-green-100 text-green-800" }
  }
  
  const config = statusConfig[status as keyof typeof statusConfig]
  return (
    <Badge variant="secondary" className={`${config.className} font-normal`}>
      {config.label}
    </Badge>
  )
}

export default function pending_table() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight text-gray-900">
              รอการอนุมัติให้เข้าอยู่หมู่บ้าน
            </h1>
            <p className="text-gray-600 mt-1">รายชื่อผู้ที่รอการอนุมัติจากผู้จัดการหมู่บ้าน</p>
          </div>
          <Button className="flex items-center gap-2">
            ดูทั้งหมด
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Table */}
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
                {approvalRequests.map((request) => (
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
                          <div className="font-medium text-gray-900">{request.name}</div>
                          <div className="text-sm text-gray-500">{request.phoneNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{request.requestType}</div>
                        <div className="text-sm text-gray-500">บ้านเลขที่ {request.houseNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
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
                          <DropdownMenuItem className="text-green-600">
                            อนุมัติ
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            ปฏิเสธ
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>ดูรายละเอียด</DropdownMenuItem>
                          <DropdownMenuItem>ติดต่อผู้ขอ</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}