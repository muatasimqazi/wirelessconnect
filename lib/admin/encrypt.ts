/**
 * Seller ID number encryption utility.
 *
 * RCW 19.60 requires storing seller identity information.
 * Government ID numbers must NEVER be stored in plaintext.
 *
 * Algorithm: AES-256-GCM (authenticated encryption)
 * Key: SELLER_ID_ENCRYPTION_KEY env var (32-byte hex string)
 * Storage format: `<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
 *
 * Used ONLY in server-side code (Server Actions).
 * NEVER import in Client Components.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const keyHex = process.env.SELLER_ID_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("SELLER_ID_ENCRYPTION_KEY environment variable is not set");
  }
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    throw new Error(
      `SELLER_ID_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Got ${key.length} bytes.`,
    );
  }
  return key;
}

/**
 * Encrypt a plaintext seller ID number.
 * Returns encrypted string in format `<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`.
 */
export function encryptSellerIdNumber(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt an encrypted seller ID number.
 * Returns plaintext or null if decryption fails.
 */
export function decryptSellerIdNumber(encrypted: string): string | null {
  try {
    const [ivHex, authTagHex, ciphertextHex] = encrypted.split(":");
    if (!ivHex || !authTagHex || !ciphertextHex) return null;

    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
  } catch {
    return null;
  }
}
