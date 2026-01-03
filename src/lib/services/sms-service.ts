/**
 * SMS Service with Provider Selection
 * 
 * This service provides SMS sending capabilities with delivery tracking.
 * It supports both Twilio (legacy) and MSG91 (recommended for India) providers.
 * The provider is selected based on the USE_MSG91 environment variable.
 * 
 * Requirements: 11.2 - SMS Gateway Integration, 18.1, 18.2
 */

import twilio from 'twilio';
import {
  sendSMS as sendMSG91SMS,
  sendBulkSMS as sendBulkMSG91SMS,
  getSMSDeliveryStatus as getMSG91DeliveryStatus,
  sendSMSWithRetry as sendMSG91SMSWithRetry,
  isMSG91Configured,
  validatePhoneNumber as validateMSG91PhoneNumber,
  formatPhoneNumber as formatMSG91PhoneNumber,
} from './msg91-service';
import type { MSG91SendResult } from '@/lib/types/communication';

// Twilio client instance (singleton)
let twilioClient: ReturnType<typeof twilio> | null = null;

/**
 * Initialize Twilio client
 * Only creates a new client if credentials are configured
 */
function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

/**
 * Check if USE_MSG91 feature flag is enabled
 * Requirement: 18.1
 */
function shouldUseMSG91(): boolean {
  return process.env.USE_MSG91 === 'true';
}

/**
 * Check if SMS service is configured (either Twilio or MSG91)
 * Requirement: 18.2
 */
export function isSMSConfigured(): boolean {
  if (shouldUseMSG91()) {
    return isMSG91Configured();
  }
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

/**
 * SMS delivery status enum
 */
export enum SMSDeliveryStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  UNDELIVERED = 'undelivered',
}

/**
 * SMS send result interface
 */
export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  status?: SMSDeliveryStatus;
  error?: string;
  to: string;
  body: string;
  timestamp: Date;
}

/**
 * SMS delivery status result interface
 */
export interface SMSStatusResult {
  success: boolean;
  messageId: string;
  status?: SMSDeliveryStatus;
  error?: string;
  errorCode?: string;
  errorMessage?: string;
  dateSent?: Date;
  dateUpdated?: Date;
}

/**
 * Send a single SMS message
 * Uses MSG91 if USE_MSG91=true, otherwise uses Twilio
 * Requirement: 18.1, 18.2
 * 
 * @param to - Recipient phone number (E.164 format: +1234567890)
 * @param body - Message content
 * @param dltTemplateId - Optional DLT template ID (for MSG91 only)
 * @returns Promise with send result including message ID and status
 */
export async function sendSMS(to: string, body: string, dltTemplateId?: string): Promise<SMSSendResult> {
  try {
    // Route to MSG91 if feature flag is enabled
    if (shouldUseMSG91()) {
      const result = await sendMSG91SMS(to, body, dltTemplateId);
      return {
        success: result.success,
        messageId: result.messageId,
        status: result.success ? SMSDeliveryStatus.SENT : SMSDeliveryStatus.FAILED,
        error: result.error,
        to,
        body,
        timestamp: new Date(),
      };
    }

    // Otherwise use Twilio (legacy)
    // Validate inputs
    if (!to || !body) {
      return {
        success: false,
        error: 'Phone number and message body are required',
        to,
        body,
        timestamp: new Date(),
      };
    }

    // Check if SMS is configured
    if (!isSMSConfigured()) {
      console.warn('SMS service not configured. Message not sent:', { to, body });
      return {
        success: false,
        error: 'SMS service not configured',
        to,
        body,
        timestamp: new Date(),
      };
    }

    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

    // Send message via Twilio
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status as SMSDeliveryStatus,
      to,
      body,
      timestamp: new Date(),
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
      to,
      body,
      timestamp: new Date(),
    };
  }
}

/**
 * Send bulk SMS messages to multiple recipients
 * Uses MSG91 if USE_MSG91=true, otherwise uses Twilio
 * Requirement: 18.1, 18.2
 * 
 * @param recipients - Array of phone numbers (E.164 format)
 * @param body - Message content (same for all recipients)
 * @param dltTemplateId - Optional DLT template ID (for MSG91 only)
 * @returns Promise with array of send results
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string,
  dltTemplateId?: string
): Promise<SMSSendResult[]> {
  try {
    // Route to MSG91 if feature flag is enabled
    if (shouldUseMSG91()) {
      const results = await sendBulkMSG91SMS(recipients, body, dltTemplateId);
      return results.map((result, index) => ({
        success: result.success,
        messageId: result.messageId,
        status: result.success ? SMSDeliveryStatus.SENT : SMSDeliveryStatus.FAILED,
        error: result.error,
        to: recipients[index],
        body,
        timestamp: new Date(),
      }));
    }

    // Otherwise use Twilio (legacy)
    // Validate inputs
    if (!recipients || recipients.length === 0) {
      return [];
    }

    if (!body) {
      return recipients.map(to => ({
        success: false,
        error: 'Message body is required',
        to,
        body,
        timestamp: new Date(),
      }));
    }

    // Check if SMS is configured
    if (!isSMSConfigured()) {
      console.warn('SMS service not configured. Bulk messages not sent:', { recipients, body });
      return recipients.map(to => ({
        success: false,
        error: 'SMS service not configured',
        to,
        body,
        timestamp: new Date(),
      }));
    }

    // Send messages in batches to avoid rate limits
    // Twilio recommends sending messages sequentially or in small batches
    const results: SMSSendResult[] = [];
    
    for (const recipient of recipients) {
      const result = await sendSMS(recipient, body);
      results.push(result);
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  } catch (error: any) {
    console.error('Error sending bulk SMS:', error);
    return recipients.map(to => ({
      success: false,
      error: error.message || 'Failed to send bulk SMS',
      to,
      body,
      timestamp: new Date(),
    }));
  }
}

/**
 * Get delivery status of a sent message
 * Uses MSG91 if USE_MSG91=true, otherwise uses Twilio
 * Requirement: 18.1, 18.2
 * 
 * @param messageId - Twilio message SID or MSG91 request ID
 * @returns Promise with delivery status information
 */
export async function getSMSDeliveryStatus(messageId: string): Promise<SMSStatusResult> {
  try {
    if (!messageId) {
      return {
        success: false,
        messageId,
        error: 'Message ID is required',
      };
    }

    // Check if SMS is configured
    if (!isSMSConfigured()) {
      return {
        success: false,
        messageId,
        error: 'SMS service not configured',
      };
    }

    // Route to MSG91 if feature flag is enabled
    if (shouldUseMSG91()) {
      const result = await getMSG91DeliveryStatus(messageId);
      return {
        success: true,
        messageId,
        status: mapMSG91StatusToSMSStatus(result.status),
        errorMessage: result.description,
        dateUpdated: result.deliveredAt,
      };
    }

    // Otherwise use Twilio (legacy)
    const client = getTwilioClient();

    // Fetch message details from Twilio
    const message = await client.messages(messageId).fetch();

    return {
      success: true,
      messageId: message.sid,
      status: message.status as SMSDeliveryStatus,
      errorCode: message.errorCode?.toString(),
      errorMessage: message.errorMessage || undefined,
      dateSent: message.dateSent || undefined,
      dateUpdated: message.dateUpdated || undefined,
    };
  } catch (error: any) {
    console.error('Error fetching SMS delivery status:', error);
    return {
      success: false,
      messageId,
      error: error.message || 'Failed to fetch delivery status',
    };
  }
}

/**
 * Map MSG91 MessageStatus to SMSDeliveryStatus
 * Helper function for backward compatibility
 */
function mapMSG91StatusToSMSStatus(status: string): SMSDeliveryStatus {
  switch (status.toLowerCase()) {
    case 'queued':
      return SMSDeliveryStatus.QUEUED;
    case 'sending':
      return SMSDeliveryStatus.SENDING;
    case 'sent':
      return SMSDeliveryStatus.SENT;
    case 'delivered':
      return SMSDeliveryStatus.DELIVERED;
    case 'failed':
      return SMSDeliveryStatus.FAILED;
    case 'undelivered':
      return SMSDeliveryStatus.UNDELIVERED;
    default:
      return SMSDeliveryStatus.QUEUED;
  }
}

/**
 * Send SMS with retry logic
 * Retries up to 3 times on failure as per requirement 11.4
 * Uses MSG91 if USE_MSG91=true, otherwise uses Twilio
 * Requirement: 18.1, 18.2
 * 
 * @param to - Recipient phone number
 * @param body - Message content
 * @param dltTemplateId - Optional DLT template ID (for MSG91 only)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise with send result
 */
export async function sendSMSWithRetry(
  to: string,
  body: string,
  dltTemplateId?: string,
  maxRetries: number = 3
): Promise<SMSSendResult> {
  // Route to MSG91 if feature flag is enabled
  if (shouldUseMSG91()) {
    const result = await sendMSG91SMSWithRetry(to, body, dltTemplateId, maxRetries);
    return {
      success: result.success,
      messageId: result.messageId,
      status: result.success ? SMSDeliveryStatus.SENT : SMSDeliveryStatus.FAILED,
      error: result.error,
      to,
      body,
      timestamp: new Date(),
    };
  }

  // Otherwise use Twilio with retry logic
  let lastResult: SMSSendResult | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await sendSMS(to, body);
    
    if (lastResult.success) {
      return lastResult;
    }
    
    // If not the last attempt, wait before retrying
    if (attempt < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`Retrying SMS send (attempt ${attempt + 1}/${maxRetries})...`);
    }
  }
  
  return lastResult!;
}

/**
 * Format phone number to E.164 format
 * Uses MSG91 formatter if USE_MSG91=true, otherwise uses basic formatter
 * This is a basic formatter - in production, use a library like libphonenumber-js
 * Requirement: 18.2
 * 
 * @param phoneNumber - Phone number in various formats
 * @param countryCode - Default country code (e.g., '+1' for US, '+91' for India)
 * @returns Formatted phone number in E.164 format
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
  // Use MSG91 formatter if feature flag is enabled
  if (shouldUseMSG91()) {
    // MSG91 uses country code without + (e.g., '91' instead of '+91')
    const code = countryCode.startsWith('+') ? countryCode.substring(1) : countryCode;
    return formatMSG91PhoneNumber(phoneNumber, code);
  }

  // Otherwise use basic formatter for Twilio
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If already has country code, return with +
  if (phoneNumber.startsWith('+')) {
    return '+' + digits;
  }
  
  // Add country code if not present
  return countryCode + digits;
}

/**
 * Validate phone number format (basic validation)
 * Uses MSG91 validator if USE_MSG91=true, otherwise uses basic validator
 * For production, use a library like libphonenumber-js for comprehensive validation
 * Requirement: 18.2
 * 
 * @param phoneNumber - Phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Use MSG91 validator if feature flag is enabled
  if (shouldUseMSG91()) {
    return validateMSG91PhoneNumber(phoneNumber);
  }

  // Otherwise use basic validator for Twilio
  // E.164 format: +[country code][number]
  // Length: 8-15 digits (including country code)
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Get current SMS provider name
 * Useful for logging and debugging
 * 
 * @returns 'MSG91' or 'Twilio'
 */
export function getSMSProvider(): 'MSG91' | 'Twilio' {
  return shouldUseMSG91() ? 'MSG91' : 'Twilio';
}
