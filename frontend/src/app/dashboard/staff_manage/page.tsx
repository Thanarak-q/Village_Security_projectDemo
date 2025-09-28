"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { StaffTable } from "./StaffTable";
import { AddStaffDialog } from "./AddStaffDialog";
// import { toast } from "sonner";
import { gsap } from "gsap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



interface StaffMember {
  admin_id: string;
  username: string;
  email: string | null;
  phone: string | null;
  status: "verified" | "pending" | "disable";
  role: string;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
  village_key: string;
  village_name: string;
}

export default function StaffManagePage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVillageKey, setSelectedVillageKey] = useState<string>("");
  const [villageName, setVillageName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Get saved itemsPerPage from localStorage, default to 5
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('staffTable_itemsPerPage');
      return saved ? parseInt(saved, 10) : 5;
    }
    return 5;
  });
  const [refreshing, setRefreshing] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchStaffMembers = useCallback(async (villageKey: string, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch(`/api/staff/staff?village_key=${villageKey}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          setStaffMembers(data.data);
          setVillageName(data.village_name);
        } else {
          // toast.error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
      } else {
        // toast.error(data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    } catch (error) {
      console.error("Error fetching staff members:", error);
      // toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // GSAP smooth scroll-up animation - matching other sidebar pages
  useEffect(() => {
    // Only animate when loading is complete and we have user role
    if (loading || !userRole || userRole === "staff" || !selectedVillageKey) return;

    const cardElement = cardRef.current;
    
    // Only animate if element exists
    if (!cardElement) return;
    
    // Set initial state
    gsap.set(cardElement, {
      opacity: 0,
      y: 50
    });

    // Animate entrance
    gsap.to(cardElement, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: "power2.inOut",
      delay: 0.2
    });

    return () => {
      try {
        gsap.killTweensOf(cardElement);
      } catch (error) {
        console.warn('GSAP cleanup error:', error);
      }
    };
  }, [loading, userRole, selectedVillageKey]); // Dependencies are stable now

  useEffect(() => {
    // Check user role first
    const checkUserRole = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const json = await res.json();
          setUserRole(json.role);

          // Redirect staff users away from this page
          if (json.role === "staff") {
            // toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
            window.location.href = "/dashboard";
            return;
          }

          // Get selected village from session storage for admin/superadmin
          const villageKey = sessionStorage.getItem("selectedVillage");
          if (villageKey) {
            setSelectedVillageKey(villageKey);
            fetchStaffMembers(villageKey);
          } else {
            // toast.error("กรุณาเลือกหมู่บ้านก่อน");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        // toast.error("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
        setLoading(false);
      }
    };

    checkUserRole();
  }, [fetchStaffMembers]);

  const handleStaffAdded = (newStaff: StaffMember) => {
    setStaffMembers(prev => [newStaff, ...prev]);
    // toast.success("เพิ่มนิติบุคคลสำเร็จ");
  };

  // Filter staff members based on search term
  const filteredStaffMembers = staffMembers.filter(staff => {
    const searchLower = searchTerm.toLowerCase();
    return (
      staff.username.toLowerCase().includes(searchLower) ||
      staff.admin_id.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination data
  const totalItems = filteredStaffMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items
  const getCurrentStaff = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStaffMembers.slice(startIndex, endIndex);
  };

  // Reset to first page when changing search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('staffTable_itemsPerPage', newValue.toString());
    }
  };

  const handleStaffUpdated = (updatedStaff: StaffMember) => {
    setStaffMembers(prev =>
      prev.map(staff =>
        staff.admin_id === updatedStaff.admin_id ? updatedStaff : staff
      )
    );
    // toast.success("อัปเดตข้อมูลนิติบุคคลสำเร็จ");
  };

  const handleStaffDeleted = (adminId: string) => {
    setStaffMembers(prev => prev.filter(staff => staff.admin_id !== adminId));
    // toast.success("ลบนิติบุคคลสำเร็จ");
  };

  if (loading || !userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show access denied for staff users
  if (userRole === "staff") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">ไม่มีสิทธิ์เข้าถึง</CardTitle>
            <CardDescription>
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => window.location.href = "/dashboard"}
              className="w-full"
            >
              กลับไปหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedVillageKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">เกิดข้อผิดพลาด</CardTitle>
            <CardDescription>
              กรุณาเลือกหมู่บ้านก่อนใช้งาน
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => window.location.href = "/admin-village-selection"}
              className="w-full"
            >
              ไปเลือกหมู่บ้าน
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={cardRef}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Card>
            <CardHeader>
              
            </CardHeader>
            <CardContent className="space-y-6">
                  {/* Add Staff Button and Search Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Add Staff Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <AddStaffDialog
                        villageKey={selectedVillageKey}
                        villageName={villageName}
                        onStaffAdded={handleStaffAdded}
                        onRefresh={() => fetchStaffMembers(selectedVillageKey, true)}
                      />
                    </div>
                    
                    {/* Search box and refresh indicator */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="ค้นหานิติบุคคล..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent w-full sm:w-64 text-sm"
                        />
                      </div>
                      
                      {/* Refresh indicator */}
                      {refreshing && (
                        <div className="flex items-center gap-1 text-primary text-sm">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                          <span>กำลังอัปเดต...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Staff table */}
                  <StaffTable
                    staffMembers={getCurrentStaff()}
                    onStaffUpdated={handleStaffUpdated}
                    onStaffDeleted={handleStaffDeleted}
                    loading={loading}
                  />

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                      {/* Items per page selector */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>แสดง</span>
                        <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <span>รายการต่อหน้า</span>
                      </div>

                      {/* Page info and navigation */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          หน้า {currentPage} จาก {totalPages} ({totalItems} รายการ)
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}