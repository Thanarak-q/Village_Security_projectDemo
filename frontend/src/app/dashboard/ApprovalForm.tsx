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
import { Check, X, UserCheck, AlertTriangle } from "lucide-react";

interface PendingUser {
  id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  role: string;
  houseNumber: string;
  requestDate: string;
  status: string;
}

interface ApprovalFormData {
  approvedRole: string;
  houseNumber: string;
  notes: string;
  approvalReason: string;
}

interface ApprovalFormProps {
  user: PendingUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: 'approve' | 'reject', formData: ApprovalFormData) => void;
}

export default function ApprovalForm({ user, isOpen, onClose, onSubmit }: ApprovalFormProps) {
  const [formData, setFormData] = useState({
    approvedRole: "",
    houseNumber: "",
    notes: "",
    approvalReason: ""
  });

  // โหลดข้อมูล user เข้าฟอร์มเมื่อเปิด
  useEffect(() => {
    if (user) {
      setFormData({
        approvedRole: user.role,
        houseNumber: user.houseNumber !== "-" ? user.houseNumber : "",
        notes: "",
        approvalReason: ""
      });
    }
  }, [user]);

  const handleApprove = () => {
    onSubmit('approve', formData);
  };

  const handleReject = () => {
    onSubmit('reject', formData);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-500" />
            อนุมัติผู้ใช้ใหม่
          </DialogTitle>
        </DialogHeader>

        {/* แสดงข้อมูล User */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-3">ข้อมูลผู้สมัคร</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
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
              <span className="text-blue-700 font-medium">วันที่สมัคร:</span>
              <p className="text-blue-900">{new Date(user.requestDate).toLocaleDateString('th-TH')}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">บทบาทที่สมัคร:</span>
              <p className="text-blue-900">{user.role}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* บทบาทที่อนุมัติ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              บทบาทที่อนุมัติ
            </label>
            <Select
              value={formData.approvedRole}
              onValueChange={(value) =>
                setFormData({ ...formData, approvedRole: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกบทบาท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ลูกบ้าน">ลูกบ้าน</SelectItem>
                <SelectItem value="ยาม">ยาม</SelectItem>
                <SelectItem value="ผู้จัดการ">ผู้จัดการ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* บ้านเลขที่ */}
          {formData.approvedRole === "ลูกบ้าน" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บ้านเลขที่
              </label>
              <Input
                placeholder="เช่น 88/123"
                value={formData.houseNumber}
                onChange={(e) =>
                  setFormData({ ...formData, houseNumber: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                กรอกบ้านเลขที่สำหรับลูกบ้าน
              </p>
            </div>
          )}

          {/* หมายเหตุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <Textarea
              placeholder="เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติม..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* เหตุผลการปฏิเสธ (แสดงเมื่อกดปฏิเสธ) */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              เหตุผลการปฏิเสธ
            </h4>
            <Textarea
              placeholder="ระบุเหตุผลในการปฏิเสธ..."
              value={formData.approvalReason}
              onChange={(e) =>
                setFormData({ ...formData, approvalReason: e.target.value })
              }
              rows={2}
              className="border-red-300 focus:border-red-500"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1">
              ยกเลิก
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            onClick={handleReject}
          >
            <X className="w-4 h-4 mr-2" />
            ปฏิเสธ
          </Button>
          <Button
            type="button"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
          >
            <Check className="w-4 h-4 mr-2" />
            อนุมัติ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
