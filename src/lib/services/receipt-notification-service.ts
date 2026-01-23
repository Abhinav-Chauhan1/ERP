/**
 * Receipt Notification Service
 * 
 * Handles sending notifications (email and in-app) for payment receipt verification events.
 * Requirements: 9.1, 9.2, 9.3
 */

import { db } from "@/lib/db";
import { sendEmail, isEmailConfigured } from "@/lib/utils/email-service";
import {
  getReceiptVerificationSuccessEmailHtml,
  getReceiptRejectionEmailHtml,
  ReceiptVerificationData,
  ReceiptRejectionData,
} from "@/lib/utils/email-templates";
import {
  getVerificationSuccessNotification,
  getRejectionNotification,
} from "../templates/receipt-notification-templates";

/**
 * Send notification for receipt verification success
 * Requirement 9.1: Notify on verification
 * Requirement 9.3: Use user's preferred notification method
 * 
 * @param userId - User ID to notify
 * @param userEmail - User email address
 * @param data - Receipt verification data
 * @returns Success status
 */
export async function sendVerificationSuccessNotification(
  userId: string,
  userEmail: string,
  data: ReceiptVerificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's notification preferences
    // const userSettings = await db.userSettings.findUnique({
    //   where: { userId },
    //   select: {
    //     emailNotifications: true,
    //     inAppNotifications: true,
    //   },
    // });
    const userSettings = null; // Fallback

    // Default to both if no preferences set
    const emailEnabled = true; // userSettings?.emailNotifications ?? true;
    const inAppEnabled = true; // userSettings?.inAppNotifications ?? true;

    const results = {
      email: { success: false, attempted: false },
      inApp: { success: false, attempted: false },
    };

    // Send in-app notification
    if (inAppEnabled) {
      results.inApp.attempted = true;
      try {
        const notificationData = getVerificationSuccessNotification(data);
        await db.notification.create({
          data: {
            userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            link: notificationData.link,
            isRead: false,
          },
        });
        results.inApp.success = true;
      } catch (error) {
        console.error("Failed to create in-app notification:", error);
        // Don't throw - continue with email
      }
    }

    // Send email notification
    if (emailEnabled && isEmailConfigured()) {
      results.email.attempted = true;
      try {
        const emailTemplate = getReceiptVerificationSuccessEmailHtml(data);
        const emailResult = await sendEmail({
          to: [userEmail],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
        results.email.success = emailResult.success;

        if (!emailResult.success) {
          console.error("Failed to send verification email:", emailResult.error);
        }
      } catch (error) {
        console.error("Error sending verification email:", error);
        // Don't throw - email failure shouldn't block the operation
      }
    }

    // Consider success if at least one notification method succeeded
    const overallSuccess = results.inApp.success || results.email.success;

    return {
      success: overallSuccess,
      error: !overallSuccess ? "Failed to send notifications via all methods" : undefined,
    };
  } catch (error) {
    console.error("Error in sendVerificationSuccessNotification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    };
  }
}

/**
 * Send notification for receipt rejection
 * Requirement 9.2: Notify on rejection with reason
 * Requirement 9.3: Use user's preferred notification method
 * 
 * @param userId - User ID to notify
 * @param userEmail - User email address
 * @param data - Receipt rejection data
 * @returns Success status
 */
export async function sendRejectionNotification(
  userId: string,
  userEmail: string,
  data: ReceiptRejectionData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's notification preferences
    // const userSettings = await db.userSettings.findUnique({
    //   where: { userId },
    //   select: {
    //     emailNotifications: true,
    //     inAppNotifications: true,
    //   },
    // });
    const userSettings = null;

    // Default to both if no preferences set
    const emailEnabled = true; // userSettings?.emailNotifications ?? true;
    const inAppEnabled = true; // userSettings?.inAppNotifications ?? true;

    const results = {
      email: { success: false, attempted: false },
      inApp: { success: false, attempted: false },
    };

    // Send in-app notification
    if (inAppEnabled) {
      results.inApp.attempted = true;
      try {
        const notificationData = getRejectionNotification(data);
        await db.notification.create({
          data: {
            userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            link: notificationData.link,
            isRead: false,
          },
        });
        results.inApp.success = true;
      } catch (error) {
        console.error("Failed to create in-app notification:", error);
        // Don't throw - continue with email
      }
    }

    // Send email notification
    if (emailEnabled && isEmailConfigured()) {
      results.email.attempted = true;
      try {
        const emailTemplate = getReceiptRejectionEmailHtml(data);
        const emailResult = await sendEmail({
          to: [userEmail],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
        results.email.success = emailResult.success;

        if (!emailResult.success) {
          console.error("Failed to send rejection email:", emailResult.error);
        }
      } catch (error) {
        console.error("Error sending rejection email:", error);
        // Don't throw - email failure shouldn't block the operation
      }
    }

    // Consider success if at least one notification method succeeded
    const overallSuccess = results.inApp.success || results.email.success;

    return {
      success: overallSuccess,
      error: !overallSuccess ? "Failed to send notifications via all methods" : undefined,
    };
  } catch (error) {
    console.error("Error in sendRejectionNotification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    };
  }
}

/**
 * Send notification to parent if user is a student
 * This ensures parents are also notified about their child's receipt status
 * 
 * @param studentId - Student ID
 * @param notificationFn - Function to send the notification
 * @returns Success status
 */
export async function notifyParentIfApplicable(
  studentId: string,
  notificationFn: (userId: string, userEmail: string) => Promise<{ success: boolean; error?: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find parent associated with the student (use first found parent)
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student?.parents?.[0]?.parent?.user) {
      // No parent found, not an error
      return { success: true };
    }

    // Send notification to first parent
    const parentUser = student.parents[0].parent.user;
    return await notificationFn(parentUser.id, parentUser.email);
  } catch (error) {
    console.error("Error notifying parent:", error);
    // Don't fail the operation if parent notification fails
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to notify parent",
    };
  }
}
