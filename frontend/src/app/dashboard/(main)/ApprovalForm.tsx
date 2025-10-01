"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Check, X, UserCheck, Search, Home } from "lucide-react";

// Interface for available house
interface AvailableHouse {
  house_id: string;
  address: string;
  status: string;
  village_key: string;
}

// Zod validation schema
const approvalFormSchema = z.object({
  approvedRole: z.string().min(1, "กรุณาเลือกบทบาทที่อนุมัติ"),
  houseId: z.string().optional(),
  houseNumber: z.string().optional(), // Keep for backward compatibility
  notes: z.string().optional(),
}).refine((data) => {
  // If approved role is 'ลูกบ้าน', house selection is required
  if (data.approvedRole === 'ลูกบ้าน') {
    return data.houseId && data.houseId.trim().length > 0;
  }
  return true;
}, {
  message: "กรุณาเลือกบ้านสำหรับลูกบ้าน",
  path: ["houseId"],
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
  const [availableHouses, setAvailableHouses] = useState<AvailableHouse[]>([]);
  const [loadingHouses, setLoadingHouses] = useState(false);
  const [houseQuery, setHouseQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const housesPerPage = 5;

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      approvedRole: "",
      houseId: "",
      houseNumber: "",
      notes: ""
    }
  });

  // Fetch available houses
  const fetchAvailableHouses = async () => {
    try {
      setLoadingHouses(true);
      const selectedVillage = sessionStorage.getItem("selectedVillage");
      if (!selectedVillage) return;

      const response = await fetch(`/api/houses?village_key=${encodeURIComponent(selectedVillage)}`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Filter for available houses on the client side
          const availableOnly = result.data.filter((house: AvailableHouse) => house.status === 'available');
          setAvailableHouses(availableOnly);
        }
      }
    } catch (error) {
      console.error("Error fetching available houses:", error);
    } finally {
      setLoadingHouses(false);
    }
  };

  // โหลดข้อมูล user เข้าฟอร์มเมื่อเปิด
  useEffect(() => {
    if (user) {
      form.reset({
        approvedRole: user.role === 'resident' ? 'ลูกบ้าน' : 'ยาม',
        houseId: "", // Will be set based on houseNumber if needed
        houseNumber: user.houseNumber !== "-" ? user.houseNumber : "",
        notes: ""
      });
    }
  }, [user, form]);

  // Filtered and paginated houses
  const filteredHouses = useMemo(
    () =>
      availableHouses.filter((house) =>
        house.address.toLowerCase().includes(houseQuery.toLowerCase()) ||
        house.house_id.toLowerCase().includes(houseQuery.toLowerCase())
      ),
    [availableHouses, houseQuery]
  );

  const paginatedHouses = useMemo(() => {
    const startIndex = (currentPage - 1) * housesPerPage;
    const endIndex = startIndex + housesPerPage;
    return filteredHouses.slice(startIndex, endIndex);
  }, [filteredHouses, currentPage, housesPerPage]);

  const totalPages = Math.ceil(filteredHouses.length / housesPerPage);

  // Reset search and pagination when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHouseQuery("");
      setCurrentPage(1);
      fetchAvailableHouses();
    }
  }, [isOpen]);

  const handleApproveClick = () => {
    if (!user) return;
    
    // Validate form using Zod
    form.handleSubmit(() => {
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
    
    // Get house address from selected house ID
    if (formData.approvedRole === 'ลูกบ้าน' && formData.houseId) {
      const selectedHouse = availableHouses.find(house => house.house_id === formData.houseId);
      if (selectedHouse) {
        formData.houseNumber = selectedHouse.address;
      }
    }
    
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

              {/* เลือกบ้าน */}
              {form.watch("approvedRole") === "ลูกบ้าน" && (
                <FormField
                  control={form.control}
                  name="houseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        เลือกบ้าน
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              placeholder="ค้นหาด้วยเลขที่บ้านหรือรหัสบ้าน"
                              value={houseQuery}
                              onChange={(e) => setHouseQuery(e.target.value)}
                              className="pl-10 text-sm"
                            />
                          </div>
                          
                          {/* House List */}
                          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                            {loadingHouses ? (
                              <div className="text-center py-4 text-muted-foreground">
                                กำลังโหลด...
                              </div>
                            ) : filteredHouses.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground">
                                {houseQuery ? "ไม่พบบ้านที่ตรงกับการค้นหา" : "ไม่มีบ้านที่ว่าง"}
                              </div>
                            ) : (
                              paginatedHouses.map((house) => (
                                <button
                                  key={house.house_id}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(house.house_id);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md border flex items-center gap-3 transition-colors ${
                                    field.value === house.house_id
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-ring hover:bg-muted/50"
                                  }`}
                                >
                                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Home className="w-4 h-4" />
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {house.address}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      ID: {house.house_id.slice(-8)}
                                    </p>
                                  </div>
                                  {field.value === house.house_id && (
                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                          
                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="text-xs"
                              >
                                ก่อนหน้า
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                หน้า {currentPage} จาก {totalPages}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="text-xs"
                              >
                                ถัดไป
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {availableHouses.length === 0 && !loadingHouses && (
                        <p className="text-xs text-muted-foreground">
                          ไม่มีบ้านที่ว่างในหมู่บ้านนี้ กรุณาเพิ่มบ้านใหม่ในหน้าจัดการบ้าน
                        </p>
                      )}
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
              {form.watch("approvedRole") === 'ลูกบ้าน' && form.watch("houseId") && (
                <>
                  <br />บ้านเลขที่: <strong>
                    {availableHouses.find(house => house.house_id === form.watch("houseId"))?.address}
                  </strong>
                </>
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
