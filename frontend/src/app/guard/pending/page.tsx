"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, RefreshCw, Shield, Home, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { switchUserRole } from "@/lib/liffAuth";

export default function GuardPendingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<Array<{role: string, village_id: string, village_name?: string, status: string}>>([]);
  const [guardData, setGuardData] = useState<any>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      if (!isAuthenticated()) {
        router.push('/liff');
        return;
      }

      const { user } = getAuthData();
      if (user) {
        setCurrentUser(user);
        setGuardData(user);
        
        // Check user roles
        try {
          const userId = user.lineUserId || user.id;
          if (userId) {
            const response = await fetch(`/api/users/roles?lineUserId=${userId}`, {
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
          }
        } catch (error) {
          console.error('Error checking user roles:', error);
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuthAndStatus();
  }, [router]);

  const handleRefresh = async () => {
    try {
      console.log("🔄 Refreshing guard status...");
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
    router.push("/liff?role=guard");
  };

  const handleSwitchToResident = async () => {
    if (isSwitchingRole) return;
    
    try {
      setIsSwitchingRole(true);
      const residentRole = userRoles.find(role => role.role === 'resident');
      
      if (!residentRole) {
        alert("คุณไม่มีบทบาทผู้อยู่อาศัย");
        return;
      }
      
      await handleRoleSwitchWithData(residentRole);
    } catch (error) {
      console.error("❌ Error in handleSwitchToResident:", error);
      alert("เกิดข้อผิดพลาดในการสลับบทบาท");
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const handleRoleSwitchWithData = async (residentRole: {status: string}) => {
    try {
      // Check resident role status and redirect accordingly
      if (residentRole.status === "verified") {
        console.log("✅ Resident role is verified, switching to resident main page");
        const result = await switchUserRole('resident');
        
        if (result.success) {
          console.log("✅ Successfully switched to resident role");
          router.push('/Resident');
        } else if (result.needsRedirect && result.redirectTo) {
          console.log(`🔄 Redirecting to ${result.redirectTo} first, then will redirect to LIFF`);
          router.push(result.redirectTo);
        } else {
          console.error("❌ Failed to switch to resident role:", result.error);
          alert(`ไม่สามารถสลับบทบาทได้: ${result.error}`);
        }
      } else if (residentRole.status === "pending") {
        console.log("⏳ Resident role is pending, redirecting to resident pending page");
        router.push('/Resident/pending');
      } else if (residentRole.status === "disable") {
        console.log("❌ Resident role is disabled, redirecting to LIFF with resident context");
        router.push("/liff?role=resident");
      } else {
        console.log("❌ Unknown resident role status, redirecting to LIFF with resident context");
        router.push("/liff?role=resident");
      }
    } catch (error) {
      console.error("❌ Error in handleRoleSwitchWithData:", error);
      alert("เกิดข้อผิดพลาดในการสลับบทบาท");
    }
  };

  // Check if user has resident role
  const hasResidentRole = userRoles.some(role => role.role === 'resident');

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 max-w-full xl:max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              รอการยืนยัน
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              บัญชีของคุณกำลังรอการตรวจสอบและยืนยันจากผู้ดูแลระบบ
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Status Card */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">สถานะบัญชี</CardTitle>
                      <CardDescription>ข้อมูลการยืนยันบัญชีของคุณ</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModeToggle />
                    {hasResidentRole && (
                      <button
                        onClick={handleSwitchToResident}
                        disabled={isSwitchingRole}
                        className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        aria-label="Go to Resident page"
                        title="ไปยังหน้าผู้อยู่อาศัย"
                      >
                        <Home className="w-5 h-5 text-foreground" />
                      </button>
                    )}
                    <button
                      onClick={() => router.push('/guard/profile')}
                      className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="Go to profile"
                      title="ไปยังโปรไฟล์"
                    >
                      <User className="w-5 h-5 text-foreground" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-orange-800 dark:text-orange-200">
                      <p className="font-medium mb-1">สถานะบัญชี: <span className="text-orange-700 dark:text-orange-300 font-bold">กำลังรอการยืนยัน</span></p>
                      <p>
                        ข้อมูลของคุณจะถูกตรวจสอบโดยผู้ดูแลระบบ 
                        คุณจะได้รับการแจ้งเตือนเมื่อบัญชีได้รับการยืนยันแล้ว
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={handleRefresh} 
                    className="w-full sm:w-auto"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    ตรวจสอบสถานะใหม่
                  </Button>
                  
                  <Button 
                    onClick={handleLogout} 
                    className="w-full sm:w-auto"
                    variant="destructive"
                  >
                    ออกจากระบบ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Info Card */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">ข้อมูลบัญชี</CardTitle>
                    <CardDescription>รายละเอียดบัญชีของคุณ</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {guardData ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                        <p className="text-sm font-medium text-foreground">{guardData.fname} {guardData.lname}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">อีเมล</p>
                        <p className="text-sm font-medium text-foreground">{guardData.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                        <p className="text-sm font-medium text-foreground">{guardData.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">หมู่บ้าน</p>
                        <p className="text-sm font-medium text-foreground">{guardData.village_name || "ไม่ระบุ"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                        <p className="text-sm font-medium text-foreground">ยามรักษาความปลอดภัย</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">สถานะ</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-sm font-medium text-orange-600 dark:text-orange-400 capitalize">
                            {guardData.status === 'pending' ? 'รอการยืนยัน' : guardData.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    </div>
  );
}