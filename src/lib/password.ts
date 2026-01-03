import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

// Web Crypto API constants
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LEN = 256;
const PBKDF2_DIGEST = "SHA-256";

// Helper to access crypto in different environments
function getCrypto() {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto;
  }
  // Safe fallback for Node.js environment that might not have global crypto yet
  try {
    // Dynamically require crypto to avoid Webpack errors in browser builds
    /* eslint-disable-next-line */
    return require('crypto').webcrypto;
  } catch (e) {
    return undefined;
  }
}

const crypto = getCrypto();

// Polyfill TextEncoder if missing (paranoid check for some Node envs)
if (typeof globalThis.TextEncoder === 'undefined') {
  try {
    /* eslint-disable-next-line */
    const { TextEncoder } = require('util');
    globalThis.TextEncoder = TextEncoder;
  } catch (e) {
    console.error("Failed to polyfill TextEncoder", e);
  }
}

/**
 * Hashes a password using Web Crypto API (PBKDF2)
 * @param password - The plaintext password to hash
 * @returns Promise resolving to the hashed password string (format: salt:hash)
 */
export async function hashPassword(password: string): Promise<string> {
  console.log("hashPassword called");
  // Use Web Crypto API if available (Node.js 15+ or Edge Runtime)
  if (typeof crypto !== 'undefined' && (crypto.subtle || (crypto as any).webcrypto?.subtle)) {
    console.log("Using Web Crypto API");
    return hashPasswordWebCrypto(password);
  }
  console.log("Web Crypto API not available (crypto undefined or subtle undefined). Falling back to bcrypt.");
  console.log("Crypto type:", typeof crypto);
  if (typeof crypto !== 'undefined') {
    console.log("Crypto keys:", Object.keys(crypto));
  }

  // Fallback to bcrypt if Web Crypto is weirdly not available (shouldn't happen in modern envs)
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function hashPasswordWebCrypto(password: string): Promise<string> {
  // Access subtle from crypto or potentially webcrypto property if using node require directly returned module
  const subtle = crypto.subtle || (crypto as any).webcrypto?.subtle;
  if (!subtle) throw new Error("Web Crypto API not available");

  try {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    console.log("Salt generated");

    const keyMaterial = await subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    console.log("Key imported");

    const derivedKey = await subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: PBKDF2_DIGEST,
      },
      keyMaterial,
      { name: "HMAC", hash: PBKDF2_DIGEST, length: PBKDF2_KEY_LEN },
      true,
      ["sign", "verify"]
    );

    const exportedKey = await subtle.exportKey("raw", derivedKey);

    // Convert to hex strings for storage
    const saltHex = Array.from(salt).map((b: any) => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(exportedKey)).map((b: any) => b.toString(16).padStart(2, '0')).join('');

    return `pbkdf2:${saltHex}:${hashHex}`;
  } catch (error) {
    console.error("Error in hashPasswordWebCrypto:", error);
    throw error;
  }
}

async function verifyPasswordWebCrypto(password: string, storedHash: string): Promise<boolean> {
  const subtle = crypto?.subtle || (crypto as any)?.webcrypto?.subtle;
  if (!subtle) return false;

  const [type, saltHex, hashHex] = storedHash.split(':');

  if (type !== 'pbkdf2') return false;

  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const derivedKey = await subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_DIGEST,
    },
    keyMaterial,
    { name: "HMAC", hash: PBKDF2_DIGEST, length: PBKDF2_KEY_LEN },
    true,
    ["sign", "verify"]
  );

  const exportedKey = await subtle.exportKey("raw", derivedKey);
  const derivedHashHex = Array.from(new Uint8Array(exportedKey)).map((b: any) => b.toString(16).padStart(2, '0')).join('');

  return hashHex === derivedHashHex;
}

/**
 * Verifies a password against a hash (Supports both bcrypt and Web Crypto)
 * @param password - The plaintext password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (hashedPassword.startsWith('$2')) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Assume it's our new Web Crypto hash
  if (hashedPassword.startsWith('pbkdf2:')) {
    return verifyPasswordWebCrypto(password, hashedPassword);
  }

  // Unknown format
  return false;
}

/**
 * Validates password strength according to security requirements
 * @param password - The password to validate
 * @returns Object containing validation result and any error messages
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
