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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

import { useForm } from "react-hook-form";
import { useMemo, useState, useEffect, useRef } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Home, House } from "lucide-react";
import axios from "axios";
import { ModeToggle } from "@/components/mode-toggle";

const visitorSchema = z.object({
  picture_key: z.string().optional(),
  license_plate: z.string()
    .min(1, "กรุณาระบุเลขทะเบียน")
    .regex(/^[ก-๙A-Za-z0-9\s-]+$/, "เลขทะเบียนไม่สามารถใช้อักษรพิเศษได้"),
  guard_name: z.string()
    .min(1, "กรุณาระบุชื่อผู้รับผิดชอบ")
    .regex(/^[ก-๙A-Za-z\s]+$/, "ชื่อไม่สามารถใช้อักษรพิเศษได้"),
  house_address: z.string()
    .min(1, "กรุณาระบุบ้านเลขที่"),
  guard_email: z.string().min(1, "กรุณาระบุอีเมล").email("อีเมลไม่ถูกต้อง"),
  entry_time: z.string().min(1, "กรุณาระบุเวลาเข้า"),
  visit_purpose: z.string()
    .optional()
});

function ApprovalForm() {
  const [houseAddress, setHouseAddress] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHouseAddress = async () => {
      try {
        const response = await axios.get("/api/houses", { 
          withCredentials: true 
        });
        
        const json = response.data;
        const listRaw = json?.data;
        const addresses = Array.isArray(listRaw)
          ? listRaw.map((h) => h.address ?? "").filter((v): v is string => Boolean(v))
          : [];
        setHouseAddress(addresses);
      } catch (err) {
        console.log("Error fetching house addresses:", err);
      }
    };
    fetchHouseAddress();
  }, []);
  
  const getLocalDateTimeForInput = () => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

  const visitorForm = useForm<z.infer<typeof visitorSchema>>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      picture_key: "",
      license_plate: "",
      guard_name: "",      
      house_address: "",
      guard_email: "",
      entry_time: getLocalDateTimeForInput(),
      visit_purpose: "",
    },
  });

  const [step, setStep] = useState<number>(1);
  const progress = step === 1 ? 25 : step === 2 ? 60 : 100;

  useEffect(() => {
    if (step === 3 && houseAddress.length > 0 && !visitorForm.getValues("house_address")) {
      visitorForm.setValue("house_address", houseAddress[0]);
    }
  }, [step, houseAddress, visitorForm]);

  const [houseQuery, setHouseQuery] = useState("");
  const filteredHouses = useMemo(
    () =>
      houseAddress.filter((h) =>
        String(h).toLowerCase().includes(houseQuery.toLowerCase())
      ),
    [houseAddress, houseQuery]
  );

  const goNext = async () => {
    if (step === 1) {
      setStep(2);
    }
    if (step === 2) {
      const isValid = await visitorForm.trigger(["license_plate", "guard_name", "guard_email", "entry_time"]);
      if (!isValid) {
        return;
      }
      
      if (houseAddress.length > 0) {
        visitorForm.setValue("house_address", houseAddress[0]);
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
    const guardName = visitorForm.watch("guard_name");
    const guardEmail = visitorForm.watch("guard_email");
    const entryTime = visitorForm.watch("entry_time");
    
    return (
      licensePlate?.trim() !== "" &&
      guardName?.trim() !== "" &&
      guardEmail?.trim() !== "" &&
      entryTime?.trim() !== ""
    );
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        visitorForm.setValue("picture_key", result);
        // console.log(visitorForm.getValues("picture_key"));
      };
      reader.readAsDataURL(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setCapturedImage(null);
    visitorForm.setValue("picture_key", "");
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function onSubmit() {
    //code body
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 max-w-full xl:max-w-4xl">
        {/* Form Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <House className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">Send Visitor</div>
                    <div className="text-sm text-muted-foreground">Step {step} of 3</div>
                  </div>
                </div>
              </CardTitle>
              <ModeToggle />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Progress value={progress} className="h-2 bg-muted" />
            </div>
            <Form {...visitorForm}>
              <form onSubmit={visitorForm.handleSubmit(onSubmit)} className="space-y-6">
                 {step === 1 && (
                   <div className="space-y-4">
                     <div 
                       onClick={openFileDialog}
                       className="w-full min-full max-h-[100%] rounded-lg border border-dashed border-border overflow-hidden relative bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
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
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                               </svg>
                             </button>
                           </div>
                         </>
                       ) : (
                         <div className="w-full h-72 flex flex-col items-center justify-center text-muted-foreground">
                           <Upload className="w-16 h-16 mb-2" />
                           <div className="text-sm">อัปโหลดรูปภาพ</div>
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
                     
                     <div className="text-xs text-muted-foreground text-center">
                       * อัปโหลดรูปภาพของรถยนต์/หมายเลขทะเบียน
                     </div>
                     {visitorForm.formState.errors.picture_key && (
                       <div className="text-sm text-red-600 text-center">
                         {visitorForm.formState.errors.picture_key.message}
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
                          <FormLabel className="text-base font-medium select-none pointer-events-nones">เลขทะเบียน</FormLabel>
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
                      name="visit_purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium select-none pointer-events-none">วัตถุประสงค์</FormLabel>
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
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={visitorForm.control}
                        name="guard_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium select-none pointer-events-none">ชื่อเจ้าหน้าที่</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ชื่อผู้รับผิดชอบ" 
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
                        name="guard_email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-base font-medium select-none pointer-events-none">อีเมลเจ้าหน้าที่</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="example@gmail.com" {...field} className="h-12 text-base focus-visible:ring-ring" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={visitorForm.control}
                        name="entry_time"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-base font-medium select-none pointer-events-none">เวลาเข้า</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} readOnly className="h-12 text-base bg-muted/60 select-none pointer-events-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-sm rounded-md bg-muted/50 text-muted-foreground p-3 border border-border">
                      ระบบจะตรวจเลขทะเบียนอัตโนมัติ หากไม่แน่ใจ สามารถแก้ไขได้ด้วยตนเอง
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <Input
                      placeholder="ค้นหาด้วยเลขที่บ้าน"
                      value={houseQuery}
                      onChange={(e) => setHouseQuery(e.target.value)}
                      className="h-12 text-base"
                    />
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {filteredHouses.map((house) => (
                        <button
                          key={house}
                          type="button"
                          onClick={() => visitorForm.setValue("house_address", house)}
                          className={`w-full text-left px-4 py-4 rounded-lg border flex items-center gap-3 ${
                            visitorForm.watch("house_address") === house
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-ring"
                          }`}
                        >
                           <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                             <Home className="w-4 h-4" />
                           </span>
                          <span className="font-medium">บ้าน {house}</span>
                        </button>
                      ))}
                    </div>

                    {/* No hidden fields; all additional fields moved to Step 2 */}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="outline" onClick={goBack} className="flex-1 h-12 text-base">กลับ</Button>
                  {step < 3 ? (
                    <Button 
                      type="button" 
                      onClick={goNext} 
                      className={`flex-1 h-12 text-base ${
                        step === 2 && !isStep2Valid()
                          ? 'bg-muted cursor-not-allowed text-muted-foreground' 
                          : ''
                      }`}
                      disabled={step === 2 && !isStep2Valid()}
                    >
                      ต่อไป
                    </Button>
                  ) : (
                    <Button type="submit" className="flex-1 h-12 text-base">ยืนยัน</Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default ApprovalForm;
