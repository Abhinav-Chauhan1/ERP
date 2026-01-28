/**
 * WhatsApp Button Response Handler
 * 
 * This service handles button responses from WhatsApp interactive messages.
 * It routes button clicks to appropriate action handlers and logs responses.
 * 
 * Requirements: 19.3, 19.4
 */

import { logMessage } from './message-logging-service';
import { CommunicationChannel, MessageLogStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

/**
 * Button response payload from WhatsApp webhook
 */
export interface ButtonResponse {
  messageId: string;
  from: string;
  buttonId: string;
  buttonText: string;
  timestamp: Date;
}

/**
 * Button action handler function type
 */
export type ButtonActionHandler = (
  response: ButtonResponse
) => Promise<void>;

/**
 * Button action registry
 */
const buttonActionHandlers = new Map<string, ButtonActionHandler>();

// ============================================================================
// Action Registration
// ============================================================================

/**
 * Register a button action handler
 * Requirement: 19.4
 * 
 * @param actionId - Unique identifier for the action (matches button ID)
 * @param handler - Function to handle the button response
 */
export function registerButtonAction(
  actionId: string,
  handler: ButtonActionHandler
): void {
  if (buttonActionHandlers.has(actionId)) {
    console.warn(`Button action handler for '${actionId}' is being overwritten`);
  }

  buttonActionHandlers.set(actionId, handler);
  console.log(`Registered button action handler: ${actionId}`);
}

/**
 * Unregister a button action handler
 * 
 * @param actionId - Action identifier to unregister
 */
export function unregisterButtonAction(actionId: string): void {
  buttonActionHandlers.delete(actionId);
  console.log(`Unregistered button action handler: ${actionId}`);
}

/**
 * Get all registered action IDs
 * 
 * @returns Array of registered action IDs
 */
export function getRegisteredActions(): string[] {
  return Array.from(buttonActionHandlers.keys());
}

// ============================================================================
// Button Response Processing
// ============================================================================

/**
 * Process a button response from WhatsApp
 * Requirement: 19.3, 19.4
 * 
 * This function:
 * 1. Logs the button response
 * 2. Routes to the appropriate action handler
 * 3. Handles errors gracefully
 * 
 * @param response - Button response data
 */
export async function processButtonResponse(
  response: ButtonResponse
): Promise<void> {
  try {
    console.log('Processing WhatsApp button response:', {
      messageId: response.messageId,
      from: response.from,
      buttonId: response.buttonId,
      buttonText: response.buttonText,
    });

    // Log the button response
    await logButtonResponse(response);

    // Extract action ID from button ID
    // Button IDs follow format: action_type_identifier
    // Example: attendance_confirm_123, fee_pay_456, leave_approve_789
    const actionType = extractActionType(response.buttonId);

    // Find and execute the appropriate handler
    const handler = buttonActionHandlers.get(actionType);

    if (handler) {
      console.log(`Executing handler for action: ${actionType}`);
      await handler(response);
      console.log(`Handler executed successfully for action: ${actionType}`);
    } else {
      console.warn(`No handler registered for action: ${actionType}`);
      console.warn(`Available handlers: ${Array.from(buttonActionHandlers.keys()).join(', ')}`);

      // Log unhandled button response for debugging
      await logUnhandledButtonResponse(response, actionType);
    }
  } catch (error: any) {
    console.error('Error processing WhatsApp button response:', {
      error: error.message,
      stack: error.stack,
      response,
    });

    // Don't throw - we want to acknowledge the webhook even if processing fails
    // The error is logged for manual investigation
  }
}

/**
 * Extract action type from button ID
 * 
 * Button IDs follow format: action_type_identifier
 * This function extracts the action type (first part before underscore)
 * 
 * @param buttonId - Full button ID
 * @returns Action type
 */
function extractActionType(buttonId: string): string {
  // Split by underscore and take first part
  const parts = buttonId.split('_');

  if (parts.length >= 2) {
    // Return first two parts as action type (e.g., "attendance_confirm")
    return `${parts[0]}_${parts[1]}`;
  }

  // If no underscore, return the whole ID
  return buttonId;
}

// ============================================================================
// Logging Functions
// ============================================================================

/**
 * Log button response to database
 * Requirement: 19.3
 * 
 * @param response - Button response data
 */
async function logButtonResponse(response: ButtonResponse): Promise<void> {
  try {
    await logMessage({
      channel: CommunicationChannel.WHATSAPP,
      recipient: response.from,
      body: `Button clicked: ${response.buttonText}`,
      messageId: response.messageId,
      status: MessageLogStatus.DELIVERED,
      metadata: {
        type: 'button_response',
        buttonId: response.buttonId,
        buttonText: response.buttonText,
        timestamp: response.timestamp.toISOString(),
        direction: 'incoming',
      },
    });

    console.log('Button response logged successfully:', {
      messageId: response.messageId,
      buttonId: response.buttonId,
    });
  } catch (error: any) {
    console.error('Failed to log button response:', {
      error: error.message,
      response,
    });
    // Don't throw - logging failure shouldn't stop processing
  }
}

/**
 * Log unhandled button response for debugging
 * 
 * @param response - Button response data
 * @param actionType - Extracted action type
 */
async function logUnhandledButtonResponse(
  response: ButtonResponse,
  actionType: string
): Promise<void> {
  try {
    await logMessage({
      channel: CommunicationChannel.WHATSAPP,
      recipient: response.from,
      body: `Unhandled button: ${response.buttonText}`,
      messageId: response.messageId,
      status: MessageLogStatus.DELIVERED,
      metadata: {
        type: 'unhandled_button_response',
        buttonId: response.buttonId,
        buttonText: response.buttonText,
        actionType,
        timestamp: response.timestamp.toISOString(),
        direction: 'incoming',
        warning: 'No handler registered for this action type',
      },
    });
  } catch (error: any) {
    console.error('Failed to log unhandled button response:', {
      error: error.message,
      response,
    });
  }
}

// ============================================================================
// Built-in Action Handlers
// ============================================================================

/**
 * Handler for attendance confirmation buttons
 * Requirement: 19.4
 * 
 * Button ID format: attendance_confirm_{studentId}_{date}
 */
async function handleAttendanceConfirmation(
  response: ButtonResponse
): Promise<void> {
  try {
    // Extract student ID and date from button ID
    const parts = response.buttonId.split('_');

    if (parts.length < 4) {
      console.error('Invalid attendance confirmation button ID:', response.buttonId);
      return;
    }

    const studentId = parts[2];
    const dateStr = parts[3];

    console.log('Processing attendance confirmation:', {
      studentId,
      date: dateStr,
      from: response.from,
    });

    // 1. Find the parent by phone number and verify they have permission for this student
    const parent = await prisma.user.findFirst({
      where: {
        phone: response.from.replace(/^\+/, ''), // Remove leading + from phone number
        role: 'PARENT',
      },
      include: {
        parent: {
          include: {
            children: {
              include: {
                student: true
              }
            }
          }
        }
      }
    });

    if (!parent || !parent.parent) {
      console.warn('Parent not found for phone number:', response.from);
      return;
    }

    // Check if this parent has access to the student
    const hasAccess = parent.parent.children.some(
      (child) => child.student.id === studentId
    );

    if (!hasAccess) {
      console.warn('Parent does not have access to student:', studentId);
      return;
    }

    // 2. Find and update the attendance record
    const parsedDate = new Date(dateStr);
    const attendance = await prisma.studentAttendance.findFirst({
      where: {
        studentId: studentId,
        date: {
          gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
          lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
        }
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    });

    if (!attendance) {
      console.warn('Attendance record not found for student and date:', { studentId, dateStr });
      return;
    }

    // Verify school context (Optional but good for audit)
    // attendance.schoolId should match student.schoolId (which is implicit)


    if (!attendance) {
      console.warn('Attendance record not found for student and date:', { studentId, dateStr });
      return;
    }

    // Update the attendance record with parent confirmation timestamp
    // We use the ID, which is unique, but we could also add schoolId check if we had it handy from the record
    await prisma.studentAttendance.update({
      where: {
        id: attendance.id,
        // Ensure we are in the same school as the record we just found
        schoolId: attendance.schoolId
      },
      data: {
        updatedAt: new Date(),
        // Note: Could add a parentConfirmedAt field in the future
      }
    });

    // 3. Log confirmation and send message back to parent
    await logMessage({
      channel: CommunicationChannel.WHATSAPP,
      recipient: response.from,
      body: `✅ Attendance confirmed for ${attendance.student.user.firstName} ${attendance.student.user.lastName} on ${new Date(dateStr).toLocaleDateString()}. Thank you!`,
      status: MessageLogStatus.SENT,
      metadata: {
        type: 'attendance_confirmation_response',
        studentId,
        date: dateStr,
        attendanceId: attendance.id,
      },
    });

    console.log('Attendance confirmation processed successfully:', {
      studentId,
      date: dateStr,
      attendanceId: attendance.id,
    });
  } catch (error: any) {
    console.error('Error handling attendance confirmation:', {
      error: error.message,
      response,
    });
  }
}

/**
 * Handler for fee payment buttons
 * Requirement: 19.4
 * 
 * Button ID format: fee_pay_{studentId}_{feeId}
 */
async function handleFeePayment(
  response: ButtonResponse
): Promise<void> {
  try {
    // Extract student ID and fee ID from button ID
    const parts = response.buttonId.split('_');

    if (parts.length < 4) {
      console.error('Invalid fee payment button ID:', response.buttonId);
      return;
    }

    const studentId = parts[2];
    const feeId = parts[3];

    console.log('Processing fee payment request:', {
      studentId,
      feeId,
      from: response.from,
    });

    // 1. Find the parent by phone number and verify they have permission for this student
    const parent = await prisma.user.findFirst({
      where: {
        phone: response.from.replace(/^\+/, ''),
        role: 'PARENT',
      },
      include: {
        parent: {
          include: {
            children: {
              include: {
                student: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!parent || !parent.parent) {
      console.warn('Parent not found for phone number:', response.from);
      return;
    }

    // Check if this parent has access to the student
    const childRecord = parent.parent.children.find(
      (child) => child.student.id === studentId
    );

    if (!childRecord) {
      console.warn('Parent does not have access to student:', studentId);
      return;
    }

    const student = childRecord.student;

    // 2. Generate payment link (using app URL for fee payment page)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentLink = `${appUrl}/parent/fees/${feeId}/pay?student=${studentId}`;

    // 3. Send payment link back to parent
    await logMessage({
      channel: CommunicationChannel.WHATSAPP,
      recipient: response.from,
      body: `💳 Fee Payment Link for ${student.user.firstName} ${student.user.lastName}\n\nClick here to complete your payment:\n${paymentLink}\n\nThis link will take you to our secure payment portal.`,
      status: MessageLogStatus.SENT,
      metadata: {
        type: 'fee_payment_link',
        studentId,
        feeId,
        paymentLink,
      },
    });

    console.log('Fee payment request processed successfully:', {
      studentId,
      feeId,
      paymentLink,
    });
  } catch (error: any) {
    console.error('Error handling fee payment:', {
      error: error.message,
      response,
    });
  }
}

/**
 * Handler for leave approval buttons
 * Requirement: 19.4
 * 
 * Button ID format: leave_approve_{leaveId} or leave_reject_{leaveId}
 */
async function handleLeaveApproval(
  response: ButtonResponse
): Promise<void> {
  try {
    // Extract leave ID and action from button ID
    const parts = response.buttonId.split('_');

    if (parts.length < 3) {
      console.error('Invalid leave approval button ID:', response.buttonId);
      return;
    }

    const action = parts[1]; // 'approve' or 'reject'
    const leaveId = parts[2];

    console.log('Processing leave approval:', {
      leaveId,
      action,
      from: response.from,
    });

    // 1. Find the user (approver) by phone number
    const approver = await prisma.user.findFirst({
      where: {
        phone: response.from.replace(/^\+/, ''),
      },
    });

    if (!approver) {
      console.warn('Approver not found for phone number:', response.from);
      return;
    }

    // Verify the user is an admin or teacher (has permission to approve)
    if (approver.role !== 'ADMIN' && approver.role !== 'TEACHER') {
      console.warn('User does not have permission to approve leaves:', approver.id);
      return;
    }

    // 2. Find and update the leave application
    const leaveApplication = await prisma.leaveApplication.findUnique({
      where: { id: leaveId },
    });

    if (!leaveApplication) {
      console.warn('Leave application not found:', leaveId);
      return;
    }

    if (leaveApplication.status !== 'PENDING') {
      console.warn('Leave application is not pending:', leaveId);
      return;
    }

    // Determine new status based on action
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Update leave application
    await prisma.leaveApplication.update({
      where: {
        id: leaveId,
        // Ensure scope
        schoolId: leaveApplication.schoolId
      },
      data: {
        status: newStatus,
        approvedById: approver.id,
        approvedOn: new Date(),
        remarks: `${action === 'approve' ? 'Approved' : 'Rejected'} via WhatsApp`,
      },
      // Note: approvedById is a User ID, we perform the check above
    });

    // 3. Log confirmation message to approver
    await logMessage({
      channel: CommunicationChannel.WHATSAPP,
      recipient: response.from,
      body: `✅ Leave application ${action === 'approve' ? 'approved' : 'rejected'} successfully.\n\nLeave ID: ${leaveId}\nDates: ${leaveApplication.fromDate.toLocaleDateString()} - ${leaveApplication.toDate.toLocaleDateString()}`,
      status: MessageLogStatus.SENT,
      metadata: {
        type: 'leave_approval_confirmation',
        leaveId,
        action,
        approverId: approver.id,
      },
    });

    // 4. Notify the applicant
    const applicant = await prisma.user.findUnique({
      where: { id: leaveApplication.applicantId },
    });

    if (applicant?.phone) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: applicant.phone,
        body: `📋 Leave Application Update\n\nYour leave request for ${leaveApplication.fromDate.toLocaleDateString()} - ${leaveApplication.toDate.toLocaleDateString()} has been ${action === 'approve' ? '✅ APPROVED' : '❌ REJECTED'}.\n\n${leaveApplication.remarks ? `Remarks: ${leaveApplication.remarks}` : ''}`,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'leave_status_notification',
          leaveId,
          status: newStatus,
          applicantId: applicant.id,
        },
      });
    }

    console.log('Leave approval processed successfully:', {
      leaveId,
      action,
      newStatus,
      approverId: approver.id,
    });
  } catch (error: any) {
    console.error('Error handling leave approval:', {
      error: error.message,
      response,
    });
  }
}

// ============================================================================
// Initialize Default Handlers
// ============================================================================

/**
 * Register default button action handlers
 * 
 * This function should be called during application startup
 * to register the built-in handlers.
 */
export function initializeDefaultHandlers(): void {
  registerButtonAction('attendance_confirm', handleAttendanceConfirmation);
  registerButtonAction('fee_pay', handleFeePayment);
  registerButtonAction('leave_approve', handleLeaveApproval);
  registerButtonAction('leave_reject', handleLeaveApproval);

  console.log('Default WhatsApp button handlers initialized');
}
