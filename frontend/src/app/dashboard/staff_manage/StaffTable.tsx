"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreHorizontal,
  Trash2,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface StaffMember {
  admin_id: string;
  username: string;
  status: "verified" | "pending" | "disable";
  role: string;
  created_at: string;
  updated_at: string;
  village_key: string;
  village_name: string;
}

interface StaffTableProps {
  staffMembers: StaffMember[];
  onStaffUpdated: (staff: StaffMember) => void;
  onStaffDeleted: (adminId: string) => void;
  loading: boolean;
}

export function StaffTable({ staffMembers, onStaffUpdated, onStaffDeleted, loading }: StaffTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  const handleDelete = async () => {
    if (!staffToDelete) return;

    try {
      const response = await fetch(`/api/staff/staff/${staffToDelete.admin_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        onStaffDeleted(staffToDelete.admin_id);
        toast.success("ลบนิติบุคคลสำเร็จ");
        setDeleteDialogOpen(false);
        setStaffToDelete(null);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการลบนิติบุคคล");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const openDeleteDialog = (staff: StaffMember) => {
    setStaffToDelete(staff);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (staffMembers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">ไม่มีข้อมูลนิติบุคคล</h3>
          <p className="text-muted-foreground text-center">
            ยังไม่มีนิติบุคคลในหมู่บ้านนี้
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อผู้ใช้</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.map((staff) => (
              <TableRow key={staff.admin_id}>
                <TableCell className="font-medium">
                  {staff.username}
                </TableCell>
                <TableCell>
                  {format(new Date(staff.created_at), "dd MMM yyyy", { locale: th })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">เปิดเมนู</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(staff)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        ลบ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบนิติบุคคล &quot;{staffToDelete?.username}&quot; 
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}