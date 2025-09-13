"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Check, X, UserCheck } from "lucide-react";

// Zod validation schema
const approvalFormSchema = z.object({
  approvedRole: z.string().min(1, "กรุณาเลือกบทบาทที่อนุมัติ"),
  houseNumber: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If approved role is 'ลูกบ้าน', house number is required
  if (data.approvedRole === 'ลูกบ้าน') {
    return data.houseNumber && data.houseNumber.trim().length > 0;
  }
  return true;
}, {
  message: "กรุณาระบุบ้านเลขที่สำหรับลูกบ้าน",
  path: ["houseNumber"],
});

type ApprovalFormData = z.infer<typeof approvalFormSchema>;

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

interface ApprovalFormProps {
  user: PendingUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: 'approve' | 'reject', formData: ApprovalFormData) => void;
}

export default function ApprovalForm({ user, isOpen, onClose, onSubmit }: ApprovalFormProps) {
  // Confirmation dialog states
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      approvedRole: "",
      houseNumber: "",
      notes: ""
    }
  });

  // โหลดข้อมูล user เข้าฟอร์มเมื่อเปิด
  useEffect(() => {
    if (user) {
      form.reset({
        approvedRole: user.role === 'resident' ? 'ลูกบ้าน' : 'ยาม',
        houseNumber: user.houseNumber !== "-" ? user.houseNumber : "",
        notes: ""
      });
    }
  }, [user, form]);

  const handleApproveClick = () => {
    if (!user) return;
    
    // Validate form using Zod
    form.handleSubmit((data) => {
      setShowApproveConfirm(true);
    }, (errors) => {
      console.log('Form validation errors:', errors);
    })();
  };

  const handleRejectClick = () => {
    if (!user) return;
    setShowRejectConfirm(true);
  };

  const handleConfirmApprove = () => {
    setShowApproveConfirm(false);
    const formData = form.getValues();
    onSubmit('approve', formData);
  };

  const handleConfirmReject = () => {
    setShowRejectConfirm(false);
    const formData = form.getValues();
    onSubmit('reject', formData);
  };

  const handleCancelConfirm = () => {
    setShowApproveConfirm(false);
    setShowRejectConfirm(false);
  };

  if (!user) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              อนุมัติผู้ใช้ใหม่
            </DialogTitle>
          </DialogHeader>

          {/* แสดงข้อมูล User */}
          <div className="bg-primary/5 p-4 rounded-lg mb-6 border border-primary/20">
            <h3 className="font-medium text-primary mb-3">ข้อมูลผู้สมัคร</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-primary/80 font-medium">ชื่อ-นามสกุล:</span>
                <p className="text-foreground">{user.fname} {user.lname}</p>
              </div>
              <div>
                <span className="text-primary/80 font-medium">Username:</span>
                <p className="text-foreground">@{user.username}</p>
              </div>
              <div>
                <span className="text-primary/80 font-medium">อีเมล:</span>
                <p className="text-foreground">{user.email}</p>
              </div>
              <div>
                <span className="text-primary/80 font-medium">เบอร์โทร:</span>
                <p className="text-foreground">{user.phone}</p>
              </div>
              <div>
                <span className="text-primary/80 font-medium">วันที่สมัคร:</span>
                <p className="text-foreground">{new Date(user.requestDate).toLocaleDateString('th-TH')}</p>
              </div>
              <div>
                <span className="text-primary/80 font-medium">บทบาทที่สมัคร:</span>
                <p className="text-foreground">{user.role === 'resident' ? 'ลูกบ้าน' : 'ยาม'}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <div className="space-y-4">
              {/* บทบาทที่อนุมัติ */}
              <FormField
                control={form.control}
                name="approvedRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      บทบาทที่อนุมัติ
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกบทบาท" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ลูกบ้าน">ลูกบ้าน</SelectItem>
                        <SelectItem value="ยาม">ยาม</SelectItem>
                        {/* <SelectItem value="ผู้จัดการ">ผู้จัดการ</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* บ้านเลขที่ */}
              {form.watch("approvedRole") === "ลูกบ้าน" && (
                <FormField
                  control={form.control}
                  name="houseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        บ้านเลขที่
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น 88/123"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        กรอกบ้านเลขที่สำหรับลูกบ้าน
                      </p>
                    </FormItem>
                  )}
                />
              )}

              {/* หมายเหตุ */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      หมายเหตุ (ไม่บังคับ)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติม..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>

          <DialogFooter className="flex gap-3 pt-6">
            {/* <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              ยกเลิก
            </Button> */}
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
              onClick={handleRejectClick}
            >
              <X className="w-4 h-4 mr-2" />
              ปฏิเสธ
            </Button>
            <Button
              type="button"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
              onClick={handleApproveClick}
            >
              <Check className="w-4 h-4 mr-2" />
              อนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <AlertDialogContent className="flex flex-col w-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              ยืนยันการอนุมัติ
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการอนุมัติผู้ใช้ <strong>{user?.fname} {user?.lname}</strong> 
              เป็น <strong>{form.watch("approvedRole")}</strong> ใช่หรือไม่?
              {form.watch("approvedRole") === 'ลูกบ้าน' && form.watch("houseNumber") && (
                <><br />บ้านเลขที่: <strong>{form.watch("houseNumber")}</strong></>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              ยืนยันการอนุมัติ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent className="flex flex-col w-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              ยืนยันการปฏิเสธ
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการปฏิเสธผู้ใช้ <strong>{user?.fname} {user?.lname}</strong> ใช่หรือไม่?
              <br />
              <span className="text-red-600 font-medium">
                การปฏิเสธจะทำให้ผู้ใช้ไม่สามารถเข้าสู่ระบบได้
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReject}
              className="bg-red-600 hover:bg-red-700"
            >
              ยืนยันการปฏิเสธ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
