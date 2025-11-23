import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-key-change-in-production-32b';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts sensitive data using AES-256-CBC
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts data encrypted with encrypt()
 */
export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generates a new TOTP secret for a user
 */
export function generateTOTPSecret(userEmail: string, issuer: string = 'School ERP'): {
  secret: string;
  uri: string;
} {
  const totp = new OTPAuth.TOTP({
    issuer,
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(OTPAuth.Secret.fromUTF8(crypto.randomBytes(20).toString('hex')).base32),
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

/**
 * Generates backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Verifies a backup code against stored codes
 */
export function verifyBackupCode(code: string, encryptedCodes: string): {
  valid: boolean;
  remainingCodes?: string;
} {
  try {
    const decryptedCodes = decrypt(encryptedCodes);
    const codes = JSON.parse(decryptedCodes) as string[];
    
    const codeIndex = codes.findIndex(c => c === code.toUpperCase());
    
    if (codeIndex === -1) {
      return { valid: false };
    }
    
    // Remove the used code
    codes.splice(codeIndex, 1);
    
    // Return encrypted remaining codes
    const remainingCodes = encrypt(JSON.stringify(codes));
    
    return { valid: true, remainingCodes };
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return { valid: false };
  }
}
