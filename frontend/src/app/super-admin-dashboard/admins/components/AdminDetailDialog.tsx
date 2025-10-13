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
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  X,
  MapPin,
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
  address?: string | null;
  admins?: Array<{
    admin_id: string;
    username: string;
  }>;
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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] p-0 overflow-hidden rounded-lg md:rounded-xl">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-6 sm:px-8 border-b bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <User className="h-7 w-7" />
                รายละเอียด Admin: {admin.username}
              </DialogTitle>
              <DialogDescription className="text-lg mt-2">
                ข้อมูลและหมู่บ้านที่ Admin คนนี้มีสิทธิ์จัดการ
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content - No Scroll */}
          <div className="flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full w-full">
              {/* Admin Basic Info */}
              <Card className="h-fit w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    ข้อมูลพื้นฐาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 w-full">
                  <div className="grid grid-cols-1 gap-6 w-full">
                    <div className="space-y-4 w-full">
                      <div className="flex items-center gap-4 w-full">
                        <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold min-w-[120px] text-base flex-shrink-0">ชื่อผู้ใช้:</span>
                        <span className="text-base flex-1">{admin.username}</span>
                      </div>
                      <div className="flex items-center gap-4 w-full">
                        <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold min-w-[120px] text-base flex-shrink-0">อีเมล:</span>
                        <span className="text-base flex-1 break-all">{admin.email}</span>
                      </div>
                      <div className="flex items-center gap-4 w-full">
                        <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold min-w-[120px] text-base flex-shrink-0">เบอร์โทรศัพท์:</span>
                        <span className="text-base flex-1">{admin.phone}</span>
                      </div>
                    </div>
                    <div className="space-y-4 w-full">
                      <div className="flex items-center gap-4 w-full">
                        <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold min-w-[120px] text-base flex-shrink-0">บทบาท:</span>
                        <Badge variant={getRoleBadgeVariant(admin.role)} className="text-sm px-3 py-1">
                          {getRoleDisplayName(admin.role)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 w-full">
                        <UserCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold min-w-[120px] text-base flex-shrink-0">สถานะ:</span>
                        <Badge variant={getStatusBadgeVariant(admin.status)} className="text-sm px-3 py-1">
                          {getStatusDisplayName(admin.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 w-full">
                        <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold min-w-[120px] text-base flex-shrink-0">วันที่สร้าง:</span>
                        <span className="text-base flex-1">{new Date(admin.createdAt).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Villages Info */}
              <Card className="h-fit w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building className="h-5 w-5" />
                    หมู่บ้านที่จัดการ ({admin.villages.length} หมู่บ้าน)
                  </CardTitle>
                  <CardDescription className="text-base">
                    รายการหมู่บ้านทั้งหมดที่ Admin คนนี้มีสิทธิ์จัดการ
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                  {loading ? (
                    <div className="text-center py-12 w-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-base text-muted-foreground">กำลังโหลดข้อมูลหมู่บ้าน...</p>
                    </div>
                  ) : admin.villages.length === 0 ? (
                    <div className="text-center py-16 w-full">
                      <Building className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                      <p className="text-muted-foreground text-xl">ยังไม่มีหมู่บ้านที่ assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-6 w-full">
                      {/* Village Badges */}
                      <div className="flex flex-wrap gap-3 w-full">
                        {admin.villages.map((village) => (
                          <Badge key={village.village_id} variant="outline" className="flex items-center gap-2 px-4 py-2 text-sm">
                            <Building className="h-4 w-4" />
                            {village.village_name}
                          </Badge>
                        ))}
                      </div>

                      {/* Village Details Table */}
                      <div className="border rounded-lg w-full overflow-hidden">
                        <div className="overflow-x-auto">
                          <div className="max-h-[360px] overflow-y-auto">
                            <Table className="w-full min-w-[560px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-base font-semibold w-[35%]">หมู่บ้าน</TableHead>
                                  <TableHead className="text-base font-semibold w-[45%]">ที่อยู่</TableHead>
                                  <TableHead className="text-base font-semibold w-[20%]">สถานะ</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getAdminVillages().map((village) => {
                                  const trimmedAddress = village.address?.trim();

                                  return (
                                    <TableRow key={village.village_id}>
                                      <TableCell className="font-medium text-base">
                                        <div className="flex items-center gap-2">
                                          <Building className="h-5 w-5" />
                                          {village.village_name}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-base">
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                                          <span className="leading-6">
                                            {trimmedAddress ? trimmedAddress : "—"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="default" className="text-sm px-3 py-1">
                                          ใช้งานอยู่
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-6 sm:px-8 border-t bg-muted/30">
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose} className="px-8 py-3 text-base">
                <X className="h-5 w-5 mr-2" />
                ปิด
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
