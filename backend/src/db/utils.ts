import { randomUUID } from 'crypto';

/**
 * Generate or use provided resident_id
 * If resident_id is provided, use it as is
 * If resident_id is not provided, generate a new UUID
 */
export function getResidentId(providedId?: string): string {
  return providedId || randomUUID();
}

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if a resident_id is custom (not UUID format) or auto-generated (UUID format)
 */
export function isCustomResidentId(residentId: string): boolean {
  return !isValidUUID(residentId);
} 