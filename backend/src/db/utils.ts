/**
 * @file This file contains miscellaneous database-related utility functions.
 * These functions provide support for common tasks such as ID generation and validation,
 * helping to maintain consistency and correctness in data handling.
 */

import { randomUUID } from 'crypto';

/**
 * Generates a new UUID for a resident ID or returns a provided ID.
 * This function ensures that a resident always has a valid ID, generating a new one
 * if an existing ID is not supplied.
 *
 * @param {string} [providedId] - An optional, existing resident ID.
 * @returns {string} The existing ID if provided, or a newly generated UUID.
 */
export function getResidentId(providedId?: string): string {
  return providedId || randomUUID();
}

/**
 * Validates whether a given string conforms to the standard UUID format.
 *
 * @param {string} uuid - The string to be validated.
 * @returns {boolean} `true` if the string is a valid UUID, otherwise `false`.
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Determines if a resident ID is a custom identifier rather than a standard UUID.
 * This is useful for systems that may use alternative identification schemes.
 *
 * @param {string} residentId - The resident ID to check.
 * @returns {boolean} `true` if the ID is not in UUID format, otherwise `false`.
 */
export function isCustomResidentId(residentId: string): boolean {
  return !isValidUUID(residentId);
}


