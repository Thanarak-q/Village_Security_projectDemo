"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  user_id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  role_id: string;
  status: string;
}

interface UserFormProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserForm({ user, isOpen, onClose }: UserFormProps) {
  const [formData, setFormData] = useState({
    status: "",
    role: "",
    houseNumber: "",
  });

  console.log("UserForm props:", { user, isOpen });

  // ใช้ useEffect ที่มี dependency ที่ถูกต้อง
  useEffect(() => {
    if (user && isOpen) {
      console.log("Loading user data:", user);
      setFormData({
        status: user.status || "",
        role: user.role_id || "",
        houseNumber: "",
      });
    }
  }, [user?.user_id, isOpen]); // dependency ที่ถูกต้อง

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    console.log("User ID:", user?.user_id);
    
    // ปิดฟอร์มหลังบันทึก
    onClose();
  };

  // ป้องกันการ render ถ้าไม่มี user หรือปิดอยู่
  if (!user || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            แก้ไขข้อมูลผู้ใช้
          </DialogTitle>
        </DialogHeader>

        {/* แสดงข้อมูล User */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="text-sm space-y-1">
            <div>
              <strong>ชื่อ:</strong> {user.fname} {user.lname}
            </div>
            <div>
              <strong>Username:</strong> {user.username}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>ID:</strong> {user.user_id}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* สถานะ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">ยืนยันแล้ว</SelectItem>
                <SelectItem value="disabled">ปิดใช้งาน</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* บทบาท */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              บทบาท
            </label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกบทบาท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resident">ลูกบ้าน</SelectItem>
                <SelectItem value="security">ยาม</SelectItem>
                <SelectItem value="admin">นิติ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* บ้านเลขที่ */}
          {formData.role === "resident" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บ้านเลขที่
              </label>
              <Input
                placeholder="เช่น 88/123"
                value={formData.houseNumber}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, houseNumber: e.target.value }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                กรอกเฉพาะเมื่อเลือกบทบาท ลูกบ้าน
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-3 pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                ยกเลิก
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}