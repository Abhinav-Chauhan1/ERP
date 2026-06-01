import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { verifyCashfreePayment } from '@/lib/utils/payment-gateway';
import { billingService } from '@/lib/services/billing-service';

/**
 * GET /api/subscription/verify?cfOrderId=...
 * Checks local DB to confirm a subscription payment has been processed.
 * If the payment is still PENDING in DB (e.g., webhook couldn't reach localhost),
 * falls back to querying Cashfree's API directly and activates the subscription.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfOrderId = request.nextUrl.searchParams.get('cfOrderId');
  if (!cfOrderId) {
    return NextResponse.json({ state: 'failed' });
  }

  // Look up the payment record by cfOrderId stored in paymentSessionId field
  const payment = await db.payment.findFirst({
    where: { paymentSessionId: cfOrderId },
    include: {
      subscription: {
        include: { plan: { select: { name: true } } },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ state: 'pending' });
  }

  // Already completed by webhook
  if (payment.status === 'COMPLETED' && payment.subscription.status === 'ACTIVE') {
    return NextResponse.json({
      state: 'success',
      planName: payment.subscription.plan.name,
    });
  }

  if (payment.status === 'FAILED') {
    return NextResponse.json({ state: 'failed' });
  }

  // Payment is PENDING in DB — webhook may not have fired (common on localhost).
  // Directly verify with Cashfree and activate if paid.
  try {
    const result = await verifyCashfreePayment(cfOrderId);

    if (result.success && result.cfPaymentId) {
      await billingService.activateSubscriptionFromPayment(cfOrderId, String(result.cfPaymentId));

      return NextResponse.json({
        state: 'success',
        planName: payment.subscription.plan.name,
      });
    }

    // Cashfree says not paid yet
    return NextResponse.json({ state: 'pending' });
  } catch {
    // Cashfree query failed — stay pending and let the polling retry
    return NextResponse.json({ state: 'pending' });
  }
}
