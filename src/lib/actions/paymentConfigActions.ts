"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "@/lib/utils/cached-queries";
import { encryptCredential, decryptCredential } from "@/lib/utils/encrypt-credentials";
import { getSchoolCashfreeInstance } from "@/lib/utils/payment-gateway";

/**
 * Payment Configuration Type
 */
export interface PaymentConfigType {
  enableOnlinePayment: boolean;
  enableOfflineVerification: boolean;
  onlinePaymentGateway?: string | null;
  maxReceiptSizeMB: number;
  allowedReceiptFormats: string;
  autoNotifyOnVerification: boolean;
  // Cashfree per-school credentials (secrets never returned — only presence flags)
  cashfreeEnabled: boolean;
  cashfreeAppId?: string | null;
  cashfreeSecretSet: boolean;
  cashfreeWebhookSet: boolean;
}

/**
 * Get payment configuration
 * Uses cached query for performance
 * Requirements: 7.1, 7.2, 7.3
 */
export async function getPaymentConfig() {
  try {
    // Get required school context - CRITICAL for multi-tenancy
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();
    
    // Use cached query for better performance with schoolId
    const settings = await getSystemSettings(schoolId);
    
    if (!settings) {
      return { 
        success: false, 
        error: "System settings not found for this school" 
      };
    }
    
    // Extract payment configuration fields
    const config: PaymentConfigType = {
      enableOnlinePayment: settings.enableOnlinePayment,
      enableOfflineVerification: settings.enableOfflineVerification,
      onlinePaymentGateway: settings.onlinePaymentGateway,
      maxReceiptSizeMB: settings.maxReceiptSizeMB,
      allowedReceiptFormats: settings.allowedReceiptFormats,
      autoNotifyOnVerification: settings.autoNotifyOnVerification,
      cashfreeEnabled: settings.cashfreeEnabled,
      cashfreeAppId: settings.cashfreeAppId,
      cashfreeSecretSet: !!settings.cashfreeSecretEncrypted,
      cashfreeWebhookSet: !!settings.cashfreeWebhookEncrypted,
    };
    
    return { 
      success: true, 
      data: config 
    };
  } catch (error) {
    console.error("Error fetching payment configuration:", error);
    return { 
      success: false, 
      error: "Failed to fetch payment configuration" 
    };
  }
}

/**
 * Update payment configuration
 * Validates configuration values and ensures at least one payment method is enabled
 * Requirements: 7.1, 7.2, 7.3
 */
export async function updatePaymentConfig(config: Partial<PaymentConfigType>) {
  try {
    // Authentication check
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { 
        success: false, 
        error: "Unauthorized" 
      };
    }

    // Get user and verify admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || !user.administrator) {
      return { 
        success: false, 
        error: "Unauthorized - Admin access required" 
      };
    }

    // Get required school context - CRITICAL for multi-tenancy
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get current settings for this school
    const settings = await db.schoolSettings.findUnique({
      where: { schoolId }, // CRITICAL: Filter by school
    });
    
    if (!settings) {
      return { 
        success: false, 
        error: "System settings not found for this school" 
      };
    }

    // Validate configuration values
    const validationError = validatePaymentConfig(config, settings);
    if (validationError) {
      return { 
        success: false, 
        error: validationError 
      };
    }

    // Prepare update data
    const updateData: Partial<PaymentConfigType> = {};
    
    if (config.enableOnlinePayment !== undefined) {
      updateData.enableOnlinePayment = config.enableOnlinePayment;
    }
    
    if (config.enableOfflineVerification !== undefined) {
      updateData.enableOfflineVerification = config.enableOfflineVerification;
    }
    
    if (config.onlinePaymentGateway !== undefined) {
      updateData.onlinePaymentGateway = config.onlinePaymentGateway;
    }
    
    if (config.maxReceiptSizeMB !== undefined) {
      updateData.maxReceiptSizeMB = config.maxReceiptSizeMB;
    }
    
    if (config.allowedReceiptFormats !== undefined) {
      updateData.allowedReceiptFormats = config.allowedReceiptFormats;
    }
    
    if (config.autoNotifyOnVerification !== undefined) {
      updateData.autoNotifyOnVerification = config.autoNotifyOnVerification;
    }

    // Update settings for this school only
    const updated = await db.schoolSettings.update({
      where: { schoolId }, // CRITICAL: Update only current school
      data: updateData,
    });

    // Revalidate paths and tags to clear cache
    revalidatePath("/admin/settings");
    revalidatePath("/admin/finance");
    revalidatePath("/student/fees");
    revalidatePath("/parent/fees");
    
    // Also invalidate the settings cache tag with schoolId
    const { revalidateTag } = await import("next/cache");
    revalidateTag("settings", "default");
    revalidateTag(`settings-${schoolId}`, "default");
    
    // Extract payment configuration from updated settings
    const updatedConfig: PaymentConfigType = {
      enableOnlinePayment: updated.enableOnlinePayment,
      enableOfflineVerification: updated.enableOfflineVerification,
      onlinePaymentGateway: updated.onlinePaymentGateway,
      maxReceiptSizeMB: updated.maxReceiptSizeMB,
      allowedReceiptFormats: updated.allowedReceiptFormats,
      autoNotifyOnVerification: updated.autoNotifyOnVerification,
      cashfreeEnabled: updated.cashfreeEnabled,
      cashfreeAppId: updated.cashfreeAppId,
      cashfreeSecretSet: !!updated.cashfreeSecretEncrypted,
      cashfreeWebhookSet: !!updated.cashfreeWebhookEncrypted,
    };
    
    return { 
      success: true, 
      data: updatedConfig 
    };
  } catch (error) {
    console.error("Error updating payment configuration:", error);
    return { 
      success: false, 
      error: "Failed to update payment configuration" 
    };
  }
}

/**
 * Validate payment configuration values
 * Ensures at least one payment method is enabled and values are within acceptable ranges
 */
function validatePaymentConfig(
  config: Partial<PaymentConfigType>, 
  currentSettings: { 
    enableOnlinePayment: boolean; 
    enableOfflineVerification: boolean;
    maxReceiptSizeMB: number;
  }
): string | null {
  // Determine final state after update
  const finalOnlineEnabled = config.enableOnlinePayment !== undefined 
    ? config.enableOnlinePayment 
    : currentSettings.enableOnlinePayment;
    
  const finalOfflineEnabled = config.enableOfflineVerification !== undefined 
    ? config.enableOfflineVerification 
    : currentSettings.enableOfflineVerification;

  // At least one payment method must be enabled
  if (!finalOnlineEnabled && !finalOfflineEnabled) {
    return "At least one payment method must be enabled (online or offline verification)";
  }

  // Validate maxReceiptSizeMB
  if (config.maxReceiptSizeMB !== undefined) {
    if (config.maxReceiptSizeMB <= 0) {
      return "Maximum receipt size must be greater than 0 MB";
    }
    if (config.maxReceiptSizeMB > 50) {
      return "Maximum receipt size cannot exceed 50 MB";
    }
  }

  // Validate allowedReceiptFormats
  if (config.allowedReceiptFormats !== undefined) {
    const formats = config.allowedReceiptFormats.split(',').map(f => f.trim().toLowerCase());
    const validFormats = ['jpg', 'jpeg', 'png', 'pdf', 'webp'];
    
    if (formats.length === 0) {
      return "At least one receipt format must be allowed";
    }
    
    for (const format of formats) {
      if (!validFormats.includes(format)) {
        return `Invalid receipt format: ${format}. Allowed formats: ${validFormats.join(', ')}`;
      }
    }
  }

  // Validate onlinePaymentGateway if online payment is enabled
  if (finalOnlineEnabled && config.onlinePaymentGateway !== undefined) {
    const validGateways = ['CASHFREE', 'STRIPE', 'PAYPAL', 'PAYTM'];
    if (config.onlinePaymentGateway && !validGateways.includes(config.onlinePaymentGateway)) {
      return `Invalid payment gateway: ${config.onlinePaymentGateway}. Allowed gateways: ${validGateways.join(', ')}`;
    }
  }

  return null;
}

/**
 * Save per-school Cashfree credentials (encrypted at rest)
 */
export async function saveCashfreeCredentials(
  appId: string,
  secretKey: string,
  webhookSecret: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { administrator: true },
    });
    if (!user?.administrator) return { success: false, error: "Admin access required" };

    if (!appId.trim()) return { success: false, error: "App ID is required" };
    if (!secretKey.trim()) return { success: false, error: "Secret Key is required" };
    if (!webhookSecret.trim()) return { success: false, error: "Webhook Secret is required" };

    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    await db.schoolSettings.update({
      where: { schoolId },
      data: {
        cashfreeAppId: appId.trim(),
        cashfreeSecretEncrypted: encryptCredential(secretKey.trim()),
        cashfreeWebhookEncrypted: encryptCredential(webhookSecret.trim()),
        cashfreeEnabled: true,
        onlinePaymentGateway: 'CASHFREE',
        enableOnlinePayment: true,
      },
    });

    revalidatePath("/admin/settings/payment-configuration");
    return { success: true };
  } catch (error) {
    console.error("Error saving Cashfree credentials:", error);
    return { success: false, error: "Failed to save credentials" };
  }
}

/**
 * Test per-school Cashfree credentials by creating and immediately voiding a test order
 */
export async function testCashfreeConnection(appId: string, secretKey: string) {
  try {
    if (!appId.trim() || !secretKey.trim()) {
      return { success: false, error: "App ID and Secret Key are required" };
    }

    const { createCashfreeOrder } = await import('@/lib/utils/payment-gateway');
    const instance = getSchoolCashfreeInstance(appId.trim(), secretKey.trim());

    // Create a minimal ₹1 test order — if credentials are invalid, this will throw
    const testOrderId = `TEST-${Date.now()}`;
    await createCashfreeOrder(
      {
        orderId: testOrderId,
        amount: 1,
        currency: 'INR',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        customerPhone: '9999999999',
        returnUrl: 'https://localhost',
        notifyUrl: 'https://localhost',
      },
      instance
    );

    return { success: true };
  } catch (error) {
    console.error("Cashfree connection test failed:", error);
    const message = error instanceof Error ? error.message : "Connection failed";
    return { success: false, error: `Connection failed: ${message}` };
  }
}

/**
 * Get decrypted school Cashfree credentials for server-side use only.
 * Never call this from a client component or return the result to the browser.
 */
export async function getSchoolCashfreeCredentials(schoolId: string) {
  const settings = await db.schoolSettings.findUnique({
    where: { schoolId },
    select: {
      cashfreeEnabled: true,
      cashfreeAppId: true,
      cashfreeSecretEncrypted: true,
      cashfreeWebhookEncrypted: true,
    },
  });

  if (
    !settings?.cashfreeEnabled ||
    !settings.cashfreeAppId ||
    !settings.cashfreeSecretEncrypted ||
    !settings.cashfreeWebhookEncrypted
  ) {
    return null;
  }

  return {
    appId: settings.cashfreeAppId,
    secretKey: decryptCredential(settings.cashfreeSecretEncrypted),
    webhookSecret: decryptCredential(settings.cashfreeWebhookEncrypted),
  };
}
