"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
]

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

export default function PendingTableDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          ดูทั้งหมด
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[1500px] !max-w-[95vw] !w-[95vw] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            รอการอนุมัติให้เข้าอยู่หมู่บ้าน
          </DialogTitle>
          <DialogDescription>
            รายชื่อผู้ที่รอการอนุมัติจากผู้จัดการหมู่บ้าน
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto">
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
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
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
      </DialogContent>
    </Dialog>
  )
}

// Component สำหรับแสดงสรุปข้อมูลสั้นๆ ในหน้าหลัก
export function PendingTableSummary() {
  // แสดงแค่ 3 รายการแรก
  const summaryRequests = approvalRequests.slice(0, 3)
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            รอการอนุมัติ
          </h2>
          <p className="text-sm text-gray-600">
            มี {approvalRequests.length} คำขอรอดำเนินการ
          </p>
        </div>
        <PendingTableDialog />
      </div>

      {/* Summary Table */}
      <div className="space-y-3">
        {summaryRequests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={request.avatar} />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                  {request.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{request.name}</div>
                <div className="text-xs text-gray-500">{request.requestType}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(request.status)}
              <span className="text-xs text-gray-500">{request.submittedTime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}