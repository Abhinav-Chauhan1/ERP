/**
 * Communication Service
 * 
 * This service orchestrates message sending across all communication channels
 * (SMS via MSG91, WhatsApp via WhatsApp Business API, Email via Resend, and In-App notifications).
 * It handles user preference lookup, channel routing, and unified notification delivery.
 * 
 * Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 10.5
 */

import { db } from '@/lib/db';
import {
  CommunicationChannel,
  NotificationType,
  NotificationParams,
  CommunicationResult,
  AttendanceAlertParams,
  LeaveNotificationParams,
  FeeReminderParams,
  BulkNotificationParams,
  BulkCommunicationResult,
  ChannelResult,
  CommunicationError,
} from '@/lib/types/communication';

// Import channel services
import { sendSMS, sendSMSWithRetry, isMSG91Configured } from './msg91-service';
import { sendTextMessage, sendTextMessageWithRetry, isWhatsAppConfigured } from './whatsapp-service';
import { sendEmail, sendEmailWithRetry, isEmailConfigured } from './email-service';

// Import message logging service
import { logMessage, updateMessageStatus } from './message-logging-service';
import { MessageLogStatus } from '@prisma/client';

// Import template service
import { getTemplateWithFallback, renderTemplate } from './template-service';

// Export template service functions for external use
export {
  getTemplateByLanguage,
  getTemplatesByLanguage,
  getTemplateWithFallback,
  renderTemplate,
  getAvailableTemplateLanguages,
  templateExistsInLanguage,
} from './template-service';

// ============================================================================
// User Preference Lookup
// ============================================================================

/**
 * Get user's contact preferences
 * Requirement: 10.5, 16.2
 * 
 * @param userId - User ID (parent, student, or teacher)
 * @param userType - Type of user (parent, student, teacher)
 * @returns Contact preferences including preferred channels and language
 */
async function getUserContactPreferences(
  userId: string,
  userType: 'parent' | 'student' | 'teacher' = 'parent'
): Promise<{
  channels: CommunicationChannel[];
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  preferredLanguage?: string;
}> {
  try {
    if (userType === 'parent') {
      // Get parent with settings
      const parent = await db.parent.findUnique({
        where: { id: userId },
        include: {
          user: true,
          settings: true,
        },
      });

      if (!parent) {
        throw new CommunicationError(`Parent not found: ${userId}`);
      }

      const settings = parent.settings;
      const channels: CommunicationChannel[] = [];

      // Determine active channels based on preferences
      if (settings?.emailNotifications && parent.user.email) {
        channels.push(CommunicationChannel.EMAIL);
      }

      if (settings?.smsNotifications && parent.user.phone) {
        channels.push(CommunicationChannel.SMS);
      }

      // Check for WhatsApp preferences
      if (settings?.whatsappNotifications && settings?.whatsappOptIn) {
        const whatsappNumber = settings.whatsappNumber || parent.user.phone;
        if (whatsappNumber) {
          channels.push(CommunicationChannel.WHATSAPP);
        }
      }

      // Always include in-app notifications
      channels.push(CommunicationChannel.IN_APP);

      return {
        channels,
        email: parent.user.email || undefined,
        phone: parent.user.phone || undefined,
        whatsappNumber: settings?.whatsappNumber || parent.user.phone || undefined,
        preferredLanguage: settings?.preferredLanguage || settings?.language || 'en',
      };
    } else if (userType === 'student') {
      // Get student with settings
      const student = await db.student.findUnique({
        where: { id: userId },
        include: {
          user: true,
          settings: true,
        },
      });

      if (!student) {
        throw new CommunicationError(`Student not found: ${userId}`);
      }

      const settings = student.settings;
      const channels: CommunicationChannel[] = [];

      // Students primarily get in-app notifications
      channels.push(CommunicationChannel.IN_APP);

      // If student has email and notifications enabled
      if (settings?.emailNotifications && student.user.email) {
        channels.push(CommunicationChannel.EMAIL);
      }

      // Check for WhatsApp preferences
      if (settings?.whatsappNotifications && settings?.whatsappOptIn && student.user.phone) {
        channels.push(CommunicationChannel.WHATSAPP);
      }

      return {
        channels,
        email: student.user.email || undefined,
        phone: student.user.phone || undefined,
        whatsappNumber: student.user.phone || undefined,
        preferredLanguage: settings?.preferredLanguage || settings?.language || 'en',
      };
    } else if (userType === 'teacher') {
      // Get teacher with settings
      const teacher = await db.teacher.findUnique({
        where: { id: userId },
        include: {
          user: true,
          settings: true,
        },
      });

      if (!teacher) {
        throw new CommunicationError(`Teacher not found: ${userId}`);
      }

      const settings = teacher.settings;
      const channels: CommunicationChannel[] = [
        CommunicationChannel.IN_APP,
      ];

      // Teachers get email notifications by default
      if (teacher.user.email) {
        channels.push(CommunicationChannel.EMAIL);
      }

      // Teachers can get SMS if phone is available
      if (teacher.user.phone) {
        channels.push(CommunicationChannel.SMS);
      }

      return {
        channels,
        email: teacher.user.email || undefined,
        phone: teacher.user.phone || undefined,
        preferredLanguage: settings?.language || 'en',
      };
    }

    throw new CommunicationError(`Invalid user type: ${userType}`);
  } catch (error: any) {
    console.error('Error getting user contact preferences:', error);
    throw new CommunicationError(
      `Failed to get contact preferences: ${error.message}`,
      error.code
    );
  }
}

// ============================================================================
// Channel Sending Functions
// ============================================================================

/**
 * Send message via email channel
 */
async function sendViaEmail(
  email: string,
  subject: string,
  message: string,
  userId?: string
): Promise<ChannelResult> {
  try {
    if (!isEmailConfigured()) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Log message before sending
    const log = await logMessage({
      channel: CommunicationChannel.EMAIL,
      recipient: email,
      userId,
      subject,
      body: message,
    });

    const result = await sendEmailWithRetry({
      to: email,
      subject,
      html: message,
    });

    // Update log with result
    if (result.success && result.messageId) {
      await updateMessageStatus({
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
      });
    } else if (!result.success) {
      await updateMessageStatus({
        messageId: log.id,
        status: MessageLogStatus.FAILED,
        errorMessage: result.error,
      });
    }

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send message via SMS channel
 */
async function sendViaSMS(
  phone: string,
  message: string,
  dltTemplateId?: string,
  userId?: string
): Promise<ChannelResult> {
  try {
    if (!isMSG91Configured()) {
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    // Log message before sending
    const log = await logMessage({
      channel: CommunicationChannel.SMS,
      recipient: phone,
      userId,
      body: message,
      metadata: dltTemplateId ? { dltTemplateId } : undefined,
    });

    const result = await sendSMSWithRetry(phone, message, dltTemplateId);

    // Update log with result
    if (result.success && result.messageId) {
      await updateMessageStatus({
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
      });
    } else if (!result.success) {
      await updateMessageStatus({
        messageId: log.id,
        status: MessageLogStatus.FAILED,
        errorCode: result.errorCode,
        errorMessage: result.error,
      });
    }

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send message via WhatsApp channel
 */
async function sendViaWhatsApp(
  phone: string,
  message: string,
  userId?: string
): Promise<ChannelResult> {
  try {
    if (!isWhatsAppConfigured()) {
      return {
        success: false,
        error: 'WhatsApp service not configured',
      };
    }

    // Log message before sending
    const log = await logMessage({
      channel: CommunicationChannel.WHATSAPP,
      recipient: phone,
      userId,
      body: message,
    });

    const result = await sendTextMessageWithRetry(phone, message);

    // Update log with result
    if (result.success && result.messageId) {
      await updateMessageStatus({
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
      });
    } else if (!result.success) {
      await updateMessageStatus({
        messageId: log.id,
        status: MessageLogStatus.FAILED,
        errorCode: result.errorCode?.toString(),
        errorMessage: result.error,
      });
    }

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  data?: Record<string, any>
): Promise<ChannelResult> {
  try {
    // Create in-app notification in database
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        // data property not supported in Notification model
        isRead: false,
      },
    });

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error: any) {
    console.error('Error creating in-app notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to create in-app notification',
    };
  }
}

// ============================================================================
// Core Communication Functions
// ============================================================================

/**
 * Send notification across multiple channels based on user preferences
 * Requirement: 10.5
 * 
 * @param params - Notification parameters
 * @returns Communication result with status for each channel
 */
export async function sendNotification(
  params: NotificationParams
): Promise<CommunicationResult> {
  try {
    const { userId, type, title, message, data, channels: overrideChannels } = params;

    // 1. Get System Settings to determine globally allowed channels for this event type
    const systemSettings = await db.systemSettings.findFirst();
    let allowedSystemChannels: CommunicationChannel[] = [];

    // Default to all channels if settings missing (fallback)
    if (!systemSettings) {
      allowedSystemChannels = Object.values(CommunicationChannel);
    } else {
      // Map NotificationType to specific settings field
      let settingsChannels: string[] = [];

      switch (type) {
        case NotificationType.ATTENDANCE:
          settingsChannels = systemSettings.attendanceNotificationChannels;
          break;
        case NotificationType.FEE:
          settingsChannels = systemSettings.paymentNotificationChannels;
          break;
        case NotificationType.EXAM:
          settingsChannels = systemSettings.examResultNotificationChannels;
          break;
        case NotificationType.LEAVE:
          settingsChannels = systemSettings.leaveAppNotificationChannels;
          break;
        // For other types (or generic ones), fall back to checking global enables or allow all
        // Adding specific handling for ENROLLMENT if it becomes a NotificationType
        default:
          // If it's a type not covered by granular settings, check legacy global flags or default to allowed
          // For now, we'll allow all valid channels if not strictly restricted
          settingsChannels = Object.values(CommunicationChannel);

          // Respect legacy global toggles as a secondary check if needed, 
          // but granular settings are preferred. 
          // If we want to strictly enforce legacy globals for generic types:
          /*
          if (!systemSettings.emailEnabled) settingsChannels = settingsChannels.filter(c => c !== 'EMAIL');
          if (!systemSettings.smsEnabled) settingsChannels = settingsChannels.filter(c => c !== 'SMS');
          */
          break;
      }

      // Convert string[] to CommunicationChannel[]
      allowedSystemChannels = settingsChannels
        .map(c => c as CommunicationChannel)
        .filter(c => Object.values(CommunicationChannel).includes(c));
    }

    // 2. Get user preferences
    const preferences = await getUserContactPreferences(userId);

    // 3. Determine target channels
    // Start with user's preferred channels (or overrides)
    const preferredChannels = overrideChannels || preferences.channels;

    // 4. Filter allowed channels: Intersection of (User Preferences) AND (System Allowed Channels)
    // The user cannot receive a notification on a channel the system has disabled for this event.
    const targetChannels = preferredChannels.filter(channel =>
      allowedSystemChannels.includes(channel)
    );

    const result: CommunicationResult = {
      success: false,
      channels: {},
    };

    // Send via each channel
    const channelPromises: Promise<void>[] = [];

    for (const channel of targetChannels) {
      switch (channel) {
        case CommunicationChannel.EMAIL:
          if (preferences.email) {
            channelPromises.push(
              sendViaEmail(preferences.email, title, message, userId).then(res => {
                result.channels.email = res;
              })
            );
          }
          break;

        case CommunicationChannel.SMS:
          if (preferences.phone) {
            channelPromises.push(
              sendViaSMS(preferences.phone, message, undefined, userId).then(res => {
                result.channels.sms = res;
              })
            );
          }
          break;

        case CommunicationChannel.WHATSAPP:
          if (preferences.whatsappNumber) {
            channelPromises.push(
              sendViaWhatsApp(preferences.whatsappNumber, message, userId).then(res => {
                result.channels.whatsapp = res;
              })
            );
          }
          break;

        case CommunicationChannel.IN_APP:
          channelPromises.push(
            sendInAppNotification(userId, title, message, type, data).then(res => {
              result.channels.inApp = res;
            })
          );
          break;
      }
    }

    // Wait for all channels to complete
    await Promise.all(channelPromises);

    // Determine overall success (at least one channel succeeded)
    result.success = Object.values(result.channels).some(ch => ch?.success);

    return result;
  } catch (error: any) {
    console.error('Error sending notification:', error);
    throw new CommunicationError(
      `Failed to send notification: ${error.message}`,
      error.code
    );
  }
}

/**
 * Send attendance alert notification
 * Requirements: 5.1, 5.2
 * 
 * @param params - Attendance alert parameters
 * @returns Communication result
 */
export async function sendAttendanceAlert(
  params: AttendanceAlertParams
): Promise<CommunicationResult> {
  try {
    const {
      studentId,
      studentName,
      date,
      status,
      attendancePercentage,
      parentId,
    } = params;

    // Format date
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create message based on status
    let title = '';
    let message = '';

    if (status === 'ABSENT') {
      title = `Attendance Alert: ${studentName} Absent`;
      message = `Dear Parent,\n\nYour child ${studentName} was marked absent on ${dateStr}.\n\nCurrent Attendance: ${attendancePercentage.toFixed(1)}%\n\nIf this is incorrect, please contact the school immediately.`;
    } else if (status === 'LATE') {
      title = `Attendance Alert: ${studentName} Late`;
      message = `Dear Parent,\n\nYour child ${studentName} arrived late on ${dateStr}.\n\nCurrent Attendance: ${attendancePercentage.toFixed(1)}%\n\nPlease ensure timely arrival to school.`;
    } else {
      // PRESENT - typically we don't send notifications for present status
      // But if needed, we can add it here
      return {
        success: true,
        channels: {},
      };
    }

    // Send notification
    return await sendNotification({
      userId: parentId,
      type: NotificationType.ATTENDANCE,
      title,
      message,
      data: {
        studentId,
        studentName,
        date: date.toISOString(),
        status,
        attendancePercentage,
      },
    });
  } catch (error: any) {
    console.error('Error sending attendance alert:', error);
    throw new CommunicationError(
      `Failed to send attendance alert: ${error.message}`,
      error.code
    );
  }
}

/**
 * Send leave application notification
 * Requirements: 6.1, 6.2, 6.3
 * 
 * @param params - Leave notification parameters
 * @returns Communication result
 */
export async function sendLeaveNotification(
  params: LeaveNotificationParams
): Promise<CommunicationResult> {
  try {
    const {
      applicantId,
      applicantName,
      leaveType,
      startDate,
      endDate,
      status,
      approverName,
      rejectionReason,
      isTeacher,
    } = params;

    // Format dates
    const startDateStr = startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const endDateStr = endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create message based on status
    let title = '';
    let message = '';

    if (status === 'SUBMITTED') {
      title = `Leave Application Submitted`;
      message = `Dear ${applicantName},\n\nYour ${leaveType} application has been submitted successfully.\n\nLeave Period: ${startDateStr} to ${endDateStr}\n\nYou will be notified once it is reviewed.`;
    } else if (status === 'APPROVED') {
      title = `Leave Application Approved`;
      message = `Dear ${applicantName},\n\nYour ${leaveType} application has been approved by ${approverName || 'the administrator'}.\n\nLeave Period: ${startDateStr} to ${endDateStr}\n\nThank you.`;
    } else if (status === 'REJECTED') {
      title = `Leave Application Rejected`;
      message = `Dear ${applicantName},\n\nYour ${leaveType} application has been rejected by ${approverName || 'the administrator'}.\n\nLeave Period: ${startDateStr} to ${endDateStr}\n\nReason: ${rejectionReason || 'Not specified'}\n\nPlease contact the administration for more details.`;
    }

    // Send notification
    return await sendNotification({
      userId: applicantId,
      type: NotificationType.LEAVE,
      title,
      message,
      data: {
        applicantId,
        applicantName,
        leaveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status,
        approverName,
        rejectionReason,
        isTeacher,
      },
    });
  } catch (error: any) {
    console.error('Error sending leave notification:', error);
    throw new CommunicationError(
      `Failed to send leave notification: ${error.message}`,
      error.code
    );
  }
}

/**
 * Send fee reminder notification
 * Requirements: 7.1, 7.2, 7.3
 * 
 * @param params - Fee reminder parameters
 * @returns Communication result
 */
export async function sendFeeReminder(
  params: FeeReminderParams
): Promise<CommunicationResult> {
  try {
    const {
      studentId,
      studentName,
      amount,
      dueDate,
      isOverdue,
      outstandingBalance,
      paymentLink,
      parentId,
    } = params;

    // Format date
    const dueDateStr = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create message based on overdue status
    let title = '';
    let message = '';

    if (isOverdue) {
      title = `Overdue Fee Payment: ${studentName}`;
      message = `Dear Parent,\n\nThis is a reminder that the fee payment for ${studentName} is overdue.\n\nAmount Due: ₹${amount.toFixed(2)}\nDue Date: ${dueDateStr}\nOutstanding Balance: ₹${outstandingBalance.toFixed(2)}\n\nPlease make the payment at your earliest convenience to avoid late fees.`;
    } else {
      title = `Fee Payment Reminder: ${studentName}`;
      message = `Dear Parent,\n\nThis is a reminder that the fee payment for ${studentName} is due soon.\n\nAmount Due: ₹${amount.toFixed(2)}\nDue Date: ${dueDateStr}\nOutstanding Balance: ₹${outstandingBalance.toFixed(2)}\n\nPlease make the payment before the due date.`;
    }

    if (paymentLink) {
      message += `\n\nPay Online: ${paymentLink}`;
    }

    // Send notification
    return await sendNotification({
      userId: parentId,
      type: NotificationType.FEE,
      title,
      message,
      data: {
        studentId,
        studentName,
        amount,
        dueDate: dueDate.toISOString(),
        isOverdue,
        outstandingBalance,
        paymentLink,
      },
    });
  } catch (error: any) {
    console.error('Error sending fee reminder:', error);
    throw new CommunicationError(
      `Failed to send fee reminder: ${error.message}`,
      error.code
    );
  }
}

/**
 * Send bulk notification to multiple recipients
 * Requirement: 11.1, 11.2, 11.3
 * 
 * @param params - Bulk notification parameters
 * @returns Bulk communication result with individual statuses
 */
export async function sendBulkNotification(
  params: BulkNotificationParams
): Promise<BulkCommunicationResult> {
  try {
    const { recipients, type, title, message, data, channel } = params;

    const result: BulkCommunicationResult = {
      success: false,
      totalRecipients: recipients.length,
      successCount: 0,
      failureCount: 0,
      results: [],
    };

    // Process recipients in batches to respect rate limits
    const batchSize = 50;
    const batches: string[][] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    // Process each batch
    for (const batch of batches) {
      const batchPromises = batch.map(async (userId) => {
        try {
          const notificationResult = await sendNotification({
            userId,
            type,
            title,
            message,
            data,
            channels: [channel],
          });

          const channelResult =
            channel === CommunicationChannel.EMAIL ? notificationResult.channels.email :
              channel === CommunicationChannel.SMS ? notificationResult.channels.sms :
                channel === CommunicationChannel.WHATSAPP ? notificationResult.channels.whatsapp :
                  notificationResult.channels.inApp;

          if (notificationResult.success && channelResult?.success) {
            result.successCount++;
            result.results.push({
              userId,
              success: true,
              messageId: channelResult.messageId || channelResult.notificationId,
            });
          } else {
            result.failureCount++;
            result.results.push({
              userId,
              success: false,
              error: channelResult?.error || 'Unknown error',
            });
          }
        } catch (error: any) {
          result.failureCount++;
          result.results.push({
            userId,
            success: false,
            error: error.message || 'Failed to send notification',
          });
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches to avoid rate limiting
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    result.success = result.successCount > 0;

    return result;
  } catch (error: any) {
    console.error('Error sending bulk notification:', error);
    throw new CommunicationError(
      `Failed to send bulk notification: ${error.message}`,
      error.code
    );
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Send notification using template with language support
 * Requirements: 16.1, 16.3, 16.4, 16.5
 * 
 * @param params - Notification parameters with template
 * @returns Communication result
 */
export async function sendNotificationWithTemplate(params: {
  userId: string;
  userType?: 'parent' | 'student' | 'teacher';
  templateName: string;
  variables: Record<string, string>;
  type: NotificationType;
  channels?: CommunicationChannel[];
}): Promise<CommunicationResult> {
  try {
    const { userId, userType = 'parent', templateName, variables, type, channels: overrideChannels } = params;

    // Get user preferences including language
    const preferences = await getUserContactPreferences(userId, userType);

    // Get template with language fallback
    const template = await getTemplateWithFallback(
      templateName,
      preferences.preferredLanguage
    );

    if (!template) {
      throw new CommunicationError(`Template "${templateName}" not found`);
    }

    // Render template with variables
    const message = renderTemplate(template, variables);
    const title = template.subject || templateName;

    // Send notification using the rendered template
    return await sendNotification({
      userId,
      type,
      title,
      message,
      data: { templateName, variables },
      channels: overrideChannels,
    });
  } catch (error: any) {
    console.error('Error sending notification with template:', error);
    throw new CommunicationError(
      `Failed to send notification with template: ${error.message}`,
      error.code
    );
  }
}

/**
 * Check if communication services are configured
 * 
 * @returns Configuration status for each channel
 */
export function checkCommunicationConfiguration(): {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
} {
  return {
    email: isEmailConfigured(),
    sms: isMSG91Configured(),
    whatsapp: isWhatsAppConfigured(),
  };
}

/**
 * Get available communication channels
 * 
 * @returns Array of available channels
 */
export function getAvailableChannels(): CommunicationChannel[] {
  const channels: CommunicationChannel[] = [CommunicationChannel.IN_APP];

  if (isEmailConfigured()) {
    channels.push(CommunicationChannel.EMAIL);
  }

  if (isMSG91Configured()) {
    channels.push(CommunicationChannel.SMS);
  }

  if (isWhatsAppConfigured()) {
    channels.push(CommunicationChannel.WHATSAPP);
  }

  return channels;
}
