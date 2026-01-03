"use server";

/**
 * MSG91 Actions
 * 
 * Server actions for sending SMS messages via MSG91 and tracking delivery status.
 * Provides role-based authorization (Admin only) for all MSG91 operations.
 * 
 * Requirements: 1.3, 3.1, 3.2, 4.2
 */

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import {
  sendSMS,
  sendBulkSMS,
  getSMSDeliveryStatus,
  sendSMSWithRetry,
  checkMSG91Configuration,
  validatePhoneNumber,
  formatPhoneNumber,
} from "@/lib/services/msg91-service";
import {
  type MSG91SendResult,
  type MSG91StatusResult,
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
 * Send a single SMS message via MSG91
 * 
 * Authorization: Admin only
 * Requirement: 1.3, 3.1
 * 
 * @param data - SMS parameters
 * @returns Action result with message ID
 */
export async function sendMSG91SMS(data: {
  to: string;
  message: string;
  dltTemplateId?: string;
  countryCode?: string;
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
        error: "Insufficient permissions. Only administrators can send SMS messages."
      };
    }

    // Validate inputs
    if (!data.to || !data.message) {
      return {
        success: false,
        error: "Phone number and message are required."
      };
    }

    // Format phone number if needed
    let phoneNumber = data.to;
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = formatPhoneNumber(phoneNumber, data.countryCode || '91');
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format. Expected E.164 format (e.g., +919876543210)."
      };
    }

    // Send SMS with retry logic
    const result = await sendSMSWithRetry(
      phoneNumber,
      data.message,
      data.dltTemplateId
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send SMS."
      };
    }

    // Log the SMS in audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "SMS",
        resourceId: result.messageId,
        userId: session.user.id,
        changes: {
          channel: "MSG91",
          recipient: phoneNumber,
          messageId: result.messageId,
          dltTemplateId: data.dltTemplateId,
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
    console.error("Error in sendMSG91SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS."
    };
  }
}

/**
 * Send bulk SMS messages to multiple recipients via MSG91
 * 
 * Authorization: Admin only
 * Requirement: 1.3, 3.2
 * 
 * @param data - Bulk SMS parameters
 * @returns Action result with delivery summary
 */
export async function sendBulkMSG91SMS(data: {
  recipients: string[];
  message: string;
  dltTemplateId?: string;
  countryCode?: string;
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
        error: "Insufficient permissions. Only administrators can send bulk SMS messages."
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

    // Format and validate phone numbers
    const formattedRecipients: string[] = [];
    const invalidRecipients: string[] = [];

    for (const recipient of data.recipients) {
      let phoneNumber = recipient;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = formatPhoneNumber(phoneNumber, data.countryCode || '91');
      }

      if (validatePhoneNumber(phoneNumber)) {
        formattedRecipients.push(phoneNumber);
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

    // Send bulk SMS
    const results = await sendBulkSMS(
      formattedRecipients,
      data.message,
      data.dltTemplateId
    );

    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Format results for response
    const formattedResults = results.map((result, index) => ({
      recipient: formattedRecipients[index],
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    }));

    // Log bulk SMS operation in audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "BULK_SMS",
        userId: session.user.id,
        changes: {
          channel: "MSG91",
          totalRecipients: results.length,
          successful: successCount,
          failed: failureCount,
          dltTemplateId: data.dltTemplateId,
        },
      },
    });

    return {
      success: true,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: formattedResults,
      },
    };
  } catch (error: any) {
    console.error("Error in sendBulkMSG91SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to send bulk SMS."
    };
  }
}

/**
 * Get delivery status of a sent SMS message
 * 
 * Authorization: Admin only
 * Requirement: 4.2
 * 
 * @param messageId - MSG91 request ID
 * @returns Action result with delivery status
 */
export async function getMSG91Status(
  messageId: string
): Promise<ActionResult<{
  status: string;
  description?: string;
  deliveredAt?: Date;
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
        error: "Insufficient permissions. Only administrators can check SMS status."
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
    const status = await getSMSDeliveryStatus(messageId);

    return {
      success: true,
      data: {
        status: status.status,
        description: status.description,
        deliveredAt: status.deliveredAt,
      },
    };
  } catch (error: any) {
    console.error("Error in getMSG91Status:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch SMS delivery status."
    };
  }
}

/**
 * Check MSG91 service configuration
 * 
 * Authorization: Admin only
 * Requirement: 1.3
 * 
 * @returns Action result with configuration status
 */
export async function checkMSG91ConfigurationAction(): Promise<ActionResult<{
  configured: boolean;
  authKey: boolean;
  senderId: boolean;
  route: string;
  country: string;
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
        error: "Insufficient permissions. Only administrators can check MSG91 configuration."
      };
    }

    // Check configuration
    const config = checkMSG91Configuration();

    const message = config.configured
      ? "MSG91 service is configured and ready to use."
      : "MSG91 service is not configured. Please set MSG91_AUTH_KEY and MSG91_SENDER_ID environment variables.";

    return {
      success: true,
      data: {
        ...config,
        message,
      },
    };
  } catch (error: any) {
    console.error("Error in checkMSG91ConfigurationAction:", error);
    return {
      success: false,
      error: error.message || "Failed to check MSG91 configuration."
    };
  }
}
