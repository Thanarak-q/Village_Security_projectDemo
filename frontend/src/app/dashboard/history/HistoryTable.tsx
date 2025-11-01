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
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Car,
  RefreshCw,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// API Response Interface

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
  license_image: string;
  license_plate: string;
  entry_time: string;
  exit_time?: string;
  is_in?: boolean;
  record_status: string;
  visit_purpose: string;
  createdAt: string;
  updatedAt: string;
  resident_name: string;
  resident_email: string;
  guard_name: string;
  guard_email: string;
  house_address: string;
  village_id: string;
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
  exit_time?: string;
  is_in?: boolean;
  record_status: string;
  visit_purpose: string;
  resident_name: string;
  resident_email: string;
  guard_name: string;
  guard_email: string;
  house_address: string;
  license_image: string;
}

interface AdminActivityLogApi {
  log_id: string;
  admin_username?: string;
  action_type: string;
  description: string;
  created_at: string;
}

interface AdminLogsResponse {
  success: boolean;
  data: AdminActivityLogApi[];
  error?: string;
}

// Interface for History data structure

// Main history table component
export default function HistoryTable() {
  // State for API data
  const [adminHistoryData, setAdminHistoryData] = useState<AdminHistory[]>([]);
  const [visitorHistoryData, setVisitorHistoryData] = useState<
    VisitorHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for managing selected tab (admin history or visitor history)
  const [activeTab, setActiveTab] = useState<"adminHistory" | "visitorHistory">(
    "adminHistory",
  );

  // State for search term
  const [searchTerm, setSearchTerm] = useState("");

  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Get saved itemsPerPage from localStorage, default to 5
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("historyTable_itemsPerPage");
      return saved ? parseInt(saved, 10) : 5;
    }
    return 5;
  });

  // State สำหรับการ refresh ข้อมูล
  const [refreshing, setRefreshing] = useState(false);

  // State สำหรับเก็บ role ของ user ที่ login
  const [userRole, setUserRole] = useState<string>("");

  // Fetch data from API
  const fetchHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get selected village key from sessionStorage
      const selectedVillageKey = sessionStorage.getItem("selectedVillage");

      // Fetch admin activity logs from API
      try {
        const adminLogsResponse = await fetch("/api/admin/activity-logs", {
          credentials: "include",
        });

        if (adminLogsResponse.ok) {
          const adminLogsData: AdminLogsResponse =
            await adminLogsResponse.json();

          if (adminLogsData.success) {
            // Transform API data to match our interface
            const transformedAdminHistory: AdminHistory[] =
              adminLogsData.data.map((log) => ({
                id: log.log_id,
                name: log.admin_username || "Unknown Admin",
                action: log.action_type,
                note: log.description,
                timestamp: log.created_at,
                user_role: "admin", // Default role since API doesn't provide this
                user_email: "", // API doesn't provide email in this endpoint
              }));

            setAdminHistoryData(transformedAdminHistory);
            console.log(
              `📊 Fetched ${transformedAdminHistory.length} admin activity logs`,
            );
          } else {
            console.error(
              "Failed to fetch admin activity logs:",
              adminLogsData.error,
            );
            setAdminHistoryData([]);
          }
        } else {
          console.error(
            "Admin activity logs API error:",
            adminLogsResponse.status,
          );
          setAdminHistoryData([]);
        }
      } catch (adminLogsError) {
        console.error("Error fetching admin activity logs:", adminLogsError);
        setAdminHistoryData([]);
      }

      // Fetch visitor records from API with village filtering
      let visitorUrl = "/api/visitor-records";
      if (selectedVillageKey) {
        visitorUrl = `/api/visitor-records/village/${selectedVillageKey}`;
      }

      const visitorResponse = await fetch(visitorUrl, {
        credentials: "include",
      });

      if (!visitorResponse.ok) {
        throw new Error(`HTTP error! status: ${visitorResponse.status}`);
      }

      const visitorData: VisitorRecordAPIResponse =
        await visitorResponse.json();

      if (visitorData.success) {
        // Transform API data to match our interface
        const transformedVisitorHistory: VisitorHistory[] =
          visitorData.data.map((record: VisitorRecordAPI) => ({
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
            license_image: record.license_image,
            exit_time: record.exit_time,
            is_in: record.is_in,
          }));

        setVisitorHistoryData(transformedVisitorHistory);
        console.log(
          `📊 Fetched ${transformedVisitorHistory.length} visitor records for village: ${selectedVillageKey || "all"}`,
        );
      } else {
        throw new Error("Failed to fetch visitor records");
      }

      // Admin history data is now set above from API
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.role || "");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchUserRole();
  }, []);

  // Listen for village changes and refresh data
  useEffect(() => {
    const handleVillageChange = () => {
      console.log("🔄 Village changed, refreshing history data...");
      fetchHistory(true);
    };

    // Listen for custom village change event
    window.addEventListener("villageChanged", handleVillageChange);

    return () => {
      window.removeEventListener("villageChanged", handleVillageChange);
    };
  }, []);

  // Function to generate avatar initials from license plate
  const getVisitorAvatarInitials = (licensePlate: string) => {
    if (!licensePlate || licensePlate.trim() === "") return "??";

    const trimmedPlate = licensePlate.trim();
    // Take first two characters from license plate
    return trimmedPlate.substring(0, 2).toUpperCase();
  };

  // Function to get avatar color based on license plate
  const getVisitorAvatarColor = (licensePlate: string) => {
    const colors = [
      "bg-green-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-cyan-500",
      "bg-lime-500",
      "bg-amber-500",
      "bg-emerald-500",
    ];

    if (!licensePlate) return colors[0];

    // Use first character of license plate to determine color
    const firstChar = licensePlate.charCodeAt(0);
    const index = firstChar % colors.length;
    return colors[index];
  };

  // Function to format date in Thai
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Function to translate action types to Thai
  const translateActionType = (actionType: string) => {
    const translations: { [key: string]: string } = {
      house_update: "แก้ไขข้อมูลบ้าน",
      house_create: "สร้างบ้านใหม่",
      house_delete: "ลบบ้าน",
      user_create: "สร้างผู้ใช้ใหม่",
      user_update: "แก้ไขข้อมูลผู้ใช้",
      user_delete: "ลบผู้ใช้",
      role_change: "เปลี่ยนบทบาทผู้ใช้",
      status_change: "เปลี่ยนสถานะผู้ใช้",
      village_update: "แก้ไขข้อมูลหมู่บ้าน",
      village_create: "สร้างหมู่บ้านใหม่",
      staff_create: "สร้างนิติบุคคลใหม่",
      staff_update: "แก้ไขข้อมูลนิติบุคคล",
      staff_delete: "ลบนิติบุคคล",
      login: "เข้าสู่ระบบ",
      logout: "ออกจากระบบ",
    };

    return translations[actionType] || actionType;
  };

  // Function to translate description text to Thai
  const translateDescription = (description: string) => {
    if (!description) return description;

    return description
      .replace(/available/g, "ว่าง")
      .replace(/occupied/g, "มีผู้อยู่อาศัย")
      .replace(/disable/g, "ไม่ใช้งาน")
      .replace(/pending/g, "รอดำเนินการ")
      .replace(/approved/g, "อนุมัติแล้ว")
      .replace(/rejected/g, "ปฏิเสธ")
      .replace(/verified/g, "ยืนยันแล้ว")
      .replace(/resident/g, "ลูกบ้าน")
      .replace(/guard/g, "ยาม")
      .replace(/admin/g, "ผู้ดูแลระบบ");
  };

  // Filter admin history by search term - focus on admin name
  const filteredAdminHistory = adminHistoryData.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      item.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false,
  );

  // Filter visitor history by search term and status - focus on license plate
  const filteredVisitorHistory = visitorHistoryData.filter((item) => {
    // Search filter - focus on license plate only
    const matchesSearch =
      item.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && item.record_status === "pending") ||
      (statusFilter === "approved" && item.record_status === "approved") ||
      (statusFilter === "rejected" && item.record_status === "rejected");

    return matchesSearch && matchesStatus;
  });

  // Function to get current page admin history
  const getCurrentAdminHistory = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAdminHistory.slice(startIndex, endIndex).map((item) => ({
      ...item,
      type: "admin",
      status: "completed",
    }));
  };

  // Function to get current page visitor history
  const getCurrentVisitorHistory = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVisitorHistory.slice(startIndex, endIndex).map((item) => ({
      ...item,
      type: "visitor",
      status: item.record_status,
    }));
  };

  // Calculate pagination data
  const totalItems =
    activeTab === "adminHistory"
      ? filteredAdminHistory.length
      : filteredVisitorHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when changing tab, search, or status filter
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, statusFilter]);

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
      localStorage.setItem("historyTable_itemsPerPage", newValue.toString());
    }
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
          <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>
          <button
            onClick={() => fetchHistory()}
            className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
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
      <div className="bg-background rounded-lg shadow-sm border border-border p-4 sm:p-6">
        {/* Header with tabs and search */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
          {/* History type tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            {/* Admin History tab */}
            <button
              onClick={() => setActiveTab("adminHistory")}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === "adminHistory"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>
                {userRole === "staff" ? "ประวัตินิติบุคคล" : "ประวัติผู้ดูแล"} (
                {adminHistoryData.length})
              </span>
            </button>

            {/* Visitor History tab */}
            <button
              onClick={() => setActiveTab("visitorHistory")}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === "visitorHistory"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Car className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>ประวัติผู้เยี่ยม ({visitorHistoryData.length})</span>
            </button>
          </div>

          {/* Search box, status filter and refresh indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={
                  activeTab === "adminHistory"
                    ? "ค้นหาจากชื่อผู้ดูแล..."
                    : "ค้นหาจากทะเบียนรถ..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent w-full text-sm"
              />
            </div>

            {/* Status filter - only show for visitor history tab */}
            {activeTab === "visitorHistory" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 sm:w-36 text-sm">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Refresh button and indicator */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHistory(true)}
                disabled={refreshing}
                className="flex items-center gap-1 text-sm"
              >
                <RefreshCw
                  className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">รีเฟรช</span>
              </Button>

              {refreshing && (
                <div className="flex items-center gap-1 text-blue-600 text-sm">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="hidden sm:inline">...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin History table */}
        {activeTab === "adminHistory" && (
          <div className="overflow-x-auto">
            <Table>
              {/* Admin History table header */}
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="text-muted-foreground font-semibold text-sm min-w-[200px] py-4 px-6">
                    ผู้ดำเนินการ
                  </TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-sm hidden sm:table-cell min-w-[150px] py-4 px-6">
                    การดำเนินการ
                  </TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-sm hidden md:table-cell min-w-[120px] py-4 px-6">
                    หมายเหตุ
                  </TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-sm hidden lg:table-cell min-w-[140px] py-4 px-6">
                    วันที่ดำเนินการ
                  </TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-sm min-w-[80px] py-4 px-6">
                    สถานะ
                  </TableHead>
                </TableRow>
              </TableHeader>

              {/* Admin History table body */}
              <TableBody>
                {getCurrentAdminHistory().length === 0 ? (
                  <TableRow></TableRow>
                ) : (
                  getCurrentAdminHistory().map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors border-b border-border/50"
                    >
                      {/* User column - Staff icon and name */}
                      <TableCell className="min-w-[200px] py-4 px-6">
                        <div className="flex items-center space-x-3">
                          {/* Staff icon */}
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-blue-500 text-white flex-shrink-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          {/* Name and email */}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground text-base truncate">
                              {item.name}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {item.user_email}
                            </div>
                            {/* Show action on mobile */}
                            <div className="sm:hidden text-xs text-muted-foreground mt-1 space-y-1">
                              <div className="truncate">
                                {translateActionType(item.action)}
                              </div>
                              <div className="truncate">
                                {translateDescription(item.note)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Action column */}
                      <TableCell className="hidden sm:table-cell min-w-[150px]">
                        <div className="space-y-1">
                          <div className="text-sm text-foreground truncate">
                            {translateActionType(item.action)}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {translateDescription(item.note)}
                          </div>
                        </div>
                      </TableCell>

                      {/* Note column */}
                      <TableCell className="text-gray-700 hidden md:table-cell text-sm min-w-[120px]">
                        <div className="truncate">
                          {translateDescription(item.note)}
                        </div>
                      </TableCell>

                      {/* Timestamp column */}
                      <TableCell className="text-muted-foreground hidden lg:table-cell text-sm min-w-[140px]">
                        {formatDate(item.timestamp)}
                      </TableCell>

                      {/* Status column */}
                      <TableCell className="min-w-[80px]">
                        <Badge
                          variant="default"
                          className="text-xs sm:text-sm bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          เสร็จสิ้น
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Visitor History table */}
        {activeTab === "visitorHistory" && (
          <div className="overflow-x-auto">
            <Table>
              {/* Visitor History table header */}
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm min-w-[200px]">
                    ข้อมูลผู้เข้าเยี่ยม
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm hidden sm:table-cell min-w-[120px]">
                    วัตถุประสงค์
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm hidden md:table-cell min-w-[150px]">
                    บ้านที่เยี่ยม
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm hidden lg:table-cell min-w-[140px]">
                    เวลาที่เข้า
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm hidden lg:table-cell min-w-[140px]">
                    เวลาที่ออก
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm min-w-[80px]">
                    สถานะ
                  </TableHead>
                </TableRow>
              </TableHeader>

              {/* Visitor History table body */}
              <TableBody>
                {getCurrentVisitorHistory().map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted">
                    {/* Visitor info column - Avatar and license plate */}
                    <TableCell className="min-w-[200px]">
                      <div className="flex items-center space-x-3">
                        {/* Avatar with license plate initials */}
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                          <AvatarFallback
                            className={`${getVisitorAvatarColor(item.license_plate || "")} text-white font-semibold text-sm`}
                          >
                            {getVisitorAvatarInitials(item.license_plate || "")}
                          </AvatarFallback>
                        </Avatar>
                        {/* License plate and purpose info */}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground text-sm sm:text-base truncate">
                            {item.license_plate || "ไม่ระบุ"}
                          </div>
                          {/* Show purpose on mobile */}
                          <div className="sm:hidden text-xs text-muted-foreground mt-1">
                            <div className="truncate">
                              {item.visit_purpose || "ไม่ระบุ"}
                            </div>
                            <div className="truncate">
                              บ้าน: {item.house_address || "ไม่ระบุ"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Purpose column */}
                    <TableCell className="hidden sm:table-cell min-w-[120px]">
                      <div className="text-sm text-foreground truncate">
                        {item.visit_purpose || "ไม่ระบุ"}
                      </div>
                    </TableCell>

                    {/* House address column */}
                    <TableCell className="text-gray-700 hidden md:table-cell text-sm min-w-[150px]">
                      <div className="truncate">
                        {item.house_address || "ไม่ระบุ"}
                      </div>
                    </TableCell>

                    {/* Entry time column */}
                    <TableCell className="text-muted-foreground hidden lg:table-cell text-sm min-w-[140px]">
                      {formatDate(item.entry_time)}
                    </TableCell>

                    {/* Exit time column */}
                    <TableCell className="text-muted-foreground hidden lg:table-cell text-sm min-w-[140px]">
                      {item.exit_time ? formatDate(item.exit_time) : "-"}
                    </TableCell>

                    {/* Status column */}
                    <TableCell className="min-w-[80px]">
                      <Badge
                        variant={
                          item.status === "completed" ? "default" : "secondary"
                        }
                        className={`text-xs sm:text-sm ${
                          item.status === "completed"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : item.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : item.status === "pending"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : item.status === "approved"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : item.status === "rejected"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {item.status === "completed"
                          ? "เสร็จสิ้น"
                          : item.status === "in_progress"
                            ? "กำลังดำเนินการ"
                            : item.status === "pending"
                              ? "รอดำเนินการ"
                              : item.status === "approved"
                                ? "อนุมัติแล้ว"
                                : item.status === "rejected"
                                  ? "ปฏิเสธ"
                                  : item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* No data message */}
        {((activeTab === "adminHistory" && filteredAdminHistory.length === 0) ||
          (activeTab === "visitorHistory" &&
            filteredVisitorHistory.length === 0)) && (
          <div className="p-8 sm:p-12 text-center">
            <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              ไม่พบข้อมูลประวัติ
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {searchTerm
                ? "ลองค้นหาด้วยคำอื่น"
                : "ยังไม่มีข้อมูลประวัติในหมวดหมู่นี้"}
            </p>
          </div>
        )}

        {/* Pagination controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 lg:px-6 py-4 border-t bg-muted gap-4">
            {/* Left section - Items per page and pagination info */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Items per page selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  แสดง
                </span>
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
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-muted-foreground hover:bg-gray-100"
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
