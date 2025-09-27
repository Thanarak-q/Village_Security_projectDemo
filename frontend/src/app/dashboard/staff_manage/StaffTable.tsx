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
  Edit,
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

  // Function to create avatar initials from username
  const getAvatarInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  // Function to get avatar color based on staff ID
  const getAvatarColor = (staffId: string) => {
    const colors = [
      "bg-primary",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
      "bg-orange-500",
    ];
    const index = staffId.charCodeAt(0) % colors.length;
    return colors[index];
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
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden md:table-cell">หมู่บ้าน</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6 hidden lg:table-cell">วันที่เข้าร่วม</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-sm py-4 px-6">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.map((staff) => (
              <TableRow key={staff.admin_id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                {/* User column - Avatar and name */}
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-4">
                    {/* Avatar circle with initials */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${getAvatarColor(
                        staff.admin_id
                      )}`}
                    >
                      {getAvatarInitials(staff.username)}
                    </div>
                    {/* Name and username */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-base">
                        {staff.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{staff.username}
                      </div>
                      {/* Show contact info on mobile */}
                      <div className="sm:hidden text-xs text-muted-foreground mt-1">
                        <div>{staff.village_name}</div>
                      </div>
                      {/* Show village on mobile */}
                      <div className="md:hidden text-xs text-muted-foreground mt-1">
                        <div>{staff.village_name}</div>
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
                    <div className="text-foreground font-medium">-</div>
                    <div className="text-muted-foreground">ไม่มีข้อมูล</div>
                  </div>
                </TableCell>

                {/* Village column - hidden on mobile and small screens */}
                <TableCell className="py-4 px-6 hidden md:table-cell">
                  <div className="text-sm text-foreground font-medium">
                    {staff.village_name}
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