"use client"

import { useState, useEffect } from "react"
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
import { Home, Filter, Plus, Loader2, ChevronLeft, ChevronRight, Edit } from "lucide-react"
import EditHouseDialog from "./popup_edithouse"

// ข้อมูลบ้านจาก API
interface HouseData {
  house_id: string
  address: string
  status: string
  village_key: string
}

export default function HouseManagementTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด")
  const [houses, setHouses] = useState<HouseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Fetch data from API
  const fetchHouses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/houses')
      const result = await response.json()
      
      if (result.success) {
        setHouses(result.data)
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error('Error fetching houses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHouses()
  }, [])

  // แปลงสถานะเป็นภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'ว่าง'
      case 'occupied':
        return 'มีผู้อยู่อาศัย'
      case 'disable':
        return 'ไม่ใช้งาน'
      default:
        return status
    }
  }

  // สีของสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gray-100 text-gray-800'
      case 'occupied':
        return 'bg-green-100 text-green-800'
      case 'disable':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // นับจำนวนบ้านตามสถานะ
  const getStatusCount = (status: string) => {
    return houses.filter(house => house.status === status).length
  }

  const filteredData = houses.filter(house => {
    const matchesSearch = house.address.includes(searchTerm) || 
                         house.village_key.includes(searchTerm)
    const matchesStatus = statusFilter === "ทั้งหมด" || 
                         getStatusText(house.status) === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate pagination data
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Reset to first page when changing search or filter
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // Function to go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Function to go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Function to change items per page
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            ลองใหม่
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight text-gray-900 mb-6">
            การจัดการบ้าน
          </h1>
          
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              เพิ่มบ้านใหม่
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-md">
                <span>มีผู้อยู่อาศัย ({getStatusCount('occupied')})</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded-md">
                <span>ว่าง ({getStatusCount('available')})</span>
              </div>
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-2 rounded-md">
                <span>ไม่ใช้งาน ({getStatusCount('disable')})</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="ค้นหาบ้านเลขที่หรือหมู่บ้าน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">ตัวกรอง</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                  <SelectItem value="มีผู้อยู่อาศัย">มีผู้อยู่อาศัย</SelectItem>
                  <SelectItem value="ว่าง">ว่าง</SelectItem>
                  <SelectItem value="ไม่ใช้งาน">ไม่ใช้งาน</SelectItem>
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
                <TableHead className="w-24">บ้านเลขที่</TableHead>
                <TableHead>หมู่บ้าน</TableHead>
                <TableHead className="w-32">สถานะ</TableHead>
                <TableHead className="w-32">รหัสบ้าน</TableHead>
                <TableHead className="w-16">แก้ไข</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentPageData().map((house) => (
                <TableRow key={house.house_id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Home className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">
                        {house.address === '-' ? 'ไม่ระบุ' : house.address}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {house.village_key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getStatusColor(house.status)} font-normal`}>
                      {getStatusText(house.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm font-mono">
                    {house.house_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <EditHouseDialog house={house} onUpdate={fetchHouses}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs sm:text-sm"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </EditHouseDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
    </div>
  )
} 