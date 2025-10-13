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
  Calendar,
  RotateCcw,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Village {
  village_id: string;
  village_name: string;
  status: string;
  disable_at: string | null;
  admin_count: number;
  address?: string | null;
  admins: Array<{
    admin_id: string;
    username: string;
  }>;
}

export default function DisabledVillagesPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDisabledVillages();
  }, []);

  const fetchDisabledVillages = async () => {
    try {
      const response = await fetch("/api/superadmin/villages/disabled", {
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
        throw new Error("Failed to fetch disabled villages");
      }

      const data = await response.json();
      if (data.success) {
        setVillages(data.data);
      } else {
        setError(data.error || "Failed to load disabled villages");
      }
    } catch (err) {
      setError("Failed to load disabled villages");
      console.error("Error fetching disabled villages:", err);
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

  const handleRestoreVillage = async () => {
    if (!selectedVillage) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/superadmin/villages/${selectedVillage.village_id}/restore`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("คืนสถานะหมู่บ้านสำเร็จ");
        setIsRestoreDialogOpen(false);
        setSelectedVillage(null);
        fetchDisabledVillages();
      } else {
        toast.error(data.error || "Failed to restore village");
      }
    } catch (err) {
      toast.error("Failed to restore village");
      console.error("Error restoring village:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openRestoreDialog = (village: Village) => {
    setSelectedVillage(village);
    setIsRestoreDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading disabled villages...</p>
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
          <Button onClick={fetchDisabledVillages} className="mt-2">
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
            <Link href="/super-admin-dashboard/villages">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับ
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">หมู่บ้านที่ถูกระงับ</h1>
          </div>
          <p className="text-muted-foreground">
            รายการหมู่บ้านที่ถูกระงับในระบบ
          </p>
        </div>
      </div>

      {/* Disabled Villages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            รายการหมู่บ้านที่ถูกระงับ ({villages.length})
          </CardTitle>
          <CardDescription>
            หมู่บ้านที่ถูกระงับและวันที่ระงับ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {villages.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">ไม่มีหมู่บ้านที่ถูกระงับในระบบ</p>
              <Link href="/super-admin-dashboard/villages">
                <Button className="mt-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  กลับไปหน้าจัดการหมู่บ้าน
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อหมู่บ้าน</TableHead>
                  <TableHead>รหัสหมู่บ้าน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>จัดการโดย</TableHead>
                  <TableHead>วันที่ระงับ</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {villages.map((village) => (
                  <TableRow key={village.village_id}>
                    <TableCell className="font-medium">
                      {village.village_name}
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {village.village_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="destructive"
                        className="text-xs"
                      >
                        ไม่ใช้งาน
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {village.admins.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {village.admins.map((admin) => (
                            <Badge
                              key={admin.admin_id}
                              variant="outline"
                              className="flex items-center gap-2 px-3 py-1 text-xs"
                            >
                              <User className="h-3.5 w-3.5" />
                              {admin.username}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          ยังไม่มอบหมาย
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(village.disable_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRestoreDialog(village)}
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
            <DialogTitle>ยืนยันการคืนสถานะหมู่บ้าน</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะคืนสถานะหมู่บ้าน "{selectedVillage?.village_name}" ให้สามารถใช้งานได้อีกครั้ง?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleRestoreVillage} 
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
