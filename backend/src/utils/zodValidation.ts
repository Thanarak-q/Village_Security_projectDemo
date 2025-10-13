import { z } from 'zod';

// Registration form validation schema (matches frontend)
export const registrationSchema = z.object({
  fname: z
    .string()
    .min(1, 'กรุณากรอกชื่อ')
    .min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'ชื่อต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^[a-zA-Zก-๙\s]+$/, 'ชื่อต้องเป็นตัวอักษรเท่านั้น'),
  
  lname: z
    .string()
    .min(1, 'กรุณากรอกนามสกุล')
    .min(2, 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'นามสกุลต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^[a-zA-Zก-๙\s]+$/, 'นามสกุลต้องเป็นตัวอักษรเท่านั้น'),
  
  email: z
    .string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .max(100, 'อีเมลต้องไม่เกิน 100 ตัวอักษร'),
  
  phone: z
    .string()
    .min(1, 'กรุณากรอกเบอร์โทรศัพท์')
    .regex(/^[0-9+\-\s()]+$/, 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง')
    .refine((phone) => phone.replace(/[^0-9]/g, '').length >= 9, {
      message: 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก'
    })
    .refine((phone) => phone.replace(/[^0-9]/g, '').length <= 15, {
      message: 'เบอร์โทรศัพท์ต้องไม่เกิน 15 หลัก'
    }),
  
  village_key: z
    .string()
    .min(1, 'กรุณากรอกรหัสหมู่บ้าน')
    .min(3, 'รหัสหมู่บ้านต้องมีอย่างน้อย 3 ตัวอักษร'),
    // .max(20, 'รหัสหมู่บ้านต้องไม่เกิน 20 ตัวอักษร')
    // .regex(/^[a-zA-Z0-9\-]+$/, 'รหัสหมู่บ้านต้องเป็นตัวอักษร ตัวเลข และขีดกลางเท่านั้น'),
  
  userType: z
    .enum(['resident', 'guard'])
    .refine((val) => val === 'resident' || val === 'guard', {
      message: 'กรุณาเลือกประเภทผู้ใช้'
    })
});

// Type for registration data
export type RegistrationData = z.infer<typeof registrationSchema>;

// Validation error type
export interface ValidationError {
  field: keyof RegistrationData;
  message: string;
}

// Validate registration data and return errors
export const validateRegistrationData = (data: Partial<RegistrationData>): ValidationError[] => {
  try {
    registrationSchema.parse(data);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map((err) => ({
        field: err.path[0] as keyof RegistrationData,
        message: err.message
      }));
    }
    return [];
  }
};

// Validate single field
export const validateField = (field: keyof RegistrationData, value: any): string | null => {
  try {
    const fieldSchema = registrationSchema.shape[field];
    fieldSchema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Invalid value';
    }
    return 'Invalid value';
  }
};

// Enhanced validation for LIFF registration with additional checks
export const validateLiffRegistration = (data: {
  idToken: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  village_key: string;
  userType: 'resident' | 'guard';
  profile_image_url?: string;
}): { isValid: boolean; errors: ValidationError[] } => {
  // First validate the basic registration data
  const basicErrors = validateRegistrationData(data);
  
  // Additional validation for LIFF-specific fields
  const additionalErrors: ValidationError[] = [];
  
  // Validate ID token
  if (!data.idToken || typeof data.idToken !== 'string') {
    additionalErrors.push({
      field: 'email', // Use email as fallback since idToken is not in schema
      message: 'ID Token is required'
    });
  }
  
  // Validate profile image URL if provided
  if (data.profile_image_url && typeof data.profile_image_url === 'string') {
    try {
      new URL(data.profile_image_url);
    } catch {
      additionalErrors.push({
        field: 'email', // Use email as fallback since profile_image_url is not in schema
        message: 'Invalid profile image URL format'
      });
    }
  }
  
  // Validate role consistency
  if (data.role && data.userType && data.role !== data.userType) {
    additionalErrors.push({
      field: 'userType',
      message: 'User type and role must match'
    });
  }
  
  const allErrors = [...basicErrors, ...additionalErrors];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Sanitize string input (enhanced version)
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

// Validate email format (enhanced version)
export const isValidEmail = (email: string): boolean => {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate phone number format
export const isValidPhone = (phone: string): boolean => {
  if (typeof phone !== 'string') return false;
  
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return cleanPhone.length >= 9 && cleanPhone.length <= 15;
};

// Validate village key format
export const isValidVillageKey = (villageKey: string): boolean => {
  if (typeof villageKey !== 'string') return false;
  
  return /^[a-zA-Z0-9\-]+$/.test(villageKey) && 
         villageKey.length >= 3 && 
         villageKey.length <= 20;
};
