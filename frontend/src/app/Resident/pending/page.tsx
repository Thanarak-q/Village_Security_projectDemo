"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, RefreshCw, Home, Shield, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function ResidentPendingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<Array<{role: string, village_key: string, village_name?: string}>>([]);

  useEffect(() => {
    const checkAuthAndStatus = () => {
      console.log("🏠 Resident pending page - checking authentication and status");
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log("❌ User not authenticated, redirecting to LIFF");
        router.push("/liff");
        return;
      }

      // Get user data and check status
      const { user } = getAuthData();
      console.log("🔍 Resident pending - user data:", user);
      
      if (!user) {
        console.log("❌ No user data found, redirecting to LIFF");
        router.push("/liff");
        return;
      }

      // Check if user has resident role (they might have multiple roles)
      // We'll check this after fetching roles, so for now just continue
      console.log("🔍 User found, checking resident status...");

      // Debug: Log user status
      console.log("🔍 Resident pending - status check:", {
        status: user.status,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role
      });

      // Check if user is verified
      if (user.status === "verified") {
        console.log("✅ Resident is verified, redirecting to main page");
        router.push("/Resident");
        return;
      }

      // If user is disabled
      if (user.status === "disable") {
        console.log("❌ Resident is disabled, redirecting to login");
        router.push("/liff");
        return;
      }

      // User is pending - show pending page
      console.log("⏳ Resident is pending, showing pending page");
      setCurrentUser(user);
      setIsCheckingAuth(false);
    };

    checkAuthAndStatus();
  }, [router]);

  // Fetch user roles to check if they have resident role and guard role
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (currentUser) {
        // Try different possible ID fields from LIFF user data
        const userId = currentUser.lineUserId || currentUser.id;
        console.log("🔍 Attempting to fetch roles for user ID:", userId);
        console.log("🔍 Current user object:", currentUser);
        
        if (userId) {
          try {
            const apiUrl = '';
            const response = await fetch(`${apiUrl}/api/users/roles?lineUserId=${userId}`, {
              credentials: 'include'
            });
            
            console.log("🔍 Roles API response status:", response.status);
            
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                console.log("🔍 Roles API response data:", data);
                
                if (data.success && data.roles) {
                  setUserRoles(data.roles);
                  
                  // Check if user has resident role
                  const hasResidentRole = data.roles.some((role: any) => role.role === 'resident');
                  if (!hasResidentRole) {
                    console.log("❌ User does not have resident role, but allowing access for testing");
                    // Temporarily allow access for testing - remove this in production
                    console.log("⚠️ TEMPORARY: Allowing access without resident role for testing");
                    // router.push("/liff");
                    // return;
                  }
                  
                  console.log("✅ User has resident role, continuing to pending page");
                } else {
                  console.log("❌ No roles found or API error, but allowing access for testing");
                  // Temporarily allow access for testing - remove this in production
                  console.log("⚠️ TEMPORARY: Allowing access without roles for testing");
                  // router.push("/liff");
                  // return;
                }
              }
            } else {
              console.log("❌ Roles API failed with status:", response.status);
              // Temporarily allow access for testing - remove this in production
              console.log("⚠️ TEMPORARY: Allowing access despite API failure for testing");
              // router.push("/liff");
              // return;
            }
          } catch (error) {
            console.error('Error fetching user roles:', error);
            // Temporarily allow access for testing - remove this in production
            console.log("⚠️ TEMPORARY: Allowing access despite error for testing");
            // router.push("/liff");
            // return;
          }
        } else {
          console.log("❌ No user ID found, but allowing access for testing");
          // Temporarily allow access for testing - remove this in production
          console.log("⚠️ TEMPORARY: Allowing access without user ID for testing");
          // router.push("/liff");
          // return;
        }
      }
    };

    fetchUserRoles();
  }, [currentUser, router]);

  const handleSwitchToGuard = () => {
    router.push('/guard');
  };

  const handleNavigateToProfile = () => {
    router.push('/Resident/profile');
  };

  // Check if user has guard role
  const hasGuardRole = userRoles.some(role => role.role === 'guard');

  const handleRefresh = async () => {
    try {
      console.log("🔄 Refreshing resident status...");
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
    router.push("/liff");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">กำลังตรวจสอบสถานะ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Header inside main content */}
        <div className="px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
              <Home className="w-6 h-6 sm:w-7 sm:h-7" />
              รอการยืนยัน
            </h1>
            <span className="flex items-center gap-2">
              <ModeToggle />
              {hasGuardRole && (
                <button
                  onClick={handleSwitchToGuard}
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Switch to Guard role"
                  title="สลับไปยังหน้ายามรักษาความปลอดภัย"
                >
                  <Shield className="w-5 h-5 text-foreground" />
                </button>
              )}
              <button
                onClick={handleNavigateToProfile}
                className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Go to profile"
              >
                <User className="w-5 h-5 text-foreground" />
              </button>
            </span>
          </div>
        </div>

        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-green-100 rounded-full flex items-center justify-center">
            <Home className="h-8 w-8 text-blue-600 dark:text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-white-900">
            รอการยืนยัน
          </CardTitle>
          <CardDescription className="text-white-600">
            บัญชีของคุณกำลังรอการตรวจสอบและยืนยันจากผู้ดูแลระบบ
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">      
          <div className="bg-blue-100 dark:bg-green-100 border border-blue-300 dark:border-green-300 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-700 dark:text-green-700 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-green-900">
                <p className="font-medium mb-1 text-bold">สถานะบัญชี: <span className="text-red-600 dark:text-red-600 font-bold">กำลังรอการยืนยัน</span></p>
                <p>
                  ข้อมูลของคุณจะถูกตรวจสอบโดยผู้ดูแลระบบ 
                  คุณจะได้รับการแจ้งเตือนเมื่อบัญชีได้รับการยืนยันแล้ว
                </p>
              </div>
            </div>
          </div>

          {currentUser && (
            <div className="bg-blue-50 dark:bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">ข้อมูลที่ส่งไป</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">ชื่อ:</span> {currentUser.fname} {currentUser.lname}</p>
                <p><span className="font-medium">อีเมล:</span> {currentUser.email}</p>
                <p><span className="font-medium">เบอร์โทร:</span> {currentUser.phone}</p>
                <p><span className="font-medium">หมู่บ้าน:</span> {currentUser.village_key}</p>
                <p><span className="font-medium">ตำแหน่ง:</span> ผู้อยู่อาศัย</p>
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
