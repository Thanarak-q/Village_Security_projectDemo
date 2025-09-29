"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Shield, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function GuardRegisterRolePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [existingRoles, setExistingRoles] = useState<Array<{role: string, village_key: string, village_name?: string, status?: string}>>([]);
  const [villageValidation, setVillageValidation] = useState<{
    isValid: boolean;
    isLoading: boolean;
    villageName?: string;
  }>({
    isValid: false,
    isLoading: false,
  });

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push("/liff");
        return;
      }

      const { user } = getAuthData();
      if (user) {
        setCurrentUser(user);
        checkExistingRoles(user.lineUserId || user.id);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const checkExistingRoles = async (lineUserId: string) => {
    try {
      const apiUrl = '';
      const response = await fetch(`${apiUrl}/api/users/roles?lineUserId=${lineUserId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.success && data.roles) {
            setExistingRoles(data.roles);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching existing roles:', error);
    }
  };

  const validateVillage = async (villageKey: string) => {
    if (!villageKey.trim()) {
      setVillageValidation({ isValid: false, isLoading: false });
      return;
    }

    setVillageValidation({ isValid: false, isLoading: true });

    try {
      const response = await fetch(`/api/villages/check/${encodeURIComponent(villageKey)}`);
      const data = await response.json();

      if (data.exists && data.village_name) {
        setVillageValidation({
          isValid: true,
          isLoading: false,
          villageName: data.village_name
        });
      } else {
        setVillageValidation({ isValid: false, isLoading: false });
      }
    } catch (error) {
      console.error('Village validation error:', error);
      setVillageValidation({ isValid: false, isLoading: false });
    }
  };

  const handleVillageInput = (value: string) => {
    setSelectedVillage(value);
    setError(null);
    setSuccess(null);
    
    // Debounce the validation
    const timeoutId = setTimeout(() => {
      validateVillage(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError("กรุณาเลือกบทบาท");
      return;
    }

    if (!selectedVillage.trim()) {
      setError("กรุณาใส่รหัสหมู่บ้าน");
      return;
    }

    if (!villageValidation.isValid) {
      setError("รหัสหมู่บ้านไม่ถูกต้อง");
      return;
    }

    if (!currentUser) {
      setError("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = '';
      const response = await fetch(`${apiUrl}/api/users/register-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lineUserId: currentUser.lineUserId || currentUser.id,
          role: selectedRole,
          email: currentUser.email,
          fname: currentUser.fname,
          lname: currentUser.lname,
          phone: currentUser.phone,
          village_key: selectedVillage,
          profile_image_url: currentUser.line_profile_url
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.success) {
            setSuccess(`ลงทะเบียนบทบาท${selectedRole === 'resident' ? 'ผู้อยู่อาศัย' : 'ยามรักษาความปลอดภัย'} ในหมู่บ้าน ${villageValidation.villageName} สำเร็จ!`);
            setSelectedRole("");
            setSelectedVillage("");
            setVillageValidation({ isValid: false, isLoading: false });
            // Refresh existing roles
            checkExistingRoles(currentUser.lineUserId || currentUser.id);
          } else {
            setError(data.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
          }
        } else {
          setError("เกิดข้อผิดพลาดในการลงทะเบียน");
        }
      } else {
        setError("เกิดข้อผิดพลาดในการลงทะเบียน");
      }
    } catch (error) {
      console.error('Error registering role:', error);
      setError("เกิดข้อผิดพลาดในการลงทะเบียน");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">ไม่พบข้อมูลผู้ใช้</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        {/* Main Card */}
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
                  <User className="w-6 h-6 sm:w-7 sm:h-7" />
                  ลงทะเบียนบทบาทเพิ่มเติม
                </h1>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">เลือกบทบาท</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleSelection('resident')}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedRole === 'resident'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">ผู้อยู่อาศัย</h4>
                        <p className="text-sm text-muted-foreground">ลงทะเบียนเป็นผู้อยู่อาศัยในหมู่บ้าน</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelection('guard')}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedRole === 'guard'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">ยามรักษาความปลอดภัย</h4>
                        <p className="text-sm text-muted-foreground">ลงทะเบียนเป็นยามรักษาความปลอดภัย</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Village Input */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="village-key" className="text-lg font-medium text-foreground">
                    รหัสหมู่บ้าน
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    กรุณาใส่รหัสหมู่บ้านที่ต้องการลงทะเบียน
                  </p>
                </div>

                <div className="relative">
                  <Input
                    id="village-key"
                    type="text"
                    placeholder="เช่น VILLAGE-001"
                    value={selectedVillage}
                    onChange={(e) => handleVillageInput(e.target.value)}
                    className={`w-full ${
                      villageValidation.isValid
                        ? 'border-green-500 focus:border-green-500'
                        : selectedVillage && !villageValidation.isValid && !villageValidation.isLoading
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }`}
                  />

                  {villageValidation.isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {villageValidation.isValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  )}

                  {selectedVillage && !villageValidation.isValid && !villageValidation.isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>

                {villageValidation.isValid && villageValidation.villageName && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-800 dark:text-green-200 text-sm">
                      หมู่บ้าน: {villageValidation.villageName}
                    </span>
                  </div>
                )}

                {selectedVillage && !villageValidation.isValid && !villageValidation.isLoading && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-800 dark:text-red-200 text-sm">
                      รหัสหมู่บ้านไม่ถูกต้อง
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!selectedRole || !selectedVillage || !villageValidation.isValid || submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    กำลังลงทะเบียน...
                  </>
                ) : (
                  'ลงทะเบียนบทบาท'
                )}
              </Button>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
                </div>
              )}
            </form>

            {/* Current Roles */}
            {existingRoles.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">บทบาทที่มีอยู่</h3>
                <div className="space-y-2">
                  {existingRoles.map((roleInfo, index) => (
                    <div
                      key={`${roleInfo.role}-${roleInfo.village_key}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {roleInfo.role === 'resident' ? (
                            <User className="w-4 h-4 text-primary" />
                          ) : (
                            <Shield className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {roleInfo.role === 'resident' ? 'ผู้อยู่อาศัย' : 'ยามรักษาความปลอดภัย'}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {roleInfo.village_name || roleInfo.village_key}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        roleInfo.status === 'verified' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : roleInfo.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {roleInfo.status === 'verified' ? 'ยืนยันแล้ว' : 
                         roleInfo.status === 'pending' ? 'รอการยืนยัน' : 
                         roleInfo.status === 'disable' ? 'ถูกปิดใช้งาน' : 
                         roleInfo.status || 'ไม่ทราบสถานะ'}
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
