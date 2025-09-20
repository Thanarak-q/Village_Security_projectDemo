"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccessDeniedProps {
  userRole?: string;
  requiredRole?: string;
}

export default function AccessDenied({ 
  userRole = "ไม่ระบุ", 
  requiredRole = "Super Admin" 
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            เข้าถึงไม่ได้
          </CardTitle>
          <CardDescription className="text-base">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4">
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">รายละเอียด:</p>
              <ul className="space-y-1 text-sm">
                <li>• บทบาทปัจจุบัน: <span className="font-medium">{userRole}</span></li>
                <li>• บทบาทที่ต้องการ: <span className="font-medium">{requiredRole}</span></li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => router.push("/dashboard")} 
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              ไปยัง Dashboard ปกติ
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.back()} 
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับหน้าก่อนหน้า
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
