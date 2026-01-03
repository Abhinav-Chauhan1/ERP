/**
 * WhatsApp Interactive Message Actions
 * 
 * Server actions for sending interactive WhatsApp messages using pre-built
 * templates. These actions handle authentication, validation, and message
 * sending for common use cases.
 * 
 * Requirements: 19.1, 19.2, 19.5
 */

'use server';

import { auth } from '@/auth';
import { sendInteractiveMessage } from '@/lib/services/whatsapp-service';
import { logMessage } from '@/lib/services/message-logging-service';
import { CommunicationChannel, MessageLogStatus } from '@prisma/client';
import {
  createAttendanceConfirmationTemplate,
  createAttendanceSummaryTemplate,
  createFeePaymentReminderTemplate,
  createFeePaymentConfirmationTemplate,
  createLeaveApprovalTemplate,
  createLeaveStatusNotificationTemplate,
  createAnnouncementTemplate,
  createExamReminderTemplate,
} from '@/lib/templates/whatsapp-interactive-templates';

// ============================================================================
// Attendance Interactive Messages
// ============================================================================

/**
 * Send attendance confirmation interactive message
 * Requirement: 19.1, 19.2
 * 
 * @param params - Message parameters
 * @returns Send result
 */
export async function sendAttendanceConfirmation(params: {
  to: string;
  studentName: string;
  studentId: string;
  date: string;
  status: 'ABSENT' | 'LATE';
  attendancePercentage: number;
}) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Create interactive message
    const interactive = createAttendanceConfirmationTemplate(params);

    // Send message
    const result = await sendInteractiveMessage(params.to, interactive);

    // Log message
    if (result.success && result.messageId) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: params.to,
        subject: 'Attendance Alert',
        body: `Attendance confirmation for ${params.studentName}`,
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'attendance_confirmation',
          studentId: params.studentId,
          date: params.date,
          status: params.status,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('Error sending attendance confirmation:', error);
    return {
      success: false,
      error: error.message || 'Failed to send attendance confirmation',
    };
  }
}

/**
 * Send attendance summary interactive message
 * Requirement: 19.5
 * 
 * @param params - Message parameters
 * @returns Send result
 */
export async function sendAttendanceSummary(params: {
  to: string;
  studentName: string;
  studentId: string;
  weekStart: string;
  weekEnd: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
  dailyRecords: Array<{
    date: string;
    status: string;
  }>;
}) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Create interactive message
    const interactive = createAttendanceSummaryTemplate(params);

    // Send message
    const result = await sendInteractiveMessage(params.to, interactive);

    // Log message
    if (result.success && result.messageId) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: params.to,
        subject: 'Weekly Attendance Summary',
        body: `Attendance summary for ${params.studentName}`,
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'attendance_summary',
          studentId: params.studentId,
          weekStart: params.weekStart,
          weekEnd: params.weekEnd,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('Error sending attendance summary:', error);
    return {
      success: false,
      error: error.message || 'Failed to send attendance summary',
    };
  }
}

// ============================================================================
// Fee Interactive Messages
// ============================================================================

/**
 * Send fee payment reminder interactive message
 * Requirement: 19.1, 19.2
 * 
 * @param params - Message parameters
 * @returns Send result
 */
export async function sendFeePaymentReminder(params: {
  to: string;
  studentName: string;
  studentId: string;
  feeType: string;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
  outstandingBalance: number;
  paymentLink?: string;
}) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Create interactive message
    const interactive = createFeePaymentReminderTemplate(params);

    // Send message
    const result = await sendInteractiveMessage(params.to, interactive);

    // Log message
    if (result.success && result.messageId) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: params.to,
        subject: 'Fee Payment Reminder',
        body: `Fee reminder for ${params.studentName}`,
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'fee_reminder',
          studentId: params.studentId,
          feeType: params.feeType,
          amount: params.amount,
          isOverdue: params.isOverdue,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('Error sending fee payment reminder:', error);
    return {
      success: false,
      error: error.message || 'Failed to send fee payment reminder',
    };
  }
}

/**
 * Send fee payment confirmation interactive message
 * Requirement: 19.1, 19.2
 * 
 * @param params - Message parameters
 * @returns Send result
 */
export async function sendFeePaymentConfirmation(params: {
  to: string;
  studentName: string;
  studentId: string;
  feeType: string;
  amount: number;
  paymentDate: string;
  receiptNumber: string;
  remainingBalance: number;
}) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Create interactive message
    const interactive = createFeePaymentConfirmationTemplate(params);

    // Send message
    const result = await sendInteractiveMessage(params.to, interactive);

    // Log message
    if (result.success && result.messageId) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: params.to,
        subject: 'Payment Confirmation',
        body: `Payment confirmation for ${params.studentName}`,
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'fee_confirmation',
          studentId: params.studentId,
          receiptNumber: params.receiptNumber,
          amount: params.amount,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('Error sending fee payment confirmation:', error);
    return {
      success: false,
      error: error.message || 'Failed to send fee payment confirmation',
    };
  }
}

// ============================================================================
// Leave Interactive Messages
// ============================================================================

/**
 * Send leave approval interactive message
 * Requirement: 19.1, 19.2
 * 
 * @param params - Message parameters
 * @returns Send result
 */
export async function sendLeaveApprovalRequest(params: {
  to: string;
  applicantName: string;
  applicantType: 'Student' | 'Teacher';
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  leaveId: string;
}) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Create interactive message
    const interactive = createLeaveApprovalTemplate(params);

    // Send message
    const result = await sendInteractiveMessage(params.to, interactive);

    // Log message
    if (result.success && result.messageId) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: params.to,
        subject: 'Leave Approval Request',
        body: `Leave approval request for ${params.applicantName}`,
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'leave_approval_request',
          leaveId: params.leaveId,
          applicantType: params.applicantType,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('Error sending leave approval request:', error);
    return {
      success: false,
      error: error.message || 'Failed to send leave approval request',
    };
  }
}

/**
 * Send leave status notification interactive message
 * Requirement: 19.1, 19.2
 * 
 * @param params - Message parameters
 * @returns Send result
 */
export async function sendLeaveStatusNotification(params: {
  to: string;
  applicantName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'APPROVED' | 'REJECTED';
  approverName: string;
  rejectionReason?: string;
  leaveId: string;
}) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Create interactive message
    const interactive = createLeaveStatusNotificationTemplate(params);

    // Send message
    const result = await sendInteractiveMessage(params.to, interactive);

    // Log message
    if (result.success && result.messageId) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: params.to,
        subject: `Leave ${params.status}`,
        body: `Leave status notification for ${params.applicantName}`,
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'leave_status_notification',
          leaveId: params.leaveId,
          status: params.status,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('Error sending leave status notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send leave status notification',
    };
  }
}

// ============================================================================
// General Interactive Messages
// ============================================================================

/**
 * Send announcement interactive message
 * Requirement: 19.1, 19.2
 * 
 * @param params - Message parameters
 * @returns Send result
 */
export async function sendAnnouncement(params: {
  to: string;
  title: string;
  message: string;
  category: string;
  actionButtons?: Array<{
    id: string;
    title: string;
  }>;
}) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Create interactive message
    const interactive = createAnnouncementTemplate(params);

    // Send message
    const result = await sendInteractiveMessage(params.to, interactive);

    // Log message
    if (result.success && result.messageId) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: params.to,
        subject: params.title,
        body: params.message,
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'announcement',
          category: params.category,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('Error sending announcement:', error);
    return {
      success: false,
      error: error.message || 'Failed to send announcement',
    };
  }
}

/**
 * Send exam reminder interactive message
 * Requirement: 19.1, 19.2
 * 
 * @param params - Message parameters
 * @returns Send result
 */
export async function sendExamReminder(params: {
  to: string;
  studentName: string;
  studentId: string;
  examName: string;
  subject: string;
  examDate: string;
  examTime: string;
  venue: string;
  daysUntilExam: number;
}) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Create interactive message
    const interactive = createExamReminderTemplate(params);

    // Send message
    const result = await sendInteractiveMessage(params.to, interactive);

    // Log message
    if (result.success && result.messageId) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: params.to,
        subject: 'Exam Reminder',
        body: `Exam reminder for ${params.studentName}`,
        messageId: result.messageId,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'exam_reminder',
          studentId: params.studentId,
          examName: params.examName,
          subject: params.subject,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('Error sending exam reminder:', error);
    return {
      success: false,
      error: error.message || 'Failed to send exam reminder',
    };
  }
}
