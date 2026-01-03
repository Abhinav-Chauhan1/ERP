"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
  generateBackupCodes,
  encrypt,
  decrypt,
} from "@/lib/utils/two-factor"
import { verifyPassword } from "@/lib/password"

export interface TwoFactorSetupResult {
  success: boolean
  qrCode?: string
  secret?: string
  backupCodes?: string[]
  error?: string
}

export interface TwoFactorVerifyResult {
  success: boolean
  error?: string
}

/**
 * Initiates 2FA setup for the current user
 * Requires password confirmation
 * Returns QR code and secret for authenticator app setup
 */
export async function initiateTwoFactorSetup(
  password: string
): Promise<TwoFactorSetupResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Verify password
    if (!user.password) {
      return { success: false, error: "Password authentication not available for OAuth users" }
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return { success: false, error: "Invalid password" }
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return { success: false, error: "2FA is already enabled" }
    }

    // Generate TOTP secret
    const { secret, uri } = generateTOTPSecret(user.email)

    // Generate QR code
    const qrCode = await generateQRCode(uri)

    // Generate backup codes
    const backupCodes = generateBackupCodes(10)

    // Return setup data (don't save yet - wait for verification)
    return {
      success: true,
      qrCode,
      secret,
      backupCodes,
    }
  } catch (error) {
    console.error("Error initiating 2FA setup:", error)
    return { success: false, error: "Failed to initiate 2FA setup" }
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
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify the token
    const isValid = verifyTOTPToken(token, secret)

    if (!isValid) {
      return { success: false, error: "Invalid verification code" }
    }

    // Encrypt secret and backup codes
    const encryptedSecret = await encrypt(secret)
    const encryptedBackupCodes = await encrypt(JSON.stringify(backupCodes))

    // Update user in database
    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: encryptedBackupCodes,
      },
    })

    // Log 2FA enablement
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "USER",
        userId: session.user.id,
        changes: { type: "2FA_ENABLED" }
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error enabling 2FA:", error)
    return { success: false, error: "Failed to enable 2FA" }
  }
}

/**
 * Disables 2FA for the current user
 * Requires TOTP code confirmation
 */
export async function disableTwoFactor(token: string): Promise<TwoFactorVerifyResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: "2FA is not enabled" }
    }

    // Decrypt secret
    const secret = await decrypt(user.twoFactorSecret)

    // Verify the token
    const isValid = verifyTOTPToken(token, secret)

    if (!isValid) {
      return { success: false, error: "Invalid verification code" }
    }

    // Disable 2FA
    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    })

    // Log 2FA disablement
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "USER",
        userId: session.user.id,
        changes: { type: "2FA_DISABLED" }
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error disabling 2FA:", error)
    return { success: false, error: "Failed to disable 2FA" }
  }
}

/**
 * Gets 2FA status for the current user
 */
export async function getTwoFactorStatus(): Promise<{
  success: boolean
  enabled: boolean
  error?: string
}> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, enabled: false, error: "Unauthorized" }
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    })

    if (!user) {
      return { success: false, enabled: false, error: "User not found" }
    }

    return { success: true, enabled: user.twoFactorEnabled }
  } catch (error) {
    console.error("Error getting 2FA status:", error)
    return { success: false, enabled: false, error: "Failed to get 2FA status" }
  }
}

/**
 * Regenerates backup codes for the current user
 * Requires TOTP code confirmation
 */
export async function regenerateBackupCodes(token: string): Promise<{
  success: boolean
  backupCodes?: string[]
  error?: string
}> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: "2FA is not enabled" }
    }

    // Decrypt secret
    const secret = await decrypt(user.twoFactorSecret)

    // Verify the token
    const isValid = verifyTOTPToken(token, secret)

    if (!isValid) {
      return { success: false, error: "Invalid verification code" }
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10)
    const encryptedBackupCodes = await encrypt(JSON.stringify(backupCodes))

    // Update user in database
    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorBackupCodes: encryptedBackupCodes,
      },
    })

    // Log backup code regeneration
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "USER",
        userId: session.user.id,
        changes: { type: "2FA_BACKUP_CODES_REGENERATED" }
      }
    })

    return { success: true, backupCodes }
  } catch (error) {
    console.error("Error regenerating backup codes:", error)
    return { success: false, error: "Failed to regenerate backup codes" }
  }
}
