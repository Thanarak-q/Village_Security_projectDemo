/**
 * @file This file provides a suite of functions for input validation and sanitization.
 * These utilities are crucial for enhancing application security by preventing common
 * vulnerabilities such as Cross-Site Scripting (XSS) and SQL injection. They ensure
 * that data conforms to expected formats and constraints before being processed.
 */

/**
 * Validates the username and password from a login request body.
 * It checks for presence, type, and length, and enforces a strict character set
 * for the username to prevent injection attacks.
 *
 * @param {any} body - The request body, expected to contain `username` and `password`.
 * @returns {{isValid: boolean, errors: string[]}} An object containing a validity flag and a list of error messages.
 */
export const validateLoginInput = (body: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Username validation: strict rules to prevent injection.
  if (!body.username || typeof body.username !== "string") {
    errors.push("Username is required and must be a string");
  } else if (body.username.length < 3 || body.username.length > 50) {
    errors.push("Username must be between 3 and 50 characters");
  } else if (!/^[a-zA-Z0-9_]+$/.test(body.username)) {
    // Whitelist approach: only allow alphanumeric characters and underscores.
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  // Password validation: ensure reasonable length to prevent denial-of-service attacks.
  if (!body.password || typeof body.password !== "string") {
    errors.push("Password is required and must be a string");
  } else if (body.password.length < 6 || body.password.length > 100) {
    errors.push("Password must be between 6 and 100 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitizes a string by trimming whitespace and removing characters
 * that could be used in XSS or other injection attacks.
 *
 * @param {string} input - The string to be sanitized.
 * @returns {string} The sanitized string, with leading/trailing whitespace and potentially harmful characters removed.
 */
export const sanitizeString = (input: string): string => {
  // Removes leading/trailing whitespace and characters often used in HTML/script injection.
  return input.trim().replace(/[<>\"'&]/g, "");
};

/**
 * Validates an email address against a standard regular expression
 * and checks if its length is within the practical limits of RFC 5321.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} `true` if the email format is valid, `false` otherwise.
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Adheres to the practical length limit for an email address.
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validates if a given string is in the standard UUID format.
 * This is useful for ensuring that identifiers are correctly formatted
 * before being used in database queries or API calls.
 *
 * @param {string} uuid - The string to be validated as a UUID.
 * @returns {boolean} `true` if the string is a valid UUID, `false` otherwise.
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};