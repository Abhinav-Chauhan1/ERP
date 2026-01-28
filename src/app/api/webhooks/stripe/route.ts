import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { billingService } from '@/lib/services/billing-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import crypto from 'crypto';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const elements = signature.split(',');
    const signatureElements: { [key: string]: string } = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureElements[key] = value;
    }
    
    const timestamp = signatureElements.t;
    const v1 = signatureElements.v1;
    
    if (!timestamp || !v1) {
      return false;
    }
    
    // Check timestamp (reject if older than 5 minutes)
    const timestampNumber = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - timestampNumber > 300) {
      return false;
    }
    
    // Verify signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying Stripe signature:', error);
    return false;
  }
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the raw body
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    const isValid = verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    
    if (!isValid) {
      console.error('Invalid Stripe webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse the webhook event
    let event;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('Error parsing webhook body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle the webhook event
    await billingService.handleWebhook({
      event: event.type,
      payload: event.data,
    });

    // Log the webhook event for audit purposes
    await logAuditEvent({
      userId: 'system', // System-generated event
      action: AuditAction.CREATE,
      resource: 'WEBHOOK',
      resourceId: event.id,
      changes: {
        provider: 'stripe',
        eventType: event.type,
        eventId: event.id,
        processed: true,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);

    // Log the failed webhook for debugging
    try {
      await logAuditEvent({
        userId: 'system',
        action: AuditAction.CREATE,
        resource: 'WEBHOOK',
        changes: {
          provider: 'stripe',
          error: error instanceof Error ? error.message : 'Unknown error',
          processed: false,
        },
      });
    } catch (auditError) {
      console.error('Error logging webhook failure:', auditError);
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/stripe
 * Health check for Stripe webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'stripe-webhook',
    timestamp: new Date().toISOString(),
  });
}