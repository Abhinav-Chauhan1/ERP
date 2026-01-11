/**
 * Email Service using Resend
 * 
 * This service provides email sending capabilities with delivery tracking and bounce handling.
 * It integrates with Resend's API to send messages and track their delivery status.
 * 
 * Requirements: 11.3 - Email Service Provider Integration
 */

import { Resend } from 'resend';

// Resend client instance (singleton)
let resendClient: Resend | null = null;

/**
 * Initialize Resend client
 * Only creates a new client if API key is configured
 */
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('Resend API key not configured. Please set RESEND_API_KEY environment variable.');
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Email delivery status enum
 */
export enum EmailDeliveryStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
}

/**
 * Email send result interface
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  status?: EmailDeliveryStatus;
  error?: string;
  to: string | string[];
  subject: string;
  timestamp: Date;
}

/**
 * Email delivery status result interface
 */
export interface EmailStatusResult {
  success: boolean;
  messageId: string;
  status?: EmailDeliveryStatus;
  error?: string;
  errorCode?: string;
  errorMessage?: string;
  dateSent?: Date;
  dateUpdated?: Date;
  bounceType?: 'hard' | 'soft';
  bounceReason?: string;
}

/**
 * Email options interface
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send a single email message
 * 
 * @param options - Email options including recipient, subject, and content
 * @returns Promise with send result including message ID and status
 */
export async function sendEmail(options: EmailOptions): Promise<EmailSendResult> {
  try {
    // Validate inputs
    if (!options.to || !options.subject) {
      return {
        success: false,
        error: 'Recipient and subject are required',
        to: options.to,
        subject: options.subject,
        timestamp: new Date(),
      };
    }

    if (!options.html && !options.text) {
      return {
        success: false,
        error: 'Email content (html or text) is required',
        to: options.to,
        subject: options.subject,
        timestamp: new Date(),
      };
    }

    // Check if email service is configured
    if (!isEmailConfigured()) {
      console.warn('Email service not configured. Message not sent:', {
        to: options.to,
        subject: options.subject
      });
      return {
        success: false,
        error: 'Email service not configured',
        to: options.to,
        subject: options.subject,
        timestamp: new Date(),
      };
    }

    const client = getResendClient();
    const fromEmail = options.from || process.env.EMAIL_FROM!;

    // Send email via Resend
    const emailPayload: any = {
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };

    if (options.html) emailPayload.html = options.html;
    if (options.text) emailPayload.text = options.text;
    if (options.replyTo) emailPayload.replyTo = options.replyTo;
    if (options.cc) emailPayload.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
    if (options.bcc) emailPayload.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
    if (options.attachments) emailPayload.attachments = options.attachments;

    const { data, error } = await client.emails.send(emailPayload);

    if (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
        to: options.to,
        subject: options.subject,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      messageId: data?.id,
      status: EmailDeliveryStatus.SENT,
      to: options.to,
      subject: options.subject,
      timestamp: new Date(),
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
      to: options.to,
      subject: options.subject,
      timestamp: new Date(),
    };
  }
}

/**
 * Send bulk emails to multiple recipients
 * 
 * @param recipients - Array of email addresses
 * @param subject - Email subject (same for all recipients)
 * @param html - HTML content (same for all recipients)
 * @param text - Plain text content (optional)
 * @returns Promise with array of send results
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
  text?: string
): Promise<EmailSendResult[]> {
  try {
    // Validate inputs
    if (!recipients || recipients.length === 0) {
      return [];
    }

    if (!subject || !html) {
      return recipients.map(to => ({
        success: false,
        error: 'Subject and HTML content are required',
        to,
        subject,
        timestamp: new Date(),
      }));
    }

    // Check if email service is configured
    if (!isEmailConfigured()) {
      console.warn('Email service not configured. Bulk emails not sent:', {
        recipients,
        subject
      });
      return recipients.map(to => ({
        success: false,
        error: 'Email service not configured',
        to,
        subject,
        timestamp: new Date(),
      }));
    }

    // Send emails in batches to avoid rate limits
    // Resend has rate limits, so we send sequentially with small delays
    const results: EmailSendResult[] = [];

    for (const recipient of recipients) {
      const result = await sendEmail({
        to: recipient,
        subject,
        html,
        text,
      });
      results.push(result);

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  } catch (error: any) {
    console.error('Error sending bulk emails:', error);
    return recipients.map(to => ({
      success: false,
      error: error.message || 'Failed to send bulk email',
      to,
      subject,
      timestamp: new Date(),
    }));
  }
}

/**
 * Send email with retry logic
 * Retries up to 3 times on failure as per requirement 11.4
 * 
 * @param options - Email options
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise with send result
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries: number = 3
): Promise<EmailSendResult> {
  let lastResult: EmailSendResult | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await sendEmail(options);

    if (lastResult.success) {
      return lastResult;
    }

    // If not the last attempt, wait before retrying
    if (attempt < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`Retrying email send (attempt ${attempt + 1}/${maxRetries})...`);
    }
  }

  return lastResult!;
}

/**
 * Handle email bounce
 * This function processes bounce notifications from Resend webhooks
 * 
 * @param messageId - Email message ID
 * @param bounceType - Type of bounce (hard or soft)
 * @param bounceReason - Reason for bounce
 * @returns Promise with bounce handling result
 */
export async function handleEmailBounce(
  messageId: string,
  bounceType: 'hard' | 'soft',
  bounceReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Email bounce detected:', {
      messageId,
      bounceType,
      bounceReason,
      timestamp: new Date(),
    });

    // In a production system, you would:
    // 1. Update the email status in your database
    // 2. Mark the email address as bounced
    // 3. For hard bounces, disable future emails to that address
    // 4. For soft bounces, implement retry logic
    // 5. Send notifications to administrators

    // For now, we just log the bounce
    // You can extend this to update your database models

    return { success: true };
  } catch (error: any) {
    console.error('Error handling email bounce:', error);
    return {
      success: false,
      error: error.message || 'Failed to handle email bounce',
    };
  }
}

/**
 * Validate email address format
 * 
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate multiple email addresses
 * 
 * @param emails - Array of email addresses to validate
 * @returns Object with valid and invalid email arrays
 */
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    if (isValidEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

/**
 * Send templated email
 * Helper function to send emails using common templates
 * 
 * @param template - Template name
 * @param to - Recipient email address
 * @param data - Template data
 * @returns Promise with send result
 */
export async function sendTemplatedEmail(
  template: 'welcome' | 'password-reset' | 'admission-confirmation' | 'fee-reminder',
  to: string,
  data: Record<string, any>
): Promise<EmailSendResult> {
  // Template definitions
  const templates = {
    welcome: {
      subject: `Welcome to ${data.schoolName || 'SikshaMitra'}`,
      html: `
        <h1>Welcome ${data.name}!</h1>
        <p>Your account has been created successfully.</p>
        <p>You can now log in to access the system.</p>
      `,
    },
    'password-reset': {
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Hi ${data.name},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${data.resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    },
    'admission-confirmation': {
      subject: 'Admission Application Received',
      html: `
        <h1>Application Received</h1>
        <p>Dear ${data.parentName},</p>
        <p>We have received your admission application for ${data.studentName}.</p>
        <p>Application Number: <strong>${data.applicationNumber}</strong></p>
        <p>We will review your application and get back to you soon.</p>
      `,
    },
    'fee-reminder': {
      subject: 'Fee Payment Reminder',
      html: `
        <h1>Fee Payment Reminder</h1>
        <p>Dear ${data.parentName},</p>
        <p>This is a reminder that the fee payment for ${data.studentName} is due.</p>
        <p>Amount Due: ${data.amount}</p>
        <p>Due Date: ${data.dueDate}</p>
        <p>Please make the payment at your earliest convenience.</p>
      `,
    },
  };

  const templateConfig = templates[template];

  return sendEmail({
    to,
    subject: templateConfig.subject,
    html: templateConfig.html,
  });
}
