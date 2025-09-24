"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Eye } from "lucide-react";
import { AddStaffForm } from "./AddStaffForm";
import { StaffTable } from "./StaffTable";
import { toast } from "sonner";

interface StaffMember {
  admin_id: string;
  username: string;
  email: string;
  phone: string;
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

  useEffect(() => {
    // Get selected village from session storage
    const villageKey = sessionStorage.getItem("selectedVillage");
    if (villageKey) {
      setSelectedVillageKey(villageKey);
      fetchStaffMembers(villageKey);
    } else {
      toast.error("กรุณาเลือกหมู่บ้านก่อน");
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        

        {/* Main Content */}
        <Tabs defaultValue="view" className="space-y-6">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  รายการนิติบุคคลทั้งหมด
                </CardTitle>
                <CardDescription>
                  จัดการข้อมูลนิติบุคคลในหมู่บ้าน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffTable
                  staffMembers={staffMembers}
                  onStaffUpdated={handleStaffUpdated}
                  onStaffDeleted={handleStaffDeleted}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  เพิ่มนิติบุคคลใหม่
                </CardTitle>
                <CardDescription>
                  เพิ่มนิติบุคคลใหม่เข้าสู่ระบบ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddStaffForm
                  villageKey={selectedVillageKey}
                  villageName={villageName}
                  onStaffAdded={handleStaffAdded}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}