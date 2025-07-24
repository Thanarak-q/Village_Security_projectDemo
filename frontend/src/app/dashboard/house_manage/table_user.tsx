"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Users, Filter } from "lucide-react"
import EditUserDialog from "./popup_edituser"


// ข้อมูลผู้ใช้งาน
const userData = [
  {
    id: 1,
    initials: "สม",
    firstName: "สมชาย",
    lastName: "ใจดี",
    email: "somchai@gmail.com",
    houseNumber: "123/45",
    role: "ผู้อยู่อาศัย",
    roleColor: "bg-green-100 text-green-800",
    avatarColor: "bg-blue-500"
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
    avatarColor: "bg-pink-500"
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
    avatarColor: "bg-purple-500"
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
    avatarColor: "bg-yellow-500"
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
    avatarColor: "bg-red-500"
  }
]




export default function UserManagementTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ทั้งหมด")

  const filteredData = userData.filter(user => {
    const matchesSearch = user.firstName.includes(searchTerm) || 
                         user.lastName.includes(searchTerm) ||
                         user.email.includes(searchTerm)
    const matchesRole = roleFilter === "ทั้งหมด" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight text-gray-900 mb-6">
            การจัดการผู้ใช้งาน
          </h1>
          
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Users className="h-4 w-4" />
              เพิ่มผู้อยู่อาศัย
            </Button>
            
            <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md">
              <span>ผู้ใช้ที่รออนุมัติ (3)</span>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="ค้นหาผู้ใช้งาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">ตัวกรอง</span>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
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
                <TableHead className="w-16">แก้ไข</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${user.avatarColor}`}>
                        {user.initials}
                      </div>
                      <span className="font-medium">{user.firstName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{user.lastName}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell className="text-gray-600">{user.houseNumber}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${user.roleColor} font-normal`}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <EditUserDialog user={{
                              id: user.id,
                              name: user.firstName + " " + user.lastName,
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.email,
                              houseNumber: user.houseNumber,
                              role:  user.role,
                              initials: "hehehe",
                              avatarColor: user.avatarColor
                          }}  />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            แสดง <span className="font-medium">5</span> จากทั้งหมด 12 รายการ
          </div>
          
          <Pagination>
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
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}