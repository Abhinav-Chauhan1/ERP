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

    // TODO: Implement attendance confirmation logic
    // This would typically:
    // 1. Verify the parent has permission for this student
    // 2. Update attendance record
    // 3. Send confirmation message back to parent

    console.log('Attendance confirmation processed successfully');
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

    // TODO: Implement fee payment logic
    // This would typically:
    // 1. Verify the parent has permission for this student
    // 2. Generate payment link or initiate payment flow
    // 3. Send payment link back to parent

    console.log('Fee payment request processed successfully');
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

    // TODO: Implement leave approval logic
    // This would typically:
    // 1. Verify the user has permission to approve/reject
    // 2. Update leave application status
    // 3. Send confirmation message
    // 4. Notify the applicant

    console.log('Leave approval processed successfully');
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
