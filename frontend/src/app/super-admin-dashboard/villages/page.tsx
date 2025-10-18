"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building,
  Edit,
  Trash2,
  AlertTriangle,
  Archive,
  MapPin,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Village {
  village_id: string;
  village_name: string;
  village_key: string;
  status: string;
  disable_at: string | null;
  admin_count: number;
  address?: string | null;
  admins: Array<{
    admin_id: string;
    username: string;
  }>;
}

export default function VillagesPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [formData, setFormData] = useState({
    village_name: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchVillages = useCallback(async () => {
    try {
      const response = await fetch("/api/superadmin/villages", {
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
        throw new Error("Failed to fetch villages");
      }

      const data = await response.json();
      if (data.success) {
        setVillages(data.data);
      } else {
        setError(data.error || "Failed to load villages");
      }
    } catch (err) {
      setError("Failed to load villages");
      console.error("Error fetching villages:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchVillages();
  }, [fetchVillages]);

  const handleEditVillage = async () => {
    if (!selectedVillage || !formData.village_name.trim()) {
      toast.error("กรุณากรอกชื่อหมู่บ้าน");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/superadmin/villages/${selectedVillage.village_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("แก้ไขหมู่บ้านสำเร็จ");
        setIsEditDialogOpen(false);
        setSelectedVillage(null);
        setFormData({ village_name: "", address: "" });
        fetchVillages();
      } else {
        toast.error(data.error || "Failed to update village");
      }
    } catch (err) {
      toast.error("Failed to update village");
      console.error("Error updating village:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVillage = async () => {
    if (!selectedVillage) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/superadmin/villages/${selectedVillage.village_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("ลบหมู่บ้านสำเร็จ");
        setIsDeleteDialogOpen(false);
        setSelectedVillage(null);
        fetchVillages();
      } else {
        toast.error(data.error || "Failed to delete village");
      }
    } catch (err) {
      toast.error("Failed to delete village");
      console.error("Error deleting village:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (village: Village) => {
    setSelectedVillage(village);
    setFormData({
      village_name: village.village_name,
      address: village.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (village: Village) => {
    setSelectedVillage(village);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading villages...</p>
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
          <Button onClick={fetchVillages} className="mt-2">
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
          <h1 className="text-3xl font-bold tracking-tight">จัดการหมู่บ้าน</h1>
          <p className="text-muted-foreground">
            สร้าง แก้ไข และลบหมู่บ้านในระบบ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/super-admin-dashboard/villages/disabled">
            <Button variant="outline">
              <Archive className="mr-2 h-4 w-4" />
              หมู่บ้านที่ถูกระงับ
            </Button>
          </Link>
        </div>
      </div>

      {/* Villages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            รายการหมู่บ้าน ({villages.length})
          </CardTitle>
          <CardDescription>
            หมู่บ้านทั้งหมดในระบบและผู้ดูแลที่รับผิดชอบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {villages.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">ยังไม่มีหมู่บ้านในระบบ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อหมู่บ้าน</TableHead>
                  <TableHead>คีย์หมู่บ้าน</TableHead>
                  <TableHead>ที่อยู่</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>จัดการโดย</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {villages.map((village) => (
                  <TableRow key={village.village_id}>
                    <TableCell className="font-medium">
                      {village.village_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {village.village_key}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm leading-5">
                          {village.address && village.address.trim().length > 0
                            ? village.address.trim()
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={village.status === "active" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {village.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(village)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(village)}
                          disabled={village.admins.length > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขหมู่บ้าน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลหมู่บ้าน
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_village_name">ชื่อหมู่บ้าน</Label>
              <Input
                id="edit_village_name"
                value={formData.village_name}
                onChange={(e) => setFormData({ ...formData, village_name: e.target.value })}
                placeholder="เช่น หมู่บ้านสุขสันต์"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_village_address">ที่อยู่ (ไม่บังคับ)</Label>
              <Input
                id="edit_village_address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="เช่น 123 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEditVillage} disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบหมู่บ้าน</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบหมู่บ้าน &quot;{selectedVillage?.village_name}&quot;? 
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteVillage} 
              disabled={submitting}
            >
              {submitting ? "กำลังลบ..." : "ลบหมู่บ้าน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
