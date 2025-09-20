"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { LiffService } from '@/lib/liff';
import { registerLiffUser, storeAuthData } from '@/lib/liffAuth';
import { validateRegistrationForm, validateField, type ValidationError as ZodValidationError } from '@/lib/validation';
import Image from 'next/image';

const svc = LiffService.getInstance();

function ResidentRegisterPageContent() {
  // const router = useRouter(); // Unused
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/villages/check/${encodeURIComponent(villageKey)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setVillageValidation({ 
            isValid: true, 
            isLoading: false, 
            villageName: data.village_name 
          });
        } else {
          setVillageValidation({ isValid: false, isLoading: false });
        }
      } else {
        setVillageValidation({ isValid: false, isLoading: false });
      }
    } catch (error) {
      console.warn('Error validating village:', error);
      setVillageValidation({ isValid: false, isLoading: false });
    }
  };

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize LIFF with resident configuration
        const initPromise = svc.init('resident');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LIFF initialization timeout')), 30000)
        );
        
        await Promise.race([initPromise, timeoutPromise]);

        // Get ID token
        const token = svc.getIDToken();
        if (!token) {
          throw new Error('No ID token available. Please login again.');
        }

        setIdToken(token);

        // Get LINE profile data and auto-fill form
        try {
          const profile = await svc.getProfile();
          if (profile && profile.userId !== "unknown") {
            setLineProfile(profile);
             setFormData(prev => ({
               ...prev,
               line_display_name: profile.displayName || '',
               email: '', // Always empty, user must fill
               profile_image_url: profile.pictureUrl || '',
             }));
          }
        } catch (profileErr) {
          console.warn('Failed to get LINE profile:', profileErr);
        }

        // Get lineUserId from URL params if available
        const urlLineUserId = searchParams.get('lineUserId');
        if (urlLineUserId) {
          setLineUserId(urlLineUserId);
        }

        setLoading(false);
      } catch (err) {
        console.error('LIFF initialization error:', err);
        setError(`เกิดข้อผิดพลาดในการเริ่มต้นระบบ: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    void initializeLiff();
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Real-time validation for individual fields (only validate fields in schema)
    if (['fname', 'lname', 'email', 'phone', 'village_key', 'userType'].includes(field)) {
      const fieldError = validateField(field as 'fname' | 'lname' | 'email' | 'phone' | 'village_key' | 'userType', value);
      if (fieldError) {
        setError(fieldError);
      } else {
        setError(null);
      }
    }

    // Validate village key when it changes
    if (field === 'village_key') {
      setTimeout(() => {
        validateVillage(value);
      }, 500);
    }
  };

  // Validate form data using Zod
  const validateForm = (): ZodValidationError[] => {
    const errors = validateRegistrationForm(formData);
    
    // Additional village key validation (server-side check)
    if (formData.village_key && !villageValidation.isValid) {
      errors.push({ field: 'village_key', message: 'รหัสหมู่บ้านไม่ถูกต้องหรือไม่มีอยู่ในระบบ' });
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);

    // Validate form before submission
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError('กรุณาตรวจสอบข้อมูลที่กรอก');
      return;
    }

    if (!idToken) {
      setError('ไม่พบ ID Token กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      setSubmitting(true);


      // Add timeout to registration request
      const registrationPromise = registerLiffUser(idToken, formData);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout')), 60000)
      );
      
      const result = await Promise.race([registrationPromise, timeoutPromise]);
      
      
      if (result.success && result.user && result.token) {
        // Store authentication data
        storeAuthData(result.user, result.token);
        setRegistrationResult(result);
        setSuccess(true);
        
        // Show enhanced success message if user has multiple roles
        if (result.existingRoles && result.existingRoles.length > 1) {
          console.log('🎉 User now has multiple roles:', result.existingRoles);
        }
      } else {
        console.error('Registration failed:', result);
        
        // Handle specific backend errors with better UX
        if (result.error?.includes('already registered as resident')) {
          setError('คุณได้ลงทะเบียนเป็นลูกบ้านแล้ว');
        } else if (result.error?.includes('already registered as guard')) {
          setError('คุณได้ลงทะเบียนเป็นยามรักษาความปลอดภัยแล้ว หากต้องการเป็นลูกบ้านด้วย กรุณาใช้แอปลูกบ้าน');
        } else if (result.canRegisterAs && result.canRegisterAs.length > 0) {
          setError(`คุณสามารถลงทะเบียนเป็น ${result.canRegisterAs.includes('resident') ? 'ลูกบ้าน' : ''}${result.canRegisterAs.includes('resident') && result.canRegisterAs.includes('guard') ? ' หรือ ' : ''}${result.canRegisterAs.includes('guard') ? 'ยามรักษาความปลอดภัย' : ''} ได้`);
        } else {
          setError(result.error || 'การลงทะเบียนล้มเหลว กรุณาลองใหม่');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(`เกิดข้อผิดพลาดในการลงทะเบียน: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">กำลังเริ่มต้นระบบ...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white flex items-center justify-center">
        <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">ลงทะเบียนสำเร็จ!</h2>
            <p className="text-zinc-300 mb-4">
              {registrationResult?.message || 'คุณสามารถปิดหน้านี้และกลับไปใช้แอป LINE ได้แล้ว'}
              {registrationResult?.existingRoles && registrationResult.existingRoles.length > 1 && (
                <span className="block mt-2 text-blue-400 font-medium">
                  🎉 คุณสามารถใช้งานได้ทั้งในฐานะลูกบ้านและยามรักษาความปลอดภัย!
                </span>
              )}
            </p>
            <div className="bg-green-900/20 rounded-xl p-4 mb-4 text-sm border border-green-500/30">
              <p className="font-semibold text-green-200">ลูกบ้าน</p>
              <p className="text-xs text-green-300 mt-1">การลงทะเบียนเสร็จสิ้น</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">ลงทะเบียนผู้อยู่อาศัย</CardTitle>
            <p className="text-zinc-300 mt-2">
              กรุณากรอกข้อมูลเพื่อลงทะเบียนใช้งานระบบสำหรับผู้อยู่อาศัย
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Error Display */}
            {error && (
              <Alert className="mb-6 bg-red-900/20 border-red-700 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {lineProfile && (
              <div className="mb-6 p-4 bg-zinc-700 rounded-lg">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">ข้อมูลจาก LINE</h3>
                <div className="flex items-center space-x-3">
                  {lineProfile.pictureUrl && (
                    <Image 
                      src={lineProfile.pictureUrl} 
                      alt="Profile" 
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{lineProfile.displayName}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fname" className="text-zinc-200">ชื่อ *</Label>
                  <Input
                    id="fname"
                    type="text"
                    value={formData.fname}
                    onChange={(e) => handleInputChange('fname', e.target.value)}
                    className="bg-zinc-700 text-white placeholder-zinc-400 border-zinc-600 focus:border-zinc-400"
                    placeholder="กรอกชื่อ"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lname" className="text-zinc-200">นามสกุล *</Label>
                  <Input
                    id="lname"
                    type="text"
                    value={formData.lname}
                    onChange={(e) => handleInputChange('lname', e.target.value)}
                    className="bg-zinc-700 text-white placeholder-zinc-400 border-zinc-600 focus:border-zinc-400"
                    placeholder="กรอกนามสกุล"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-zinc-200">อีเมล *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-zinc-700 text-white placeholder-zinc-400 border-zinc-600 focus:border-zinc-400"
                  placeholder="กรอกอีเมล"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-zinc-200">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-zinc-700 text-white placeholder-zinc-400 border-zinc-600 focus:border-zinc-400"
                  placeholder="กรอกเบอร์โทรศัพท์"
                  required
                />
              </div>

              <div>
                <Label htmlFor="village_key" className="text-zinc-200">รหัสหมู่บ้าน *</Label>
                <div className="relative">
                  <Input
                    id="village_key"
                    type="text"
                    value={formData.village_key}
                    onChange={(e) => handleInputChange('village_key', e.target.value)}
                    className={`bg-zinc-700 text-white placeholder-zinc-400 pr-10 ${
                      villageValidation.isValid
                        ? 'border-green-500 focus:border-green-400'
                        : 'border-zinc-600 focus:border-zinc-400'
                    }`}
                    placeholder="กรอกรหัสหมู่บ้าน (เช่น pha-suk-village-001)"
                    required
                  />
                  {villageValidation.isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    </div>
                  )}
                  {villageValidation.isValid && !villageValidation.isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </div>
                {villageValidation.isValid && villageValidation.villageName && (
                  <p className="text-green-400 text-xs mt-1">
                    ✓ {villageValidation.villageName}
                  </p>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังลงทะเบียน...
                    </>
                  ) : (
                    'ลงทะเบียนผู้อยู่อาศัย'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResidentRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <ResidentRegisterPageContent />
    </Suspense>
  );
}