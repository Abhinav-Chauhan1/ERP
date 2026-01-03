"use server";

/**
 * SMS Actions
 * 
 * Server actions for sending SMS messages and tracking delivery status.
 * Integrates with the SMS service to provide bulk messaging capabilities.
 * 
 * Requirements: 11.2 - SMS Gateway Integration
 */

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import {
  sendSMS,
  sendBulkSMS,
  getSMSDeliveryStatus,
  sendSMSWithRetry,
  isSMSConfigured,
  formatPhoneNumber,
  isValidPhoneNumber,
  getSMSProvider,
  type SMSSendResult,
  type SMSStatusResult,
} from "@/lib/services/sms-service";

/**
 * Send a single SMS message
 */
export async function sendSingleSMS(data: {
  to: string;
  message: string;
  countryCode?: string;
  dltTemplateId?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user has permission to send SMS
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate and format phone number
    let phoneNumber = data.to;
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = formatPhoneNumber(phoneNumber, data.countryCode || '+1');
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return { success: false, error: "Invalid phone number format. Use E.164 format: +1234567890" };
    }

    // Send SMS with retry logic (includes DLT template ID if provided)
    const result = await sendSMSWithRetry(phoneNumber, data.message, data.dltTemplateId);

    if (!result.success) {
      return { success: false, error: result.error || "Failed to send SMS" };
    }

    // Log the SMS in database (optional - for tracking)
    // You could create an SMSLog model to track all sent messages
    
    return {
      success: true,
      data: {
        messageId: result.messageId,
        status: result.status,
        to: result.to,
      },
    };
  } catch (error: any) {
    console.error("Error in sendSingleSMS:", error);
    return { success: false, error: error.message || "Failed to send SMS" };
  }
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSMSAction(data: {
  recipients: string[];
  message: string;
  countryCode?: string;
  dltTemplateId?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user has permission to send bulk SMS
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    if (!data.recipients || data.recipients.length === 0) {
      return { success: false, error: "No recipients provided" };
    }

    // Validate and format phone numbers
    const formattedRecipients = data.recipients.map(phone => {
      if (!phone.startsWith('+')) {
        return formatPhoneNumber(phone, data.countryCode || '+1');
      }
      return phone;
    });

    // Validate all phone numbers
    const invalidNumbers = formattedRecipients.filter(phone => !isValidPhoneNumber(phone));
    if (invalidNumbers.length > 0) {
      return {
        success: false,
        error: `Invalid phone numbers: ${invalidNumbers.join(', ')}. Use E.164 format: +1234567890`,
      };
    }

    // Send bulk SMS (includes DLT template ID if provided)
    const results = await sendBulkSMS(formattedRecipients, data.message, data.dltTemplateId);

    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Log bulk SMS operation (optional)
    // You could create a BulkSMSLog model to track bulk operations

    return {
      success: true,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: results.map(r => ({
          to: r.to,
          success: r.success,
          messageId: r.messageId,
          status: r.status,
          error: r.error,
        })),
      },
    };
  } catch (error: any) {
    console.error("Error in sendBulkSMSAction:", error);
    return { success: false, error: error.message || "Failed to send bulk SMS" };
  }
}

/**
 * Get SMS delivery status
 */
export async function getSMSStatus(messageId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user has permission
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    const status = await getSMSDeliveryStatus(messageId);

    if (!status.success) {
      return { success: false, error: status.error || "Failed to fetch delivery status" };
    }

    return {
      success: true,
      data: {
        messageId: status.messageId,
        status: status.status,
        errorCode: status.errorCode,
        errorMessage: status.errorMessage,
        dateSent: status.dateSent,
        dateUpdated: status.dateUpdated,
      },
    };
  } catch (error: any) {
    console.error("Error in getSMSStatus:", error);
    return { success: false, error: error.message || "Failed to fetch SMS status" };
  }
}

/**
 * Send SMS to parents of a specific class
 */
export async function sendSMSToClass(data: {
  classId: string;
  message: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get all students in the class through enrollments
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId: data.classId,
      },
      include: {
        student: {
          include: {
            parents: {
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return { success: false, error: "No students found in this class" };
    }

    // Extract parent phone numbers
    const phoneNumbers = enrollments
      .flatMap(e => e.student.parents.map(sp => sp.parent.user.phone))
      .filter((phone): phone is string => !!phone);

    if (phoneNumbers.length === 0) {
      return { success: false, error: "No parent phone numbers found" };
    }

    // Send bulk SMS
    const result = await sendBulkSMSAction({
      recipients: phoneNumbers,
      message: data.message,
    });

    revalidatePath("/admin/communication");
    return result;
  } catch (error: any) {
    console.error("Error in sendSMSToClass:", error);
    return { success: false, error: error.message || "Failed to send SMS to class" };
  }
}

/**
 * Send SMS to all parents
 */
export async function sendSMSToAllParents(message: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get all parents with phone numbers
    const parents = await db.parent.findMany({
      include: {
        user: {
          select: {
            phone: true,
          },
        },
      },
    });

    if (parents.length === 0) {
      return { success: false, error: "No parent phone numbers found" };
    }

    const phoneNumbers = parents
      .map(p => p.user.phone)
      .filter((phone): phone is string => !!phone);

    // Send bulk SMS
    const result = await sendBulkSMSAction({
      recipients: phoneNumbers,
      message,
    });

    revalidatePath("/admin/communication");
    return result;
  } catch (error: any) {
    console.error("Error in sendSMSToAllParents:", error);
    return { success: false, error: error.message || "Failed to send SMS to all parents" };
  }
}

/**
 * Check if SMS service is configured
 */
export async function checkSMSConfiguration() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    const configured = isSMSConfigured();
    const provider = getSMSProvider();

    let message: string;
    if (configured) {
      message = `SMS service is configured and ready to use (Provider: ${provider})`;
    } else {
      if (provider === 'MSG91') {
        message = "SMS service is not configured. Please set MSG91_AUTH_KEY and MSG91_SENDER_ID environment variables.";
      } else {
        message = "SMS service is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.";
      }
    }

    return {
      success: true,
      data: {
        configured,
        provider,
        message,
      },
    };
  } catch (error: any) {
    console.error("Error in checkSMSConfiguration:", error);
    return { success: false, error: error.message || "Failed to check SMS configuration" };
  }
}
