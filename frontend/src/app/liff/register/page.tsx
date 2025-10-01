"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, User, Shield, ArrowLeft, MapPin } from 'lucide-react';
import { LiffService } from '@/lib/liff';
import { registerLiffUser, storeAuthData } from '@/lib/liffAuth';
import { validateRegistrationForm, validateField, type ValidationError as ZodValidationError } from '@/lib/validation';
import { ModeToggle } from '@/components/mode-toggle';
import Image from 'next/image';

const svc = LiffService.getInstance();

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{ success: boolean; message?: string; existingRoles?: string[] } | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [, setLineUserId] = useState<string | null>(null);
  const [villageValidation, setVillageValidation] = useState<{
    isValid: boolean;
    isLoading: boolean;
    villageName?: string;
  }>({ isValid: false, isLoading: false });

  const [formData, setFormData] = useState({
    email: '',
    fname: '',
    lname: '',
    phone: '',
    village_key: '',
    userType: 'resident' as 'resident' | 'guard',
    profile_image_url: '',
    line_display_name: '',
  });

  const [lineProfile, setLineProfile] = useState<{ userId?: string; displayName?: string; pictureUrl?: string } | null>(null);

  // Validate village key
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

  // Initialize LIFF and get user profile
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await svc.init();
        
        if (!svc.isLoggedIn()) {
          setError('กรุณาเข้าสู่ระบบด้วย LINE ก่อน');
          setLoading(false);
          return;
        }

        const profile = await svc.getProfile();
        const idToken = svc.getIDToken();
        
        if (!idToken) {
          setError('ไม่สามารถดึงข้อมูล LINE ได้ กรุณาลองใหม่');
          setLoading(false);
          return;
        }

        setIdToken(idToken);
        setLineUserId(profile.userId);
        setLineProfile(profile);
        
        // Pre-fill form with LINE profile data
        setFormData(prev => ({
          ...prev,
          email: prev.email || '',
          profile_image_url: profile.pictureUrl || '',
          line_display_name: profile.displayName || '',
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('LIFF initialization error:', error);
        setError('เกิดข้อผิดพลาดในการเริ่มต้น LIFF');
        setLoading(false);
      }
    };

    initializeLiff();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate village key when it changes
    if (field === 'village_key') {
      const timeoutId = setTimeout(() => validateVillage(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  // Handle role selection
  const handleRoleSelection = (role: 'resident' | 'guard') => {
    setFormData(prev => ({ ...prev, userType: role }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idToken) {
      setError('ไม่พบ LINE token กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Validate form data
      const validation = validateRegistrationForm(formData);
      if (validation.length > 0) {
        setError(`กรุณาตรวจสอบข้อมูล: ${validation.map(e => e.message).join(', ')}`);
        setSubmitting(false);
        return;
      }

      // Submit registration
      const result = await registerLiffUser(idToken, {
        email: formData.email,
        fname: formData.fname,
        lname: formData.lname,
        phone: formData.phone,
        village_key: formData.village_key,
        userType: formData.userType,
        profile_image_url: formData.profile_image_url,
      });

      if (result.success && result.user && result.token) {
        storeAuthData(result.user, result.token);
        setSuccess(true);
        setRegistrationResult({
          success: true,
          message: result.message || 'ลงทะเบียนสำเร็จ',
          existingRoles: result.existingRoles
        });
        
        // Redirect based on user role
        setTimeout(() => {
          const redirectPath = result.user?.role === 'guard' ? '/guard' : '/Resident';
          router.push(redirectPath);
        }, 2000);
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        setRegistrationResult({
          success: false,
          message: result.error,
          existingRoles: result.existingRoles
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        formData: {
          email: formData.email,
          fname: formData.fname,
          lname: formData.lname,
          phone: formData.phone,
          village_key: formData.village_key,
          userType: formData.userType,
        }
      });
      setError('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-card rounded-2xl border shadow-lg">
            <div className="px-4 py-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">ลงทะเบียนสำเร็จ!</h2>
              <p className="text-muted-foreground mb-4">
                {registrationResult?.message || 'ยินดีต้อนรับสู่ระบบ Village Security'}
              </p>
              {registrationResult?.existingRoles && registrationResult.existingRoles.length > 0 && (
                <p className="text-sm text-primary mb-4">
                  คุณมีบทบาท: {registrationResult.existingRoles.join(', ')}
                </p>
              )}
              <p className="text-sm text-muted-foreground">กำลังพาไปหน้าหลัก...</p>
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
          <div className="px-4 py-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                  <User className="w-6 h-6 sm:w-7 sm:h-7" />
                  ลงทะเบียนใช้งาน
                </h1>
              </div>
              <ModeToggle />
            </div>
            <p className="text-sm text-muted-foreground">กรุณากรอกข้อมูลเพื่อลงทะเบียนใช้งานระบบ</p>
          </div>
          
          <div className="px-4 py-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
                {error}
              </div>
            )}

            {lineProfile && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                {lineProfile.pictureUrl && (
                  <Image
                    src={lineProfile.pictureUrl}
                    alt="LINE Profile"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="text-foreground font-medium">{lineProfile.displayName}</p>
                  <p className="text-sm text-muted-foreground">บัญชี LINE ของคุณ</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">เลือกประเภทผู้ใช้งาน</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleRoleSelection('resident')}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                      formData.userType === 'resident'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <User className="w-6 h-6 mb-2 text-primary" />
                    <span className="font-medium text-foreground">ผู้อยู่อาศัย</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRoleSelection('guard')}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                      formData.userType === 'guard'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <Shield className="w-6 h-6 mb-2 text-primary" />
                    <span className="font-medium text-foreground">ยามรักษาความปลอดภัย</span>
                  </button>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fname" className="text-sm font-medium text-foreground">ชื่อ *</Label>
                  <Input
                    id="fname"
                    type="text"
                    value={formData.fname}
                    onChange={(e) => handleInputChange('fname', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lname" className="text-sm font-medium text-foreground">นามสกุล *</Label>
                  <Input
                    id="lname"
                    type="text"
                    value={formData.lname}
                    onChange={(e) => handleInputChange('lname', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground">อีเมล *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1"
                  placeholder="08xxxxxxxx"
                  required
                />
              </div>

              <div>
                <Label htmlFor="village_key" className="text-sm font-medium text-foreground">รหัสหมู่บ้าน *</Label>
                <Input
                  id="village_key"
                  type="text"
                  value={formData.village_key}
                  onChange={(e) => handleInputChange('village_key', e.target.value)}
                  className="mt-1"
                  placeholder="กรอกรหัสหมู่บ้าน"
                  required
                />
                {villageValidation.isLoading && (
                  <p className="text-sm text-primary mt-1">กำลังตรวจสอบรหัสหมู่บ้าน...</p>
                )}
                {villageValidation.isValid && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 mt-2">
                    <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-800 dark:text-green-200 text-sm">
                      หมู่บ้าน: {villageValidation.villageName}
                    </span>
                  </div>
                )}
                {!villageValidation.isValid && !villageValidation.isLoading && formData.village_key && (
                  <p className="text-sm text-red-500 mt-1">รหัสหมู่บ้านไม่ถูกต้อง</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || !villageValidation.isValid}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    กำลังลงทะเบียน...
                  </>
                ) : (
                  'ลงทะเบียน'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}