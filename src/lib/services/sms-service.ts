/**
 * Simplified SMS Service - MSG91 Only
 * 
 * This service provides SMS sending capabilities using MSG91 exclusively.
 * All Twilio dependencies and provider selection logic have been removed.
 * 
 * Requirements: 11.2 - SMS Gateway Integration
 */

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
 * Check if SMS service is configured
 */
export function isSMSConfigured(): boolean {
  return isMSG91Configured();
}

/**
 * Send a single SMS message via MSG91
 * 
 * @param to - Recipient phone number (E.164 format: +1234567890)
 * @param body - Message content
 * @param dltTemplateId - Optional DLT template ID for Indian compliance
 * @returns Promise with send result including message ID and status
 */
export async function sendSMS(to: string, body: string, dltTemplateId?: string): Promise<SMSSendResult> {
  try {
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
      console.warn('MSG91 SMS service not configured. Message not sent:', { to, body });
      return {
        success: false,
        error: 'SMS service not configured',
        to,
        body,
        timestamp: new Date(),
      };
    }

    // Send message via MSG91
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
 * Send bulk SMS messages to multiple recipients via MSG91
 * 
 * @param recipients - Array of phone numbers (E.164 format)
 * @param body - Message content (same for all recipients)
 * @param dltTemplateId - Optional DLT template ID for Indian compliance
 * @returns Promise with array of send results
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string,
  dltTemplateId?: string
): Promise<SMSSendResult[]> {
  try {
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
      console.warn('MSG91 SMS service not configured. Bulk messages not sent:', { recipients, body });
      return recipients.map(to => ({
        success: false,
        error: 'SMS service not configured',
        to,
        body,
        timestamp: new Date(),
      }));
    }

    // Send bulk messages via MSG91
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
 * Get delivery status of a sent message via MSG91
 * 
 * @param messageId - MSG91 request ID
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

    // Get delivery status from MSG91
    const result = await getMSG91DeliveryStatus(messageId);
    
    return {
      success: true,
      messageId,
      status: mapMSG91StatusToSMSStatus(result.status),
      errorMessage: result.description,
      dateUpdated: result.deliveredAt,
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
 * Send SMS with retry logic via MSG91
 * Retries up to 3 times on failure
 * 
 * @param to - Recipient phone number
 * @param body - Message content
 * @param dltTemplateId - Optional DLT template ID for Indian compliance
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise with send result
 */
export async function sendSMSWithRetry(
  to: string,
  body: string,
  dltTemplateId?: string,
  maxRetries: number = 3
): Promise<SMSSendResult> {
  try {
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
  } catch (error: any) {
    console.error('Error sending SMS with retry:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS with retry',
      to,
      body,
      timestamp: new Date(),
    };
  }
}

/**
 * Format phone number to E.164 format using MSG91 formatter
 * 
 * @param phoneNumber - Phone number in various formats
 * @param countryCode - Default country code (e.g., '91' for India)
 * @returns Formatted phone number in E.164 format
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string = '91'): string {
  return formatMSG91PhoneNumber(phoneNumber, countryCode);
}

/**
 * Validate phone number format using MSG91 validator
 * 
 * @param phoneNumber - Phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  return validateMSG91PhoneNumber(phoneNumber);
}

/**
 * Get current SMS provider name
 * Always returns 'MSG91' since Twilio support has been removed
 * 
 * @returns 'MSG91'
 */
export function getSMSProvider(): 'MSG91' {
  return 'MSG91';
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