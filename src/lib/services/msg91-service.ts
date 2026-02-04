/**
 * MSG91 SMS Service
 * 
 * This service provides SMS messaging capabilities through MSG91 API.
 * It replaces Twilio for cost-effectiveness and Indian compliance (DLT).
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import {
  MSG91SendResult,
  MSG91StatusResult,
  MSG91Route,
  MSG91Error,
  MessageStatus,
} from '@/lib/types/communication';
import { retrySMSOperation, RetryConfig } from '@/lib/utils/retry';

// ============================================================================
// Configuration
// ============================================================================

interface MSG91Config {
  authKey: string;
  senderId: string;
  route: MSG91Route;
  country: string;
}

/**
 * Get MSG91 configuration from environment variables
 */
function getMSG91Config(): MSG91Config {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'SCHOOL';
  const route = (process.env.MSG91_ROUTE as MSG91Route) || MSG91Route.TRANSACTIONAL;
  const country = process.env.MSG91_COUNTRY || '91';

  if (!authKey) {
    throw new MSG91Error(
      'MSG91 authentication key not configured. Please set MSG91_AUTH_KEY environment variable.',
      '102'
    );
  }

  return {
    authKey,
    senderId,
    route,
    country,
  };
}

/**
 * Check if MSG91 service is configured
 * Requirement: 1.2
 */
export function isMSG91Configured(): boolean {
  return !!(
    process.env.MSG91_AUTH_KEY &&
    process.env.MSG91_SENDER_ID
  );
}

// ============================================================================
// Phone Number Validation and Formatting
// ============================================================================

/**
 * Validate phone number format (E.164)
 * Requirement: 1.4, 3.4
 * 
 * @param phoneNumber - Phone number to validate
 * @returns true if valid E.164 format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) {
    return false;
  }

  // E.164 format: +[country code][number]
  // Length: 8-15 digits (including country code)
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Format phone number to E.164 format
 * Requirement: 1.4
 * 
 * @param phoneNumber - Phone number in various formats
 * @param countryCode - Default country code (e.g., '91' for India)
 * @returns Formatted phone number in E.164 format
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string = '91'): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If already has + prefix, return with digits only after +
  if (phoneNumber.startsWith('+')) {
    return '+' + digits;
  }

  // Add + and country code if not present
  return '+' + countryCode + digits;
}

// ============================================================================
// Core SMS Functions
// ============================================================================

/**
 * Send a single SMS message via MSG91
 * Requirement: 1.1, 1.3, 1.5
 * 
 * @param to - Recipient phone number (E.164 format)
 * @param message - Message content
 * @param dltTemplateId - Optional DLT template ID for compliance
 * @returns Promise with send result including message ID
 */
export async function sendSMS(
  to: string,
  message: string,
  dltTemplateId?: string
): Promise<MSG91SendResult> {
  try {
    // Validate inputs
    if (!to || !message) {
      throw new MSG91Error(
        'Phone number and message are required',
        '104',
        to
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(to)) {
      throw new MSG91Error(
        `Invalid phone number format: ${to}. Expected E.164 format (e.g., +919876543210)`,
        '104',
        to
      );
    }

    // Check if MSG91 is configured
    if (!isMSG91Configured()) {
      console.warn('MSG91 service not configured. Message not sent:', { to, message });
      throw new MSG91Error(
        'MSG91 service not configured',
        '102'
      );
    }

    const config = getMSG91Config();

    // Remove + from phone number for MSG91 API
    const phoneNumber = to.replace('+', '');

    // Build URL parameters for Simple SMS API
    const params = new URLSearchParams({
      authkey: config.authKey,
      mobiles: phoneNumber,
      message: message,
      sender: config.senderId,
      route: config.route,
      country: config.country,
    });

    // Add DLT template ID if provided (required for Indian compliance)
    if (dltTemplateId) {
      params.append('DLT_TE_ID', dltTemplateId);
    }

    // Send request to MSG91 Simple SMS API
    const response = await fetch(
      `https://api.msg91.com/api/sendhttp.php?${params.toString()}`,
      { method: 'GET' }
    );

    const responseText = await response.text();

    // MSG91 Simple SMS API returns text response
    // Success: message ID (e.g., "5218f16e3ac3d94032000005")
    // Error: error message string

    // Handle API errors
    if (!response.ok || responseText.toLowerCase().includes('error') || responseText.toLowerCase().includes('invalid')) {
      throw new MSG91Error(
        responseText || 'Failed to send SMS',
        response.status.toString(),
        to,
        dltTemplateId
      );
    }

    return {
      success: true,
      messageId: responseText.trim(), // Message ID from MSG91
    };
  } catch (error: any) {
    console.error('Error sending SMS via MSG91:', error);

    // Re-throw MSG91Error as-is
    if (error instanceof MSG91Error) {
      throw error;
    }

    // Wrap other errors
    throw new MSG91Error(
      error.message || 'Failed to send SMS',
      error.code,
      to,
      dltTemplateId
    );
  }
}

/**
 * Send bulk SMS messages to multiple recipients
 * Requirement: 1.3, 1.6
 * 
 * @param recipients - Array of phone numbers (E.164 format)
 * @param message - Message content (same for all recipients)
 * @param dltTemplateId - Optional DLT template ID for compliance
 * @returns Promise with array of send results
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string,
  dltTemplateId?: string
): Promise<MSG91SendResult[]> {
  try {
    // Validate inputs
    if (!recipients || recipients.length === 0) {
      return [];
    }

    if (!message) {
      return recipients.map(to => ({
        success: false,
        error: 'Message is required',
        errorCode: '104',
      }));
    }

    // Check if MSG91 is configured
    if (!isMSG91Configured()) {
      console.warn('MSG91 service not configured. Bulk messages not sent:', { recipients, message });
      return recipients.map(to => ({
        success: false,
        error: 'MSG91 service not configured',
        errorCode: '102',
      }));
    }

    const config = getMSG91Config();

    // Validate and format all phone numbers
    const validRecipients: string[] = [];
    const results: MSG91SendResult[] = [];

    for (const recipient of recipients) {
      if (!validatePhoneNumber(recipient)) {
        results.push({
          success: false,
          error: `Invalid phone number format: ${recipient}`,
          errorCode: '104',
        });
      } else {
        validRecipients.push(recipient.replace('+', ''));
      }
    }

    // If no valid recipients, return early
    if (validRecipients.length === 0) {
      return results;
    }

    // MSG91 Simple SMS API supports comma-separated mobile numbers
    // Batch them in groups of 100 to avoid rate limits
    const batchSize = 100;
    const batches: string[][] = [];

    for (let i = 0; i < validRecipients.length; i += batchSize) {
      batches.push(validRecipients.slice(i, i + batchSize));
    }

    // Send each batch
    for (const batch of batches) {
      try {
        // Join mobile numbers with commas for MSG91 Simple SMS API
        const mobileNumbers = batch.join(',');

        // Build URL parameters for Simple SMS API
        const params = new URLSearchParams({
          authkey: config.authKey,
          mobiles: mobileNumbers,
          message: message,
          sender: config.senderId,
          route: config.route,
          country: config.country,
        });

        // Add DLT template ID if provided
        if (dltTemplateId) {
          params.append('DLT_TE_ID', dltTemplateId);
        }

        // Send request to MSG91 Simple SMS API
        const response = await fetch(
          `https://api.msg91.com/api/sendhttp.php?${params.toString()}`,
          { method: 'GET' }
        );

        const responseText = await response.text();

        // Handle API errors
        if (!response.ok || responseText.toLowerCase().includes('error') || responseText.toLowerCase().includes('invalid')) {
          // All messages in this batch failed
          for (let i = 0; i < batch.length; i++) {
            results.push({
              success: false,
              error: responseText || 'Failed to send SMS',
              errorCode: response.status.toString(),
            });
          }
        } else {
          // All messages in this batch succeeded
          for (let i = 0; i < batch.length; i++) {
            results.push({
              success: true,
              messageId: responseText.trim(),
            });
          }
        }

        // Small delay between batches to avoid rate limiting
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        console.error('Error sending batch SMS via MSG91:', error);
        // Mark all messages in this batch as failed
        for (let i = 0; i < batch.length; i++) {
          results.push({
            success: false,
            error: error.message || 'Failed to send SMS',
            errorCode: error.code,
          });
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error('Error sending bulk SMS via MSG91:', error);
    return recipients.map(to => ({
      success: false,
      error: error.message || 'Failed to send bulk SMS',
      errorCode: error.code,
    }));
  }
}

/**
 * Get delivery status of a sent message
 * Requirement: 1.3
 * 
 * @param messageId - MSG91 request ID
 * @returns Promise with delivery status information
 */
export async function getSMSDeliveryStatus(messageId: string): Promise<MSG91StatusResult> {
  try {
    if (!messageId) {
      throw new MSG91Error('Message ID is required');
    }

    // Check if MSG91 is configured
    if (!isMSG91Configured()) {
      throw new MSG91Error('MSG91 service not configured', '102');
    }

    const config = getMSG91Config();

    // Fetch delivery report from MSG91 API
    const response = await fetch(
      `https://api.msg91.com/api/v5/report/${messageId}`,
      {
        method: 'GET',
        headers: {
          'authkey': config.authKey,
        },
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.type === 'error') {
      throw new MSG91Error(
        data.message || 'Failed to fetch delivery status',
        data.code || response.status.toString()
      );
    }

    // Map MSG91 status to our MessageStatus enum
    let status: MessageStatus;
    const msg91Status = data.status?.toLowerCase();

    switch (msg91Status) {
      case 'queued':
        status = MessageStatus.QUEUED;
        break;
      case 'sending':
      case 'sent':
        status = MessageStatus.SENT;
        break;
      case 'delivered':
        status = MessageStatus.DELIVERED;
        break;
      case 'failed':
      case 'rejected':
      case 'undelivered':
        status = MessageStatus.FAILED;
        break;
      default:
        status = MessageStatus.QUEUED;
    }

    return {
      status,
      description: data.description,
      deliveredAt: data.delivered_at ? new Date(data.delivered_at) : undefined,
    };
  } catch (error: any) {
    console.error('Error fetching SMS delivery status from MSG91:', error);

    // Re-throw MSG91Error as-is
    if (error instanceof MSG91Error) {
      throw error;
    }

    // Wrap other errors
    throw new MSG91Error(
      error.message || 'Failed to fetch delivery status',
      error.code
    );
  }
}

/**
 * Send SMS with retry logic and exponential backoff
 * Requirement: 3.3
 * 
 * @param to - Recipient phone number
 * @param message - Message content
 * @param dltTemplateId - Optional DLT template ID
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryConfig - Optional custom retry configuration
 * @returns Promise with send result
 */
export async function sendSMSWithRetry(
  to: string,
  message: string,
  dltTemplateId?: string,
  maxRetries: number = 3,
  retryConfig?: Partial<RetryConfig>
): Promise<MSG91SendResult> {
  return retrySMSOperation(
    () => sendSMS(to, message, dltTemplateId),
    { maxRetries, ...retryConfig }
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check MSG91 configuration and return status
 * Requirement: 1.2
 * 
 * @returns Configuration status with details
 */
export function checkMSG91Configuration(): {
  configured: boolean;
  authKey: boolean;
  senderId: boolean;
  route: string;
  country: string;
} {
  const authKey = !!process.env.MSG91_AUTH_KEY;
  const senderId = !!process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE || MSG91Route.TRANSACTIONAL;
  const country = process.env.MSG91_COUNTRY || '91';

  return {
    configured: authKey && senderId,
    authKey,
    senderId,
    route,
    country,
  };
}
