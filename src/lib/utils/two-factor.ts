import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-key-change-in-production-32b';

// ============================================================================
// Web Crypto API Helper Functions (Edge Runtime Compatible)
// ============================================================================

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string
 */
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate cryptographically secure random bytes using Web Crypto API
 */
function getRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * Derive encryption key from password using PBKDF2 (Web Crypto API)
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordBytes = stringToUint8Array(password);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// Encryption/Decryption Functions
// ============================================================================

/**
 * Encrypts sensitive data using AES-256-GCM (Web Crypto API)
 */
export async function encrypt(text: string): Promise<string> {
  const iv = getRandomBytes(12); // 12 bytes for AES-GCM
  const salt = getRandomBytes(16); // Salt for key derivation
  const key = await deriveKey(ENCRYPTION_KEY, salt);

  const textBytes = stringToUint8Array(text);
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    textBytes.buffer as ArrayBuffer
  );

  // Combine salt + iv + encrypted data
  const combined = uint8ArrayToHex(salt) + ':' + uint8ArrayToHex(iv) + ':' + uint8ArrayToHex(new Uint8Array(encryptedData));
  return combined;
}

/**
 * Decrypts data encrypted with encrypt() (Web Crypto API)
 */
export async function decrypt(text: string): Promise<string> {
  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const salt = hexToUint8Array(parts[0]);
  const iv = hexToUint8Array(parts[1]);
  const encryptedData = hexToUint8Array(parts[2]);

  const key = await deriveKey(ENCRYPTION_KEY, salt);

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encryptedData.buffer as ArrayBuffer
  );

  return uint8ArrayToString(new Uint8Array(decryptedData));
}

// ============================================================================
// TOTP Functions
// ============================================================================

/**
 * Generates a new TOTP secret for a user
 */
export function generateTOTPSecret(userEmail: string, issuer: string = 'SikshaMitra'): {
  secret: string;
  uri: string;
} {
  // Generate random bytes for secret using Web Crypto API
  const randomBytes = getRandomBytes(20);
  const randomHex = uint8ArrayToHex(randomBytes);

  const totp = new OTPAuth.TOTP({
    issuer,
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(OTPAuth.Secret.fromUTF8(randomHex).base32),
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Generates a QR code data URL from a TOTP URI
 */
export async function generateQRCode(uri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(uri);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verifies a TOTP token against a secret
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // Allow a window of ±1 period (30 seconds) to account for time drift
    const delta = totp.validate({ token, window: 1 });

    return delta !== null;
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return false;
  }
}

// ============================================================================
// Backup Codes Functions
// ============================================================================

/**
 * Generates backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes using Web Crypto API
    const randomBytes = getRandomBytes(4);
    const code = uint8ArrayToHex(randomBytes).toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Verifies a backup code against stored codes
 */
export async function verifyBackupCode(code: string, encryptedCodes: string): Promise<{
  valid: boolean;
  remainingCodes?: string;
}> {
  try {
    const decryptedCodes = await decrypt(encryptedCodes);
    const codes = JSON.parse(decryptedCodes) as string[];

    const codeIndex = codes.findIndex(c => c === code.toUpperCase());

    if (codeIndex === -1) {
      return { valid: false };
    }

    // Remove the used code
    codes.splice(codeIndex, 1);

    // Return encrypted remaining codes
    const remainingCodes = await encrypt(JSON.stringify(codes));

    return { valid: true, remainingCodes };
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return { valid: false };
  }
}
