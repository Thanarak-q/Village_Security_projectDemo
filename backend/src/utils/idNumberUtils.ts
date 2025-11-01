import "../config/env";
import crypto from "crypto";

const DEFAULT_ID_HASH_SECRET = "village-security-id-secret";
const ID_HASH_SECRET =
  process.env.ID_NUMBER_HASH_SECRET ||
  process.env.ID_NUMBER_HASH_SALT ||
  DEFAULT_ID_HASH_SECRET;

/**
 * Normalizes an ID number by trimming whitespace, removing separators,
 * and uppercasing characters to ensure consistent hashing.
 */
export function normalizeIdNumber(idNumber: string): string {
  return idNumber.trim().replace(/[\s-]+/g, "").toUpperCase();
}

/**
 * Hashes the provided ID/document number using HMAC-SHA256 with a secret.
 * Falls back to a default secret in development if none is provided.
 */
export function hashIdNumber(idNumber: string): string {
  const normalized = normalizeIdNumber(idNumber);
  const hmac = crypto.createHmac("sha256", ID_HASH_SECRET);
  hmac.update(normalized);
  return hmac.digest("hex");
}

/**
 * Extracts the last four characters from the normalized ID/document number.
 * Returns the entire string if it is shorter than four characters.
 */
export function extractIdLast4(idNumber: string): string {
  const normalized = normalizeIdNumber(idNumber);
  return normalized.slice(-4);
}
