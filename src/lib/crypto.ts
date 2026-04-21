import crypto from "crypto";

/**
 * AES-256-GCM symmetric encryption for OAuth tokens + other sensitive strings
 * stored in the database. Keyed off process.env.ENCRYPTION_KEY — a 32-byte
 * (64-hex-character) key generated with `openssl rand -hex 32`.
 *
 * Format of the encrypted string: base64(iv || authTag || ciphertext)
 *   - iv: 12 bytes (GCM standard)
 *   - authTag: 16 bytes (GCM standard)
 *   - ciphertext: variable
 *
 * Why GCM: authenticated encryption means we detect tampering.
 * Why AES-256: matches industry standard for at-rest encryption.
 *
 * Never log or ship plaintext values returned from decrypt().
 */

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;   // GCM recommended
const TAG_LENGTH = 16;  // GCM standard

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set. Generate with `openssl rand -hex 32` and add to env.");
  }
  if (raw.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes). Use `openssl rand -hex 32`.");
  }
  return Buffer.from(raw, "hex");
}

/**
 * Encrypt a plaintext string. Returns base64-encoded iv+tag+ciphertext.
 * Safe to store directly in a text column.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, ciphertext]);
  return combined.toString("base64");
}

/**
 * Decrypt a base64-encoded iv+tag+ciphertext string back to plaintext.
 * Throws if the authTag doesn't verify (tampering detected).
 */
export function decrypt(encoded: string): string {
  const key = getKey();
  const combined = Buffer.from(encoded, "base64");
  if (combined.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Ciphertext too short to be valid.");
  }
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

/**
 * Safe wrapper — returns null on decrypt failure instead of throwing.
 * Use when graceful degradation is preferred (e.g., stored ciphertext corrupted
 * after an encryption key change).
 */
export function tryDecrypt(encoded: string | null | undefined): string | null {
  if (!encoded) return null;
  try {
    return decrypt(encoded);
  } catch {
    return null;
  }
}
