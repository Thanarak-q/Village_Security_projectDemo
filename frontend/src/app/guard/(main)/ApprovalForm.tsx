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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import { useForm } from "react-hook-form";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Upload,
  House,
  User,
  Search,
  Loader2,
  Camera,
  ImageIcon,
  CheckCircle,
  Shuffle,
  Home,
} from "lucide-react";
import axios from "axios";
import { ModeToggle } from "@/components/mode-toggle";

// Simple auth data getter from localStorage (compatible with both LIFF and Demo login)
const getAuthData = () => {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('liffUser') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('liffToken') : null;
  return {
    user: userStr ? JSON.parse(userStr) : null,
    token,
  };
};

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const visitorSchema = z
  .object({
    license_image: z.string().optional(),
    province: z.string().optional(),
    guard_id: z.string().min(1, "ต้องการ ID ของผู้รับผิดชอบ"),
    id_card_image: z.string().optional(),
    fname: z.string().min(1, "กรุณากรอกชื่อผู้เข้าเยี่ยม"),
    lname: z.string().min(1, "กรุณากรอกนามสกุลผู้เข้าเยี่ยม"),
    visitor_id_card: z
      .string()
      .min(1, "กรุณากรอกเลขบัตรประชาชน")
      .regex(/^[0-9]{8,13}$/, "เลขบัตรต้องเป็นตัวเลข 8-13 หลัก"),
    license_plate: z
      .string()
      .min(1, "กรุณาระบุเลขทะเบียน")
      .regex(/^[ก-๙A-Za-z0-9\s-]+$/, "เลขทะเบียนไม่สามารถใช้อักษรพิเศษได้"),
    house_id: z.string().min(1, "กรุณาเลือกบ้าน"),
    entry_time: z.string().min(1, "กรุณาระบุเวลาเข้า"),
    visit_purpose: z.string().min(1, "กรุณาเลือกวัตถุประสงค์"),
    visit_purpose_note: z.string().optional(),
  })
  .refine(
    (data) =>
      data.visit_purpose !== "other" ||
      (data.visit_purpose_note && data.visit_purpose_note.trim().length > 0),
    {
      message: "กรุณาระบุวัตถุประสงค์เพิ่มเติม",
      path: ["visit_purpose_note"],
    },
  );

const visitPurposeOptions = [
  { value: "deliver_package", label: "ส่งของ" },
  { value: "installation", label: "ติดตั้ง" },
  { value: "repair", label: "ซ่อมแซม" },
  { value: "family_visit", label: "เยี่ยมเยียนครอบครัว / เพื่อน" },
  { value: "service_provider", label: "ช่างหรือผู้ให้บริการตามนัด" },
  { value: "admin_task", label: "ติดต่อสำนักงาน / งานเอกสาร" },
  { value: "transport", label: "บริการรับ-ส่ง / แท็กซี่" },
  { value: "cleaning", label: "ทำความสะอาด / แม่บ้าน" },
  { value: "other", label: "อื่นๆ (โปรดระบุ)" },
] as const;

interface ApprovalFormProps {
  userRoles?: Array<{
    role: string;
    village_id: string;
    village_name?: string;
    status: string;
    guard_id?: string;
  }>;
}

function ApprovalForm({ userRoles = [] }: ApprovalFormProps) {
  const router = useRouter();
  const [houses, setHouses] = useState<
    Array<{ house_id: string; address: string; village_id: string }>
  >([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    guard_id?: string;
    fname: string;
    lname: string;
    email: string;
    village_id: string;
  } | null>(null);
  const [villageName, setVillageName] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedIdCardImage, setCapturedIdCardImage] = useState<string | null>(
    null,
  );
  const [isProcessingIDCardOCR, setIsProcessingIDCardOCR] = useState(false);
  const [isProcessingLicensePlateOCR, setIsProcessingLicensePlateOCR] =
    useState(false);
  const [documentType, setDocumentType] = useState<
    "id_card" | "driver_license"
  >("id_card");
  const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<"car" | "idcard">(
    "car",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const idCardFileInputRef = useRef<HTMLInputElement>(null);
  const idCardCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { user } = getAuthData();
        if (user) {
          setCurrentUser(user);
        }
        const storedVillageName = sessionStorage.getItem("selectedVillageName");
        if (storedVillageName) {
          setVillageName(storedVillageName);
        }

        // Get village_id from user data or sessionStorage
        let villageId = user?.village_id;
        if (!villageId) {
          villageId = sessionStorage.getItem("selectedVillageId") || undefined;
        }

        if (!villageId) {
          console.error("No village_id found for guard", {
            user: user,
            sessionStorage: sessionStorage.getItem("selectedVillageId"),
          });
          alert("ไม่พบข้อมูลหมู่บ้าน กรุณาติดต่อผู้ดูแลระบบ");
          return;
        }

        const housesResponse = await axios.get(
          `/api/houses/liff?village_id=${encodeURIComponent(villageId)}`,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const houses = housesResponse.data?.data || [];
        setHouses(houses);

        // Get village name from the response
        const villageNameFromResponse = housesResponse.data?.village_name;
        if (villageNameFromResponse) {
          setVillageName(villageNameFromResponse);
        }

        console.log("🏠 Houses loaded:", {
          total: houses.length,
          village_id: villageId,
          village_name: villageNameFromResponse,
          houses: houses,
          response: housesResponse.data,
        });

        if (houses.length === 0) {
          console.warn("No houses found for village:", villageId);
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

  useEffect(() => {
    if (!currentUser) return;
    const matchingRole = userRoles
      .filter((role) => role.role === "guard")
      .find((role) => role.guard_id === currentUser.guard_id);

    if (matchingRole?.village_name) {
      setVillageName(matchingRole.village_name);
    }
    if (matchingRole?.village_id) {
      sessionStorage.setItem("selectedVillage", matchingRole.village_id);
      sessionStorage.setItem("selectedVillageId", matchingRole.village_id);
    }
    if (matchingRole?.village_name) {
      sessionStorage.setItem("selectedVillageName", matchingRole.village_name);
    }
  }, [userRoles, currentUser]);

  const handleNavigateToProfile = () => {
    router.push("/guard/profile");
  };

  const handleGoToRoleSelect = () => {
    router.push("/liff/select-role");
  };

  const getLocalDateTimeForInput = () => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

  const visitorForm = useForm<z.infer<typeof visitorSchema>>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      license_image: "",
      province: "",
      guard_id: currentUser?.guard_id || currentUser?.id,
      fname: "",
      lname: "",
      id_card_image: "",
      license_plate: "",
      visitor_id_card: "",
      house_id: "",
      entry_time: getLocalDateTimeForInput(),
      visit_purpose: visitPurposeOptions[0].value,
      visit_purpose_note: "",
    },
  });

  const selectedPurpose = visitorForm.watch("visit_purpose");

  useEffect(() => {
    if (selectedPurpose !== "other") {
      visitorForm.setValue("visit_purpose_note", "");
    }
  }, [selectedPurpose, visitorForm]);

  useEffect(() => {
    if (currentUser?.guard_id || currentUser?.id) {
      visitorForm.setValue("guard_id", currentUser.guard_id || currentUser.id);
    }
  }, [currentUser?.guard_id, currentUser?.id, visitorForm]);

  const [step, setStep] = useState<number>(1);
  const progress = step === 1 ? 25 : step === 2 ? 60 : 100;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{
    visitorId: string;
    visitorName: string;
    licensePlate: string;
  } | null>(null);
  useEffect(() => {
    const checkDevice = () => {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          ua,
        );
      setIsMobileDevice(
        isMobile || (typeof window !== "undefined" && window.innerWidth < 1024),
      );
    };
    checkDevice();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkDevice);
      return () => window.removeEventListener("resize", checkDevice);
    }
  }, []);

  const [houseQuery, setHouseQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const housesPerPage = 5;

  const filteredHouses = useMemo(
    () =>
      houses.filter((h) =>
        h.address.toLowerCase().includes(houseQuery.toLowerCase()),
      ),
    [houses, houseQuery],
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
        "fname",
        "lname",
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
    const fname = visitorForm.watch("fname");
    const lname = visitorForm.watch("lname");

    return (
      licensePlate?.trim() !== "" &&
      entryTime?.trim() !== "" &&
      fname?.trim() !== "" &&
      lname?.trim() !== ""
    );
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        visitorForm.setValue("license_image", result);

        // Process License Plate OCR
        setIsProcessingLicensePlateOCR(true);
        try {
          console.log("🚗 Processing license plate with OCR...");
          const { token } = getAuthData();

          const response = await axios.post(
            "/api/ocr/license-plate",
            { image: result },
            {
              withCredentials: true,
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          );

          if (response.data?.success && response.data?.data?.licensePlate) {
            const licensePlate = response.data.data.licensePlate;
            const vehicleInfo = response.data.data;

            console.log("✅ OCR extracted license plate:", licensePlate);
            console.log("🚗 Vehicle info:", vehicleInfo);

            // Auto-fill the license plate field
            visitorForm.setValue("license_plate", licensePlate);

            // Auto-fill province if available
            if (vehicleInfo.province) {
              // Extract Thai province name from format "th-14:Phra Nakhon Si Ayutthaya (พระนครศรีอยุธยา)"
              const provinceMatch = vehicleInfo.province.match(/\(([^)]+)\)/);
              const provinceName = provinceMatch
                ? provinceMatch[1]
                : vehicleInfo.province;
              visitorForm.setValue("province", provinceName);
              console.log("✅ OCR extracted province:", provinceName);
            }

            // Build vehicle info string
            // let infoText = `ระบบอ่านป้ายทะเบียนสำเร็จ!\nทะเบียน: ${licensePlate}`;
            // if (vehicleInfo.vehicleBrand || vehicleInfo.vehicleColor) {
            //   infoText += `\n`;
            //   if (vehicleInfo.vehicleColor) infoText += `สี: ${vehicleInfo.vehicleColor} `;
            //   if (vehicleInfo.vehicleBrand) infoText += `ยี่ห้อ: ${vehicleInfo.vehicleBrand}`;
            // }
            // if (vehicleInfo.province) {
            //   const provinceMatch = vehicleInfo.province.match(/\(([^)]+)\)/);
            //   const provinceName = provinceMatch ? provinceMatch[1] : vehicleInfo.province;
            //   infoText += `\nจังหวัด: ${provinceName}`;
            // }
            // if (vehicleInfo.confidence) {
            //   infoText += `\nความแม่นยำ: ${Math.round(vehicleInfo.confidence)}%`;
            // }

            // Show success message with vehicle info
            // alert(infoText);
          } else {
            console.warn("⚠️ OCR could not extract license plate");
            alert("ไม่สามารถอ่านป้ายทะเบียนได้ กรุณากรอกด้วยตนเอง");
          }
        } catch (error) {
          console.error("❌ License plate OCR processing failed:", error);
          if (axios.isAxiosError(error)) {
            const errorMessage =
              error.response?.data?.error || "ไม่สามารถอ่านป้ายทะเบียนได้";
            alert(`เกิดข้อผิดพลาด: ${errorMessage}\nกรุณากรอกทะเบียนด้วยตนเอง`);
          } else {
            alert("เกิดข้อผิดพลาดในการอ่านป้ายทะเบียน กรุณากรอกด้วยตนเอง");
          }
        } finally {
          setIsProcessingLicensePlateOCR(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdCardUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setCapturedIdCardImage(result);
        visitorForm.setValue("id_card_image", result);

        // Process OCR based on document type
        setIsProcessingIDCardOCR(true);
        try {
          const { token } = getAuthData();
          const apiEndpoint =
            documentType === "id_card"
              ? "/api/ocr/id-card"
              : "/api/ocr/driver-license";

          console.log(
            `🔍 Processing ${documentType === "id_card" ? "ID card" : "driver license"} with OCR...`,
          );

          const response = await axios.post(
            apiEndpoint,
            { image: result },
            {
              withCredentials: true,
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          );

          if (response.data?.success && response.data?.data) {
            const data = response.data.data;

            if (documentType === "id_card") {
              // Handle ID Card response
              const idNumber = data.idCardNumber;
              const firstName = data.thaiFirstName || "";
              const lastName = data.thaiLastName || "";

              console.log("✅ OCR extracted ID number:", idNumber);
              console.log("✅ OCR extracted name:", firstName, lastName);

              // Auto-fill the ID card number field
              if (idNumber) {
                visitorForm.setValue("visitor_id_card", idNumber);
              }

              // Auto-fill first name and last name if available
              if (firstName) {
                visitorForm.setValue("fname", firstName);
              }
              if (lastName) {
                visitorForm.setValue("lname", lastName);
              }
            } else {
              // Handle Driver License response
              const idCardNumber = data.idCardNumber; // ID card number from driver's license
              const firstName = data.thaiFirstName || "";
              const lastName = data.thaiLastName || "";

              console.log("✅ OCR extracted ID card number:", idCardNumber);
              console.log("✅ OCR extracted name:", firstName, lastName);

              // Auto-fill the ID card number
              if (idCardNumber) {
                visitorForm.setValue("visitor_id_card", idCardNumber);
              }

              // Auto-fill first name and last name if available
              if (firstName) {
                visitorForm.setValue("fname", firstName);
              }
              if (lastName) {
                visitorForm.setValue("lname", lastName);
              }
            }
          } else {
            console.warn("⚠️ OCR could not extract document data");
            alert(
              `ไม่สามารถอ่าน${documentType === "id_card" ? "บัตรประชาชน" : "ใบขับขี่"}ได้ กรุณากรอกด้วยตนเอง`,
            );
          }
        } catch (error) {
          console.error("❌ Document OCR processing failed:", error);
          if (axios.isAxiosError(error)) {
            const errorMessage =
              error.response?.data?.error ||
              `ไม่สามารถอ่าน${documentType === "id_card" ? "บัตร" : "ใบขับขี่"}ได้`;
            alert(
              `เกิดข้อผิดพลาดในการอ่าน${documentType === "id_card" ? "บัตร" : "ใบขับขี่"}: ${errorMessage}\nกรุณากรอกด้วยตนเอง`,
            );
          } else {
            alert(
              `เกิดข้อผิดพลาดในการอ่าน${documentType === "id_card" ? "บัตร" : "ใบขับขี่"} กรุณากรอกด้วยตนเอง`,
            );
          }
        } finally {
          setIsProcessingIDCardOCR(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openFileDialog = () => {
    setCurrentImageType("car");
    setShowImageSourceDialog(true);
  };

  const openIdCardFileDialog = () => {
    setCurrentImageType("idcard");
    setShowImageSourceDialog(true);
  };

  const handleImageSourceSelection = (source: "camera" | "file") => {
    setShowImageSourceDialog(false);

    if (currentImageType === "car") {
      if (source === "camera") {
        cameraInputRef.current?.click();
      } else {
        fileInputRef.current?.click();
      }
    } else {
      if (source === "camera") {
        idCardCameraInputRef.current?.click();
      } else {
        idCardFileInputRef.current?.click();
      }
    }
  };

  const clearImage = () => {
    setCapturedImage(null);
    visitorForm.setValue("license_image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const clearIdCardImage = () => {
    setCapturedIdCardImage(null);
    visitorForm.setValue("id_card_image", "");
    if (idCardFileInputRef.current) {
      idCardFileInputRef.current.value = "";
    }
    if (idCardCameraInputRef.current) {
      idCardCameraInputRef.current.value = "";
    }
  };

  async function onSubmit(data: z.infer<typeof visitorSchema>) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log("🚀 Submitting form data:", data);
      console.log("🔍 Guard ID being sent:", data.guard_id);

      const selectedPurposeOption = visitPurposeOptions.find(
        (option) => option.value === data.visit_purpose,
      );

      const visitPurposeText = selectedPurposeOption
        ? selectedPurposeOption.value === "other"
          ? `อื่นๆ: ${data.visit_purpose_note?.trim() ?? ""}`.trim()
          : selectedPurposeOption.label
        : data.visit_purpose;

      // Send to real API without authentication
      const payload: Record<string, unknown> = {
        visitorIDCard: data.visitor_id_card,
        fname: data.fname,
        lname: data.lname,
        houseId: data.house_id,
        licensePlate: data.license_plate,
        province: data.province?.trim() ? data.province : undefined,
        visitPurpose: visitPurposeText,
        guardId: data.guard_id,
        idDocType: documentType === "id_card" ? "thai_id" : "driver_license",
      };

      if (
        selectedPurposeOption?.value === "other" &&
        data.visit_purpose_note?.trim()
      ) {
        payload.visitPurposeNote = data.visit_purpose_note.trim();
      }
      payload.visitPurposeCode =
        selectedPurposeOption?.value || data.visit_purpose;

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
        // Store success data for the dialog
        setSuccessData({
          visitorId: response.data.visitorId || "N/A",
          visitorName: `${data.fname} ${data.lname}`,
          licensePlate: data.license_plate,
        });
        setShowSuccessDialog(true);

        // Reset form values and UI state for a new submission
        visitorForm.reset({
          license_image: "",
          province: "",
          guard_id: currentUser?.guard_id || currentUser?.id || "",
          id_card_image: "",
          fname: "",
          lname: "",
          license_plate: "",
          visitor_id_card: "",
          house_id: "",
          entry_time: getLocalDateTimeForInput(),
          visit_purpose: visitPurposeOptions[0].value,
          visit_purpose_note: "",
        });
        setStep(1);
        setCapturedImage(null);
        setCapturedIdCardImage(null);
        setHouseQuery("");
        setCurrentPage(1);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (cameraInputRef.current) {
          cameraInputRef.current.value = "";
        }
        if (idCardFileInputRef.current) {
          idCardFileInputRef.current.value = "";
        }
        if (idCardCameraInputRef.current) {
          idCardCameraInputRef.current.value = "";
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
              <h1 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2 slect-none pointer-events-none">
                <House className="w-5 h-5 sm:w-6 sm:h-6" /> ส่งคำขอเข้าเยี่ยม
              </h1>

              <span className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="h-9">
                  <a
                    href="/guard/visitors-in"
                    aria-label="Open visitors currently in village"
                    title="รายชื่อผู้เยี่ยมในหมู่บ้าน"
                  >
                    ผู้เยี่ยมในหมู่บ้าน
                  </a>
                </Button>

                <ModeToggle />
                <button
                  onClick={handleGoToRoleSelect}
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Go to role selection"
                  title="กลับไปเลือกบทบาท"
                >
                  <Shuffle className="w-5 h-5 text-foreground" />
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
            <p className="text-sm text-muted-foreground mb-3">
              กำลังปฏิบัติหน้าที่ดูแลหมู่บ้าน:{" "}
              <span className="font-medium text-foreground">
                {villageName ||
                  currentUser?.village_id ||
                  "ไม่พบข้อมูลหมู่บ้าน"}
              </span>
            </p>
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
                      onClick={
                        isProcessingLicensePlateOCR ? undefined : openFileDialog
                      }
                      className={`w-full max-h-[100%] rounded-lg border border-dashed overflow-hidden relative ${isProcessingLicensePlateOCR ? "cursor-wait" : "cursor-pointer hover:bg-muted"} transition-colors`}
                    >
                      {capturedImage ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={capturedImage}
                            alt="Uploaded"
                            className={`w-full h-full object-cover ${isProcessingLicensePlateOCR ? "opacity-50" : ""}`}
                          />
                          {isProcessingLicensePlateOCR && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                              <div className="text-center text-white">
                                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                                <p className="text-sm font-medium">
                                  กำลังอ่านป้ายทะเบียน...
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearImage();
                              }}
                              disabled={isProcessingLicensePlateOCR}
                              className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <div className="text-sm">
                            อัปโหลดรูปภาพรถ/ป้ายทะเบียน
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Hidden inputs for car image upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {visitorForm.formState.errors.license_image && (
                      <div className="text-sm text-red-600 text-center">
                        {visitorForm.formState.errors.license_image.message}
                      </div>
                    )}

                    {/* Document type selector */}
                    <div className="space-y-3">
                      <FormLabel className="text-base font-medium select-none">
                        ประเภทเอกสาร
                      </FormLabel>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentType("id_card");
                            // Clear previous image when switching types
                            setCapturedIdCardImage(null);
                            visitorForm.setValue("id_card_image", "");
                            visitorForm.setValue("visitor_id_card", "");
                          }}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${documentType === "id_card"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                            }`}
                        >
                          บัตรประชาชน
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentType("driver_license");
                            // Clear previous image when switching types
                            setCapturedIdCardImage(null);
                            visitorForm.setValue("id_card_image", "");
                            visitorForm.setValue("visitor_id_card", "");
                          }}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${documentType === "driver_license"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                            }`}
                        >
                          ใบขับขี่
                        </button>
                      </div>
                    </div>

                    {/* ID card/Driver license image upload */}
                    <FormLabel className="text-base font-medium select-none">
                      {documentType === "id_card"
                        ? "รูปภาพบัตรประชาชน"
                        : "รูปภาพใบขับขี่"}
                    </FormLabel>
                    <div
                      onClick={
                        isProcessingIDCardOCR ? undefined : openIdCardFileDialog
                      }
                      className={`w-full max-h-[100%] rounded-lg border border-dashed overflow-hidden relative ${isProcessingIDCardOCR ? "cursor-wait" : "cursor-pointer hover:bg-muted"} transition-colors`}
                    >
                      {capturedIdCardImage ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={capturedIdCardImage}
                            alt="ID Card"
                            className={`w-full h-full object-cover ${isProcessingIDCardOCR ? "opacity-50" : ""}`}
                          />
                          {isProcessingIDCardOCR && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                              <div className="text-center text-white">
                                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                                <p className="text-sm font-medium">
                                  {documentType === "id_card"
                                    ? "กำลังอ่านบัตรประชาชน..."
                                    : "กำลังอ่านใบขับขี่..."}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearIdCardImage();
                              }}
                              disabled={isProcessingIDCardOCR}
                              className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                documentType === "id_card"
                                  ? "ลบรูปบัตรประชาชน"
                                  : "ลบรูปใบขับขี่"
                              }
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
                          <div className="text-sm">
                            {documentType === "id_card"
                              ? "อัปโหลดรูปภาพบัตรประชาชน"
                              : "อัปโหลดรูปภาพใบขับขี่"}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Hidden inputs for ID card/driver license upload */}
                    <input
                      ref={idCardFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIdCardUpload}
                      className="hidden"
                    />
                    <input
                      ref={idCardCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
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
                    {/* License Plate and Province in the same row */}
                    <div className="grid grid-cols-2 gap-4">
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
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium select-none pointer-events-none">
                              จังหวัด
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="จังหวัด"
                                {...field}
                                className="h-12 text-base focus-visible:ring-ring"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                              placeholder={
                                documentType === "id_card"
                                  ? "เลขบัตรประชาชนผู้เข้าเยี่ยม (13 หลัก)"
                                  : "เลขใบขับขี่ผู้เข้าเยี่ยม (8 หลัก)"
                              }
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
                      name="fname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium select-none pointer-events-none">
                            ชื่อผู้เข้าเยี่ยม
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ชื่อ"
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
                      name="lname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium select-none pointer-events-none">
                            นามสกุลผู้เข้าเยี่ยม
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="นามสกุล"
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="เลือกวัตถุประสงค์" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {visitPurposeOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {selectedPurpose === "other" && (
                      <FormField
                        control={visitorForm.control}
                        name="visit_purpose_note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium select-none pointer-events-none">
                              โปรดระบุวัตถุประสงค์เพิ่มเติม
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="กรุณาระบุรายละเอียดวัตถุประสงค์"
                                {...field}
                                className="min-h-[90px] text-base focus-visible:ring-ring"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
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
                      ระบบจะตรวจเลขทะเบียน และหมายเลขบัตรประชาชนอัตโนมัติ
                      หากไม่แน่ใจสามารถแก้ไขได้ด้วยตนเอง
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
                            {currentUser?.village_id && (
                              <span className="text-base ml-2">
                                หมู่บ้าน:{" "}
                                {villageName || currentUser.village_id} <br />
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
                                        house.house_id,
                                      );
                                    }}
                                    className={`w-full text-left px-4 py-4 rounded-lg border flex items-center gap-3 ${visitorForm.watch("house_id") ===
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
                                        {currentUser?.village_id && (
                                          <p className="text-xs text-muted-foreground">
                                            หมู่บ้าน: {currentUser.village_id}
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
                                        Math.max(1, prev - 1),
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
                                        Math.min(totalPages, prev + 1),
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
                      className={`flex-1 h-12 text-base ${step === 2 && !isStep2Valid()
                          ? "bg-muted cursor-not-allowed text-muted-foreground"
                          : ""
                        }`}
                      disabled={isSubmitting || (step === 2 && !isStep2Valid())}
                    >
                      ต่อไป
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1 h-12 text-base"
                      disabled={isSubmitting}
                    >
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

      {/* Image Source Selection Dialog */}
      <AlertDialog
        open={showImageSourceDialog}
        onOpenChange={setShowImageSourceDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              เลือกวิธีการอัปโหลดรูปภาพ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {currentImageType === "car"
                ? "คุณต้องการอัปโหลดรูปภาพรถ/ป้ายทะเบียนอย่างไร?"
                : documentType === "id_card"
                  ? "คุณต้องการอัปโหลดรูปบัตรประชาชนอย่างไร?"
                  : "คุณต้องการอัปโหลดรูปใบขับขี่อย่างไร?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {isMobileDevice && (
              <Button
                onClick={() => handleImageSourceSelection("camera")}
                className="w-full h-14 text-base flex items-center justify-center gap-3"
                variant="default"
              >
                <Camera className="w-5 h-5" />
                ถ่ายรูป
              </Button>
            )}
            <Button
              onClick={() => handleImageSourceSelection("file")}
              className="w-full h-14 text-base flex items-center justify-center gap-3"
              variant="outline"
            >
              <ImageIcon className="w-5 h-5" />
              เลือกจากอุปกรณ์
            </Button>
            <AlertDialogCancel className="mt-2">ยกเลิก</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Notification Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center px-6">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-blue-800 dark:text-blue-200">
              ส่งคำขอสำเร็จ!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              คำขอได้ถูกส่งไปยังผู้อยู่อาศัยเรียบร้อยแล้ว
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Visitor Information */}
          <div className="space-y-3 px-6 pb-2">
            <div className="text-sm">
              <span className="font-medium text-foreground">ผู้เยี่ยม:</span>
              <span className="ml-2">{successData?.visitorName}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-foreground">ทะเบียน:</span>
              <span className="ml-2">{successData?.licensePlate}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-foreground">
                รหัสการเยี่ยม:
              </span>
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded ml-2 text-xs">
                {successData?.visitorId}
              </span>
            </div>
          </div>

          <div className="flex justify-center pt-2 px-6">
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              เข้าใจแล้ว
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export default ApprovalForm;
