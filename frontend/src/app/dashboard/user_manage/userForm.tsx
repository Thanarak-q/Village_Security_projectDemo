// userForm.tsx
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schema
const formSchema = z.object({
  status: z.string().min(1, { message: "กรุณาเลือกสถานะ" }),
  role: z.string().min(1, { message: "กรุณาเลือกบทบาท" }),
  houseNumber: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// ✅ เพิ่ม interface สำหรับข้อมูลที่จะส่งกลับ
interface UpdateUserData {
  id: number;
  status: string;
  role: string;
  houseNumber?: string;
}

interface UserFormProps {
  title: string;
  user: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    houseNumber: string;
    role: string;
    initials: string;
    avatarColor: string;
  };
  isOpen: boolean;
  onClose: () => void;
  // ✅ เพิ่ม callback สำหรับส่งข้อมูลกลับ
  onSave?: (userData: UpdateUserData) => void;
}

export default function UserForm({
  title,
  user,
  isOpen,
  onClose,
  onSave, // ✅ รับ callback function
}: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set initial role based on user data
  const getInitialRole = (role: string) => {
    switch (role) {
      case "ผู้อยู่อาศัย":
        return "resident";
      case "รปภ.":
        return "security";
      case "ผู้จัดการ":
        return "admin";
      default:
        return "resident";
    }
  };

  const [selectedRole, setSelectedRole] = useState(getInitialRole(user.role));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "active",
      role: getInitialRole(user.role),
      houseNumber: user.houseNumber !== "-" ? user.houseNumber : "",
    },
  });

  // ✅ ปรับปรุง onSubmit function
  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    
    try {
      // สร้างข้อมูลที่จะส่งกลับ
      const updateData: UpdateUserData = {
        id: user.id, // ✅ ส่ง id ไปด้วย
        status: data.status,
        role: data.role,
        houseNumber: data.houseNumber || "",
      };

      // ✅ เรียก callback function หากมี
      if (onSave) {
        await onSave(updateData);
      } else {
        // fallback: แสดง alert พร้อม id
        alert(`บันทึกข้อมูลผู้ใช้งาน ID: ${user.id}\n${JSON.stringify(updateData, null, 2)}`);
      }
      
      onClose(); // ปิด dialog หลังบันทึกสำเร็จ
    } catch (error) {
      console.error("Error saving user data:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  }

  const showHouseNumberField = selectedRole === "resident";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogClose asChild></DialogClose>
          <DialogTitle className="text-lg font-semibold pr-6">
            {title}
          </DialogTitle>
          {/* ✅ แสดง user ID สำหรับ debug */}
          <DialogDescription className="text-xs text-gray-500">
            User ID: {user.id}
          </DialogDescription>
        </DialogHeader>

        {/* User Info Section */}
        <div className="flex items-center gap-3 py-4 border-b">
          <div
            className={`w-12 h-12 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-lg font-medium`}
          >
            {user.initials}
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* สถานะ */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    สถานะ
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">ใช้งาน</SelectItem>
                      <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                      <SelectItem value="pending">รอการอนุมัติ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* บทบาท */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    บทบาท
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedRole(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="resident">ผู้อยู่อาศัย</SelectItem>
                      <SelectItem value="security">รปภ.</SelectItem>
                      <SelectItem value="admin">ผู้จัดการ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* บ้านเลขที่ - แสดงเฉพาะเมื่อเลือกผู้อยู่อาศัย */}
            {showHouseNumberField && (
              <FormField
                control={form.control}
                name="houseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      บ้านเลขที่
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="88/123"
                        {...field}
                        className="placeholder:text-gray-400"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      * ระบบจะอัปเดตข้อมูลอัตโนมัติหลังจากยืนยัน
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex gap-3 pt-6">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}