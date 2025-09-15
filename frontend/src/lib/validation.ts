import { z } from 'zod';

// Registration form validation schema
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
    .min(3, 'รหัสหมู่บ้านต้องมีอย่างน้อย 3 ตัวอักษร')
    .max(20, 'รหัสหมู่บ้านต้องไม่เกิน 20 ตัวอักษร')
    .regex(/^[a-zA-Z0-9]+$/, 'รหัสหมู่บ้านต้องเป็นตัวอักษรและตัวเลขเท่านั้น'),
  
  userType: z
    .enum(['resident', 'guard'])
    .refine((val) => val === 'resident' || val === 'guard', {
      message: 'กรุณาเลือกประเภทผู้ใช้'
    })
});

// Type for form data
export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Validation error type
export interface ValidationError {
  field: keyof RegistrationFormData;
  message: string;
}

// Validate form data and return errors
export const validateRegistrationForm = (data: Partial<RegistrationFormData>): ValidationError[] => {
  try {
    registrationSchema.parse(data);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map((err) => ({
        field: err.path[0] as keyof RegistrationFormData,
        message: err.message
      }));
    }
    return [];
  }
};

// Validate single field
export const validateField = (field: keyof RegistrationFormData, value: unknown): string | null => {
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
