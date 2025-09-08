/**
 * @file This file provides utility functions for password management,
 * including hashing and verification. It uses the `bcryptjs` library
 * to perform secure, asynchronous password operations. These utilities
 * are essential for maintaining user security by avoiding the storage
 * of plain-text passwords.
 */

import bcrypt from "bcryptjs";

/**
 * The number of salt rounds to use for hashing.
 * A higher number increases the computational cost of hashing,
 * making brute-force attacks more difficult.
 * @type {number}
 */
const SALT_ROUNDS = 12;

/**
 * Hashes a plain-text password using bcrypt.
 * This is an asynchronous operation that generates a salt and
 * hashes the password, making it suitable for secure storage.
 *
 * @param {string} plainPassword - The plain-text password to be hashed.
 * @returns {Promise<string>} A promise that resolves to the securely hashed password.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verifies a plain-text password against a stored hash.
 * This function securely compares the provided password with the
 * hash without exposing the original password.
 *
 * @param {string} plainPassword - The plain-text password to verify.
 * @param {string} hashedPassword - The stored hash to compare against.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the password is correct, and `false` otherwise.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Checks if a given string appears to be a bcrypt hash.
 * This is useful for determining if a password needs to be hashed,
 * for instance, during a data migration.
 *
 * @param {string} password - The string to check.
 * @returns {boolean} `true` if the string starts with the bcrypt identifier, `false` otherwise.
 */
export function isPasswordHashed(password: string): boolean {
  return password.startsWith("$2b$");
} 