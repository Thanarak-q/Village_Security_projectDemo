"use client";
import { useEffect, useState, useMemo } from "react";
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
import { Edit, Home, Shield, Search, CheckCircle } from "lucide-react";

// Interface for available house
interface AvailableHouse {
  house_id: string;
  address: string;
  status: string;
  village_key: string;
}

interface HousesResponse {
  success: boolean;
  data: AvailableHouse[];
}

// Zod validation schema
const userEditFormSchema = z.object({
  status: z.string().min(1, "กรุณาเลือกสถานะ"),
  role: z.string().min(1, "กรุณาเลือกบทบาท"),
  houseId: z.string().optional(),
  houseNumber: z.string().optional(), // Keep for backward compatibility
  notes: z.string().optional(),
}).refine((data) => {
  // If role is 'resident', house selection is required
  if (data.role === 'resident') {
    return data.houseId && data.houseId.trim().length > 0;
  }
  return true;
}, {
  message: "กรุณาเลือกบ้านสำหรับลูกบ้าน",
  path: ["houseId"],
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
  const [availableHouses, setAvailableHouses] = useState<AvailableHouse[]>([]);
  const [loadingHouses, setLoadingHouses] = useState(false);
  const [houseQuery, setHouseQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const housesPerPage = 5;
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<UserEditFormData | null>(null);
  const [successData, setSuccessData] = useState<{
    type: 'role_change' | 'user_update' | 'no_change';
    userName: string;
    action: string;
    formData: UserEditFormData;
  } | null>(null);

  // Filter houses based on search query
  const filteredHouses = useMemo(
    () =>
      availableHouses.filter((h) =>
        h.address.toLowerCase().includes(houseQuery.toLowerCase())
      ),
    [availableHouses, houseQuery]
  );

  // Paginate filtered houses
  const paginatedHouses = useMemo(() => {
    const startIndex = (currentPage - 1) * housesPerPage;
    const endIndex = startIndex + housesPerPage;
    return filteredHouses.slice(startIndex, endIndex);
  }, [filteredHouses, currentPage, housesPerPage]);

  const totalPages = Math.ceil(filteredHouses.length / housesPerPage);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [houseQuery]);

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      status: "",
      role: "",
      houseId: "",
      houseNumber: "",
      notes: ""
    }
  });

  // Fetch available houses
  const fetchAvailableHouses = async () => {
    try {
      setLoadingHouses(true);
      // Use selectedVillageId instead of selectedVillage to avoid confusion
      const selectedVillageId = sessionStorage.getItem("selectedVillageId");
      if (!selectedVillageId) return;

      // Use the same endpoint as guard page but filter for available houses
      const response = await fetch(`/api/houses?village_id=${encodeURIComponent(selectedVillageId)}`, {
        credentials: "include",
      });

      if (response.ok) {
        const result: HousesResponse = await response.json();
        if (result.success) {
          // Filter for available houses only
          const available = result.data.filter((house) => house.status === "available");
          setAvailableHouses(available);
        }
      }
    } catch (error) {
      console.error("Error fetching available houses:", error);
    } finally {
      setLoadingHouses(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Find the current house ID based on the user's house number
      let currentHouseId = "";
      if (user.role === 'resident' && user.houseNumber && availableHouses.length > 0) {
        const currentHouse = availableHouses.find(house => house.address === user.houseNumber);
        currentHouseId = currentHouse?.house_id || "";
      }

      form.reset({
        status: user.status,
        role: user.role,
        houseId: currentHouseId,
        houseNumber: user.houseNumber || "",
        notes: ""
      });
    }
  }, [user, form, availableHouses]);

  // Fetch available houses when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableHouses();
      // Reset search and pagination when dialog opens
      setHouseQuery("");
      setCurrentPage(1);
    }
  }, [isOpen]);

  const handleSubmit = async (data: UserEditFormData) => {
    if (!user) return;

    const roleChanged = user.role !== data.role;
    const statusChanged = user.status !== data.status;

    // For house comparison, we need to find the current house ID from the available houses
    let currentHouseId = null;
    if (user.role === 'resident' && user.houseNumber && availableHouses.length > 0) {
      const currentHouse = availableHouses.find(house => house.address === user.houseNumber);
      currentHouseId = currentHouse?.house_id;
    }

    const houseChanged = user.role === 'resident' && data.role === 'resident' &&
      currentHouseId !== data.houseId && data.houseId; // Also check that houseId is not empty

    console.log('Change detection:', {
      roleChanged,
      statusChanged,
      houseChanged,
      currentHouseId,
      selectedHouseId: data.houseId,
      userHouseNumber: user.houseNumber,
      availableHousesCount: availableHouses.length
    });

    // Check if there are any actual changes
    if (!roleChanged && !statusChanged && !houseChanged && !data.notes?.trim()) {
      // Show notification and close form
      setSuccessData({
        type: 'no_change',
        userName: `${user.fname} ${user.lname}`,
        action: 'ไม่มีการเปลี่ยนแปลงใดๆ',
        formData: data
      });
      setShowSuccessDialog(true);
      return;
    }

    // Validate that if role is resident, houseId is provided
    if (data.role === 'resident' && (!data.houseId || data.houseId.trim() === '')) {
      alert('กรุณาเลือกบ้านสำหรับลูกบ้าน');
      return;
    }

    // Store form data and show confirmation dialog
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = async () => {
    if (!user || !pendingFormData) return;

    const data = pendingFormData;
    setShowConfirmDialog(false);
    setPendingFormData(null);

    const roleChanged = user.role !== data.role;

    try {
      const apiEndpoint = roleChanged ? '/api/changeUserRole' : '/api/updateUser';

      // Send houseId directly for proper house assignment
      const requestBody = roleChanged
        ? {
          userId: user.id,
          currentRole: user.role as 'resident' | 'guard',
          newRole: data.role as 'resident' | 'guard',
          status: data.status,
          houseId: data.role === 'resident' ? data.houseId : undefined,
          notes: data.notes
        }
        : {
          userId: user.id,
          role: data.role,
          status: data.status,
          houseId: data.role === 'resident' ? data.houseId : undefined,
          notes: data.notes
        };

      console.log('Sending request to:', apiEndpoint);
      console.log('Request body:', requestBody);
      console.log('Form data:', data);
      console.log('Available houses:', availableHouses.length);

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      console.log('API Response:', result);

      // Check if result is valid
      if (!result || typeof result !== 'object') {
        console.error('Invalid API response:', result);
        alert('ได้รับข้อมูลตอบกลับที่ไม่ถูกต้องจากเซิร์ฟเวอร์');
        return;
      }

      if (result.success) {
        console.log(roleChanged ? 'User role changed successfully:' : 'User updated successfully:', result);

        // Show success notification dialog
        setSuccessData({
          type: roleChanged ? 'role_change' : 'user_update',
          userName: `${user.fname} ${user.lname}`,
          action: roleChanged ? 'เปลี่ยนบทบาทผู้ใช้สำเร็จแล้ว' : 'อัปเดตข้อมูลผู้ใช้สำเร็จแล้ว',
          formData: data // Store form data to call onSubmit later
        });
        setShowSuccessDialog(true);

        // Reset form to clean state
        form.reset({
          status: "",
          role: "",
          houseId: "",
          houseNumber: "",
          notes: ""
        });
      } else {
        console.error('Failed to update user:', result);
        const errorMessage = result.error || result.details || result.message || 'Unknown error occurred';
        alert(`Failed to ${roleChanged ? 'change user role' : 'update user'}: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`An error occurred while ${roleChanged ? 'changing user role' : 'updating the user'}`);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
  };

  const getChangesSummary = () => {
    if (!user || !pendingFormData) return [];

    const changes = [];

    if (user.status !== pendingFormData.status) {
      const statusText = pendingFormData.status === 'verified' ? 'ยืนยันแล้ว' : 'ระงับการใช้งาน';
      const oldStatusText = user.status === 'verified' ? 'ยืนยันแล้ว' : 'ระงับการใช้งาน';
      changes.push(`สถานะ: ${oldStatusText} → ${statusText}`);
    }

    if (user.role !== pendingFormData.role) {
      const roleText = pendingFormData.role === 'resident' ? 'ลูกบ้าน' : 'ยาม';
      const oldRoleText = user.role === 'resident' ? 'ลูกบ้าน' : 'ยาม';
      changes.push(`บทบาท: ${oldRoleText} → ${roleText}`);
    }

    // Check house changes for residents
    if (user.role === 'resident' && pendingFormData.role === 'resident' && pendingFormData.houseId) {
      let currentHouseId = null;
      if (user.houseNumber && availableHouses.length > 0) {
        const currentHouse = availableHouses.find(house => house.address === user.houseNumber);
        currentHouseId = currentHouse?.house_id;
      }

      if (currentHouseId !== pendingFormData.houseId) {
        const newHouse = availableHouses.find(house => house.house_id === pendingFormData.houseId);
        changes.push(`บ้าน: ${user.houseNumber || 'ไม่ระบุ'} → ${newHouse?.address || 'ไม่ระบุ'}`);
      }
    }

    if (pendingFormData.notes?.trim()) {
      changes.push(`หมายเหตุ: ${pendingFormData.notes}`);
    }

    return changes;
  };

  const isResident = user?.role === 'resident';

  if (!user) return null;

  return (
    <>
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
              {/* Role Selection - DISABLED: Admin/Staff cannot change user roles */}
              {/* <FormField
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
            /> */}

              {/* Display current role as read-only */}
              <div className="space-y-2">
                <FormLabel className="text-xs sm:text-sm font-medium text-foreground">
                  บทบาท
                </FormLabel>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                  {form.watch("role") === 'resident' ? (
                    <>
                      <Home className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">ลูกบ้าน</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm">ยาม</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้ในหน้านี้
                </p>
              </div>

              {/* House Selection Field (for residents only) */}
              {form.watch("role") === 'resident' && (
                <FormField
                  control={form.control}
                  name="houseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium text-foreground">
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
                                  className={`w-full text-left px-3 py-2 rounded-md border flex items-center gap-3 transition-colors ${field.value === house.house_id
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              ยืนยันการอัปเดตข้อมูลผู้ใช้
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  คุณต้องการอัปเดตข้อมูลของผู้ใช้ <strong>{user?.fname} {user?.lname}</strong> ใช่หรือไม่?
                </p>

                {getChangesSummary().length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">การเปลี่ยนแปลงที่จะดำเนินการ:</p>
                    <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      {getChangesSummary().map((change, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                  ⚠️ การเปลี่ยนแปลงนี้จะมีผลทันทีและไม่สามารถยกเลิกได้
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpdate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ยืนยันการอัปเดต
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Notification Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center">
            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${successData?.type === 'no_change'
                ? 'bg-blue-100 dark:bg-blue-900/20'
                : 'bg-green-100 dark:bg-green-900/20'
              }`}>
              <CheckCircle className={`h-6 w-6 ${successData?.type === 'no_change'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-green-600 dark:text-green-400'
                }`} />
            </div>
            <AlertDialogTitle className={`text-xl font-semibold ${successData?.type === 'no_change'
                ? 'text-blue-800 dark:text-blue-200'
                : 'text-green-800 dark:text-green-200'
              }`}>
              {successData?.action}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              {successData?.type === 'no_change' ? (
                <>
                  ข้อมูลของ <span className="font-medium text-foreground">{successData?.userName}</span> ไม่มีการเปลี่ยนแปลง
                </>
              ) : (
                <>
                  ผู้ใช้ <span className="font-medium text-foreground">{successData?.userName}</span>
                  {successData?.type === 'role_change' ? ' ได้รับการเปลี่ยนบทบาทเรียบร้อยแล้ว' : ' ได้รับการอัปเดตข้อมูลเรียบร้อยแล้ว'}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center pt-2">
            <AlertDialogAction
              onClick={() => {
                setShowSuccessDialog(false);
                // For no_change, just close the dialog without calling onSubmit
                if (successData?.type === 'no_change') {
                  onClose();
                } else if (successData?.formData) {
                  // Call onSubmit to refresh data and close the edit dialog
                  onSubmit(successData.formData);
                }
              }}
              className={
                successData?.type === 'no_change'
                  ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  : "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              }
            >
              ตกลง
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
