"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Shield, ArrowLeft, Home, Loader2, Clock } from "lucide-react";
import { getAuthData, switchUserRole } from "@/lib/liffAuth";
import { LiffService } from "@/lib/liff";
import { ModeToggle } from "@/components/mode-toggle";

interface UserRole {
  role: string;
  village_id: string;
  village_name?: string;
  status?: string;
}

export default function SelectRolePage() {
  const router = useRouter();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      const { user } = getAuthData();
      if (user) {
        const userId = user.lineUserId || user.id;
        console.log("🔍 Select role page - fetching roles for user ID:", userId);
        
        if (userId) {
          try {
            // Ensure we have a valid token before making API calls
            const svc = LiffService.getInstance();
            const validToken = await svc.ensureValidToken();
            if (!validToken) {
              console.warn("⚠️ No valid token available, redirecting to LIFF");
              router.push('/liff');
              return;
            }

            const response = await fetch(`/api/users/roles?lineUserId=${userId}`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                console.log("🔍 Select role page - roles API response:", data);
                
                if (data.success && data.roles) {
                  setUserRoles(data.roles);
                } else {
                  setError("ไม่พบข้อมูลบทบาท");
                }
              } else {
                setError("ได้รับข้อมูลที่ไม่ถูกต้องจากเซิร์ฟเวอร์");
              }
            } else {
              setError("เกิดข้อผิดพลาดในการดึงข้อมูลบทบาท");
            }
          } catch (error) {
            console.error('Error fetching user roles:', error);
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
          }
        } else {
          setError("ไม่พบข้อมูลผู้ใช้");
        }
      } else {
        setError("ไม่พบข้อมูลการเข้าสู่ระบบ");
      }
      setLoading(false);
    };

    fetchUserRoles();
  }, []);

  const handleRoleSelection = async (role: string) => {
    if (switchingRole) return; // Prevent multiple clicks
    
    try {
      setSwitchingRole(role);
      console.log(`🔄 Switching to ${role} role...`);
      
      // Check if the selected role is pending
      const selectedRoleData = userRoles.find(r => r.role === role);
      const isPending = selectedRoleData?.status === 'pending';
      
      console.log(`🔍 Selected role data:`, selectedRoleData, `isPending:`, isPending);
      
      const result = await switchUserRole(role as 'resident' | 'guard');
      
      if (result.success) {
        console.log(`✅ Successfully switched to ${role} role`);
        
        // Redirect based on role status
        if (isPending) {
          // User has pending status for this role, redirect to pending page
          if (role === 'resident') {
            console.log('⏳ Redirecting to Resident pending page');
            router.push('/Resident/pending');
          } else if (role === 'guard') {
            console.log('⏳ Redirecting to Guard pending page');
            router.push('/guard/pending');
          }
        } else {
          // User has verified status for this role, redirect to main page
          if (role === 'resident') {
            console.log('✅ Redirecting to Resident main page');
            router.push('/Resident');
          } else if (role === 'guard') {
            console.log('✅ Redirecting to Guard main page');
            router.push('/guard');
          }
        }
      } else if (result.needsRedirect && result.redirectTo) {
        // Handle the special case where user needs to go to the role page first
        console.log(`🔄 Redirecting to ${result.redirectTo} first, then will redirect to LIFF`);
        router.push(result.redirectTo);
      } else {
        console.error(`❌ Failed to switch to ${role} role:`, result.error);
        alert(`ไม่สามารถสลับบทบาทได้: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error switching to ${role} role:`, error);
      alert("เกิดข้อผิดพลาดในการสลับบทบาท");
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-card rounded-2xl border shadow-lg">
            <div className="px-4 py-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={handleGoBack}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                กลับ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show all roles regardless of status - let the main pages handle status checking
  const hasResidentRole = userRoles.some(role => role.role === 'resident');
  const hasGuardRole = userRoles.some(role => role.role === 'guard');

  if (!hasResidentRole && !hasGuardRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-card rounded-2xl border shadow-lg">
            <div className="px-4 py-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-2xl">❌</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">ไม่พบบทบาท</h2>
              <p className="text-muted-foreground mb-4">
                ไม่พบบทบาทที่สามารถใช้งานได้ กรุณาลงทะเบียนบทบาทก่อน
              </p>
              <button
                onClick={handleGoBack}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                กลับ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-card rounded-2xl border shadow-lg">
          {/* Header */}
          <div className="px-4 py-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGoBack}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                  <Home className="w-6 h-6 sm:w-7 sm:h-7" />
                  เลือกบทบาท
                </h1>
              </div>
              <ModeToggle />
            </div>
            <p className="text-sm text-muted-foreground">เลือกบทบาทที่ต้องการใช้งาน</p>
          </div>

          {/* Role Selection */}
          <div className="px-4 py-6 space-y-4">
            {hasResidentRole && (
              <button
                onClick={() => handleRoleSelection('resident')}
                disabled={switchingRole !== null}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {switchingRole === 'resident' ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">ผู้อยู่อาศัย</h3>
                    {userRoles.find(r => r.role === 'resident')?.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        รอการยืนยัน
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">สำหรับผู้ที่อาศัยในหมู่บ้าน</p>
                </div>
              </button>
            )}

            {hasGuardRole && (
              <button
                onClick={() => handleRoleSelection('guard')}
                disabled={switchingRole !== null}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {switchingRole === 'guard' ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <Shield className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">ยามรักษาความปลอดภัย</h3>
                    {userRoles.find(r => r.role === 'guard')?.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        รอการยืนยัน
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">สำหรับเจ้าหน้าที่รักษาความปลอดภัย</p>
                </div>
              </button>
            )}

            {/* Show pending roles */}
            {userRoles.filter(role => role.status === 'pending').length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">บทบาทที่รอการยืนยัน</h4>
                <div className="space-y-2">
                  {userRoles
                    .filter(role => role.status === 'pending')
                    .map((role, index) => (
                      <div
                        key={`${role.role}-${role.village_id}-${index}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {role.role === 'resident' ? (
                            <User className="w-4 h-4 text-primary" />
                          ) : (
                            <Shield className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {role.role === 'resident' ? 'ผู้อยู่อาศัย' : 'ยามรักษาความปลอดภัย'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {role.village_name || role.village_id}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ml-auto">
                          รอการยืนยัน
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
