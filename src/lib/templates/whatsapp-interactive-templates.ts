/**
 * WhatsApp Interactive Message Templates
 * 
 * This module provides pre-built interactive message templates for common
 * use cases like attendance confirmation, fee payment reminders, and leave
 * approval. These templates use WhatsApp's interactive message format with
 * buttons for quick actions.
 * 
 * Requirements: 19.1, 19.2, 19.5
 */

import { WhatsAppInteractiveMessage } from '@/lib/types/communication';

// ============================================================================
// Attendance Confirmation Template
// ============================================================================

/**
 * Create an attendance confirmation interactive message
 * Requirement: 19.1, 19.2
 * 
 * This template sends a message to parents when their child is marked absent,
 * with buttons to confirm or report an error.
 * 
 * @param params - Template parameters
 * @returns Interactive message configuration
 */
export function createAttendanceConfirmationTemplate(params: {
  studentName: string;
  studentId: string;
  date: string;
  status: 'ABSENT' | 'LATE';
  attendancePercentage: number;
}): WhatsAppInteractiveMessage['interactive'] {
  const { studentName, studentId, date, status, attendancePercentage } = params;

  const statusText = status === 'ABSENT' ? 'absent' : 'late';
  const emoji = status === 'ABSENT' ? '❌' : '⏰';

  return {
    type: 'button',
    header: {
      type: 'text',
      text: `${emoji} Attendance Alert`,
    },
    body: {
      text: `Dear Parent,\n\nYour child *${studentName}* was marked *${statusText}* on ${date}.\n\nCurrent Attendance: *${attendancePercentage}%*\n\nIf this is incorrect, please contact the school immediately.`,
    },
    footer: {
      text: 'School ERP System',
    },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: {
            id: `attendance_confirm_${studentId}_${date.replace(/\//g, '-')}`,
            title: '✓ Acknowledged',
          },
        },
        {
          type: 'reply',
          reply: {
            id: `attendance_error_${studentId}_${date.replace(/\//g, '-')}`,
            title: '⚠ Report Error',
          },
        },
      ],
    },
  };
}

/**
 * Create an attendance summary interactive message with list
 * Requirement: 19.5
 * 
 * This template provides a weekly attendance summary with a list of dates
 * to view detailed information.
 * 
 * @param params - Template parameters
 * @returns Interactive message configuration
 */
export function createAttendanceSummaryTemplate(params: {
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
}): WhatsAppInteractiveMessage['interactive'] {
  const {
    studentName,
    studentId,
    weekStart,
    weekEnd,
    presentDays,
    absentDays,
    lateDays,
    attendancePercentage,
    dailyRecords,
  } = params;

  return {
    type: 'list',
    header: {
      type: 'text',
      text: '📊 Weekly Attendance',
    },
    body: {
      text: `*${studentName}*\nWeek: ${weekStart} - ${weekEnd}\n\n✓ Present: ${presentDays} days\n❌ Absent: ${absentDays} days\n⏰ Late: ${lateDays} days\n\nAttendance: *${attendancePercentage}%*`,
    },
    footer: {
      text: 'Tap to view daily details',
    },
    action: {
      button: 'View Details',
      sections: [
        {
          title: 'Daily Records',
          rows: dailyRecords.slice(0, 10).map((record) => ({
            id: `attendance_view_${studentId}_${record.date.replace(/\//g, '-')}`,
            title: record.date,
            description: `Status: ${record.status}`,
          })),
        },
      ],
    },
  };
}

// ============================================================================
// Fee Payment Reminder Template
// ============================================================================

/**
 * Create a fee payment reminder interactive message
 * Requirement: 19.1, 19.2
 * 
 * This template sends a fee reminder to parents with buttons to pay now
 * or view fee details.
 * 
 * @param params - Template parameters
 * @returns Interactive message configuration
 */
export function createFeePaymentReminderTemplate(params: {
  studentName: string;
  studentId: string;
  feeType: string;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
  outstandingBalance: number;
  paymentLink?: string;
}): WhatsAppInteractiveMessage['interactive'] {
  const {
    studentName,
    studentId,
    feeType,
    amount,
    dueDate,
    isOverdue,
    outstandingBalance,
    paymentLink,
  } = params;

  const statusEmoji = isOverdue ? '🔴' : '🔔';
  const statusText = isOverdue ? 'OVERDUE' : 'Due Soon';

  const buttons: Array<{
    type: 'reply';
    reply: { id: string; title: string };
  }> = [];

  // Add payment button if payment link is available
  if (paymentLink) {
    buttons.push({
      type: 'reply',
      reply: {
        id: `fee_pay_${studentId}_${Date.now()}`,
        title: '💳 Pay Now',
      },
    });
  }

  // Add view details button
  buttons.push({
    type: 'reply',
    reply: {
      id: `fee_details_${studentId}`,
      title: '📄 View Details',
    },
  });

  // Add remind later button if not overdue
  if (!isOverdue && buttons.length < 3) {
    buttons.push({
      type: 'reply',
      reply: {
        id: `fee_remind_${studentId}`,
        title: '⏰ Remind Later',
      },
    });
  }

  return {
    type: 'button',
    header: {
      type: 'text',
      text: `${statusEmoji} Fee Payment ${statusText}`,
    },
    body: {
      text: `Dear Parent,\n\n*${feeType}* for *${studentName}*\n\nAmount: ₹${amount.toLocaleString('en-IN')}\nDue Date: ${dueDate}\nOutstanding Balance: ₹${outstandingBalance.toLocaleString('en-IN')}\n\n${
        isOverdue
          ? '⚠️ This payment is overdue. Please pay immediately to avoid late fees.'
          : 'Please make the payment before the due date.'
      }`,
    },
    footer: {
      text: 'School ERP System',
    },
    action: {
      buttons,
    },
  };
}

/**
 * Create a fee payment confirmation interactive message
 * Requirement: 19.1, 19.2
 * 
 * This template confirms a successful fee payment with options to download
 * receipt or view payment history.
 * 
 * @param params - Template parameters
 * @returns Interactive message configuration
 */
export function createFeePaymentConfirmationTemplate(params: {
  studentName: string;
  studentId: string;
  feeType: string;
  amount: number;
  paymentDate: string;
  receiptNumber: string;
  remainingBalance: number;
}): WhatsAppInteractiveMessage['interactive'] {
  const {
    studentName,
    studentId,
    feeType,
    amount,
    paymentDate,
    receiptNumber,
    remainingBalance,
  } = params;

  return {
    type: 'button',
    header: {
      type: 'text',
      text: '✅ Payment Successful',
    },
    body: {
      text: `Dear Parent,\n\nPayment received for *${studentName}*\n\n*${feeType}*\nAmount Paid: ₹${amount.toLocaleString('en-IN')}\nDate: ${paymentDate}\nReceipt No: ${receiptNumber}\n\nRemaining Balance: ₹${remainingBalance.toLocaleString('en-IN')}\n\nThank you for your payment!`,
    },
    footer: {
      text: 'School ERP System',
    },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: {
            id: `fee_receipt_${studentId}_${receiptNumber}`,
            title: '📥 Download Receipt',
          },
        },
        {
          type: 'reply',
          reply: {
            id: `fee_history_${studentId}`,
            title: '📊 Payment History',
          },
        },
      ],
    },
  };
}

// ============================================================================
// Leave Approval Template
// ============================================================================

/**
 * Create a leave approval interactive message
 * Requirement: 19.1, 19.2
 * 
 * This template sends leave application details to administrators with
 * buttons to approve or reject the leave.
 * 
 * @param params - Template parameters
 * @returns Interactive message configuration
 */
export function createLeaveApprovalTemplate(params: {
  applicantName: string;
  applicantType: 'Student' | 'Teacher';
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  leaveId: string;
}): WhatsAppInteractiveMessage['interactive'] {
  const {
    applicantName,
    applicantType,
    leaveType,
    startDate,
    endDate,
    duration,
    reason,
    leaveId,
  } = params;

  const emoji = applicantType === 'Student' ? '🎓' : '👨‍🏫';

  return {
    type: 'button',
    header: {
      type: 'text',
      text: `${emoji} Leave Application`,
    },
    body: {
      text: `*${applicantType} Leave Request*\n\nName: *${applicantName}*\nType: ${leaveType}\nFrom: ${startDate}\nTo: ${endDate}\nDuration: ${duration} day${duration > 1 ? 's' : ''}\n\nReason:\n${reason}\n\nPlease review and take action.`,
    },
    footer: {
      text: 'School ERP System',
    },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: {
            id: `leave_approve_${leaveId}`,
            title: '✓ Approve',
          },
        },
        {
          type: 'reply',
          reply: {
            id: `leave_reject_${leaveId}`,
            title: '✗ Reject',
          },
        },
      ],
    },
  };
}

/**
 * Create a leave status notification interactive message
 * Requirement: 19.1, 19.2
 * 
 * This template notifies the applicant about their leave status with
 * options to view details or apply for another leave.
 * 
 * @param params - Template parameters
 * @returns Interactive message configuration
 */
export function createLeaveStatusNotificationTemplate(params: {
  applicantName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'APPROVED' | 'REJECTED';
  approverName: string;
  rejectionReason?: string;
  leaveId: string;
}): WhatsAppInteractiveMessage['interactive'] {
  const {
    applicantName,
    leaveType,
    startDate,
    endDate,
    status,
    approverName,
    rejectionReason,
    leaveId,
  } = params;

  const isApproved = status === 'APPROVED';
  const emoji = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'Approved' : 'Rejected';

  let bodyText = `Dear ${applicantName},\n\nYour leave application has been *${statusText}*.\n\n*${leaveType}*\nFrom: ${startDate}\nTo: ${endDate}\nApproved by: ${approverName}`;

  if (!isApproved && rejectionReason) {
    bodyText += `\n\nReason for rejection:\n${rejectionReason}`;
  }

  const buttons: Array<{
    type: 'reply';
    reply: { id: string; title: string };
  }> = [
    {
      type: 'reply',
      reply: {
        id: `leave_details_${leaveId}`,
        title: '📄 View Details',
      },
    },
  ];

  // Add "Apply Again" button if rejected
  if (!isApproved) {
    buttons.push({
      type: 'reply',
      reply: {
        id: `leave_apply_new`,
        title: '📝 Apply Again',
      },
    });
  }

  return {
    type: 'button',
    header: {
      type: 'text',
      text: `${emoji} Leave ${statusText}`,
    },
    body: {
      text: bodyText,
    },
    footer: {
      text: 'School ERP System',
    },
    action: {
      buttons,
    },
  };
}

// ============================================================================
// General Announcement Template
// ============================================================================

/**
 * Create a general announcement interactive message
 * Requirement: 19.1, 19.2
 * 
 * This template sends general announcements with optional action buttons.
 * 
 * @param params - Template parameters
 * @returns Interactive message configuration
 */
export function createAnnouncementTemplate(params: {
  title: string;
  message: string;
  category: string;
  actionButtons?: Array<{
    id: string;
    title: string;
  }>;
}): WhatsAppInteractiveMessage['interactive'] {
  const { title, message, category, actionButtons } = params;

  const categoryEmojis: Record<string, string> = {
    urgent: '🚨',
    event: '📅',
    exam: '📝',
    holiday: '🎉',
    general: '📢',
  };

  const emoji = categoryEmojis[category.toLowerCase()] || '📢';

  const buttons: Array<{
    type: 'reply';
    reply: { id: string; title: string };
  }> = [];

  if (actionButtons && actionButtons.length > 0) {
    actionButtons.slice(0, 3).forEach((btn) => {
      buttons.push({
        type: 'reply',
        reply: {
          id: btn.id,
          title: btn.title,
        },
      });
    });
  } else {
    // Default button
    buttons.push({
      type: 'reply',
      reply: {
        id: `announcement_acknowledge_${Date.now()}`,
        title: '✓ Acknowledged',
      },
    });
  }

  return {
    type: 'button',
    header: {
      type: 'text',
      text: `${emoji} ${title}`,
    },
    body: {
      text: message,
    },
    footer: {
      text: 'School ERP System',
    },
    action: {
      buttons,
    },
  };
}

// ============================================================================
// Exam Reminder Template
// ============================================================================

/**
 * Create an exam reminder interactive message
 * Requirement: 19.1, 19.2
 * 
 * This template sends exam reminders with options to view schedule or syllabus.
 * 
 * @param params - Template parameters
 * @returns Interactive message configuration
 */
export function createExamReminderTemplate(params: {
  studentName: string;
  studentId: string;
  examName: string;
  subject: string;
  examDate: string;
  examTime: string;
  venue: string;
  daysUntilExam: number;
}): WhatsAppInteractiveMessage['interactive'] {
  const {
    studentName,
    studentId,
    examName,
    subject,
    examDate,
    examTime,
    venue,
    daysUntilExam,
  } = params;

  const urgencyEmoji = daysUntilExam <= 1 ? '🔴' : daysUntilExam <= 3 ? '🟡' : '📝';

  return {
    type: 'button',
    header: {
      type: 'text',
      text: `${urgencyEmoji} Exam Reminder`,
    },
    body: {
      text: `Dear Parent,\n\nUpcoming exam for *${studentName}*\n\n*${examName}*\nSubject: ${subject}\nDate: ${examDate}\nTime: ${examTime}\nVenue: ${venue}\n\n${
        daysUntilExam === 0
          ? '⚠️ Exam is TODAY!'
          : daysUntilExam === 1
          ? '⚠️ Exam is TOMORROW!'
          : `📅 ${daysUntilExam} days until exam`
      }`,
    },
    footer: {
      text: 'School ERP System',
    },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: {
            id: `exam_schedule_${studentId}`,
            title: '📅 Full Schedule',
          },
        },
        {
          type: 'reply',
          reply: {
            id: `exam_syllabus_${studentId}_${subject}`,
            title: '📚 View Syllabus',
          },
        },
      ],
    },
  };
}
