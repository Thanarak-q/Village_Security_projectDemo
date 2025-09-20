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
import { Upload, Home } from "lucide-react";
import Image from "next/image";

const visitorSchema = z.object({
  license_plate: z.string().min(1, "ต้องการเลขทะเบียน"),
  guard_name: z.string().min(1, "กรุณาระบุชื่อผู้รับผิดชอบ"),
  house_address: z.string().min(1, "กรุณาระบุบ้านเลขที่"),
  guard_email: z.string().min(1, "กรุณาระบุอีเมล").email("อีเมลไม่ถูกต้อง"),
  entry_time: z.string().min(1, "กรุณาระบุเวลาเข้า"),
  visit_purpose: z.string()
});

function ApprovalForm() {
  const [houseAddress, setHouseAddress] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHouseAddress = async () => {
      try {
        const res = await fetch("/api/houses", { credentials: "include" });
        if (!res.ok) return;
        const json: { success?: boolean; data?: Array<{ address?: string }> } = await res.json();
        const listRaw = json?.data;
        const addresses = Array.isArray(listRaw)
          ? listRaw.map((h) => h.address ?? "").filter((v): v is string => Boolean(v))
          : [];
        setHouseAddress(addresses);
      } catch (err) {
        console.log(err);
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

  const [houseQuery, setHouseQuery] = useState("");
  const filteredHouses = useMemo(
    () =>
      houseAddress.filter((h) =>
        String(h).toLowerCase().includes(houseQuery.toLowerCase())
      ),
    [houseAddress, houseQuery]
  );

  const goNext = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
    }
  };

  const goBack = () => {
    if (step === 1) return;
    setStep((s) => Math.max(1, s - 1));
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };


  async function onSubmit() {
    //code body
  }

  return (
    <>
      {/*การ์ดแสดงส่วนของฟอร์ม*/}
      <div className="container mx-auto p-6 max-w-3xl">
        <Card className="border border-blue-200 shadow-sm">
          <CardHeader>
            {/*ชื่อของฟอร์ม*/}
            <CardTitle className="text-xl font-semibold ">{`Send Visitor • Step ${step} / 3`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Progress value={progress} className="h-2 bg-blue-100" />
            </div>
            <Form {...visitorForm}>
              <form onSubmit={visitorForm.handleSubmit(onSubmit)} className="space-y-6">
                 {step === 1 && (
                   <div className="space-y-4">
                     <div className="w-full h-56 rounded-lg border border-dashed border-blue-300/70 overflow-hidden relative bg-gray-50">
                       {capturedImage ? (
                         <Image 
                           src={capturedImage} 
                           alt="Uploaded" 
                           className="object-cover w-full h-full"
                           width={400}
                           height={224}
                           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                         />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-blue-500">
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
                     
                     <div className="flex gap-4">
                       {capturedImage ? (
                         <Button 
                           type="button" 
                           onClick={openFileDialog}
                           className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
                         >
                           <Upload className="w-4 h-4 mr-2" />
                           อัปโหลดใหม่
                         </Button>
                       ) : (
                         <Button 
                           type="button" 
                           onClick={openFileDialog}
                           className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
                         >
                           <Upload className="w-4 h-4 mr-2" />
                           อัปโหลดรูปภาพ
                         </Button>
                       )}
                     </div>
                     
                     <div className="text-xs text-muted-foreground text-center">
                       * อัปโหลดรูปภาพของรถยนต์/หมายเลขทะเบียน
                     </div>
                   </div>
                 )}

                {step === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={visitorForm.control}
                      name="license_plate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">เลขทะเบียน</FormLabel>
                          <FormControl>
                            <Input placeholder="เช่น กข 1234" {...field} className="h-12 text-base focus-visible:ring-blue-500" />
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
                          <FormLabel className="text-base font-medium">วัตถุประสงค์</FormLabel>
                          <FormControl>
                            <Textarea placeholder="ส่งของ / ติดตั้ง / ซ่อม" {...field} className="min-h-[90px] text-base focus-visible:ring-blue-500" />
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
                            <FormLabel className="text-base font-medium">ชื่อเจ้าหน้าที่</FormLabel>
                            <FormControl>
                              <Input placeholder="ชื่อผู้รับผิดชอบ" {...field} className="h-12 text-base focus-visible:ring-blue-500" />
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
                            <FormLabel className="text-base font-medium">อีเมลเจ้าหน้าที่</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="example@gmail.com" {...field} className="h-12 text-base focus-visible:ring-blue-500" />
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
                            <FormLabel className="text-base font-medium">เวลาเข้า</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} readOnly className="h-12 text-base bg-blue-50/60 select-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-sm rounded-md bg-blue-50 text-blue-900 p-3 border border-blue-100">
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
                              ? "border-blue-500 bg-blue-50"
                              : "border-blue-100 hover:border-blue-300"
                          }`}
                        >
                           <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
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
                  <Button type="button" variant="secondary" onClick={goBack} className="flex-1 h-12 text-base border-1 bg-transparent hover:bg-blue-100">Back</Button>
                  {step < 3 ? (
                    <Button type="button" onClick={goNext} className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white">Next</Button>
                  ) : (
                    <Button type="submit" className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white">Send</Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

    </>
  );
}
export default ApprovalForm;
