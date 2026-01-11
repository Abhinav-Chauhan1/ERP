"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "@/lib/utils/cached-queries";

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
}

/**
 * Get payment configuration
 * Uses cached query for performance
 * Requirements: 7.1, 7.2, 7.3
 */
export async function getPaymentConfig() {
  try {
    // Use cached query for better performance
    const settings = await getSystemSettings();
    
    if (!settings) {
      return { 
        success: false, 
        error: "System settings not found" 
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

    // Get current settings
    const settings = await db.systemSettings.findFirst();
    
    if (!settings) {
      return { 
        success: false, 
        error: "System settings not found" 
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

    // Update settings
    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    // Revalidate paths and tags to clear cache
    revalidatePath("/admin/settings");
    revalidatePath("/admin/finance");
    revalidatePath("/student/fees");
    revalidatePath("/parent/fees");
    
    // Also invalidate the settings cache tag
    const { revalidateTag } = await import("next/cache");
    revalidateTag("settings", "default");
    
    // Extract payment configuration from updated settings
    const updatedConfig: PaymentConfigType = {
      enableOnlinePayment: updated.enableOnlinePayment,
      enableOfflineVerification: updated.enableOfflineVerification,
      onlinePaymentGateway: updated.onlinePaymentGateway,
      maxReceiptSizeMB: updated.maxReceiptSizeMB,
      allowedReceiptFormats: updated.allowedReceiptFormats,
      autoNotifyOnVerification: updated.autoNotifyOnVerification,
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
    const validGateways = ['RAZORPAY', 'STRIPE', 'PAYPAL', 'PAYTM'];
    if (config.onlinePaymentGateway && !validGateways.includes(config.onlinePaymentGateway)) {
      return `Invalid payment gateway: ${config.onlinePaymentGateway}. Allowed gateways: ${validGateways.join(', ')}`;
    }
  }

  return null;
}
