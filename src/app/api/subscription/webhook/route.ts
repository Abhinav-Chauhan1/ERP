import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhook } from '@/lib/utils/payment-gateway';
import { billingService } from '@/lib/services/billing-service';

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'subscription-webhook' });
}

/**
 * POST /api/subscription/webhook
 * Cashfree webhook handler for SaaS subscription payments.
 * Register this URL in Cashfree dashboard for subscription-related events.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';

    if (!verifyCashfreeWebhook(rawBody, signature, timestamp)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload.type || '';
    const { order, payment } = payload.data || {};

    if (!order?.order_id) {
      return NextResponse.json({ received: true });
    }

    const cfOrderId: string = order.order_id;

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const cfPaymentId: string = payment?.cf_payment_id?.toString() || '';
      await billingService.activateSubscriptionFromPayment(cfOrderId, cfPaymentId);
    } else if (
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK'
    ) {
      // Mark the pending Payment record as failed
      const { db } = await import('@/lib/db');
      await db.payment.updateMany({
        where: { paymentSessionId: cfOrderId, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Subscription webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
