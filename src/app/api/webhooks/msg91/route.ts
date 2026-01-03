/**
 * MSG91 Webhook Handler
 * 
 * This API route handles webhook notifications from MSG91 for SMS delivery status updates.
 * It verifies webhook authenticity, parses delivery status updates, and updates the
 * message status in the database.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateMessageStatus } from '@/lib/services/message-logging-service';
import { MessageLogStatus } from '@prisma/client';
import { MSG91WebhookPayload } from '@/lib/types/communication';

// ============================================================================
// Webhook Verification
// ============================================================================

/**
 * Verify MSG91 webhook authenticity
 * Requirement: 13.2
 * 
 * MSG91 doesn't provide signature verification by default, but we can verify:
 * 1. The webhook comes from a known IP (if configured)
 * 2. The payload structure matches expected format
 * 3. The request_id exists in our database
 * 
 * For production, consider:
 * - IP whitelisting
 * - Custom authentication token in query params
 * - HTTPS only
 * 
 * @param request - Incoming webhook request
 * @returns true if webhook is authentic
 */
function verifyWebhookAuthenticity(request: NextRequest): boolean {
  try {
    // Check if request is HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      if (protocol !== 'https') {
        console.warn('MSG91 webhook received over non-HTTPS connection');
        return false;
      }
    }

    // Optional: Verify custom authentication token
    const authToken = request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.MSG91_WEBHOOK_TOKEN;
    
    if (expectedToken && authToken !== expectedToken) {
      console.warn('MSG91 webhook authentication token mismatch');
      return false;
    }

    // Optional: IP whitelisting
    // MSG91 webhook IPs can be added to environment variables
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip');
    const whitelistedIps = process.env.MSG91_WEBHOOK_IPS?.split(',') || [];
    
    if (whitelistedIps.length > 0 && clientIp) {
      const isWhitelisted = whitelistedIps.some(ip => 
        clientIp.includes(ip.trim())
      );
      
      if (!isWhitelisted) {
        console.warn('MSG91 webhook from non-whitelisted IP:', clientIp);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error verifying MSG91 webhook authenticity:', error);
    return false;
  }
}

// ============================================================================
// Status Mapping
// ============================================================================

/**
 * Map MSG91 status to MessageLogStatus
 * Requirement: 13.3
 * 
 * MSG91 status values:
 * - SENT: Message sent to carrier
 * - DELIVERED: Message delivered to recipient
 * - FAILED: Message delivery failed
 * - REJECTED: Message rejected by carrier
 * - UNDELIVERED: Message not delivered
 * - QUEUED: Message queued for sending
 * 
 * @param msg91Status - Status from MSG91 webhook
 * @returns MessageLogStatus
 */
function mapMSG91StatusToMessageLogStatus(msg91Status: string): MessageLogStatus {
  const status = msg91Status.toUpperCase();
  
  switch (status) {
    case 'QUEUED':
      return MessageLogStatus.QUEUED;
    
    case 'SENDING':
    case 'SENT':
      return MessageLogStatus.SENT;
    
    case 'DELIVERED':
      return MessageLogStatus.DELIVERED;
    
    case 'FAILED':
    case 'REJECTED':
    case 'UNDELIVERED':
    case 'EXPIRED':
    case 'DELETED':
      return MessageLogStatus.FAILED;
    
    default:
      console.warn('Unknown MSG91 status:', msg91Status);
      return MessageLogStatus.QUEUED;
  }
}

// ============================================================================
// Webhook Handler
// ============================================================================

/**
 * POST handler for MSG91 webhook
 * Requirement: 13.1, 13.3
 * 
 * Receives delivery status updates from MSG91 and updates the message log.
 * 
 * Expected payload format:
 * {
 *   "request_id": "string",
 *   "status": "DELIVERED|FAILED|SENT|etc",
 *   "mobile": "919876543210",
 *   "description": "optional description",
 *   "timestamp": "optional timestamp"
 * }
 * 
 * @param request - Incoming webhook request
 * @returns Response with status
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    // Requirement: 13.2
    if (!verifyWebhookAuthenticity(request)) {
      console.error('MSG91 webhook authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload: MSG91WebhookPayload;
    
    try {
      payload = await request.json();
    } catch (error) {
      console.error('Failed to parse MSG91 webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!payload.request_id || !payload.status) {
      console.error('MSG91 webhook missing required fields:', payload);
      return NextResponse.json(
        { error: 'Missing required fields: request_id, status' },
        { status: 400 }
      );
    }

    // Log webhook receipt
    console.log('MSG91 webhook received:', {
      request_id: payload.request_id,
      status: payload.status,
      mobile: payload.mobile,
      timestamp: payload.timestamp || new Date().toISOString(),
    });

    // Map MSG91 status to our MessageLogStatus
    const messageStatus = mapMSG91StatusToMessageLogStatus(payload.status);

    // Prepare update parameters
    const updateParams: any = {
      messageId: payload.request_id,
      status: messageStatus,
    };

    // Add delivered timestamp if status is DELIVERED
    if (messageStatus === MessageLogStatus.DELIVERED && payload.timestamp) {
      updateParams.deliveredAt = new Date(payload.timestamp);
    }

    // Add error information if status is FAILED
    if (messageStatus === MessageLogStatus.FAILED) {
      updateParams.failedAt = payload.timestamp 
        ? new Date(payload.timestamp) 
        : new Date();
      updateParams.errorMessage = payload.description || 
        `Message delivery failed with status: ${payload.status}`;
      updateParams.errorCode = payload.status;
    }

    // Update message status in database
    // Requirement: 13.3
    try {
      await updateMessageStatus(updateParams);
      
      console.log('MSG91 webhook processed successfully:', {
        request_id: payload.request_id,
        status: messageStatus,
      });

      return NextResponse.json(
        { 
          success: true,
          message: 'Webhook processed successfully',
          request_id: payload.request_id,
        },
        { status: 200 }
      );
    } catch (dbError: any) {
      // Log database update error but don't fail the webhook
      // Requirement: 13.5
      console.error('Failed to update message status in database:', {
        error: dbError.message,
        request_id: payload.request_id,
        status: payload.status,
      });

      // If message not found, it might be a webhook for a message we didn't send
      // Return 200 to acknowledge receipt but log the issue
      if (dbError.message.includes('not found')) {
        console.warn('MSG91 webhook for unknown message:', payload.request_id);
        return NextResponse.json(
          { 
            success: true,
            message: 'Webhook acknowledged (message not found)',
            request_id: payload.request_id,
          },
          { status: 200 }
        );
      }

      // For other database errors, return 500 so MSG91 can retry
      return NextResponse.json(
        { 
          error: 'Failed to process webhook',
          message: 'Database update failed',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // Log webhook processing error
    // Requirement: 13.5
    console.error('Error processing MSG91 webhook:', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification
 * 
 * Some webhook systems require a GET endpoint for verification.
 * This is optional for MSG91 but included for completeness.
 * 
 * @param request - Incoming verification request
 * @returns Response confirming webhook endpoint
 */
export async function GET(request: NextRequest) {
  // Simple verification endpoint
  const verifyToken = request.nextUrl.searchParams.get('verify_token');
  const expectedToken = process.env.MSG91_WEBHOOK_VERIFY_TOKEN;

  if (expectedToken && verifyToken === expectedToken) {
    return NextResponse.json(
      { 
        success: true,
        message: 'MSG91 webhook endpoint verified',
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { 
      success: true,
      message: 'MSG91 webhook endpoint active',
    },
    { status: 200 }
  );
}
