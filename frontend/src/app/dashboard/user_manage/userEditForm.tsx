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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, User, Home, Shield } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  status: string;
  joinDate: string;
  houseNumber?: string;
  shift?: string;
}

interface UserEditFormData {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  status: string;
  houseNumber: string;
  shift: string;
  notes: string;
}

interface UserEditFormProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: UserEditFormData) => void;
}

export default function UserEditForm({ user, isOpen, onClose, onSubmit }: UserEditFormProps) {
  const [formData, setFormData] = useState<UserEditFormData>({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    status: "",
    houseNumber: "",
    shift: "",
    notes: ""
  });

  // โหลดข้อมูล user เข้าฟอร์มเมื่อเปิด
  useEffect(() => {
    if (user) {
      setFormData({
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        phone: user.phone,
        status: user.status,
        houseNumber: user.houseNumber || "",
        shift: user.shift || "",
        notes: ""
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isResident = user?.houseNumber;

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

        {/* แสดงข้อมูล User */}
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            {isResident ? <Home className="h-3 w-3 sm:h-4 sm:w-4" /> : <Shield className="h-3 w-3 sm:h-4 sm:w-4" />}
            ข้อมูลผู้ใช้
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-blue-700 font-medium">Username:</span>
              <p className="text-blue-900">@{user.username}</p>
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

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* ชื่อ-นามสกุล */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                ชื่อ
              </label>
              <Input
                value={formData.fname}
                onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                required
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                นามสกุล
              </label>
              <Input
                value={formData.lname}
                onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                required
                className="text-sm"
              />
            </div>
          </div>

          {/* อีเมล */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              อีเมล
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="text-sm"
            />
          </div>

          {/* เบอร์โทร */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              เบอร์โทร
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="text-sm"
            />
          </div>

          {/* สถานะ */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              สถานะ
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ใช้งาน">ใช้งาน</SelectItem>
                <SelectItem value="ไม่ใช้งาน">ไม่ใช้งาน</SelectItem>
                <SelectItem value="ระงับชั่วคราว">ระงับชั่วคราว</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* บ้านเลขที่ (สำหรับลูกบ้าน) */}
          {isResident && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                บ้านเลขที่
              </label>
              <Input
                value={formData.houseNumber}
                onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                placeholder="เช่น 88/123"
                className="text-sm"
              />
            </div>
          )}

          {/* กะ (สำหรับยาม) */}
          {!isResident && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                กะ
              </label>
              <Select
                value={formData.shift}
                onValueChange={(value) => setFormData({ ...formData, shift: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="เลือกกะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="กะเช้า">กะเช้า</SelectItem>
                  <SelectItem value="กะบ่าย">กะบ่าย</SelectItem>
                  <SelectItem value="กะดึก">กะดึก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* หมายเหตุ */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <Textarea
              placeholder="เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติม..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>

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
      </DialogContent>
    </Dialog>
  );
} 