/**
 * SECURITY ENHANCEMENT: Input Validation Utilities
 * 
 * Purpose: Prevent injection attacks and ensure data integrity
 * Added: 2024-12-08 - Security audit improvement
 * 
 * Security benefits:
 * - Prevents SQL injection through input sanitization
 * - Validates data types and formats
 * - Limits input length to prevent buffer overflow
 * - Uses whitelist approach for allowed characters
 */

/**
 * Validates login input data
 * SECURITY: Prevents injection attacks and ensures proper data format
 */
export const validateLoginInput = (body: any) => {
  const errors: string[] = [];
  
  // Username validation - strict rules to prevent injection
  if (!body.username || typeof body.username !== 'string') {
    errors.push('Username is required and must be a string');
  } else if (body.username.length < 3 || body.username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(body.username)) {
    // SECURITY: Only allow alphanumeric and underscore (whitelist approach)
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  // Password validation - ensure reasonable length limits
  if (!body.password || typeof body.password !== 'string') {
    errors.push('Password is required and must be a string');
  } else if (body.password.length < 6 || body.password.length > 100) {
    // SECURITY: Prevent extremely long passwords that could cause DoS
    errors.push('Password must be between 6 and 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes string input by removing potentially dangerous characters
 * SECURITY: Prevents XSS and injection attacks
 */
export const sanitizeString = (input: string): string => {
  // Remove whitespace and dangerous HTML/script characters
  return input.trim().replace(/[<>\"'&]/g, '');
};

/**
 * Validates email format
 * SECURITY: Prevents malformed email injection
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // RFC 5321 email length limit
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validates UUID format
 * SECURITY: Prevents malformed UUID injection in database queries
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};