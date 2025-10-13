"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Shield, CheckCircle, AlertCircle, Loader2, MapPin } from "lucide-react";
import { getAuthData, isAuthenticated } from "@/lib/liffAuth";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LiffUser } from "@/lib/liffAuth";
import type { UserRole, UserRolesResponse } from "@/types/roles";

type RoleRegistrationUser = LiffUser & { village_name?: string };

const RoleRegistrationPage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<RoleRegistrationUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'resident' | 'guard' | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [existingRoles, setExistingRoles] = useState<UserRole[]>([]);
  const [villageValidation, setVillageValidation] = useState<{
    isValid: boolean;
    isLoading: boolean;
    villageName?: string;
  }>({ isValid: false, isLoading: false });

  useEffect(() => {
    const loadUserData = () => {
      if (!isAuthenticated()) {
        router.push('/liff');
        return;
      }

      const { user } = getAuthData();
      if (!user) {
        router.push('/liff');
        return;
      }

      setCurrentUser(user);
      setLoading(false);

      // Check existing roles
      const userId = user.lineUserId || user.id;
      if (userId) {
        checkExistingRoles(userId);
      }
    };

    loadUserData();
  }, [router]);

  const checkExistingRoles = async (lineUserId: string) => {
    try {
      const response = await fetch(`/api/users/roles?lineUserId=${lineUserId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Response is not JSON");
          return;
        }
        const data: UserRolesResponse = await response.json();
        if (data.success && data.roles) {
          setExistingRoles(data.roles);
        }
      }
    } catch (error) {
      console.error('Error checking existing roles:', error);
    }
  };

  const validateVillage = async (villageId: string) => {
    if (!villageId.trim()) {
      setVillageValidation({ isValid: false, isLoading: false });
      return;
    }

    setVillageValidation({ isValid: false, isLoading: true });

    try {
      const response = await fetch(`/api/villages/check/${encodeURIComponent(villageId)}`);
      const data = await response.json();

      if (data.exists && data.village_name) {
        setVillageValidation({
          isValid: true,
          isLoading: false,
          villageName: data.village_name
        });
      } else {
        setVillageValidation({ isValid: false, isLoading: false });

        const userId = currentUser?.lineUserId || currentUser?.id;
        if (userId) {
          checkExistingRoles(userId);
        }
      }
    } catch (error) {
      console.error('Village validation error:', error);
      setVillageValidation({ isValid: false, isLoading: false });
    }
  };

  const handleRoleSelection = (role: 'resident' | 'guard') => {
    setSelectedRole(role);
    setError(null);
  };

  const handleVillageInput = (villageId: string) => {
    setSelectedVillage(villageId);
    setError(null);
    
    // Validate village with debounce
    const timeoutId = setTimeout(() => {
      validateVillage(villageId);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async () => {
    if (!selectedRole || !currentUser) {
      setError('กรุณาเลือกบทบาทที่ต้องการลงทะเบียน');
      return;
    }

    if (!selectedVillage) {
      setError('กรุณาใส่รหัสหมู่บ้านที่ต้องการลงทะเบียน');
      return;
    }

    if (!villageValidation.isValid) {
      setError('รหัสหมู่บ้านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    // Note: We'll let the backend handle the role+village validation
    // since the frontend doesn't have detailed role+village information

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/register-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lineUserId: currentUser.lineUserId,
          role: selectedRole,
          email: currentUser.email,
          fname: currentUser.fname,
          lname: currentUser.lname,
          phone: currentUser.phone,
          village_key: selectedVillage,
          profile_image_url: currentUser.line_profile_url,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError("Response is not JSON");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Update existing roles with village information
        setExistingRoles(prev => [...prev, {
          role: selectedRole,
          village_id: selectedVillage,
          village_name: villageValidation.villageName,
          status: 'pending'
        }]);
        // Reset form
        setSelectedRole(null);
        setSelectedVillage('');
        setVillageValidation({ isValid: false, isLoading: false });
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการลงทะเบียนบทบาท');
      }
    } catch (error) {
      console.error('Role registration error:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const getAvailableRoles = () => {
    const allRoles = [
      { key: 'resident', label: 'ผู้อยู่อาศัย', description: 'สำหรับผู้ที่อาศัยในหมู่บ้าน', icon: User, color: 'blue' },
      { key: 'guard', label: 'ยามรักษาความปลอดภัย', description: 'สำหรับเจ้าหน้าที่รักษาความปลอดภัย', icon: Shield, color: 'green' }
    ];

    // Since users can now register for the same role in different villages,
    // we show all roles and let the backend validate role+village combinations
    return allRoles;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">ไม่พบข้อมูลผู้ใช้</p>
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

  const availableRoles = getAvailableRoles();

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
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                  ลงทะเบียนบทบาทเพิ่มเติม
                </h1>
              </div>
              <ModeToggle />
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-6 space-y-6">
            {/* Current User Info */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                {currentUser.line_profile_url ? (
                  <img
                    src={currentUser.line_profile_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {currentUser.fname} {currentUser.lname}
              </h2>
              <p className="text-sm text-muted-foreground">
                บทบาทปัจจุบัน: {currentUser.role === 'resident' ? 'ผู้อยู่อาศัย' : 'ยามรักษาความปลอดภัย'}
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ลงทะเบียนบทบาท {selectedRole === 'resident' ? 'ผู้อยู่อาศัย' : 'ยามรักษาความปลอดภัย'} สำเร็จแล้ว!
                  {villageValidation.villageName && (
                    <div className="mt-1 text-sm">
                      หมู่บ้าน: {villageValidation.villageName}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Available Roles */}
            {availableRoles.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">เลือกบทบาทที่ต้องการลงทะเบียน</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {availableRoles.map((role) => {
                    const IconComponent = role.icon;
                    const isSelected = selectedRole === role.key;
                    
                    return (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => handleRoleSelection(role.key as 'resident' | 'guard')}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? `border-${role.color}-500 bg-${role.color}-500/20`
                            : 'border-border bg-muted/30 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? `bg-${role.color}-500/30` : 'bg-muted'
                          }`}>
                            <IconComponent className={`w-5 h-5 ${
                              isSelected ? `text-${role.color}-600` : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{role.label}</p>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
                  onClick={handleSubmit}
                  disabled={!selectedRole || !selectedVillage || !villageValidation.isValid || submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังลงทะเบียน...
                    </>
                  ) : (
                    'ลงทะเบียนบทบาท'
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  คุณมีบทบาทครบถ้วนแล้ว
                </h3>
                <p className="text-muted-foreground">
                  คุณได้ลงทะเบียนบทบาททั้งหมดที่มีในระบบแล้ว
                </p>
              </div>
            )}

            {/* Current Roles */}
            {existingRoles.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">บทบาทที่มีอยู่</h3>
                <div className="space-y-2">
                  {existingRoles.map((roleInfo, index) => (
                    <div
                      key={`${roleInfo.role}-${roleInfo.village_id}-${index}`}
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
                            {roleInfo.village_name || "ไม่ระบุ"}
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
};

export default RoleRegistrationPage;
