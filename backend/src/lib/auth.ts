import bcrypt from 'bcryptjs';

// Password hashing utility
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // จำนวนรอบการ hash (ยิ่งมากยิ่งปลอดภัยแต่ช้า)
  return await bcrypt.hash(password, saltRounds);
}

// Password verification utility
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: "Password must be less than 128 characters" };
  }
  
  // ตรวจสอบว่ามีตัวอักษรอย่างน้อย 1 ตัว
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one letter" };
  }
  
  // ตรวจสอบว่ามีตัวเลขอย่างน้อย 1 ตัว
  if (!/\d/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  
  return { isValid: true };
}

// Email validation
export function validateEmail(email: string): { isValid: boolean; message?: string } {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }
  
  return { isValid: true };
}

// Phone validation (Thai phone numbers)
export function validatePhone(phone: string): { isValid: boolean; message?: string } {
  if (!phone) {
    return { isValid: false, message: "Phone number is required" };
  }
  
  // รองรับเบอร์โทรไทย: 08x-xxxxxxx, 09x-xxxxxxx, 06x-xxxxxxx
  const phoneRegex = /^0[689]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, message: "Invalid Thai phone number format" };
  }
  
  return { isValid: true };
} 