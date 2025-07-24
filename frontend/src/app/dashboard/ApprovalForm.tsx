// ApprovalForm.tsx
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Form schema สำหรับการอนุมัติ
const approvalFormSchema = z.object({
  decision: z.string().min(1, { message: "กรุณาเลือกการตัดสินใจ" }),
  role: z.string().optional(), // ✅ เปลี่ยนเป็น optional
  houseNumber: z.string().optional(),
  note: z.string().optional(),
}).refine((data) => {
  // ✅ ถ้าอนุมัติต้องมี role
  if (data.decision === "approved" && !data.role) {
    return false;
  }
  return true;
}, {
  message: "กรุณาเลือกบทบาทเมื่ออนุมัติ",
  path: ["role"],
});

type ApprovalFormData = z.infer<typeof approvalFormSchema>;

// Interface สำหรับข้อมูลที่จะส่งกลับ
interface ApprovalDecisionData {
  id: number;
  decision: "approved" | "rejected";
  role?: string; // ✅ เปลี่ยนเป็น optional
  houseNumber?: string;
  note?: string;
}

interface ApprovalFormProps {
  title: string;
  request: {
    id: number;
    name: string;
    avatar: string;
    requestType: string;
    houseNumber: string;
    status: string;
    submittedTime: string;
    phoneNumber: string;
    email?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave?: (approvalData: ApprovalDecisionData) => void;
}

export default function ApprovalForm({
  title,
  request,
  isOpen,
  onClose,
  onSave,
}: ApprovalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState("resident"); // ✅ เพิ่ม state สำหรับ role
  const [selectedDecision, setSelectedDecision] = useState(""); // ✅ เพิ่ม state สำหรับ decision

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      decision: "",
      role: "resident", // ✅ ค่าเริ่มต้น
      houseNumber: request.houseNumber !== "-" ? request.houseNumber : "",
      note: "",
    },
  });

  // ✅ Fix: แสดงฟิลด์เฉพาะเมื่ออนุมัติ
  const showRoleAndHouseFields = selectedDecision === "approved";
  const showHouseNumberField = showRoleAndHouseFields && selectedRole === "resident";

  async function onSubmit(data: ApprovalFormData) {
    setIsSubmitting(true);
    
    try {
      // ✅ Fix: เพิ่ม role ใน approvalData เฉพาะเมื่ออนุมัติ
      const approvalData: ApprovalDecisionData = {
        id: request.id,
        decision: data.decision as "approved" | "rejected",
        note: data.note || "",
      };

      // ✅ เพิ่ม role และ houseNumber เฉพาะเมื่ออนุมัติ
      if (data.decision === "approved") {
        approvalData.role = data.role;
        approvalData.houseNumber = data.houseNumber;
      }

      if (onSave) {
        await onSave(approvalData);
      } else {
        alert(`${data.decision === "approved" ? "อนุมัติ" : "ปฏิเสธ"}คำขอ ID: ${request.id}\n${JSON.stringify(approvalData, null, 2)}`);
      }
      
      // Reset form และปิด dialog
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error processing approval:", error);
      alert("เกิดข้อผิดพลาดในการดำเนินการ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogClose asChild></DialogClose>
          <DialogTitle className="text-lg font-semibold pr-6">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Request ID: {request.id}
          </DialogDescription>
        </DialogHeader>

        {/* Request Info Section */}
        <div className="flex items-center gap-3 py-4 border-b">
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.avatar} />
            <AvatarFallback className="bg-gray-200 text-gray-600">
              {request.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{request.name}</div>
            <div className="text-sm text-gray-500">{request.phoneNumber}</div>
            {request.email && (
              <div className="text-sm text-gray-500">{request.email}</div>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">ประเภทคำขอ:</span>
            <span className="text-sm font-medium">{request.requestType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">บ้านเลขที่:</span>
            <span className="text-sm font-medium">{request.houseNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">เวลาที่ส่งคำขอ:</span>
            <span className="text-sm font-medium">{request.submittedTime}</span>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* การตัดสินใจ */}
            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    การตัดสินใจ
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedDecision(value); // ✅ อัปเดต decision state
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกการตัดสินใจ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="approved">อนุมัติ</SelectItem>
                      <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ บทบาท - แสดงเฉพาะเมื่ออนุมัติ */}
            {showRoleAndHouseFields && (
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
                        setSelectedRole(value); // ✅ อัปเดต state
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
            )}

            {/* ✅ บ้านเลขที่ - แสดงเฉพาะเมื่อเลือกผู้อยู่อาศัย */}
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
                      * ระบุบ้านเลขที่สำหรับผู้อยู่อาศัยใหม่
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* หมายเหตุ */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    หมายเหตุ (ไม่บังคับ)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เพิ่มหมายเหตุสำหรับการตัดสินใจนี้..."
                      {...field}
                      className="placeholder:text-gray-400 min-h-[80px]"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    * หมายเหตุจะถูกส่งให้ผู้ขออนุมัติทราบ
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการตัดสินใจ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}