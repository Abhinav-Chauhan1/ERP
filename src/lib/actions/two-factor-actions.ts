'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
  generateBackupCodes,
  encrypt,
  decrypt,
  verifyBackupCode,
} from '@/lib/utils/two-factor';

export interface TwoFactorSetupResult {
  success: boolean;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
  error?: string;
}

export interface TwoFactorVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Initiates 2FA setup for the current user
 * Returns QR code and secret for authenticator app setup
 */
export async function initiateTwoFactorSetup(): Promise<TwoFactorSetupResult> {
  try {
    const authObject = await auth();
    
    if (!authObject.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: authObject.userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Generate TOTP secret
    const { secret, uri } = generateTOTPSecret(user.email);

    // Generate QR code
    const qrCode = await generateQRCode(uri);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Store encrypted secret and backup codes temporarily
    // We'll only save them after verification
    return {
      success: true,
      qrCode,
      secret,
      backupCodes,
    };
  } catch (error) {
    console.error('Error initiating 2FA setup:', error);
    return { success: false, error: 'Failed to initiate 2FA setup' };
  }
}

/**
 * Enables 2FA after verifying the setup token
 */
export async function enableTwoFactor(
  secret: string,
  token: string,
  backupCodes: string[]
): Promise<TwoFactorVerifyResult> {
  try {
    const authObject = await auth();
    
    if (!authObject.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify the token
    const isValid = verifyTOTPToken(token, secret);

    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Encrypt secret and backup codes
    const encryptedSecret = encrypt(secret);
    const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));

    // Update user in database
    await prisma.user.update({
      where: { clerkId: authObject.userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: encryptedBackupCodes,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return { success: false, error: 'Failed to enable 2FA' };
  }
}

/**
 * Disables 2FA for the current user
 */
export async function disableTwoFactor(token: string): Promise<TwoFactorVerifyResult> {
  try {
    const authObject = await auth();
    
    if (!authObject.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: authObject.userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: '2FA is not enabled' };
    }

    // Decrypt secret
    const secret = decrypt(user.twoFactorSecret);

    // Verify the token
    const isValid = verifyTOTPToken(token, secret);

    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Disable 2FA
    await prisma.user.update({
      where: { clerkId: authObject.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return { success: false, error: 'Failed to disable 2FA' };
  }
}

/**
 * Verifies a 2FA token for login
 */
export async function verifyTwoFactorLogin(
  userId: string,
  token: string
): Promise<TwoFactorVerifyResult> {
  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: '2FA is not enabled for this user' };
    }

    // Decrypt secret
    const secret = decrypt(user.twoFactorSecret);

    // Verify the token
    const isValid = verifyTOTPToken(token, secret);

    if (isValid) {
      return { success: true };
    }

    // If TOTP fails, try backup codes
    if (user.twoFactorBackupCodes) {
      const backupResult = verifyBackupCode(token, user.twoFactorBackupCodes);
      
      if (backupResult.valid) {
        // Update remaining backup codes
        await prisma.user.update({
          where: { clerkId: userId },
          data: {
            twoFactorBackupCodes: backupResult.remainingCodes,
          },
        });
        
        return { success: true };
      }
    }

    return { success: false, error: 'Invalid verification code' };
  } catch (error) {
    console.error('Error verifying 2FA login:', error);
    return { success: false, error: 'Failed to verify 2FA code' };
  }
}

/**
 * Gets 2FA status for the current user
 */
export async function getTwoFactorStatus(): Promise<{
  success: boolean;
  enabled: boolean;
  error?: string;
}> {
  try {
    const authObject = await auth();
    
    if (!authObject.userId) {
      return { success: false, enabled: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: authObject.userId },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      return { success: false, enabled: false, error: 'User not found' };
    }

    return { success: true, enabled: user.twoFactorEnabled };
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return { success: false, enabled: false, error: 'Failed to get 2FA status' };
  }
}

/**
 * Regenerates backup codes for the current user
 */
export async function regenerateBackupCodes(token: string): Promise<{
  success: boolean;
  backupCodes?: string[];
  error?: string;
}> {
  try {
    const authObject = await auth();
    
    if (!authObject.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: authObject.userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: '2FA is not enabled' };
    }

    // Decrypt secret
    const secret = decrypt(user.twoFactorSecret);

    // Verify the token
    const isValid = verifyTOTPToken(token, secret);

    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10);
    const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));

    // Update user in database
    await prisma.user.update({
      where: { clerkId: authObject.userId },
      data: {
        twoFactorBackupCodes: encryptedBackupCodes,
      },
    });

    return { success: true, backupCodes };
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return { success: false, error: 'Failed to regenerate backup codes' };
  }
}
