"use client";

import { useState, useEffect, useCallback } from "react";
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
  Home,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
} from "lucide-react";
import EditHouseDialog from "./popup_edithouse";
import AddHouseDialog from "./popup_addhouse";
import { getSelectedVillage } from "@/lib/villageSelection";

// ข้อมูลบ้านจาก API
interface HouseData {
  house_id: string;
  address: string;
  status: string;
  village_id?: string | null;
}

export default function HouseManagementTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [houses, setHouses] = useState<HouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedVillageKey, setSelectedVillageKey] = useState<string | null>(null);
  const [selectedVillageName, setSelectedVillageName] = useState<string>("");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Get saved itemsPerPage from localStorage, default to 5
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("houseTable_itemsPerPage");
      return saved ? parseInt(saved, 10) : 5;
    }
    return 5;
  });

  // State สำหรับการ refresh ข้อมูล
  const [refreshing, setRefreshing] = useState(false);

  const fetchVillageName = useCallback((villageId: string) => {
    fetch(`/api/villages/check/${villageId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((villageData) => {
        if (villageData.exists && villageData.village_name) {
          setSelectedVillageName(villageData.village_name);
          sessionStorage.setItem("selectedVillageName", villageData.village_name);
        }
      })
      .catch((err) => {
        console.error("Error fetching village name:", err);
      });
  }, []);

  // Get selected village info from sessionStorage on mount
  useEffect(() => {
    const { id, name } = getSelectedVillage();

    if (id) {
      setSelectedVillageId(id);
    }

    if (name) {
      setSelectedVillageName(name);
    }

    if (id && !name) {
      fetchVillageName(id);
    }

    if (id) {
      return;
    }

    // If no village is selected yet, fallback to the first accessible village from user data
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((userData) => {
        const fallbackId: string | undefined = userData?.village_ids?.[0];
        const fallbackKey: string | undefined = userData?.village_keys?.[0];

        if (fallbackId) {
          setSelectedVillageId(fallbackId);
          sessionStorage.setItem("selectedVillageId", fallbackId);
        }

        if (fallbackKey) {
          setSelectedVillageKey(fallbackKey);
          sessionStorage.setItem("selectedVillage", fallbackKey);
          sessionStorage.setItem("selectedVillageKey", fallbackKey);
          if (!name) {
            fetchVillageName(fallbackKey);
          }
        }

        if (!fallbackId && !fallbackKey) {
          setError("กรุณาเลือกหมู่บ้านก่อน - ไปที่เมนู 'เปลี่ยนหมู่บ้าน' เพื่อเลือกหมู่บ้าน");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching user data:", err);
        setError("กรุณาเลือกหมู่บ้านก่อน - ไปที่เมนู 'เปลี่ยนหมู่บ้าน' เพื่อเลือกหมู่บ้าน");
        setLoading(false);
      });
  }, [fetchVillageName]);

  // Fetch data from API with village identifier parameter
  const fetchHouses = useCallback(async (isRefresh = false) => {
    const activeVillageId = selectedVillageId;
    const activeVillageKey = selectedVillageKey;
    const queryValue = activeVillageId ?? activeVillageKey;

    if (!queryValue) {
      setError("กรุณาเลือกหมู่บ้านก่อน");
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const queryParam = "village_id";
      const response = await fetch(`/api/houses?${queryParam}=${encodeURIComponent(queryValue)}`, {
        credentials: "include",
      });
      const result = await response.json();

      if (result.success) {
        setHouses(result.data);
        setError(null);

        if (result.village_id) {
          setSelectedVillageId(result.village_id);
          sessionStorage.setItem("selectedVillageId", result.village_id);
        }

        if (result.village_id) {
          setSelectedVillageKey(result.village_id);
          sessionStorage.setItem("selectedVillage", result.village_id);
          sessionStorage.setItem("selectedVillageKey", result.village_id);
        }

        // Use village_name from API response if available
        if (result.village_name && result.village_name.trim() !== "") {
          setSelectedVillageName(result.village_name);
          sessionStorage.setItem("selectedVillageName", result.village_name);
        } else if (!selectedVillageName) {
          // Fallback to fetching village name if not provided in response
          fetchVillageName(result.village_id);
        }
      } else {
        setError(result.error || "ไม่สามารถโหลดข้อมูลได้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      console.error("Error fetching houses:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchVillageName, selectedVillageId, selectedVillageKey, selectedVillageName]);

  useEffect(() => {
    if (selectedVillageId || selectedVillageKey) {
      fetchHouses();
    }
  }, [fetchHouses, selectedVillageId, selectedVillageKey]);

  // Listen for village changes from village selection page
  useEffect(() => {
    const handleVillageChange = (event: CustomEvent) => {
      const { villageId, villageName } = event.detail as {
        villageId?: string;
        villageName?: string;
      };

      setSelectedVillageId(villageId ?? null);

      if (villageName) {
        setSelectedVillageName(villageName);
        sessionStorage.setItem("selectedVillageName", villageName);
      } else if (villageId) {
        fetchVillageName(villageId);
      }
    };

    window.addEventListener('villageChanged', handleVillageChange as EventListener);
    
    return () => {
      window.removeEventListener('villageChanged', handleVillageChange as EventListener);
    };
  }, [fetchVillageName]);

  // แปลงสถานะเป็นภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "ว่าง";
      case "occupied":
        return "มีผู้อยู่อาศัย";
      case "disable":
        return "ไม่ใช้งาน";
      default:
        return status;
    }
  };

  // สีของสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-muted text-muted-foreground";
      case "occupied":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "disable":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // นับจำนวนบ้านตามสถานะ
  const getStatusCount = (status: string) => {
    return houses.filter((house) => house.status === status).length;
  };

  const filteredData = houses.filter((house) => {
    const houseVillageId = house.village_id ?? selectedVillageKey ?? "";
    const matchesSearch =
      house.address.includes(searchTerm) ||
      houseVillageId.includes(searchTerm);
    const matchesStatus =
      statusFilter === "ทั้งหมด" ||
      getStatusText(house.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination data
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when changing search or filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("houseTable_itemsPerPage", newValue.toString());
    }
  };

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
          <p className="text-red-600 mb-4">{error}</p>
          {error.includes("เลือกหมู่บ้าน") ? (
            <button 
              onClick={() => window.location.href = "/admin-village-selection"} 
              className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              ไปเลือกหมู่บ้าน
            </button>
          ) : (
            <button 
              onClick={() => fetchHouses()} 
              className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              ลองใหม่
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main table section */}
      <div className="bg-background rounded-lg shadow-sm border border-border p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          {/* Village Info */}
          

          {/* Top Actions */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
            <AddHouseDialog onAdd={() => fetchHouses(true)} />

            <div className="flex flex-wrap items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-3 py-2 rounded-md text-sm">
                <span>มีผู้อยู่อาศัย ({getStatusCount("occupied")})</span>
              </div>
              <div className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-2 rounded-md text-sm">
                <span>ว่าง ({getStatusCount("available")})</span>
              </div>
              <div className="flex items-center gap-2 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-md text-sm">
                <span>ไม่ใช้งาน ({getStatusCount("disable")})</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                placeholder="ค้นหาบ้านเลขที่หรือหมู่บ้าน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground hidden sm:inline">ตัวกรอง</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
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

            {/* Refresh indicator */}
            {refreshing && (
              <div className="flex items-center gap-1 text-primary text-sm w-full sm:w-auto justify-center sm:justify-start">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                <span>กำลังอัปเดต...</span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="w-24 min-w-[120px] py-4 px-6 text-muted-foreground font-semibold text-sm">บ้านเลขที่</TableHead>
                  <TableHead className="min-w-[150px] py-4 px-6 text-muted-foreground font-semibold text-sm">หมู่บ้าน</TableHead>
                  <TableHead className="w-32 min-w-[120px] py-4 px-6 text-muted-foreground font-semibold text-sm">สถานะ</TableHead>
                  <TableHead className="w-32 min-w-[120px] py-4 px-6 text-muted-foreground font-semibold text-sm">รหัสบ้าน</TableHead>
                  <TableHead className="w-16 min-w-[80px] py-4 px-6 text-muted-foreground font-semibold text-sm">แก้ไข</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentPageData().map((house) => {
                  const normalizedHouse: HouseData = {
                    ...house,
                    village_id: house.village_id ?? selectedVillageId ?? null,
                  };

                  const houseVillageId = normalizedHouse.village_id ?? selectedVillageId ?? "";
                  const villageLabel = (selectedVillageName && selectedVillageName.trim() !== "") 
                    ? selectedVillageName
                    : (houseVillageId && houseVillageId.trim() !== ""
                      ? houseVillageId
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "ไม่ระบุ");

                  return (
                    <TableRow key={house.house_id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                    <TableCell className="min-w-[120px] py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <span className="font-semibold text-sm sm:text-base truncate text-foreground">
                          {!house.address || house.address === "-" || house.address.trim() === "" ? "ไม่ระบุ" : house.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground min-w-[150px] text-sm sm:text-base py-4 px-6">
                      {villageLabel}
                    </TableCell>
                    <TableCell className="min-w-[120px] py-4 px-6">
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(house.status)} font-medium text-xs sm:text-sm px-3 py-1`}
                      >
                        {getStatusText(house.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs sm:text-sm font-mono min-w-[120px] py-4 px-6">
                      {house.house_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="min-w-[80px]">
                      <EditHouseDialog
                        house={normalizedHouse}
                        onUpdate={() => fetchHouses(true)}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 hover:bg-primary/10 text-xs sm:text-sm w-full sm:w-auto"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </EditHouseDialog>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        </div>

        {/* Pagination controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 lg:px-6 py-4 border-t bg-muted gap-4">
            {/* Left section - Items per page and pagination info */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Items per page selector */}
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
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    รายการต่อหน้า
                  </span>
                </div>

                {/* Pagination info */}
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} จาก{" "}
                  {totalItems} รายการ
                </div>
              </div>

              {/* Right section - Navigation buttons */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
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
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                          currentPage === pageNum
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
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
