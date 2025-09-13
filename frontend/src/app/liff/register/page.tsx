"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, WifiOff, RefreshCw } from 'lucide-react';
import { LiffService } from '@/lib/liff';
import { registerLiffUser, storeAuthData } from '@/lib/liffAuth';
import { validateRegistrationForm, validateField } from '@/lib/validation';

const svc = LiffService.getInstance();

// Error types for better error handling
interface ValidationError {
  field: string;
  message: string;
}

interface NetworkError {
  type: 'network' | 'timeout' | 'server' | 'unknown';
  message: string;
  retryable: boolean;
}

function LiffRegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [networkError, setNetworkError] = useState<NetworkError | null>(null);
  const [success, setSuccess] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [, setLineUserId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
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
  });

  const [lineProfile, setLineProfile] = useState<{ userId?: string; displayName?: string; pictureUrl?: string } | null>(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Comprehensive validation function
  // Validate form data using Zod
  const validateForm = (): ValidationError[] => {
    const errors = validateRegistrationForm(formData);
    
    // Additional village key validation (server-side check)
    if (formData.village_key && !villageValidation.isValid) {
      errors.push({ field: 'village_key', message: 'รหัสหมู่บ้านไม่ถูกต้องหรือไม่มีอยู่ในระบบ' });
    }
    
    return errors;
  };

  // Clear all errors
  const clearErrors = () => {
    setError(null);
    setValidationErrors([]);
    setNetworkError(null);
  };

  // Handle network errors
  const handleNetworkError = (err: unknown): NetworkError => {
    if (!navigator.onLine) {
      return {
        type: 'network',
        message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อ',
        retryable: true
      };
    }
    
    const error = err as Error;
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่',
        retryable: true
      };
    }
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        type: 'network',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ',
        retryable: true
      };
    }
    
    return {
      type: 'unknown',
      message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
      retryable: true
    };
  };

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        setLoading(true);
        clearErrors();

        // Check network connectivity first
        if (!navigator.onLine) {
          throw new Error('No internet connection');
        }

        // Initialize LIFF with timeout
        const initPromise = svc.init();
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
              username: profile.displayName || '',
              email: '', // Always empty, user must fill
              profile_image_url: profile.pictureUrl || '',
            }));
          }
        } catch (profileErr) {
          console.warn('Failed to get LINE profile:', profileErr);
          // Continue without profile data
        }

        // Get lineUserId from URL params if available
        const urlLineUserId = searchParams.get('lineUserId');
        if (urlLineUserId) {
          setLineUserId(urlLineUserId);
        }

        setLoading(false);
      } catch (err) {
        console.error('LIFF initialization error:', err);
        
        if (err instanceof Error) {
          if (err.message.includes('timeout')) {
            setNetworkError({
              type: 'timeout',
              message: 'การเริ่มต้นระบบใช้เวลานานเกินไป กรุณาลองใหม่',
              retryable: true
            });
          } else if (err.message.includes('No internet connection')) {
            setNetworkError({
              type: 'network',
              message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อ',
              retryable: true
            });
          } else if (err.message.includes('ID token')) {
            setError('ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
          } else {
            setError(`เกิดข้อผิดพลาดในการเริ่มต้นระบบ: ${err.message}`);
          }
        } else {
          setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุในการเริ่มต้นระบบ');
        }
        
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
    
    // Clear validation errors for this field when user starts typing
    setValidationErrors(prev => prev.filter(error => error.field !== field));

    // Real-time validation for individual fields (only validate fields in schema)
    if (['fname', 'lname', 'email', 'phone', 'village_key', 'userType'].includes(field)) {
      const fieldError = validateField(field as 'fname' | 'lname' | 'email' | 'phone' | 'village_key' | 'userType', value);
      if (fieldError) {
        setValidationErrors(prev => [
          ...prev.filter(error => error.field !== field),
          { field, message: fieldError }
        ]);
      }
    }

    // Validate village key when it changes
    if (field === 'village_key') {
      // Debounce the validation
      setTimeout(() => {
        validateVillage(value);
      }, 500);
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    clearErrors();
    
    // Re-initialize LIFF
    try {
      setLoading(true);
      await svc.init();
      const token = svc.getIDToken();
      if (token) {
        setIdToken(token);
        setLoading(false);
      } else {
        throw new Error('No ID token after retry');
      }
    } catch (err) {
      console.error('Retry failed:', err);
      setError('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Check network connectivity
    if (!navigator.onLine) {
      setNetworkError({
        type: 'network',
        message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อ',
        retryable: true
      });
      return;
    }

    // Comprehensive validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors);
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
        setSuccess(true);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/Resident');
        }, 2000);
      } else {
        console.error('Registration failed:', result);
        
        // Handle specific backend errors
        if (result.error?.includes('already exists') || result.error?.includes('already registered')) {
          setError('อีเมลหรือชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้ข้อมูลอื่น');
        } else if (result.error?.includes('Invalid ID token') || result.error?.includes('expired')) {
          setError('ข้อมูลการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        } else if (result.error?.includes('User not found')) {
          setError('ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ');
        } else {
          setError(result.error || 'การลงทะเบียนล้มเหลว กรุณาลองใหม่');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          setNetworkError({
            type: 'timeout',
            message: 'การลงทะเบียนใช้เวลานานเกินไป กรุณาลองใหม่',
            retryable: true
          });
        } else if (err.message.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          const networkErr = handleNetworkError(err);
          setNetworkError(networkErr);
        } else {
          setError(`เกิดข้อผิดพลาดในการลงทะเบียน: ${err.message}`);
        }
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุในการลงทะเบียน');
      }
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
            <p className="text-zinc-300 mb-4">กำลังพาไปหน้าหลัก...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
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
            <CardTitle className="text-2xl font-bold text-white">ลงทะเบียนผู้ใช้</CardTitle>
            <p className="text-zinc-300 mt-2">
              กรุณากรอกข้อมูลเพื่อลงทะเบียนใช้งานระบบ
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Network Status Indicator */}
            {!isOnline && (
              <Alert className="mb-6 bg-yellow-900/20 border-yellow-700 text-yellow-200">
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อ
                </AlertDescription>
              </Alert>
            )}

            {/* Network Error */}
            {networkError && (
              <Alert className="mb-6 bg-orange-900/20 border-orange-700 text-orange-200">
                <WifiOff className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{networkError.message}</span>
                  {networkError.retryable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetry}
                      className="ml-2 border-orange-600 text-orange-200 hover:bg-orange-800"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      ลองใหม่
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* General Error */}
            {error && (
              <Alert className="mb-6 bg-red-900/20 border-red-700 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetry}
                    className="ml-2 border-red-600 text-red-200 hover:bg-red-800"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    ลองใหม่
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert className="mb-6 bg-red-900/20 border-red-700 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">กรุณาแก้ไขข้อมูลต่อไปนี้:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {lineProfile && (
              <div className="mb-6 p-4 bg-zinc-700 rounded-lg">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">ข้อมูลจาก LINE</h3>
                <div className="flex items-center space-x-3">
                  {lineProfile.pictureUrl && (
                    <img 
                      src={lineProfile.pictureUrl} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full"
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
                    className={`bg-zinc-700 text-white placeholder-zinc-400 ${
                      validationErrors.some(e => e.field === 'fname') 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-zinc-600 focus:border-zinc-400'
                    }`}
                    placeholder="กรอกชื่อ"
                    required
                  />
                  {validationErrors.some(e => e.field === 'fname') && (
                    <p className="text-red-400 text-xs mt-1">
                      {validationErrors.find(e => e.field === 'fname')?.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lname" className="text-zinc-200">นามสกุล *</Label>
                  <Input
                    id="lname"
                    type="text"
                    value={formData.lname}
                    onChange={(e) => handleInputChange('lname', e.target.value)}
                    className={`bg-zinc-700 text-white placeholder-zinc-400 ${
                      validationErrors.some(e => e.field === 'lname') 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-zinc-600 focus:border-zinc-400'
                    }`}
                    placeholder="กรอกนามสกุล"
                    required
                  />
                  {validationErrors.some(e => e.field === 'lname') && (
                    <p className="text-red-400 text-xs mt-1">
                      {validationErrors.find(e => e.field === 'lname')?.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-zinc-200">อีเมล *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`bg-zinc-700 text-white placeholder-zinc-400 ${
                    validationErrors.some(e => e.field === 'email') 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-zinc-600 focus:border-zinc-400'
                  }`}
                  placeholder="กรอกอีเมล"
                  required
                />
                {validationErrors.some(e => e.field === 'email') && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.find(e => e.field === 'email')?.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-zinc-200">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`bg-zinc-700 text-white placeholder-zinc-400 ${
                    validationErrors.some(e => e.field === 'phone') 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-zinc-600 focus:border-zinc-400'
                  }`}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  required
                />
                {validationErrors.some(e => e.field === 'phone') && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.find(e => e.field === 'phone')?.message}
                  </p>
                )}
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
                      validationErrors.some(e => e.field === 'village_key') 
                        ? 'border-red-500 focus:border-red-400' 
                        : villageValidation.isValid
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
                {validationErrors.some(e => e.field === 'village_key') && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.find(e => e.field === 'village_key')?.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="userType" className="text-zinc-200">ประเภทผู้ใช้ *</Label>
                <Select value={formData.userType} onValueChange={(value: 'resident' | 'guard') => handleInputChange('userType', value)}>
                  <SelectTrigger className={`bg-zinc-700 text-white ${
                    validationErrors.some(e => e.field === 'userType') 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-zinc-600 focus:border-zinc-400'
                  }`}>
                    <SelectValue placeholder="เลือกประเภทผู้ใช้" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-700 border-zinc-600">
                    <SelectItem value="resident" className="text-white hover:bg-zinc-600">ผู้อยู่อาศัย</SelectItem>
                    <SelectItem value="guard" className="text-white hover:bg-zinc-600">ยามรักษาความปลอดภัย</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.some(e => e.field === 'userType') && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.find(e => e.field === 'userType')?.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={submitting || !isOnline || (!!error && retryCount >= 3)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังลงทะเบียน...
                    </>
                  ) : retryCount > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      ลองใหม่ ({retryCount}/3)
                    </>
                  ) : (
                    'ลงทะเบียน'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/liff')}
                  className="border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                >
                  กลับ
                </Button>
              </div>
              
              {/* Retry limit warning */}
              {retryCount >= 3 && error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-red-200 text-sm text-center">
                    เกิดข้อผิดพลาดซ้ำๆ กรุณาติดต่อผู้ดูแลระบบหรือลองใหม่ในภายหลัง
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LiffRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <LiffRegisterPageContent />
    </Suspense>
  );
}
