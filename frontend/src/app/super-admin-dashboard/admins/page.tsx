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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Building,
  Shield,
  UserCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Admin {
  admin_id: string;
  username: string;
  email: string;
  phone: string;
  role: "admin" | "staff";
  status: "verified" | "pending" | "disable";
  village_key: string;
  village_name: string;
  createdAt: string;
  updatedAt: string;
}

interface Village {
  village_id: string;
  village_name: string;
  village_key: string;
  admin_count: number;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "admin" as "admin" | "staff",
    village_key: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAdmins();
    fetchVillages();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/superadmin/admins", {
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
        throw new Error("Failed to fetch admins");
      }

      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
      } else {
        setError(data.error || "Failed to load admins");
      }
    } catch (err) {
      setError("Failed to load admins");
      console.error("Error fetching admins:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVillages = async () => {
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
    }
  };

  const handleCreateAdmin = async () => {
    if (!formData.username.trim() || !formData.email.trim() || 
        !formData.password.trim() || !formData.phone.trim() || 
        !formData.village_key) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/superadmin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("สร้าง Admin สำเร็จ");
        setIsCreateDialogOpen(false);
        setFormData({
          username: "",
          email: "",
          password: "",
          phone: "",
          role: "admin",
          village_key: "",
        });
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to create admin");
      }
    } catch (err) {
      toast.error("Failed to create admin");
      console.error("Error creating admin:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin || !formData.username.trim() || 
        !formData.email.trim() || !formData.phone.trim() || 
        !formData.village_key) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/superadmin/admins/${selectedAdmin.admin_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          village_key: formData.village_key,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("แก้ไข Admin สำเร็จ");
        setIsEditDialogOpen(false);
        setSelectedAdmin(null);
        setFormData({
          username: "",
          email: "",
          password: "",
          phone: "",
          role: "admin",
          village_key: "",
        });
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to update admin");
      }
    } catch (err) {
      toast.error("Failed to update admin");
      console.error("Error updating admin:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/superadmin/admins/${selectedAdmin.admin_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("ลบ Admin สำเร็จ");
        setIsDeleteDialogOpen(false);
        setSelectedAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to delete admin");
      }
    } catch (err) {
      toast.error("Failed to delete admin");
      console.error("Error deleting admin:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      username: admin.username,
      email: admin.email,
      password: "",
      phone: admin.phone,
      role: admin.role,
      village_key: admin.village_key,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const getRoleDisplayName = (role: string) => {
    return role === "admin" ? "เจ้าของโครงการ" : "นิติ";
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "verified": return "ยืนยันแล้ว";
      case "pending": return "รอการอนุมัติ";
      case "disable": return "ปิดใช้งาน";
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "verified": return "default";
      case "pending": return "secondary";
      case "disable": return "destructive";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admins...</p>
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
          <Button onClick={fetchAdmins} className="mt-2">
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
          <h1 className="text-3xl font-bold tracking-tight">จัดการ Admin</h1>
          <p className="text-muted-foreground">
            สร้าง แก้ไข และลบ Admin ในระบบ
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              สร้าง Admin ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>สร้าง Admin ใหม่</DialogTitle>
              <DialogDescription>
                เพิ่ม Admin ใหม่เข้าไปในระบบ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">ชื่อผู้ใช้</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="เช่น admin01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="เช่น admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="เช่น 0812345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">บทบาท</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "staff") => 
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">เจ้าของโครงการ</SelectItem>
                    <SelectItem value="staff">นิติ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="village_key">หมู่บ้าน</Label>
                <Select
                  value={formData.village_key}
                  onValueChange={(value) => 
                    setFormData({ ...formData, village_key: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมู่บ้าน" />
                  </SelectTrigger>
                  <SelectContent>
                    {villages.map((village) => (
                      <SelectItem key={village.village_id} value={village.village_key}>
                        {village.village_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreateAdmin} disabled={submitting}>
                {submitting ? "กำลังสร้าง..." : "สร้าง Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            รายการ Admin ({admins.length})
          </CardTitle>
          <CardDescription>
            Admin ทั้งหมดในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">ยังไม่มี Admin ในระบบ</p>
              <Button 
                className="mt-2" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                สร้าง Admin แรก
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อผู้ใช้</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>หมู่บ้าน</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.admin_id}>
                    <TableCell className="font-medium">
                      {admin.username}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.role === "admin" ? "default" : "secondary"}>
                        {getRoleDisplayName(admin.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(admin.status)}>
                        {getStatusDisplayName(admin.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="text-sm">{admin.village_name || "ไม่ระบุ"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(admin.createdAt).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(admin)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(admin)}
                          disabled={admin.role === "superadmin"}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไข Admin</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูล Admin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_username">ชื่อผู้ใช้</Label>
              <Input
                id="edit_username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="เช่น admin01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">อีเมล</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="เช่น admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">เบอร์โทรศัพท์</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="เช่น 0812345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">บทบาท</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "staff") => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">เจ้าของโครงการ</SelectItem>
                  <SelectItem value="staff">นิติ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_village_key">หมู่บ้าน</Label>
              <Select
                value={formData.village_key}
                onValueChange={(value) => 
                  setFormData({ ...formData, village_key: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมู่บ้าน" />
                </SelectTrigger>
                <SelectContent>
                  {villages.map((village) => (
                    <SelectItem key={village.village_id} value={village.village_key}>
                      {village.village_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEditAdmin} disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ Admin</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบ Admin "{selectedAdmin?.username}"? 
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAdmin} 
              disabled={submitting}
            >
              {submitting ? "กำลังลบ..." : "ลบ Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
