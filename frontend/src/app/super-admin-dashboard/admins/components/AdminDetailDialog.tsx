"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Building, 
  Users, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  UserCheck,
  X
} from "lucide-react";

interface Admin {
  admin_id: string;
  username: string;
  email: string;
  phone: string;
  role: "admin" | "staff";
  status: "verified" | "pending" | "disable";
  village_ids: string[];
  villages: Array<{
    village_id: string;
    village_name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Village {
  village_id: string;
  village_name: string;
  admin_count: number;
}

interface AdminDetailDialogProps {
  admin: Admin | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDetailDialog({
  admin,
  isOpen,
  onClose,
}: AdminDetailDialogProps) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin && isOpen) {
      fetchVillages();
    }
  }, [admin, isOpen]);

  const fetchVillages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/superadmin/villages", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVillages(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching villages:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!admin) return null;

  const getRoleDisplayName = (role: string) => {
    return role === "admin" ? "เจ้าของโครงการ" : "นิติ";
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "verified": return "ยืนยันแล้ว";
      case "pending": return "รอการยืนยัน";
      case "disable": return "ปิดใช้งาน";
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "verified": return "default" as const;
      case "pending": return "secondary" as const;
      case "disable": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "admin" ? "default" as const : "secondary" as const;
  };

  const getAdminVillages = () => {
    return villages.filter(village => 
      admin.village_ids.includes(village.village_id)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            รายละเอียด Admin: {admin.username}
          </DialogTitle>
          <DialogDescription>
            ข้อมูลและหมู่บ้านที่ Admin คนนี้มีสิทธิ์จัดการ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Admin Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                ข้อมูลพื้นฐาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">ชื่อผู้ใช้:</span>
                    <span>{admin.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">อีเมล:</span>
                    <span>{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">เบอร์โทรศัพท์:</span>
                    <span>{admin.phone}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">บทบาท:</span>
                    <Badge variant={getRoleBadgeVariant(admin.role)}>
                      {getRoleDisplayName(admin.role)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">สถานะ:</span>
                    <Badge variant={getStatusBadgeVariant(admin.status)}>
                      {getStatusDisplayName(admin.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">วันที่สร้าง:</span>
                    <span>{new Date(admin.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Villages Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                หมู่บ้านที่จัดการ ({admin.villages.length} หมู่บ้าน)
              </CardTitle>
              <CardDescription>
                รายการหมู่บ้านทั้งหมดที่ Admin คนนี้มีสิทธิ์จัดการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">กำลังโหลดข้อมูลหมู่บ้าน...</p>
                </div>
              ) : admin.villages.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">ยังไม่มีหมู่บ้านที่ assigned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Village Badges */}
                  <div className="flex flex-wrap gap-2">
                    {admin.villages.map((village) => (
                      <Badge key={village.village_id} variant="outline" className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {village.village_name}
                      </Badge>
                    ))}
                  </div>

                  {/* Village Details Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>หมู่บ้าน</TableHead>
                          <TableHead>Village Key</TableHead>
                          <TableHead>จำนวน Admin</TableHead>
                          <TableHead>สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getAdminVillages().map((village) => (
                          <TableRow key={village.village_id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {village.village_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {village.village_id}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {village.admin_count} คน
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                ใช้งานอยู่
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
