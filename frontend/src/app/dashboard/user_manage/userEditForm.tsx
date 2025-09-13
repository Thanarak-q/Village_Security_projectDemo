"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Home, Shield } from "lucide-react";

// Zod validation schema
const userEditFormSchema = z.object({
  status: z.string().min(1, "กรุณาเลือกสถานะ"),
  role: z.string().min(1, "กรุณาเลือกบทบาท"),
  houseNumber: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If role is 'resident', house number is required
  if (data.role === 'resident') {
    return data.houseNumber && data.houseNumber.trim().length > 0;
  }
  return true;
}, {
  message: "กรุณาระบุบ้านเลขที่สำหรับลูกบ้าน",
  path: ["houseNumber"],
});

type UserEditFormData = z.infer<typeof userEditFormSchema>;

interface User {
  id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  status: string;
  role: string;
  joinDate: string;
  houseNumber?: string;
  shift?: string;
}

interface UserEditFormProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: UserEditFormData) => void;
}

export default function UserEditForm({ user, isOpen, onClose, onSubmit }: UserEditFormProps) {
  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      status: "",
      role: "",
      houseNumber: "",
      notes: ""
    }
  });

  useEffect(() => {
    if (user) {
      form.reset({
        status: user.status,
        role: user.role,
        houseNumber: user.houseNumber || "",
        notes: ""
      });
    }
  }, [user, form]);

  const handleSubmit = async (data: UserEditFormData) => {
    if (!user) return;

    const roleChanged = user.role !== data.role;

    try {
      const apiEndpoint = roleChanged ? '/api/changeUserRole' : '/api/updateUser';
      const requestBody = roleChanged 
        ? {
            userId: user.id,
            currentRole: user.role as 'resident' | 'guard',
            newRole: data.role as 'resident' | 'guard',
            status: data.status,
            houseNumber: data.role === 'resident' ? data.houseNumber : undefined,
            notes: data.notes
          }
        : {
            userId: user.id,
            role: data.role,
            status: data.status,
            houseNumber: data.role === 'resident' ? data.houseNumber : undefined,
            notes: data.notes
          };

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        console.log(roleChanged ? 'User role changed successfully:' : 'User updated successfully:', result);
        alert(roleChanged ? 'เปลี่ยนบทบาทผู้ใช้สำเร็จแล้ว!' : 'อัปเดตข้อมูลผู้ใช้สำเร็จแล้ว!');
        onSubmit(data);
      } else {
        console.error('Failed to update user:', result.error);
        alert(`Failed to ${roleChanged ? 'change user role' : 'update user'}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`An error occurred while ${roleChanged ? 'changing user role' : 'updating the user'}`);
    }
  };

  const isResident = user?.role === 'resident';

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            แก้ไขข้อมูลผู้ใช้
          </DialogTitle>
        </DialogHeader>

        {/* User Information Display */}
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            {isResident ? <Home className="h-3 w-3 sm:h-4 sm:w-4" /> : <Shield className="h-3 w-3 sm:h-4 sm:w-4" />}
            ข้อมูลผู้ใช้
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-blue-700 font-medium">ชื่อ-นามสกุล:</span>
              <p className="text-blue-900">{user.fname} {user.lname}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Username:</span>
              <p className="text-blue-900">@{user.username}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">อีเมล:</span>
              <p className="text-blue-900">{user.email}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">เบอร์โทร:</span>
              <p className="text-blue-900">{user.phone}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">ประเภท:</span>
              <p className="text-blue-900">{isResident ? "ลูกบ้าน" : "ยาม"}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">วันที่เข้าร่วม:</span>
              <p className="text-blue-900">{new Date(user.joinDate).toLocaleDateString('th-TH')}</p>
            </div>
            {isResident && (
              <div>
                <span className="text-blue-700 font-medium">บ้านเลขที่:</span>
                <p className="text-blue-900">{user.houseNumber}</p>
              </div>
            )}
            {!isResident && user.shift && (
              <div>
                <span className="text-blue-700 font-medium">กะ:</span>
                <p className="text-blue-900">{user.shift}</p>
              </div>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium text-foreground">
                    สถานะ
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="verified">ยืนยันแล้ว</SelectItem>
                      <SelectItem value="disable">ระงับการใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium text-foreground">
                    บทบาท
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="เลือกบทบาท" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="resident">ลูกบ้าน</SelectItem>
                      <SelectItem value="guard">ยาม</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* House Number Field (for residents only) */}
            {form.watch("role") === 'resident' && (
              <FormField
                control={form.control}
                name="houseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-foreground">
                      บ้านเลขที่
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น 88/123"
                        className="text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium text-foreground">
                    หมายเหตุ (ไม่บังคับ)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติม..."
                      rows={3}
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <DialogFooter className="flex gap-2 sm:gap-3 pt-4 sm:pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1 text-xs sm:text-sm">
                  ยกเลิก
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">บันทึกการเปลี่ยนแปลง</span>
                <span className="sm:hidden">บันทึก</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 