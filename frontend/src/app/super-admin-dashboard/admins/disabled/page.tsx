"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Archive, 
  ArrowLeft,
  AlertTriangle,
  Users,
  Calendar,
  RotateCcw,
  Shield,
  Building
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Admin {
  admin_id: string;
  username: string;
  email: string;
  phone: string;
  role: "admin" | "staff";
  status: "verified" | "pending" | "disable";
  disable_at: string | null;
  village_keys: string[];
  villages: Array<{
    village_key: string;
    village_name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function DisabledAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDisabledAdmins();
  }, []);

  const fetchDisabledAdmins = async () => {
    try {
      const response = await fetch("/api/superadmin/admins/disabled", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        // Access denied - will be handled by layout
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch disabled admins");
      }

      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
      } else {
        setError(data.error || "Failed to load disabled admins");
      }
    } catch (err) {
      setError("Failed to load disabled admins");
      console.error("Error fetching disabled admins:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "ไม่ระบุ";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRestoreAdmin = async () => {
    if (!selectedAdmin) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/superadmin/admins/${selectedAdmin.admin_id}/restore`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("คืนสถานะแอดมินสำเร็จ");
        setIsRestoreDialogOpen(false);
        setSelectedAdmin(null);
        fetchDisabledAdmins();
      } else {
        toast.error(data.error || "Failed to restore admin");
      }
    } catch (err) {
      toast.error("Failed to restore admin");
      console.error("Error restoring admin:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openRestoreDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsRestoreDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading disabled admins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchDisabledAdmins} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/super-admin-dashboard/admins">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับ
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">แอดมินที่ถูกระงับ</h1>
          </div>
          <p className="text-muted-foreground">
            รายการแอดมินที่ถูกระงับในระบบ
          </p>
        </div>
      </div>

      {/* Disabled Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            รายการแอดมินที่ถูกระงับ ({admins.length})
          </CardTitle>
          <CardDescription>
            แอดมินที่ถูกระงับและวันที่ระงับ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">ไม่มีแอดมินที่ถูกระงับในระบบ</p>
              <Link href="/super-admin-dashboard/admins">
                <Button className="mt-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  กลับไปหน้าจัดการแอดมิน
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อผู้ใช้</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>หมู่บ้าน</TableHead>
                  <TableHead>วันที่ระงับ</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.admin_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {admin.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {admin.email || "ไม่ระบุ"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={admin.role === "admin" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {admin.role === "admin" ? "เจ้าของโครงการ" : "นิติ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.villages.length > 0 ? (
                          admin.villages.map((village) => (
                            <Badge key={village.village_key} variant="outline" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              {village.village_name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">ไม่มีหมู่บ้าน</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(admin.disable_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRestoreDialog(admin)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        คืนสถานะ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการคืนสถานะแอดมิน</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะคืนสถานะแอดมิน "{selectedAdmin?.username}" ให้สามารถใช้งานได้อีกครั้ง?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleRestoreAdmin} 
              disabled={submitting}
            >
              {submitting ? "กำลังคืนสถานะ..." : "คืนสถานะ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
