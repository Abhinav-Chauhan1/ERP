"use server";

/**
 * WhatsApp Actions
 * 
 * Server actions for sending WhatsApp messages via WhatsApp Business API
 * and tracking delivery status.
 * Provides role-based authorization (Admin only) for all WhatsApp operations.
 * 
 * Requirements: 2.3, 3.1, 3.2, 3.5, 8.1, 8.2, 8.3, 8.4, 19.1, 19.2, 19.5
 */

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import {
  sendTextMessage,
  sendTemplateMessage,
  sendMediaMessage,
  sendInteractiveMessage,
  getMessageStatus,
  checkWhatsAppConfiguration,
  validatePhoneNumber,
  sendTextMessageWithRetry,
  sendTemplateMessageWithRetry,
  sendMediaMessageWithRetry,
  sendInteractiveMessageWithRetry,
} from "@/lib/services/whatsapp-service";
import {
  type WhatsAppSendResult,
  type WhatsAppStatusResult,
  WhatsAppTemplateComponent,
  WhatsAppInteractiveMessage,
} from "@/lib/types/communication";

/**
 * Action result type
 */
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Send a single WhatsApp text message
 * 
 * Authorization: Admin only
 * Requirement: 2.3, 3.1
 * 
 * @param data - WhatsApp message parameters
 * @returns Action result with message ID
 */
export async function sendWhatsAppMessage(data: {
  to: string;
  message: string;
  previewUrl?: boolean;
}): Promise<ActionResult<{ messageId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can send WhatsApp messages."
      };
    }

    // Validate inputs
    if (!data.to || !data.message) {
      return {
        success: false,
        error: "Phone number and message are required."
      };
    }

    // Validate phone number format
    if (!validatePhoneNumber(data.to)) {
      return {
        success: false,
        error: "Invalid phone number format. Expected E.164 format (e.g., +919876543210)."
      };
    }

    // Send WhatsApp message with retry logic
    const result = await sendTextMessageWithRetry(
      data.to,
      data.message,
      data.previewUrl || false
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send WhatsApp message."
      };
    }

    // Log the WhatsApp message in audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "WHATSAPP_MESSAGE",
        resourceId: result.messageId,
        userId: session.user.id,
        changes: {
          channel: "WHATSAPP",
          recipient: data.to,
          messageId: result.messageId,
          messageType: "text",
        },
      },
    });

    return {
      success: true,
      data: {
        messageId: result.messageId!,
      },
    };
  } catch (error: any) {
    console.error("Error in sendWhatsAppMessage:", error);
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp message."
    };
  }
}

/**
 * Send a WhatsApp template message
 * 
 * Authorization: Admin only
 * Requirement: 2.3, 3.1
 * 
 * @param data - WhatsApp template message parameters
 * @returns Action result with message ID
 */
export async function sendWhatsAppTemplate(data: {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: WhatsAppTemplateComponent[];
}): Promise<ActionResult<{ messageId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can send WhatsApp template messages."
      };
    }

    // Validate inputs
    if (!data.to || !data.templateName) {
      return {
        success: false,
        error: "Phone number and template name are required."
      };
    }

    // Validate phone number format
    if (!validatePhoneNumber(data.to)) {
      return {
        success: false,
        error: "Invalid phone number format. Expected E.164 format (e.g., +919876543210)."
      };
    }

    // Send WhatsApp template message with retry logic
    const result = await sendTemplateMessageWithRetry(
      data.to,
      data.templateName,
      data.languageCode || 'en',
      data.components || []
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send WhatsApp template message."
      };
    }

    // Log the WhatsApp template message in audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "WHATSAPP_TEMPLATE",
        resourceId: result.messageId,
        userId: session.user.id,
        changes: {
          channel: "WHATSAPP",
          recipient: data.to,
          messageId: result.messageId,
          messageType: "template",
          templateName: data.templateName,
          languageCode: data.languageCode || 'en',
        },
      },
    });

    return {
      success: true,
      data: {
        messageId: result.messageId!,
      },
    };
  } catch (error: any) {
    console.error("Error in sendWhatsAppTemplate:", error);
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp template message."
    };
  }
}

/**
 * Send a WhatsApp media message (image, document, video, audio)
 * 
 * Authorization: Admin only
 * Requirement: 3.5, 8.1, 8.2, 8.3, 8.4
 * 
 * @param data - WhatsApp media message parameters
 * @returns Action result with message ID
 */
export async function sendWhatsAppMedia(data: {
  to: string;
  mediaType: 'image' | 'document' | 'video' | 'audio';
  mediaUrl: string;
  caption?: string;
  filename?: string;
}): Promise<ActionResult<{ messageId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can send WhatsApp media messages."
      };
    }

    // Validate inputs
    if (!data.to || !data.mediaType || !data.mediaUrl) {
      return {
        success: false,
        error: "Phone number, media type, and media URL are required."
      };
    }

    // Validate phone number format
    if (!validatePhoneNumber(data.to)) {
      return {
        success: false,
        error: "Invalid phone number format. Expected E.164 format (e.g., +919876543210)."
      };
    }

    // Validate media type
    const validMediaTypes = ['image', 'document', 'video', 'audio'];
    if (!validMediaTypes.includes(data.mediaType)) {
      return {
        success: false,
        error: `Invalid media type. Must be one of: ${validMediaTypes.join(', ')}.`
      };
    }

    // Send WhatsApp media message with retry logic
    const result = await sendMediaMessageWithRetry(
      data.to,
      data.mediaType,
      data.mediaUrl,
      data.caption,
      data.filename
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send WhatsApp media message."
      };
    }

    // Log the WhatsApp media message in audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "WHATSAPP_MEDIA",
        resourceId: result.messageId,
        userId: session.user.id,
        changes: {
          channel: "WHATSAPP",
          recipient: data.to,
          messageId: result.messageId,
          messageType: data.mediaType,
          mediaUrl: data.mediaUrl,
          caption: data.caption,
          filename: data.filename,
        },
      },
    });

    return {
      success: true,
      data: {
        messageId: result.messageId!,
      },
    };
  } catch (error: any) {
    console.error("Error in sendWhatsAppMedia:", error);
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp media message."
    };
  }
}

/**
 * Send a WhatsApp interactive message (buttons or list)
 * 
 * Authorization: Admin only
 * Requirement: 3.5, 19.1, 19.2, 19.5
 * 
 * @param data - WhatsApp interactive message parameters
 * @returns Action result with message ID
 */
export async function sendWhatsAppInteractive(data: {
  to: string;
  interactive: WhatsAppInteractiveMessage['interactive'];
}): Promise<ActionResult<{ messageId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can send WhatsApp interactive messages."
      };
    }

    // Validate inputs
    if (!data.to || !data.interactive) {
      return {
        success: false,
        error: "Phone number and interactive configuration are required."
      };
    }

    // Validate phone number format
    if (!validatePhoneNumber(data.to)) {
      return {
        success: false,
        error: "Invalid phone number format. Expected E.164 format (e.g., +919876543210)."
      };
    }

    // Validate interactive type
    if (!data.interactive.type || !['button', 'list'].includes(data.interactive.type)) {
      return {
        success: false,
        error: "Interactive type must be 'button' or 'list'."
      };
    }

    // Validate interactive body
    if (!data.interactive.body?.text) {
      return {
        success: false,
        error: "Interactive message body text is required."
      };
    }

    // Send WhatsApp interactive message with retry logic
    const result = await sendInteractiveMessageWithRetry(
      data.to,
      data.interactive
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send WhatsApp interactive message."
      };
    }

    // Log the WhatsApp interactive message in audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "WHATSAPP_INTERACTIVE",
        resourceId: result.messageId,
        userId: session.user.id,
        changes: {
          channel: "WHATSAPP",
          recipient: data.to,
          messageId: result.messageId,
          messageType: "interactive",
          interactiveType: data.interactive.type,
        },
      },
    });

    return {
      success: true,
      data: {
        messageId: result.messageId!,
      },
    };
  } catch (error: any) {
    console.error("Error in sendWhatsAppInteractive:", error);
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp interactive message."
    };
  }
}

/**
 * Send bulk WhatsApp messages to multiple recipients
 * 
 * Authorization: Admin only
 * Requirement: 3.2
 * 
 * @param data - Bulk WhatsApp message parameters
 * @returns Action result with delivery summary
 */
export async function sendBulkWhatsApp(data: {
  recipients: string[];
  message: string;
  previewUrl?: boolean;
}): Promise<ActionResult<{
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    recipient: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can send bulk WhatsApp messages."
      };
    }

    // Validate inputs
    if (!data.recipients || data.recipients.length === 0) {
      return {
        success: false,
        error: "No recipients provided."
      };
    }

    if (!data.message) {
      return {
        success: false,
        error: "Message is required."
      };
    }

    // Validate phone numbers
    const validRecipients: string[] = [];
    const invalidRecipients: string[] = [];

    for (const recipient of data.recipients) {
      if (validatePhoneNumber(recipient)) {
        validRecipients.push(recipient);
      } else {
        invalidRecipients.push(recipient);
      }
    }

    // If there are invalid numbers, return error
    if (invalidRecipients.length > 0) {
      return {
        success: false,
        error: `Invalid phone numbers: ${invalidRecipients.join(', ')}. Expected E.164 format (e.g., +919876543210).`,
      };
    }

    // Send WhatsApp messages to all recipients
    const results: Array<{
      recipient: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    for (const recipient of validRecipients) {
      try {
        const result = await sendTextMessageWithRetry(
          recipient,
          data.message,
          data.previewUrl || false
        );

        results.push({
          recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });
      } catch (error: any) {
        results.push({
          recipient,
          success: false,
          error: error.message || "Failed to send message",
        });
      }
    }

    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Log bulk WhatsApp operation in audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "BULK_WHATSAPP",
        userId: session.user.id,
        changes: {
          channel: "WHATSAPP",
          totalRecipients: results.length,
          successful: successCount,
          failed: failureCount,
        },
      },
    });

    return {
      success: true,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results,
      },
    };
  } catch (error: any) {
    console.error("Error in sendBulkWhatsApp:", error);
    return {
      success: false,
      error: error.message || "Failed to send bulk WhatsApp messages."
    };
  }
}

/**
 * Get delivery status of a sent WhatsApp message
 * 
 * Authorization: Admin only
 * Requirement: 3.1
 * 
 * @param messageId - WhatsApp message ID
 * @returns Action result with delivery status
 */
export async function getWhatsAppStatus(
  messageId: string
): Promise<ActionResult<{
  status: string;
  timestamp?: Date;
  error?: string;
}>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can check WhatsApp message status."
      };
    }

    // Validate input
    if (!messageId) {
      return {
        success: false,
        error: "Message ID is required."
      };
    }

    // Get delivery status
    const status = await getMessageStatus(messageId);

    return {
      success: true,
      data: {
        status: status.status,
        timestamp: status.timestamp,
        error: status.error,
      },
    };
  } catch (error: any) {
    console.error("Error in getWhatsAppStatus:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch WhatsApp message status."
    };
  }
}

/**
 * Check WhatsApp service configuration
 * 
 * Authorization: Admin only
 * Requirement: 2.3
 * 
 * @returns Action result with configuration status
 */
export async function checkWhatsAppConfigurationAction(): Promise<ActionResult<{
  configured: boolean;
  accessToken: boolean;
  phoneNumberId: boolean;
  businessAccountId: boolean;
  appSecret: boolean;
  apiVersion: string;
  message: string;
}>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can check WhatsApp configuration."
      };
    }

    // Check configuration
    const config = checkWhatsAppConfiguration();

    const message = config.configured
      ? "WhatsApp Business API is configured and ready to use."
      : "WhatsApp Business API is not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables.";

    return {
      success: true,
      data: {
        ...config,
        message,
      },
    };
  } catch (error: any) {
    console.error("Error in checkWhatsAppConfigurationAction:", error);
    return {
      success: false,
      error: error.message || "Failed to check WhatsApp configuration."
    };
  }
}

// ============================================================================
// WhatsApp Business Profile Management Actions
// ============================================================================

/**
 * Get WhatsApp Business profile information
 * 
 * Authorization: Admin only
 * Requirement: 20.1
 * 
 * @returns Action result with business profile data
 */
export async function getWhatsAppBusinessProfile(): Promise<ActionResult<{
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can view WhatsApp Business profile."
      };
    }

    // Import business profile functions
    const { getBusinessProfile } = await import("@/lib/services/whatsapp-service");

    // Get business profile
    const profile = await getBusinessProfile();

    if (!profile) {
      return {
        success: false,
        error: "Failed to fetch business profile. Profile may not be set up yet.",
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error: any) {
    console.error("Error in getWhatsAppBusinessProfile:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch WhatsApp Business profile."
    };
  }
}

/**
 * Update WhatsApp Business profile information
 * 
 * Authorization: Admin only
 * Requirement: 20.1, 20.3
 * 
 * @param data - Business profile data to update
 * @returns Action result
 */
export async function updateWhatsAppBusinessProfile(data: {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  websites?: string[];
  vertical?: string;
}): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can update WhatsApp Business profile."
      };
    }

    // Validate at least one field is provided
    if (!data.about && !data.address && !data.description && !data.email && !data.websites && !data.vertical) {
      return {
        success: false,
        error: "At least one field must be provided to update.",
      };
    }

    // Import business profile functions
    const { updateBusinessProfile } = await import("@/lib/services/whatsapp-service");

    // Update business profile
    const result = await updateBusinessProfile(data);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to update business profile.",
      };
    }

    // Log the profile update in audit log
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "WHATSAPP_PROFILE",
        userId: session.user.id,
        changes: {
          updatedFields: Object.keys(data),
        },
      },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error in updateWhatsAppBusinessProfile:", error);
    return {
      success: false,
      error: error.message || "Failed to update WhatsApp Business profile."
    };
  }
}

/**
 * Upload profile photo for WhatsApp Business profile
 * 
 * Authorization: Admin only
 * Requirement: 20.3
 * 
 * @param formData - Form data containing the image file
 * @returns Action result
 */
export async function uploadWhatsAppProfilePhoto(
  formData: FormData
): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can upload WhatsApp profile photo."
      };
    }

    // Get the file from form data
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: "No file provided.",
      };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPEG and PNG images are supported.",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size exceeds 5MB limit.",
      };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Import business profile functions
    const { uploadProfilePhoto } = await import("@/lib/services/whatsapp-service");

    // Upload profile photo
    const result = await uploadProfilePhoto(buffer, file.type);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to upload profile photo.",
      };
    }

    // Log the profile photo upload in audit log
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "WHATSAPP_PROFILE_PHOTO",
        userId: session.user.id,
        changes: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error in uploadWhatsAppProfilePhoto:", error);
    return {
      success: false,
      error: error.message || "Failed to upload WhatsApp profile photo."
    };
  }
}
