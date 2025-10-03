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
  User,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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
  village_id: string;
  village_name: string;
}

interface StaffTableProps {
  staffMembers: StaffMember[];
  onStaffUpdated: (staff: StaffMember) => void;
  onStaffDeleted: (adminId: string) => void;
  loading: boolean;
}

export function StaffTable({ staffMembers, onStaffDeleted, loading }: StaffTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Function to get password change status
  const getPasswordStatus = (passwordChangedAt: string | null) => {
    return passwordChangedAt ? "เปลี่ยนรหัสผ่านแล้ว" : "ยังไม่เปลี่ยนรหัสผ่าน";
  };

  // Function to get password status badge color
  const getPasswordStatusColor = (passwordChangedAt: string | null) => {
    return passwordChangedAt 
      ? "bg-green-600 hover:bg-green-700 text-white px-1 py-1 text-sm rounded-lg flex-1 disabled:opacity-50 dark:bg-green-900/20 dark:text-green-400" 
      : "bg-red-600 hover:bg-red-700 text-white px-1 py-1 text-sm rounded-lg flex-1 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400";
  };


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
      // toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
      <div className="overflow-x-auto rounded-lg border border-border bg-background shadow-sm hover:shadow-md transition-shadow duration-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border">
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">นิติบุคคล</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden sm:table-cell">ข้อมูลติดต่อ</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden lg:table-cell">วันที่เข้าร่วม</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.map((staff) => (
              <TableRow key={staff.admin_id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                {/* User column - Staff icon and name */}
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    {/* Staff icon */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-blue-500 text-white flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    {/* Name and username */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-base">
                        {staff.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{staff.username}
                      </div>
                        {/* Show join date on mobile */}
                        <div className="lg:hidden text-xs text-muted-foreground mt-1">
                          <div>{staff.created_at ? (() => {
                            try {
                              return format(new Date(staff.created_at), "dd MMM yyyy", { locale: th });
                            } catch (error) {
                              console.error('Date formatting error:', error, 'created_at:', staff.created_at);
                              return 'Invalid Date';
                            }
                          })() : 'N/A'}</div>
                        </div>
                      </div>
                  </div>
                </TableCell>

                {/* Contact info column - hidden on mobile */}
                <TableCell className="py-4 px-6 hidden sm:table-cell">
                  <div className="text-sm">
                    <div className="text-foreground font-medium">
                      {staff.email || "-"}
                    </div>
                    <div className="text-muted-foreground">
                      {staff.phone || "ไม่มีข้อมูล"}
                    </div>
                  </div>
                </TableCell>


                {/* Join date column - hidden on mobile, small and medium screens */}
                <TableCell className="py-4 px-6 hidden lg:table-cell">
                  <div className="text-sm text-foreground">
                    {staff.created_at ? (() => {
                      try {
                        return format(new Date(staff.created_at), "dd MMM yyyy", { locale: th });
                      } catch (error) {
                        console.error('Date formatting error:', error, 'created_at:', staff.created_at);
                        return 'Invalid Date';
                      }
                    })() : 'N/A'}
                  </div>
                </TableCell>


                {/* Actions column */}
                <TableCell className="py-4 px-6">
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
                      {/* Password status in dropdown */}
                      <div className="px-2 py-1.5">
                        <div className="text-xs text-muted-foreground mb-1">สถานะรหัสผ่าน</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPasswordStatusColor(staff.password_changed_at)}`}>
                          {getPasswordStatus(staff.password_changed_at)}
                        </span>
                      </div>
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