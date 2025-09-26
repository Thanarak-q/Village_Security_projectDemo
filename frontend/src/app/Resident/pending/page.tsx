"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";

export default function ResidentPendingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndStatus = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push("/liff/resident");
        return;
      }

      // Get user data and check status
      const { user } = getAuthData();
      if (!user || user.role !== "resident") {
        if (user?.role === "guard") {
          router.push("/liff/guard");
        } else {
          router.push("/liff/resident");
        }
        return;
      }

      // Check if user is verified
      if (user.status === "verified") {
        router.push("/Resident");
        return;
      }

      // If user is disabled
      if (user.status === "disable") {
        router.push("/liff/resident");
        return;
      }

      // User is pending - show pending page
      setCurrentUser(user);
      setIsCheckingAuth(false);
    };

    checkAuthAndStatus();
  }, [router]);

  const handleRefresh = async () => {
    try {
      // Clear cached data
      localStorage.removeItem('liffUser');
      localStorage.removeItem('liffToken');
      
      // Force reload to get fresh data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing:', error);
      window.location.reload();
    }
  };

  const handleLogout = () => {
    // Clear auth data and redirect to login
    localStorage.clear();
    router.push("/liff/resident");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">กำลังตรวจสอบสถานะ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            รอการยืนยัน
          </CardTitle>
          <CardDescription className="text-gray-600">
            บัญชีของคุณกำลังรอการตรวจสอบและยืนยันจากผู้ดูแลระบบ
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">สถานะบัญชี: กำลังรอการยืนยัน</p>
                <p>
                  ข้อมูลของคุณจะถูกตรวจสอบโดยผู้ดูแลระบบ 
                  คุณจะได้รับการแจ้งเตือนเมื่อบัญชีได้รับการยืนยันแล้ว
                </p>
              </div>
            </div>
          </div>

          {currentUser && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">ข้อมูลที่ส่งไป</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">ชื่อ:</span> {currentUser.fname} {currentUser.lname}</p>
                <p><span className="font-medium">อีเมล:</span> {currentUser.email}</p>
                <p><span className="font-medium">เบอร์โทร:</span> {currentUser.phone}</p>
                <p><span className="font-medium">หมู่บ้าน:</span> {currentUser.village_key}</p>
                <p><span className="font-medium">สถานะ:</span> <span className="font-bold text-red-600">{currentUser.status}</span></p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              ตรวจสอบสถานะใหม่
            </Button>
            
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              ออกจากระบบ
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>หากมีคำถาม กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
