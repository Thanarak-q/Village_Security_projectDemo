"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const addStaffSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"),
});

type AddStaffFormData = z.infer<typeof addStaffSchema>;

interface AddStaffFormProps {
  villageKey: string;
  villageName: string;
  onStaffAdded: (staff: StaffMember) => void;
}

interface StaffMember {
  admin_id: string;
  username: string;
  status: "verified" | "pending" | "disable";
  role: string;
  created_at: string;
  updated_at: string;
  village_key: string;
  village_name: string;
}

export function AddStaffForm({ villageKey, villageName, onStaffAdded }: AddStaffFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(true); // แสดง password ตั้งแต่แรก
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddStaffFormData>({
    resolver: zodResolver(addStaffSchema),
  });

  const onSubmit = async (data: AddStaffFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/staff/add-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: data.username,
          village_key: villageKey,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedCredentials({
          username: result.data.username,
          password: result.data.password,
        });
        onStaffAdded(result.data);
        reset();
        toast.success("เพิ่มนิติบุคคลสำเร็จ");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการเพิ่มนิติบุคคล");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("คัดลอกแล้ว");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  const handleNewStaff = () => {
    setGeneratedCredentials(null);
    reset();
  };

  return (
    <div className="space-y-6">
      {generatedCredentials ? (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              เพิ่มนิติบุคคลสำเร็จ
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              ข้อมูลเข้าสู่ระบบสำหรับนิติบุคคลใหม่
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">ชื่อผู้ใช้ (Username)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedCredentials.username}
                    readOnly
                    className="bg-white dark:bg-gray-800"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCredentials.username, "username")}
                  >
                    {copiedField === "username" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">รหัสผ่าน (Password)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={generatedCredentials.password}
                    readOnly
                    className="bg-whi e dark:bg-gray-800"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCredentials.password, "password")}
                  >
                    {copiedField === "password" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>คำเตือน:</strong> กรุณาบันทึกข้อมูลเข้าสู่ระบบนี้ไว้ในที่ปลอดภัย 
                เนื่องจากจะไม่สามารถดูรหัสผ่านได้อีกครั้ง
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleNewStaff} variant="outline" className="flex-1">
                เพิ่มนิติบุคคลใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">ชื่อผู้ใช้ (Username) *</Label>
            <Input
              id="username"
              {...register("username")}
              placeholder="กรอกชื่อผู้ใช้ (จะถูกเติม staff_ นำหน้า)"
              className={errors.username ? "border-red-500" : ""}
            />
            <p className="text-sm text-muted-foreground">
              ชื่อผู้ใช้จริงจะเป็น: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">staff_[ชื่อที่กรอก]</span>
            </p>
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>หมู่บ้าน</Label>
            <Input
              value={villageName}
              disabled
              className="bg-gray-50 dark:bg-gray-800"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเพิ่ม...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  เพิ่มนิติบุคคล
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}