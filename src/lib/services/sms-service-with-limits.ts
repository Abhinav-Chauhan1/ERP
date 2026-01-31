/**
 * SMS Service with Usage Limit Enforcement
 *
 * This service wraps the core SMS service and enforces usage limits
 * based on the school's subscription plan.
 */

import {
  sendSMS as coreSendSMS,
  sendBulkSMS as coreSendBulkSMS,
  getSMSDeliveryStatus as coreGetSMSDeliveryStatus,
  sendSMSWithRetry as coreSendSMSWithRetry,
  SMSDeliveryStatus,
  SMSSendResult,
  SMSStatusResult,
} from './sms-service';
import {
  canSendSMS,
  incrementSMSUsage,
} from './usage-service';

/**
 * Send SMS with usage limit enforcement
 */
export async function sendSMS(
  to: string,
  message: string,
  options?: {
    from?: string;
    priority?: 'low' | 'normal' | 'high';
    scheduleTime?: Date;
    dltTemplateId?: string;
  }
): Promise<SMSSendResult> {
  // Check if school can send SMS messages
  const canSend = await canSendSMS(1);
  if (!canSend) {
    return {
      success: false,
      error: 'SMS sending limit exceeded. Please upgrade your plan or contact support.',
      to,
      body: message,
      timestamp: new Date(),
    };
  }

  // Send the SMS
  const result = await coreSendSMS(to, message, options?.dltTemplateId);

  // Increment usage counter on success
  if (result.success) {
    await incrementSMSUsage(1);
  }

  return result;
}

/**
 * Send bulk SMS with usage limit enforcement
 */
export async function sendBulkSMS(
  messages: Array<{
    to: string;
    body: string;
  }>,
  options?: {
    from?: string;
    priority?: 'low' | 'normal' | 'high';
    scheduleTime?: Date;
    dltTemplateId?: string;
  }
): Promise<Array<SMSSendResult>> {
  const messageCount = messages.length;

  // Check if school can send all SMS messages
  const canSend = await canSendSMS(messageCount);
  if (!canSend) {
    return messages.map(msg => ({
      success: false,
      error: 'SMS sending limit exceeded. Please upgrade your plan or contact support.',
      to: msg.to,
      body: msg.body,
      timestamp: new Date(),
    }));
  }

  // Send the bulk SMS
  const recipients = messages.map(msg => msg.to);
  const messageBody = messages[0]?.body || ''; // Assuming all messages have the same body for bulk SMS
  const results = await coreSendBulkSMS(recipients, messageBody, options?.dltTemplateId);

  // Count successful sends and increment usage counter
  const successCount = results.filter(result => result.success).length;
  if (successCount > 0) {
    await incrementSMSUsage(successCount);
  }

  return results;
}

/**
 * Send SMS with retry and usage limit enforcement
 */
export async function sendSMSWithRetry(
  to: string,
  message: string,
  options?: {
    from?: string;
    priority?: 'low' | 'normal' | 'high';
    scheduleTime?: Date;
    dltTemplateId?: string;
  },
  maxRetries: number = 3,
  retryConfig?: any
): Promise<SMSSendResult> {
  // Check if school can send SMS messages
  const canSend = await canSendSMS(1);
  if (!canSend) {
    return {
      success: false,
      error: 'SMS sending limit exceeded. Please upgrade your plan or contact support.',
      to,
      body: message,
      timestamp: new Date(),
    };
  }

  // Send the SMS with retry
  const result = await coreSendSMSWithRetry(to, message, options?.dltTemplateId, maxRetries);

  // Increment usage counter on success
  if (result.success) {
    await incrementSMSUsage(1);
  }

  return result;
}

// Re-export other functions from the core service
export {
  getSMSDeliveryStatus,
  isSMSConfigured,
  SMSDeliveryStatus,
  type SMSSendResult,
  type SMSStatusResult,
} from './sms-service';