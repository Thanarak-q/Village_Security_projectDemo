"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Eye } from "lucide-react";
import { AddStaffForm } from "./AddStaffForm";
import { StaffTable } from "./StaffTable";
import { toast } from "sonner";
import { gsap } from "gsap";



interface StaffMember {
  admin_id: string;
  username: string;
  email?: string;
  phone?: string;
  status: "verified" | "pending" | "disable";
  role: string;
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
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Enhanced GSAP smooth scroll-up animations
  useEffect(() => {
    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      const cardElement = cardRef.current;
      const headerElement = headerRef.current;
      const tabsElement = tabsRef.current;

      // Only animate if elements exist and are valid
      if (cardElement && headerElement && tabsElement) {
        // Set initial state for all elements
        gsap.set([cardElement, headerElement, tabsElement], {
          opacity: 0,
          y: 30
        });

        // Create timeline for staggered animation
        const tl = gsap.timeline();

        tl.to(cardElement, {
          duration: 0.6,
          opacity: 1,
          y: 0,
          ease: "power2.out"
        })
          .to(headerElement, {
            duration: 0.5,
            opacity: 1,
            y: 0,
            ease: "power2.out"
          }, "-=0.3")
          .to(tabsElement, {
            duration: 0.5,
            opacity: 1,
            y: 0,
            ease: "power2.out"
          }, "-=0.2");
      }
    }, 100); // Increased delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      // Kill any existing animations safely
      try {
        if (cardRef.current) gsap.killTweensOf(cardRef.current);
        if (headerRef.current) gsap.killTweensOf(headerRef.current);
        if (tabsRef.current) gsap.killTweensOf(tabsRef.current);
      } catch (error) {
        console.warn('GSAP cleanup error:', error);
      }
    };
  }, []);

  // 

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
            toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
            window.location.href = "/dashboard";
            return;
          }

          // Get selected village from session storage for admin/superadmin
          const villageKey = sessionStorage.getItem("selectedVillage");
          if (villageKey) {
            setSelectedVillageKey(villageKey);
            fetchStaffMembers(villageKey);
          } else {
            toast.error("กรุณาเลือกหมู่บ้านก่อน");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        toast.error("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const fetchStaffMembers = async (villageKey: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/staff?village_key=${villageKey}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStaffMembers(data.data);
          setVillageName(data.village_name);
        } else {
          toast.error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
      } else {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    } catch (error) {
      console.error("Error fetching staff members:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleStaffAdded = (newStaff: StaffMember) => {
    setStaffMembers(prev => [newStaff, ...prev]);
    toast.success("เพิ่มนิติบุคคลสำเร็จ");
  };

  const handleStaffUpdated = (updatedStaff: StaffMember) => {
    setStaffMembers(prev =>
      prev.map(staff =>
        staff.admin_id === updatedStaff.admin_id ? updatedStaff : staff
      )
    );
    toast.success("อัปเดตข้อมูลนิติบุคคลสำเร็จ");
  };

  const handleStaffDeleted = (adminId: string) => {
    setStaffMembers(prev => prev.filter(staff => staff.admin_id !== adminId));
    toast.success("ลบนิติบุคคลสำเร็จ");
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
            <CardHeader ref={headerRef}>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                จัดการนิติบุคคล
              </CardTitle>
              <CardDescription>
                จัดการข้อมูลนิติบุคคลในหมู่บ้าน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="view" className="space-y-6" ref={tabsRef}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="view" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    ดูนิติบุคคลทั้งหมด
                  </TabsTrigger>
                  <TabsTrigger value="add" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    เพิ่มนิติบุคคล
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="space-y-4">
                  <StaffTable
                    staffMembers={staffMembers}
                    onStaffUpdated={handleStaffUpdated}
                    onStaffDeleted={handleStaffDeleted}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="add" className="space-y-4">
                  <AddStaffForm
                    villageKey={selectedVillageKey}
                    villageName={villageName}
                    onStaffAdded={handleStaffAdded}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}