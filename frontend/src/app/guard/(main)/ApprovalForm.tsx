"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

import { useForm } from "react-hook-form";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
// @ts-ignore
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Home, House, User, Search, Shield, Loader2} from "lucide-react";
import axios from "axios";
import { ModeToggle } from "@/components/mode-toggle";
import { getAuthData, switchUserRole } from "@/lib/liffAuth";

const visitorSchema = z.object({
  license_image: z.string().optional(),
  guard_id: z.string().min(1, "ต้องการ ID ของผู้รับผิดชอบ"),
  id_card_image: z.string().optional(),
  visitor_id_card: z
    .string()
    .min(1, "กรุณากรอกเลขบัตรประชาชน")
    .regex(/^[0-9]{13}$/, "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"),
  license_plate: z
    .string()
    .min(1, "กรุณาระบุเลขทะเบียน")
    .regex(/^[ก-๙A-Za-z0-9\s-]+$/, "เลขทะเบียนไม่สามารถใช้อักษรพิเศษได้"),
  house_id: z.string().min(1, "กรุณาเลือกบ้าน"),
  entry_time: z.string().min(1, "กรุณาระบุเวลาเข้า"),
  visit_purpose: z.string().optional(),
});

function ApprovalForm() {
  const router = useRouter();
  const [houses, setHouses] = useState<
    Array<{ house_id: string; address: string; village_key: string }>
  >([]);
  const [userRoles, setUserRoles] = useState<Array<{role: string, village_key: string, village_name?: string}>>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    fname: string;
    lname: string;
    email: string;
    village_key: string;
  } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedIdCardImage, setCapturedIdCardImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idCardFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { user, token } = getAuthData();
        if (user) {
          setCurrentUser(user);
        }
        
        // Get village_key from user data or sessionStorage
        let villageKey = user?.village_key;
        if (!villageKey) {
          villageKey = sessionStorage.getItem("selectedVillage") || undefined;
        }
        
        if (!villageKey) {
          console.error("No village_key found for guard", {
            user: user,
            sessionStorage: sessionStorage.getItem("selectedVillage")
          });
          alert("ไม่พบข้อมูลหมู่บ้าน กรุณาติดต่อผู้ดูแลระบบ");
          return;
        }
        
        const housesResponse = await axios.get(`/api/houses?village_key=${encodeURIComponent(villageKey)}`, {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const houses = housesResponse.data?.data || [];
        setHouses(houses);
        console.log("🏠 Houses loaded:", {
          total: houses.length,
          village_key: villageKey,
          houses: houses,
          response: housesResponse.data
        });
        
        if (houses.length === 0) {
          console.warn("No houses found for village:", villageKey);
        }
      } catch (err) {
        console.error("Error fetching houses data:", err);
        if (axios.isAxiosError(err) && err.response?.data?.error) {
          console.error("API Error:", err.response.data.error);
        }
      }
    };
    fetchData();
  }, []);

  // Fetch user roles to check if they have resident role
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (currentUser?.id) {
        try {
          const apiUrl = '';
          const response = await fetch(`${apiUrl}/api/users/roles?lineUserId=${currentUser.id}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              if (data.success && data.roles) {
                setUserRoles(data.roles);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user roles:', error);
        }
      }
    };

    fetchUserRoles();
  }, [currentUser]);

  const handleSwitchToResident = async () => {
    if (isSwitchingRole) return; // Prevent multiple clicks
    
    try {
      setIsSwitchingRole(true);
      console.log("🔄 Switching to resident role...");
      const result = await switchUserRole('resident');
      
      if (result.success) {
        console.log("✅ Successfully switched to resident role");
        router.push('/Resident');
      } else {
        console.error("❌ Failed to switch to resident role:", result.error);
        alert(`ไม่สามารถสลับบทบาทได้: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Error switching to resident role:", error);
      alert("เกิดข้อผิดพลาดในการสลับบทบาท");
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const handleNavigateToProfile = () => {
    router.push('/guard/profile');
  };

  // Check if user has resident role
  const hasResidentRole = userRoles.some(role => role.role === 'resident');

  const getLocalDateTimeForInput = () => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

  const visitorForm = useForm<z.infer<typeof visitorSchema>>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      license_image: "",
      guard_id: currentUser?.id,
      id_card_image: "",
      license_plate: "",
      visitor_id_card: "",
      house_id: "",
      entry_time: getLocalDateTimeForInput(),
      visit_purpose: "",
    },
  });

    useEffect(() => {
      if (currentUser?.id) {
        visitorForm.setValue("guard_id", currentUser.id);
      }
    }, [currentUser?.id, visitorForm]);

  const [step, setStep] = useState<number>(1);
  const progress = step === 1 ? 25 : step === 2 ? 60 : 100;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const [houseQuery, setHouseQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const housesPerPage = 5;

  const filteredHouses = useMemo(
    () =>
      houses.filter((h) =>
        h.address.toLowerCase().includes(houseQuery.toLowerCase())
      ),
    [houses, houseQuery]
  );

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

  useEffect(() => {
    if (
      step === 3 &&
      filteredHouses.length !== 0 &&
      !visitorForm.getValues("house_id")
    ) {
      // Only auto-select if no house is already selected
      visitorForm.setValue("house_id", filteredHouses[0].house_id);
    }
  }, [step, filteredHouses, visitorForm]);

  const goNext = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (step === 1) {
      setStep(2);
    }
    if (step === 2) {
      const isValid = await visitorForm.trigger([
        "license_plate",
        "entry_time",
        "visitor_id_card",
      ]);
      if (!isValid) {
        return;
      }

      setStep(3);
    }
  };

  const goBack = () => {
    if (step === 1) return;
    setStep((s) => Math.max(1, s - 1));
  };

  const isStep2Valid = () => {
    const licensePlate = visitorForm.watch("license_plate");
    const entryTime = visitorForm.watch("visitor_id_card");

    return licensePlate?.trim() !== "" && entryTime?.trim() !== "";
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        visitorForm.setValue("license_image", result);
        // console.log(visitorForm.getValues("picture_key"));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdCardUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedIdCardImage(result);
        visitorForm.setValue("id_card_image", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openIdCardFileDialog = () => {
    idCardFileInputRef.current?.click();
  };

  const clearImage = () => {
    setCapturedImage(null);
    visitorForm.setValue("license_image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearIdCardImage = () => {
    setCapturedIdCardImage(null);
    visitorForm.setValue("id_card_image", "");
    if (idCardFileInputRef.current) {
      idCardFileInputRef.current.value = "";
    }
  };

  async function onSubmit(data: z.infer<typeof visitorSchema>) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log("🚀 Submitting form data:", data);
      console.log("🔍 Guard ID being sent:", data.guard_id);

      // Send to real API without authentication
      const payload: Record<string, unknown> = {
        visitorIDCard: data.visitor_id_card,
        houseId: data.house_id,
        licensePlate: data.license_plate,
        visitPurpose: data.visit_purpose?.trim() ? data.visit_purpose : undefined,
        guardId: data.guard_id,
      };

      if (data.license_image && data.license_image.trim()) {
        payload.licenseImage = data.license_image;
      }

      if (data.id_card_image && data.id_card_image.trim()) {
        payload.idCardImage = data.id_card_image;
      }

      const { token } = getAuthData();

      const response = await axios.post("/api/approvalForms", payload, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log("✅ Form submitted successfully:", response.data);

      if (response.data?.success) {
        alert(`ส่งคำขอสำเร็จ! รหัสการเยี่ยม: ${response.data.visitorId}`);
        // Reset form values and UI state for a new submission
        visitorForm.reset({
          license_image: "",
          guard_id: currentUser?.id ?? "",
          id_card_image: "",
          license_plate: "",
          visitor_id_card: "",
          house_id: "",
          entry_time: getLocalDateTimeForInput(),
          visit_purpose: "",
        });
        setStep(1);
        setCapturedImage(null);
        setCapturedIdCardImage(null);
        setHouseQuery("");
        setCurrentPage(1);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (idCardFileInputRef.current) {
          idCardFileInputRef.current.value = "";
        }
      } else if (response.data?.error) {
        const err = response.data.error;
        const message = Array.isArray(err) ? err.join("\n") : String(err);
        alert(`เกิดข้อผิดพลาด: ${message}`);
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
        alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
      } else {
        alert("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-card rounded-2xl border shadow-lg">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2 slect-none pointer-events-none">
                <House className="w-6 h-6 sm:w-7 sm:h-7" /> ส่งคำขอเข้าเยี่ยม
              </h1>
              <span className="flex items-center gap-2">
                <ModeToggle />
                <button
                  onClick={handleSwitchToResident}
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Go to Resident page"
                  title="ไปยังหน้าผู้อยู่อาศัย"
                >
                  <Home className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={handleNavigateToProfile}
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Go to profile"
                >
                  <User className="w-5 h-5 text-foreground" />
                </button>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">{progress}%</div>
            <div className="mb-4 mt-2">
              <Progress value={progress} className="h-2 bg-muted" />
            </div>
          </div>
          <div className="px-4 pb-4">
            <Form {...visitorForm}>
              <form
                onSubmit={visitorForm.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-6">
                    {/* License plate/car image upload */}
                    <FormLabel className="text-base font-medium select-none">
                      รูปภาพรถ/ป้ายทะเบียน
                    </FormLabel>
                    <div
                      onClick={openFileDialog}
                      className="w-full max-h-[100%] rounded-lg border border-dashed overflow-hidden relative cursor-pointer hover:bg-muted transition-colors"
                    >
                      {capturedImage ? (
                        <>
                          <img
                            src={capturedImage}
                            alt="Uploaded"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearImage();
                              }}
                              className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                              title="ลบรูปภาพ"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-48 flex flex-col items-center justify-center text-muted-foreground">
                          <Upload className="w-16 h-16 mb-2" />
                          <div className="text-sm">อัปโหลดรูปภาพรถ/ป้ายทะเบียน</div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {visitorForm.formState.errors.license_image && (
                      <div className="text-sm text-red-600 text-center">
                        {visitorForm.formState.errors.license_image.message}
                      </div>
                    )}

                    {/* ID card image upload */}
                    <FormLabel className="text-base font-medium select-none">
                      รูปภาพบัตรประชาชน
                    </FormLabel>
                    <div
                      onClick={openIdCardFileDialog}
                      className="w-full max-h-[100%] rounded-lg border border-dashed overflow-hidden relative cursor-pointer hover:bg-muted transition-colors"
                    >
                      {capturedIdCardImage ? (
                        <>
                          <img
                            src={capturedIdCardImage}
                            alt="ID Card"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearIdCardImage();
                              }}
                              className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                              title="ลบรูปบัตรประชาชน"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-48 flex flex-col items-center justify-center text-muted-foreground">
                          <Upload className="w-12 h-12 mb-2" />
                          <div className="text-sm">อัปโหลดรูปภาพบัตรประชาชน</div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={idCardFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIdCardUpload}
                      className="hidden"
                    />
                    {visitorForm.formState.errors.id_card_image && (
                      <div className="text-sm text-red-600 text-center">
                        {visitorForm.formState.errors.id_card_image.message}
                      </div>
                    )}
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={visitorForm.control}
                      name="license_plate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium select-none pointer-events-nones">
                            เลขทะเบียน
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="เช่น กข 1234"
                              {...field}
                              className="h-12 text-base focus-visible:ring-ring"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={visitorForm.control}
                      name="visitor_id_card"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium select-none pointer-events-none">
                            เลขบัตรประชาชน
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="เลขบัตรประชาชนผู้เข้าเยี่ยม"
                              {...field}
                              className="h-12 text-base focus-visible:ring-ring"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <label className="text-base font-medium text-foreground">
                        เจ้าหน้าที่ผู้รับผิดชอบ
                      </label>
                      {currentUser ? (
                        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="w-5 h-5" />
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {currentUser.fname} {currentUser.lname}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {currentUser.email}
                            </p>
                          </div>
                          <div className="text-xs text-green-600 bg-green-100 px-2.5 py-2 rounded-full">
                            กำลังใช้งาน
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center text-muted-foreground">
                          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>ไม่พบข้อมูลผู้ใช้</p>
                        </div>
                      )}
                    </div>
                    <FormField
                      control={visitorForm.control}
                      name="visit_purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium select-none pointer-events-none">
                            วัตถุประสงค์
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="ส่งของ / ติดตั้ง / ซ่อม"
                              {...field}
                              className="min-h-[90px] text-base focus-visible:ring-ring"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-6">
                      <FormField
                        control={visitorForm.control}
                        name="entry_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium select-none pointer-events-none">
                              เวลาเข้า
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                readOnly
                                className="h-12 text-base bg-muted/60 select-none pointer-events-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-sm rounded-md bg-muted/50 text-muted-foreground p-3 border border-border">
                      ระบบจะตรวจเลขทะเบียนอัตโนมัติ หากไม่แน่ใจ
                      สามารถแก้ไขได้ด้วยตนเอง
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={visitorForm.control}
                      name="house_id"
                      render={() => (
                        <FormItem>
                          <FormLabel>
                            {currentUser?.village_key && (
                              <span className="text-base ml-2">
                                หมู่บ้าน: {currentUser.village_key} <br />
                                เลือกบ้านเลขที่
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  placeholder="ค้นหาด้วยเลขที่บ้านหรือรหัสบ้าน"
                                  onChange={(e) =>
                                    setHouseQuery(e.target.value)
                                  }
                                  className="h-12 text-base pl-10"
                                />
                              </div>
                              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {paginatedHouses.map((house) => (
                                  <button
                                    key={house.house_id}
                                    type="button"
                                    onClick={() => {
                                      visitorForm.setValue(
                                        "house_id",
                                        house.house_id
                                      );
                                    }}
                                    className={`w-full text-left px-4 py-4 rounded-lg border flex items-center gap-3 ${
                                      visitorForm.watch("house_id") ===
                                      house.house_id
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-ring"
                                    }`}
                                  >
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                      <Home className="w-4 h-4" />
                                    </span>
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        บ้าน {house.address}
                                      </p>
                                    </div>
                                    {visitorForm.watch("house_id") ===
                                      house.house_id && (
                                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                      </div>
                                    )}
                                  </button>
                                ))}
                                {filteredHouses.length === 0 && (
                                  <div className="text-center py-4">
                                    {houseQuery ? (
                                      <p className="text-muted-foreground">
                                        ไม่พบบ้านที่ตรงกับการค้นหา
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        <p className="text-muted-foreground">
                                          ไม่มีบ้านในหมู่บ้านนี้
                                        </p>
                                        {currentUser?.village_key && (
                                          <p className="text-xs text-muted-foreground">
                                            หมู่บ้าน: {currentUser.village_key}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-3 border-t">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setCurrentPage((prev) =>
                                        Math.max(1, prev - 1)
                                      )
                                    }
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                      />
                                    </svg>
                                    ก่อนหน้า
                                  </Button>
                                  <span className="text-sm text-muted-foreground">
                                    หน้า {currentPage} จาก {totalPages}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setCurrentPage((prev) =>
                                        Math.min(totalPages, prev + 1)
                                      )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-2"
                                  >
                                    ถัดไป
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="flex-1 h-12 text-base"
                    disabled={isSubmitting}
                  >
                    กลับ
                  </Button>
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={goNext}
                      className={`flex-1 h-12 text-base ${
                        step === 2 && !isStep2Valid()
                          ? "bg-muted cursor-not-allowed text-muted-foreground"
                          : ""
                      }`}
                      disabled={isSubmitting || (step === 2 && !isStep2Valid())}
                    >
                      ต่อไป
                    </Button>
                  ) : (
                    <Button type="submit" className="flex-1 h-12 text-base" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังส่ง...
                        </span>
                      ) : (
                        "ยืนยัน"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ApprovalForm;
