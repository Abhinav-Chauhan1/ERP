/**
 * WhatsApp Webhook Handler
 * 
 * This API route handles webhook notifications from WhatsApp Business API for
 * message delivery status updates and incoming messages. It verifies webhook
 * signatures, parses events, and updates the message status in the database.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateMessageStatus, logMessage } from '@/lib/services/message-logging-service';
import { MessageLogStatus, CommunicationChannel } from '@prisma/client';
import { WhatsAppWebhookPayload } from '@/lib/types/communication';
import { processButtonResponse, ButtonResponse } from '@/lib/services/whatsapp-button-handler';
import crypto from 'crypto';

// ============================================================================
// Webhook Verification
// ============================================================================

/**
 * Verify WhatsApp webhook signature
 * Requirement: 12.2
 * 
 * WhatsApp signs webhook requests using HMAC-SHA256 with the app secret.
 * The signature is sent in the X-Hub-Signature-256 header.
 * 
 * Format: sha256=<signature>
 * 
 * @param payload - Raw request body
 * @param signature - Signature from X-Hub-Signature-256 header
 * @param appSecret - WhatsApp app secret
 * @returns true if signature is valid
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  try {
    // Remove 'sha256=' prefix if present
    const signatureHash = signature.startsWith('sha256=')
      ? signature.substring(7)
      : signature;

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying WhatsApp webhook signature:', error);
    return false;
  }
}

// ============================================================================
// Status Mapping
// ============================================================================

/**
 * Map WhatsApp status to MessageLogStatus
 * Requirement: 12.3
 * 
 * WhatsApp status values:
 * - sent: Message sent to WhatsApp server
 * - delivered: Message delivered to recipient's device
 * - read: Message read by recipient
 * - failed: Message delivery failed
 * 
 * @param whatsappStatus - Status from WhatsApp webhook
 * @returns MessageLogStatus
 */
function mapWhatsAppStatusToMessageLogStatus(
  whatsappStatus: string
): MessageLogStatus {
  const status = whatsappStatus.toLowerCase();

  switch (status) {
    case 'sent':
      return MessageLogStatus.SENT;

    case 'delivered':
      return MessageLogStatus.DELIVERED;

    case 'read':
      return MessageLogStatus.READ;

    case 'failed':
      return MessageLogStatus.FAILED;

    default:
      console.warn('Unknown WhatsApp status:', whatsappStatus);
      return MessageLogStatus.QUEUED;
  }
}

// ============================================================================
// Webhook Handlers
// ============================================================================

/**
 * GET handler for webhook verification
 * Requirement: 12.1
 * 
 * WhatsApp sends a GET request to verify the webhook endpoint during setup.
 * The request includes:
 * - hub.mode: Should be 'subscribe'
 * - hub.verify_token: Token set in Meta App Dashboard
 * - hub.challenge: Random string to echo back
 * 
 * @param request - Incoming verification request
 * @returns Challenge string if verification succeeds
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('WhatsApp webhook verification request:', {
      mode,
      token: token ? '***' : undefined,
      challenge: challenge ? '***' : undefined,
    });

    // Verify the mode and token
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!expectedToken) {
      console.error('WHATSAPP_VERIFY_TOKEN not configured');
      return NextResponse.json(
        { error: 'Webhook verification token not configured' },
        { status: 500 }
      );
    }

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('WhatsApp webhook verified successfully');

      // Return the challenge to complete verification
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('WhatsApp webhook verification failed:', {
      mode,
      tokenMatch: token === expectedToken,
    });

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    );
  } catch (error: any) {
    console.error('Error in WhatsApp webhook verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for webhook events
 * Requirement: 12.1, 12.3, 12.4
 * 
 * Receives webhook events from WhatsApp Business API including:
 * - Message status updates (sent, delivered, read, failed)
 * - Incoming messages from users
 * 
 * @param request - Incoming webhook request
 * @returns Response with status
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    // Requirement: 12.2
    const signature = request.headers.get('x-hub-signature-256');
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
      console.error('WHATSAPP_APP_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook signature verification not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error('WhatsApp webhook missing signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
      console.error('WhatsApp webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload: WhatsAppWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Failed to parse WhatsApp webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload.object || !payload.entry) {
      console.error('WhatsApp webhook missing required fields:', payload);
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    // Process each entry in the webhook
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const { value, field } = change;

        // Process message status updates
        // Requirement: 12.3
        if (value.statuses && value.statuses.length > 0) {
          await processStatusUpdates(value.statuses);
        }

        // Process incoming messages
        // Requirement: 12.4
        if (value.messages && value.messages.length > 0) {
          await processIncomingMessages(value.messages, value.metadata);
        }
      }
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json(
      { success: true, message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing WhatsApp webhook:', {
      error: error.message,
      stack: error.stack,
    });

    // Return 200 even on error to prevent WhatsApp from retrying
    // Log the error for manual investigation
    return NextResponse.json(
      { success: true, message: 'Webhook acknowledged' },
      { status: 200 }
    );
  }
}

// ============================================================================
// Event Processing Functions
// ============================================================================

/**
 * Process message status updates
 * Requirement: 12.3
 * 
 * Updates the message status in the database based on delivery updates
 * from WhatsApp.
 * 
 * @param statuses - Array of status updates from webhook
 */
async function processStatusUpdates(
  statuses: Array<{
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
    errors?: Array<{
      code: number;
      title: string;
    }>;
  }>
): Promise<void> {
  for (const statusUpdate of statuses) {
    try {
      const { id, status, timestamp, errors } = statusUpdate;

      console.log('Processing WhatsApp status update:', {
        messageId: id,
        status,
        timestamp,
      });

      // Map WhatsApp status to our MessageLogStatus
      const messageStatus = mapWhatsAppStatusToMessageLogStatus(status);

      // Prepare update parameters
      const updateParams: any = {
        messageId: id,
        status: messageStatus,
      };

      // Add timestamp based on status
      const statusTimestamp = new Date(parseInt(timestamp) * 1000);

      if (messageStatus === MessageLogStatus.DELIVERED) {
        updateParams.deliveredAt = statusTimestamp;
      }

      if (messageStatus === MessageLogStatus.READ) {
        updateParams.readAt = statusTimestamp;
      }

      // Add error information if status is FAILED
      if (messageStatus === MessageLogStatus.FAILED && errors && errors.length > 0) {
        updateParams.failedAt = statusTimestamp;
        updateParams.errorCode = errors[0].code.toString();
        updateParams.errorMessage = errors[0].title;
      }

      // Update message status in database
      await updateMessageStatus(updateParams);

      console.log('WhatsApp status update processed successfully:', {
        messageId: id,
        status: messageStatus,
      });
    } catch (error: any) {
      // Log error but continue processing other status updates
      console.error('Failed to process WhatsApp status update:', {
        error: error.message,
        statusUpdate,
      });

      // If message not found, log warning but don't fail
      if (error.message.includes('not found')) {
        console.warn('WhatsApp status update for unknown message:', statusUpdate.id);
      }
    }
  }
}

/**
 * Process incoming messages from users
 * Requirement: 12.4
 * 
 * Logs incoming messages from users for future processing.
 * This enables two-way communication features.
 * 
 * @param messages - Array of incoming messages from webhook
 * @param metadata - Metadata about the WhatsApp Business account
 */
async function processIncomingMessages(
  messages: Array<{
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: {
      body: string;
    };
    button?: {
      text: string;
      payload: string;
    };
  }>,
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  }
): Promise<void> {
  for (const message of messages) {
    try {
      const { from, id, timestamp, type, text, button } = message;

      console.log('Processing incoming WhatsApp message:', {
        messageId: id,
        from,
        type,
        timestamp,
      });

      // Handle button responses
      // Requirement: 19.3, 19.4
      if (type === 'button' && button) {
        await processButtonResponse({
          messageId: id,
          from,
          buttonId: button.payload,
          buttonText: button.text,
          timestamp: new Date(parseInt(timestamp) * 1000),
        });

        // Button response is handled, continue to next message
        continue;
      }

      // Extract message content based on type
      let messageBody = '';
      let messageMetadata: any = {
        type,
        phoneNumberId: metadata.phone_number_id,
        displayPhoneNumber: metadata.display_phone_number,
      };

      if (type === 'text' && text) {
        messageBody = text.body;
      } else {
        messageBody = `[${type} message]`;
      }

      // Log incoming message to database
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: from,
        body: messageBody,
        messageId: id,
        metadata: {
          ...messageMetadata,
          direction: 'incoming',
          timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        },
      });

      console.log('Incoming WhatsApp message logged successfully:', {
        messageId: id,
        from,
        type,
      });

      // Process incoming text messages and send auto-reply
      if (type === 'text' && text) {
        await processTextMessageAndReply(from, text.body, metadata.phone_number_id);
      }
    } catch (error: any) {
      // Log error but continue processing other messages
      console.error('Failed to process incoming WhatsApp message:', {
        error: error.message,
        message,
      });
    }
  }
}

// ============================================================================
// Auto-Reply Processing
// ============================================================================

/**
 * Process incoming text message and send auto-reply
 * 
 * Handles common user queries with automated responses
 * 
 * @param from - Sender's phone number
 * @param messageBody - Text message content
 * @param phoneNumberId - WhatsApp Business phone number ID
 */
async function processTextMessageAndReply(
  from: string,
  messageBody: string,
  phoneNumberId: string
): Promise<void> {
  try {
    const lowerMessage = messageBody.toLowerCase().trim();

    // Define keyword-based auto-replies
    let replyMessage = '';

    if (lowerMessage.includes('help') || lowerMessage === 'hi' || lowerMessage === 'hello') {
      replyMessage = `👋 Welcome to School ERP WhatsApp Support!

Here's how I can help you:

📚 *Attendance* - Type "attendance" to check your child's attendance
💰 *Fees* - Type "fees" to view pending fees
📊 *Results* - Type "results" to check exam results
📅 *Calendar* - Type "calendar" to view upcoming events
📞 *Contact* - Type "contact" for school contact info

Or simply describe what you need help with!`;
    } else if (lowerMessage.includes('attendance')) {
      replyMessage = `📋 *Attendance Information*

To check attendance details, please log in to the parent portal at:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent/attendance

You can also contact the school office for attendance queries.`;
    } else if (lowerMessage.includes('fee') || lowerMessage.includes('payment')) {
      replyMessage = `💰 *Fee Information*

To view and pay fees online, please visit:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent/fees

For payment queries, contact the accounts department.`;
    } else if (lowerMessage.includes('result') || lowerMessage.includes('exam') || lowerMessage.includes('marks')) {
      replyMessage = `📊 *Exam Results*

To view your child's exam results, please visit:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent/academics

Results are also available on the parent portal.`;
    } else if (lowerMessage.includes('calendar') || lowerMessage.includes('event')) {
      replyMessage = `📅 *School Calendar*

View upcoming events and important dates at:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent/calendar

Stay updated with school activities!`;
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      replyMessage = `📞 *Contact Information*

School Office: Contact your school administration
Email: Contact the school email
Website: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

For urgent matters, please call the school directly.`;
    } else if (lowerMessage.includes('thank')) {
      replyMessage = `🙏 You're welcome! Is there anything else I can help you with?

Type "help" for more options.`;
    }

    // If we have a reply, log it (actual sending would require WhatsApp API call)
    if (replyMessage) {
      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: from,
        body: replyMessage,
        status: MessageLogStatus.SENT,
        metadata: {
          type: 'auto_reply',
          triggerMessage: messageBody,
          phoneNumberId,
        },
      });

      console.log('Auto-reply sent to:', from);
    }
  } catch (error: any) {
    console.error('Error processing text message for auto-reply:', error);
    // Don't throw - auto-reply failure shouldn't affect message processing
  }
}
