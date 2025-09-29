"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, RefreshCw, Shield, Home, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function GuardPendingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<Array<{role: string, village_key: string, village_name?: string, status: string}>>([]);
  const [guardData, setGuardData] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndStatus = () => {
      console.log("🛡️ Guard pending page - checking authentication and status");
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log("❌ User not authenticated, redirecting to LIFF with guard context");
        // Pass guard role context to LIFF page
        router.push("/liff?role=guard");
        return;
      }

      // Get user data and check status
      const { user } = getAuthData();
      console.log("🔍 Guard pending - user data:", user);
      
      if (!user) {
        console.log("❌ No user data found, redirecting to LIFF with guard context");
        router.push("/liff?role=guard");
        return;
      }

      // Check if user has guard role (they might have multiple roles)
      // We'll check this after fetching roles, so for now just continue
      console.log("🔍 User found, checking guard status...");
      
      // For now, let's allow the user to continue and check roles later
      // This prevents immediate redirect for users with multiple roles

      // Debug: Log user status
      console.log("🔍 Guard pending - status check:", {
        status: user.status,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role
      });

      // Basic user authentication check - detailed role checking will be done in roles fetch
      console.log("✅ User authenticated, will check guard role status in roles fetch");
      setCurrentUser(user);
      // Don't set isCheckingAuth to false yet - wait for role verification
    };

    checkAuthAndStatus();
  }, [router]);

  // Fetch user roles to check if they have guard role and resident role
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (currentUser) {
        // Try different possible ID fields from LIFF user data
        const userId = currentUser.lineUserId || currentUser.id;
        console.log("🔍 Attempting to fetch roles for user ID:", userId);
        console.log("🔍 Current user object:", currentUser);
        
        if (userId) {
        try {
          const { token } = getAuthData();
          const apiUrl = '';
          const response = await fetch(`${apiUrl}/api/users/roles?lineUserId=${userId}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
            
            console.log("🔍 Roles API response status:", response.status);
            
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                console.log("🔍 Roles API response data:", data);
                
                if (data.success && data.roles) {
                  setUserRoles(data.roles);
                  
                  // Check if user has guard role and its status
                  const guardRole = data.roles.find((role: any) => role.role === 'guard');
                  const hasResidentRole = data.roles.some((role: any) => role.role === 'resident');
                  
                  console.log("🔍 Guard pending - guardRole:", guardRole);
                  console.log("🔍 Guard pending - hasResidentRole:", hasResidentRole);
                  
                  if (!guardRole) {
                    console.log("❌ User does not have guard role, redirecting to LIFF with guard context");
                    router.push("/liff?role=guard");
                    return;
                  }
                  
                  // Check if guard role is verified - if so, redirect to main page
                  if (guardRole.status === "verified") {
                    console.log("✅ Guard role is verified, redirecting to main page");
                    router.push("/guard");
                    return;
                  }
                  
                  // Check if guard role is disabled
                  if (guardRole.status === "disable") {
                    console.log("❌ Guard role is disabled, redirecting to LIFF with guard context");
                    router.push("/liff?role=guard");
                    return;
                  }
                  
                  // Guard role is pending - show pending page
                  console.log("⏳ Guard role is pending, showing pending page");
                  
                  // Set guard-specific data for display
                  setGuardData({
                    fname: guardRole.fname || currentUser.fname,
                    lname: guardRole.lname || currentUser.lname,
                    email: guardRole.email || currentUser.email,
                    phone: guardRole.phone || currentUser.phone,
                    village_key: guardRole.village_key || currentUser.village_key,
                    village_name: guardRole.village_name || currentUser.village_name,
                    status: guardRole.status
                  });
                  
                  setIsCheckingAuth(false);
                  
                  // Store role information for potential role switching
                  if (hasResidentRole) {
                    console.log("🔄 User has both roles - role switching available");
                  }
                } else {
                  console.log("❌ No roles found or API error, redirecting to LIFF with guard context");
                  router.push("/liff?role=guard");
                  return;
                }
              }
            } else {
              console.log("❌ Roles API failed with status:", response.status);
              router.push("/liff?role=guard");
              return;
            }
          } catch (error) {
            console.error('Error fetching user roles:', error);
            router.push("/liff?role=guard");
            return;
          }
        } else {
          console.log("❌ No user ID found, redirecting to LIFF with guard context");
          router.push("/liff?role=guard");
          return;
        }
      }
    };

    fetchUserRoles();
  }, [currentUser, router]);

  const handleSwitchToResident = async () => {
    // Check if user has resident role and its status before switching
    const residentRole = userRoles.find(role => role.role === 'resident');
    console.log("🔍 Current userRoles:", userRoles);
    console.log("🔍 Found residentRole:", residentRole);
    
    // If userRoles is empty or doesn't have resident role, try to fetch fresh data
    if (!residentRole || userRoles.length === 0) {
      console.log("⚠️ No resident role found in userRoles, attempting to fetch fresh roles data...");
      
      try {
        const { user, token } = getAuthData();
        if (user?.lineUserId || user?.id) {
          const userId = user.lineUserId || user.id;
          const apiUrl = '';
          const response = await fetch(`${apiUrl}/api/users/roles?lineUserId=${userId}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              console.log("🔍 Fresh roles data:", data);
              
              if (data.success && data.roles) {
                const freshResidentRole = data.roles.find((role: any) => role.role === 'resident');
                console.log("🔍 Fresh residentRole:", freshResidentRole);
                
                if (freshResidentRole) {
                  // Use the fresh data for role switching
                  return handleResidentRoleSwitchWithData(freshResidentRole);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ Error fetching fresh roles data:", error);
      }
      
      console.log("❌ User does not have resident role, redirecting to LIFF with resident context");
      router.push("/liff?role=resident");
      return;
    }
    
    // Use the found resident role
    handleResidentRoleSwitchWithData(residentRole);
  };

  const handleResidentRoleSwitchWithData = (residentRole: any) => {
    // Check resident role status and redirect accordingly
    if (residentRole.status === "verified") {
      console.log("✅ Resident role is verified, redirecting to resident main page");
      router.push('/Resident');
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
  };

  const handleNavigateToProfile = () => {
    router.push('/guard/profile');
  };

  // Check if user has resident role
  const hasResidentRole = userRoles.some(role => role.role === 'resident');

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
              <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
              รอการยืนยัน
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
        </div>

        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600 dark:text-green-600" />
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

          {guardData && (
            <div className="bg-blue-50 dark:bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">ข้อมูลที่ส่งไป</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">ชื่อ:</span> {guardData.fname} {guardData.lname}</p>
                <p><span className="font-medium">อีเมล:</span> {guardData.email}</p>
                <p><span className="font-medium">เบอร์โทร:</span> {guardData.phone}</p>
                <p><span className="font-medium">หมู่บ้าน:</span> {guardData.village_name || guardData.village_key}</p>
                <p><span className="font-medium">ตำแหน่ง:</span> รปภ.</p>
                <p><span className="font-medium">สถานะ:</span> <span className="font-bold text-red-600">{guardData.status}</span></p>
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
