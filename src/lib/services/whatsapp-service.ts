/**
 * WhatsApp Business API Service
 * 
 * This service provides WhatsApp messaging capabilities through the official
 * WhatsApp Business API (Cloud API).
 * 
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.3, 3.4, 3.5
 */

import {
  WhatsAppSendResult,
  WhatsAppStatusResult,
  WhatsAppError,
  WhatsAppTextMessage,
  WhatsAppTemplateMessage,
  WhatsAppMediaMessage,
  WhatsAppInteractiveMessage,
  WhatsAppMessage,
  MessageStatus,
} from '@/lib/types/communication';
import { retryWhatsAppOperation, RetryConfig } from '@/lib/utils/retry';

// ============================================================================
// Configuration
// ============================================================================

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  appSecret: string;
  apiVersion: string;
}

/**
 * Get WhatsApp configuration from environment variables
 */
function getWhatsAppConfig(): WhatsAppConfig {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';

  if (!accessToken) {
    throw new WhatsAppError(
      'WhatsApp access token not configured. Please set WHATSAPP_ACCESS_TOKEN environment variable.',
      undefined
    );
  }

  if (!phoneNumberId) {
    throw new WhatsAppError(
      'WhatsApp phone number ID not configured. Please set WHATSAPP_PHONE_NUMBER_ID environment variable.',
      undefined
    );
  }

  return {
    accessToken,
    phoneNumberId: phoneNumberId || '',
    businessAccountId: businessAccountId || '',
    appSecret: appSecret || '',
    apiVersion,
  };
}

/**
 * Check if WhatsApp service is configured
 * Requirement: 2.2
 */
export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Validate phone number format (E.164)
 * Requirement: 3.4
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
 * Format phone number to WhatsApp format (without + prefix)
 * 
 * @param phoneNumber - Phone number in E.164 format
 * @returns Formatted phone number without + prefix
 */
function formatPhoneNumberForWhatsApp(phoneNumber: string): string {
  // Remove + prefix if present
  return phoneNumber.replace(/^\+/, '');
}

// ============================================================================
// Core WhatsApp Functions
// ============================================================================

/**
 * Send a text message via WhatsApp
 * Requirement: 2.1, 3.1
 * 
 * @param to - Recipient phone number (E.164 format)
 * @param message - Message text content
 * @param previewUrl - Whether to show URL preview (default: false)
 * @returns Promise with send result including message ID
 */
export async function sendTextMessage(
  to: string,
  message: string,
  previewUrl: boolean = false
): Promise<WhatsAppSendResult> {
  try {
    // Validate inputs
    if (!to || !message) {
      throw new WhatsAppError(
        'Phone number and message are required',
        131026,
        to
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(to)) {
      throw new WhatsAppError(
        `Invalid phone number format: ${to}. Expected E.164 format (e.g., +919876543210)`,
        131026,
        to
      );
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      console.warn('WhatsApp service not configured. Message not sent:', { to, message });
      throw new WhatsAppError(
        'WhatsApp service not configured',
        undefined
      );
    }

    const config = getWhatsAppConfig();
    const phoneNumber = formatPhoneNumberForWhatsApp(to);

    // Prepare text message payload
    const payload: WhatsAppTextMessage & { messaging_product: string; to: string } = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: message,
        preview_url: previewUrl,
      },
    };

    // Send request to WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      throw new WhatsAppError(
        error.message || 'Failed to send WhatsApp message',
        error.code,
        to,
        'text'
      );
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp text message:', error);

    // Re-throw WhatsAppError as-is
    if (error instanceof WhatsAppError) {
      throw error;
    }

    // Wrap other errors
    throw new WhatsAppError(
      error.message || 'Failed to send WhatsApp text message',
      error.code,
      to,
      'text'
    );
  }
}

/**
 * Send a template message via WhatsApp
 * Requirement: 2.3, 3.1
 * 
 * @param to - Recipient phone number (E.164 format)
 * @param templateName - WhatsApp approved template name
 * @param languageCode - Template language code (e.g., 'en', 'hi')
 * @param components - Template components with parameters
 * @returns Promise with send result including message ID
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components: WhatsAppTemplateMessage['template']['components'] = []
): Promise<WhatsAppSendResult> {
  try {
    // Validate inputs
    if (!to || !templateName) {
      throw new WhatsAppError(
        'Phone number and template name are required',
        131026,
        to,
        'template'
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(to)) {
      throw new WhatsAppError(
        `Invalid phone number format: ${to}. Expected E.164 format (e.g., +919876543210)`,
        131026,
        to,
        'template'
      );
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      console.warn('WhatsApp service not configured. Template message not sent:', { to, templateName });
      throw new WhatsAppError(
        'WhatsApp service not configured',
        undefined,
        to,
        'template'
      );
    }

    const config = getWhatsAppConfig();
    const phoneNumber = formatPhoneNumberForWhatsApp(to);

    // Prepare template message payload
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };

    // Send request to WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      throw new WhatsAppError(
        error.message || 'Failed to send WhatsApp template message',
        error.code,
        to,
        'template'
      );
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp template message:', error);

    // Re-throw WhatsAppError as-is
    if (error instanceof WhatsAppError) {
      throw error;
    }

    // Wrap other errors
    throw new WhatsAppError(
      error.message || 'Failed to send WhatsApp template message',
      error.code,
      to,
      'template'
    );
  }
}

/**
 * Send a media message via WhatsApp (image, document, video, audio)
 * Requirement: 3.5
 * 
 * @param to - Recipient phone number (E.164 format)
 * @param mediaType - Type of media (image, document, video, audio)
 * @param mediaUrl - URL or media ID of the media file
 * @param caption - Optional caption for the media
 * @param filename - Optional filename (for documents)
 * @returns Promise with send result including message ID
 */
export async function sendMediaMessage(
  to: string,
  mediaType: 'image' | 'document' | 'video' | 'audio',
  mediaUrl: string,
  caption?: string,
  filename?: string
): Promise<WhatsAppSendResult> {
  try {
    // Validate inputs
    if (!to || !mediaType || !mediaUrl) {
      throw new WhatsAppError(
        'Phone number, media type, and media URL are required',
        131026,
        to,
        mediaType
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(to)) {
      throw new WhatsAppError(
        `Invalid phone number format: ${to}. Expected E.164 format (e.g., +919876543210)`,
        131026,
        to,
        mediaType
      );
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      console.warn('WhatsApp service not configured. Media message not sent:', { to, mediaType });
      throw new WhatsAppError(
        'WhatsApp service not configured',
        undefined,
        to,
        mediaType
      );
    }

    const config = getWhatsAppConfig();
    const phoneNumber = formatPhoneNumberForWhatsApp(to);

    // Prepare media message payload
    const mediaObject: any = {
      link: mediaUrl,
    };

    if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
      mediaObject.caption = caption;
    }

    if (filename && mediaType === 'document') {
      mediaObject.filename = filename;
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: mediaType,
      [mediaType]: mediaObject,
    };

    // Send request to WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      throw new WhatsAppError(
        error.message || 'Failed to send WhatsApp media message',
        error.code,
        to,
        mediaType
      );
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp media message:', error);

    // Re-throw WhatsAppError as-is
    if (error instanceof WhatsAppError) {
      throw error;
    }

    // Wrap other errors
    throw new WhatsAppError(
      error.message || 'Failed to send WhatsApp media message',
      error.code,
      to,
      mediaType
    );
  }
}

/**
 * Send an interactive message via WhatsApp (buttons or list)
 * Requirement: 3.5
 * 
 * @param to - Recipient phone number (E.164 format)
 * @param interactive - Interactive message configuration
 * @returns Promise with send result including message ID
 */
export async function sendInteractiveMessage(
  to: string,
  interactive: WhatsAppInteractiveMessage['interactive']
): Promise<WhatsAppSendResult> {
  try {
    // Validate inputs
    if (!to || !interactive) {
      throw new WhatsAppError(
        'Phone number and interactive configuration are required',
        131026,
        to,
        'interactive'
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(to)) {
      throw new WhatsAppError(
        `Invalid phone number format: ${to}. Expected E.164 format (e.g., +919876543210)`,
        131026,
        to,
        'interactive'
      );
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      console.warn('WhatsApp service not configured. Interactive message not sent:', { to });
      throw new WhatsAppError(
        'WhatsApp service not configured',
        undefined,
        to,
        'interactive'
      );
    }

    const config = getWhatsAppConfig();
    const phoneNumber = formatPhoneNumberForWhatsApp(to);

    // Prepare interactive message payload
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'interactive',
      interactive,
    };

    // Send request to WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      throw new WhatsAppError(
        error.message || 'Failed to send WhatsApp interactive message',
        error.code,
        to,
        'interactive'
      );
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp interactive message:', error);

    // Re-throw WhatsAppError as-is
    if (error instanceof WhatsAppError) {
      throw error;
    }

    // Wrap other errors
    throw new WhatsAppError(
      error.message || 'Failed to send WhatsApp interactive message',
      error.code,
      to,
      'interactive'
    );
  }
}

/**
 * Get message delivery status
 * Requirement: 3.1
 * 
 * @param messageId - WhatsApp message ID
 * @returns Promise with delivery status information
 */
export async function getMessageStatus(messageId: string): Promise<WhatsAppStatusResult> {
  try {
    if (!messageId) {
      throw new WhatsAppError('Message ID is required');
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      throw new WhatsAppError('WhatsApp service not configured');
    }

    const config = getWhatsAppConfig();

    // Fetch message status from WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${messageId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      throw new WhatsAppError(
        error.message || 'Failed to fetch message status',
        error.code,
        undefined,
        undefined,
        messageId
      );
    }

    // Map WhatsApp status to our MessageStatus enum
    let status: MessageStatus;
    const whatsappStatus = data.status?.toLowerCase();

    switch (whatsappStatus) {
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
      case 'read':
        status = MessageStatus.READ;
        break;
      case 'failed':
        status = MessageStatus.FAILED;
        break;
      default:
        status = MessageStatus.QUEUED;
    }

    return {
      status,
      timestamp: data.timestamp ? new Date(parseInt(data.timestamp) * 1000) : undefined,
      error: data.errors?.[0]?.title,
    };
  } catch (error: any) {
    console.error('Error fetching WhatsApp message status:', error);

    // Re-throw WhatsAppError as-is
    if (error instanceof WhatsAppError) {
      throw error;
    }

    // Wrap other errors
    throw new WhatsAppError(
      error.message || 'Failed to fetch message status',
      error.code,
      undefined,
      undefined,
      messageId
    );
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check WhatsApp configuration and return status
 * Requirement: 2.2
 * 
 * @returns Configuration status with details
 */
export function checkWhatsAppConfiguration(): {
  configured: boolean;
  accessToken: boolean;
  phoneNumberId: boolean;
  businessAccountId: boolean;
  appSecret: boolean;
  apiVersion: string;
} {
  const accessToken = !!process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = !!process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const appSecret = !!process.env.WHATSAPP_APP_SECRET;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';

  return {
    configured: accessToken && phoneNumberId,
    accessToken,
    phoneNumberId,
    businessAccountId,
    appSecret,
    apiVersion,
  };
}

// ============================================================================
// Retry Wrapper Functions
// ============================================================================

/**
 * Send text message with retry logic and exponential backoff
 * Requirement: 3.3
 * 
 * @param to - Recipient phone number
 * @param message - Message text content
 * @param previewUrl - Whether to show URL preview
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryConfig - Optional custom retry configuration
 * @returns Promise with send result
 */
export async function sendTextMessageWithRetry(
  to: string,
  message: string,
  previewUrl: boolean = false,
  maxRetries: number = 3,
  retryConfig?: Partial<RetryConfig>
): Promise<WhatsAppSendResult> {
  return retryWhatsAppOperation(
    () => sendTextMessage(to, message, previewUrl),
    { maxRetries, ...retryConfig }
  );
}

/**
 * Send template message with retry logic and exponential backoff
 * Requirement: 3.3
 * 
 * @param to - Recipient phone number
 * @param templateName - WhatsApp approved template name
 * @param languageCode - Template language code
 * @param components - Template components with parameters
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryConfig - Optional custom retry configuration
 * @returns Promise with send result
 */
export async function sendTemplateMessageWithRetry(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components: WhatsAppTemplateMessage['template']['components'] = [],
  maxRetries: number = 3,
  retryConfig?: Partial<RetryConfig>
): Promise<WhatsAppSendResult> {
  return retryWhatsAppOperation(
    () => sendTemplateMessage(to, templateName, languageCode, components),
    { maxRetries, ...retryConfig }
  );
}

/**
 * Send media message with retry logic and exponential backoff
 * Requirement: 3.3
 * 
 * @param to - Recipient phone number
 * @param mediaType - Type of media
 * @param mediaUrl - URL or media ID of the media file
 * @param caption - Optional caption for the media
 * @param filename - Optional filename (for documents)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryConfig - Optional custom retry configuration
 * @returns Promise with send result
 */
export async function sendMediaMessageWithRetry(
  to: string,
  mediaType: 'image' | 'document' | 'video' | 'audio',
  mediaUrl: string,
  caption?: string,
  filename?: string,
  maxRetries: number = 3,
  retryConfig?: Partial<RetryConfig>
): Promise<WhatsAppSendResult> {
  return retryWhatsAppOperation(
    () => sendMediaMessage(to, mediaType, mediaUrl, caption, filename),
    { maxRetries, ...retryConfig }
  );
}

/**
 * Send interactive message with retry logic and exponential backoff
 * Requirement: 3.3
 * 
 * @param to - Recipient phone number
 * @param interactive - Interactive message configuration
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryConfig - Optional custom retry configuration
 * @returns Promise with send result
 */
export async function sendInteractiveMessageWithRetry(
  to: string,
  interactive: WhatsAppInteractiveMessage['interactive'],
  maxRetries: number = 3,
  retryConfig?: Partial<RetryConfig>
): Promise<WhatsAppSendResult> {
  return retryWhatsAppOperation(
    () => sendInteractiveMessage(to, interactive),
    { maxRetries, ...retryConfig }
  );
}

// ============================================================================
// WhatsApp Business Profile Management
// ============================================================================

/**
 * Business profile data interface
 */
export interface WhatsAppBusinessProfile {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}

/**
 * Business profile update result
 */
export interface BusinessProfileUpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Media upload result
 */
export interface MediaUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

/**
 * Get WhatsApp Business profile information
 * Requirement: 20.1
 * 
 * @returns Promise with business profile data
 */
export async function getBusinessProfile(): Promise<WhatsAppBusinessProfile | null> {
  try {
    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      throw new WhatsAppError('WhatsApp service not configured');
    }

    const config = getWhatsAppConfig();

    // Fetch business profile from WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      throw new WhatsAppError(
        error.message || 'Failed to fetch business profile',
        error.code
      );
    }

    // Return the first profile data (API returns array with single item)
    return data.data?.[0] || null;
  } catch (error: any) {
    console.error('Error fetching WhatsApp business profile:', error);

    // Re-throw WhatsAppError as-is
    if (error instanceof WhatsAppError) {
      throw error;
    }

    // Wrap other errors
    throw new WhatsAppError(
      error.message || 'Failed to fetch business profile',
      error.code
    );
  }
}

/**
 * Update WhatsApp Business profile information
 * Requirement: 20.1, 20.3
 * 
 * @param profileData - Business profile data to update
 * @returns Promise with update result
 */
export async function updateBusinessProfile(
  profileData: Partial<WhatsAppBusinessProfile>
): Promise<BusinessProfileUpdateResult> {
  try {
    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      throw new WhatsAppError('WhatsApp service not configured');
    }

    const config = getWhatsAppConfig();

    // Prepare update payload
    const payload: any = {
      messaging_product: 'whatsapp',
    };

    // Add fields to update
    if (profileData.about !== undefined) {
      payload.about = profileData.about;
    }
    if (profileData.address !== undefined) {
      payload.address = profileData.address;
    }
    if (profileData.description !== undefined) {
      payload.description = profileData.description;
    }
    if (profileData.email !== undefined) {
      payload.email = profileData.email;
    }
    if (profileData.websites !== undefined) {
      payload.websites = profileData.websites;
    }
    if (profileData.vertical !== undefined) {
      payload.vertical = profileData.vertical;
    }

    // Update business profile via WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/whatsapp_business_profile`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      return {
        success: false,
        error: error.message || 'Failed to update business profile',
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error updating WhatsApp business profile:', error);
    return {
      success: false,
      error: error.message || 'Failed to update business profile',
    };
  }
}

/**
 * Upload media file to WhatsApp
 * Requirement: 20.3
 * 
 * @param file - File buffer to upload
 * @param mimeType - MIME type of the file
 * @returns Promise with media upload result including media ID
 */
export async function uploadMedia(
  file: Buffer,
  mimeType: string
): Promise<MediaUploadResult> {
  try {
    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      throw new WhatsAppError('WhatsApp service not configured');
    }

    const config = getWhatsAppConfig();

    // Create form data for file upload
    const formData = new FormData();
    // Use type assertion for Buffer to BlobPart compatibility
    const blob = new Blob([file as unknown as BlobPart], { type: mimeType });
    formData.append('file', blob);
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mimeType);

    // Upload media to WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      return {
        success: false,
        error: error.message || 'Failed to upload media',
      };
    }

    return {
      success: true,
      mediaId: data.id,
    };
  } catch (error: any) {
    console.error('Error uploading media to WhatsApp:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload media',
    };
  }
}

/**
 * Upload profile photo for WhatsApp Business profile
 * Requirement: 20.3
 * 
 * @param file - Image file buffer to upload
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
 * @returns Promise with update result
 */
export async function uploadProfilePhoto(
  file: Buffer,
  mimeType: string
): Promise<BusinessProfileUpdateResult> {
  try {
    // First, upload the media file
    const uploadResult = await uploadMedia(file, mimeType);

    if (!uploadResult.success || !uploadResult.mediaId) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload profile photo',
      };
    }

    // Then, update the business profile with the media ID
    const config = getWhatsAppConfig();

    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/whatsapp_business_profile`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          profile_picture_handle: uploadResult.mediaId,
        }),
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok || data.error) {
      const error = data.error || {};
      return {
        success: false,
        error: error.message || 'Failed to set profile photo',
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload profile photo',
    };
  }
}

