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
 * Validates login input data.
 * @param {any} body - The request body.
 * @returns {Object} An object containing a boolean indicating if the input is valid and an array of errors.
 */
export const validateLoginInput = (body: any) => {
  const errors: string[] = [];

  // Username validation - strict rules to prevent injection
  if (!body.username || typeof body.username !== "string") {
    errors.push("Username is required and must be a string");
  } else if (body.username.length < 3 || body.username.length > 50) {
    errors.push("Username must be between 3 and 50 characters");
  } else if (!/^[a-zA-Z0-9_]+$/.test(body.username)) {
    // SECURITY: Only allow alphanumeric and underscore (whitelist approach)
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  // Password validation - ensure reasonable length limits
  if (!body.password || typeof body.password !== "string") {
    errors.push("Password is required and must be a string");
  } else if (body.password.length < 6 || body.password.length > 100) {
    // SECURITY: Prevent extremely long passwords that could cause DoS
    errors.push("Password must be between 6 and 100 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitizes string input by removing potentially dangerous characters.
 * @param {string} input - The string to sanitize.
 * @returns {string} The sanitized string.
 */
export const sanitizeString = (input: string): string => {
  // Remove whitespace and dangerous HTML/script characters
  return input.trim().replace(/[<>\"'&]/g, "");
};

/**
 * Validates email format.
 * @param {string} email - The email to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // RFC 5321 email length limit
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validates UUID format.
 * @param {string} uuid - The UUID to validate.
 * @returns {boolean} True if the UUID is valid, false otherwise.
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};