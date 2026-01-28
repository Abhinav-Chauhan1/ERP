/**
 * WhatsApp Service with Usage Limit Enforcement
 *
 * This service wraps the core WhatsApp service and enforces usage limits
 * based on the school's subscription plan.
 */

import {
  sendTextMessage as coreSendTextMessage,
  sendTemplateMessage as coreSendTemplateMessage,
  sendMediaMessage as coreSendMediaMessage,
  sendInteractiveMessage as coreSendInteractiveMessage,
  sendTextMessageWithRetry as coreSendTextMessageWithRetry,
  sendTemplateMessageWithRetry as coreSendTemplateMessageWithRetry,
  sendMediaMessageWithRetry as coreSendMediaMessageWithRetry,
  sendInteractiveMessageWithRetry as coreSendInteractiveMessageWithRetry,
} from './whatsapp-service';
import {
  canSendWhatsApp,
  incrementWhatsAppUsage,
} from './usage-service';
import { WhatsAppSendResult, WhatsAppError } from '@/lib/types/communication';

/**
 * Send text message with usage limit enforcement
 */
export async function sendTextMessage(
  to: string,
  message: string,
  previewUrl: boolean = false
): Promise<WhatsAppSendResult> {
  // Check if school can send WhatsApp messages
  const canSend = await canSendWhatsApp(1);
  if (!canSend) {
    throw new WhatsAppError(
      'WhatsApp sending limit exceeded. Please upgrade your plan or contact support.',
      undefined,
      to,
      'text'
    );
  }

  // Send the message
  const result = await coreSendTextMessage(to, message, previewUrl);

  // Increment usage counter on success
  if (result.success) {
    await incrementWhatsAppUsage(1);
  }

  return result;
}

/**
 * Send template message with usage limit enforcement
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components: any = []
): Promise<WhatsAppSendResult> {
  // Check if school can send WhatsApp messages
  const canSend = await canSendWhatsApp(1);
  if (!canSend) {
    throw new WhatsAppError(
      'WhatsApp sending limit exceeded. Please upgrade your plan or contact support.',
      undefined,
      to,
      'template'
    );
  }

  // Send the message
  const result = await coreSendTemplateMessage(to, templateName, languageCode, components);

  // Increment usage counter on success
  if (result.success) {
    await incrementWhatsAppUsage(1);
  }

  return result;
}

/**
 * Send media message with usage limit enforcement
 */
export async function sendMediaMessage(
  to: string,
  mediaType: 'image' | 'document' | 'video' | 'audio',
  mediaUrl: string,
  caption?: string,
  filename?: string
): Promise<WhatsAppSendResult> {
  // Check if school can send WhatsApp messages
  const canSend = await canSendWhatsApp(1);
  if (!canSend) {
    throw new WhatsAppError(
      'WhatsApp sending limit exceeded. Please upgrade your plan or contact support.',
      undefined,
      to,
      mediaType
    );
  }

  // Send the message
  const result = await coreSendMediaMessage(to, mediaType, mediaUrl, caption, filename);

  // Increment usage counter on success
  if (result.success) {
    await incrementWhatsAppUsage(1);
  }

  return result;
}

/**
 * Send interactive message with usage limit enforcement
 */
export async function sendInteractiveMessage(
  to: string,
  interactive: any
): Promise<WhatsAppSendResult> {
  // Check if school can send WhatsApp messages
  const canSend = await canSendWhatsApp(1);
  if (!canSend) {
    throw new WhatsAppError(
      'WhatsApp sending limit exceeded. Please upgrade your plan or contact support.',
      undefined,
      to,
      'interactive'
    );
  }

  // Send the message
  const result = await coreSendInteractiveMessage(to, interactive);

  // Increment usage counter on success
  if (result.success) {
    await incrementWhatsAppUsage(1);
  }

  return result;
}

/**
 * Send text message with retry and usage limit enforcement
 */
export async function sendTextMessageWithRetry(
  to: string,
  message: string,
  previewUrl: boolean = false,
  maxRetries: number = 3,
  retryConfig?: any
): Promise<WhatsAppSendResult> {
  // Check if school can send WhatsApp messages
  const canSend = await canSendWhatsApp(1);
  if (!canSend) {
    throw new WhatsAppError(
      'WhatsApp sending limit exceeded. Please upgrade your plan or contact support.',
      undefined,
      to,
      'text'
    );
  }

  // Send the message with retry
  const result = await coreSendTextMessageWithRetry(to, message, previewUrl, maxRetries, retryConfig);

  // Increment usage counter on success
  if (result.success) {
    await incrementWhatsAppUsage(1);
  }

  return result;
}

/**
 * Send template message with retry and usage limit enforcement
 */
export async function sendTemplateMessageWithRetry(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components: any = [],
  maxRetries: number = 3,
  retryConfig?: any
): Promise<WhatsAppSendResult> {
  // Check if school can send WhatsApp messages
  const canSend = await canSendWhatsApp(1);
  if (!canSend) {
    throw new WhatsAppError(
      'WhatsApp sending limit exceeded. Please upgrade your plan or contact support.',
      undefined,
      to,
      'template'
    );
  }

  // Send the message with retry
  const result = await coreSendTemplateMessageWithRetry(to, templateName, languageCode, components, maxRetries, retryConfig);

  // Increment usage counter on success
  if (result.success) {
    await incrementWhatsAppUsage(1);
  }

  return result;
}

/**
 * Send media message with retry and usage limit enforcement
 */
export async function sendMediaMessageWithRetry(
  to: string,
  mediaType: 'image' | 'document' | 'video' | 'audio',
  mediaUrl: string,
  caption?: string,
  filename?: string,
  maxRetries: number = 3,
  retryConfig?: any
): Promise<WhatsAppSendResult> {
  // Check if school can send WhatsApp messages
  const canSend = await canSendWhatsApp(1);
  if (!canSend) {
    throw new WhatsAppError(
      'WhatsApp sending limit exceeded. Please upgrade your plan or contact support.',
      undefined,
      to,
      mediaType
    );
  }

  // Send the message with retry
  const result = await coreSendMediaMessageWithRetry(to, mediaType, mediaUrl, caption, filename, maxRetries, retryConfig);

  // Increment usage counter on success
  if (result.success) {
    await incrementWhatsAppUsage(1);
  }

  return result;
}

/**
 * Send interactive message with retry and usage limit enforcement
 */
export async function sendInteractiveMessageWithRetry(
  to: string,
  interactive: any,
  maxRetries: number = 3,
  retryConfig?: any
): Promise<WhatsAppSendResult> {
  // Check if school can send WhatsApp messages
  const canSend = await canSendWhatsApp(1);
  if (!canSend) {
    throw new WhatsAppError(
      'WhatsApp sending limit exceeded. Please upgrade your plan or contact support.',
      undefined,
      to,
      'interactive'
    );
  }

  // Send the message with retry
  const result = await coreSendInteractiveMessageWithRetry(to, interactive, maxRetries, retryConfig);

  // Increment usage counter on success
  if (result.success) {
    await incrementWhatsAppUsage(1);
  }

  return result;
}

// Re-export other functions from the core service
export {
  getMessageStatus,
  getBusinessProfile,
  updateBusinessProfile,
  uploadMedia,
  uploadProfilePhoto,
  isWhatsAppConfigured,
  checkWhatsAppConfiguration,
  validatePhoneNumber,
} from './whatsapp-service';