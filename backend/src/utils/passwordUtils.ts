import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hashes a plain text password using bcrypt.
 * @param {string} plainPassword - The plain text password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verifies a plain text password against a hashed password.
 * @param {string} plainPassword - The plain text password to verify.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} A promise that resolves to true if the password matches, false otherwise.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Checks if a string is already hashed (starts with $2b$).
 * @param {string} password - The password string to check.
 * @returns {boolean} True if the password is already hashed, false otherwise.
 */
export function isPasswordHashed(password: string): boolean {
  return password.startsWith("$2b$");
} 