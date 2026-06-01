import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { subscriptionService } from '@/lib/services/subscription-service';
import { z } from 'zod';

const cancelSchema = z.object({
  immediate: z.boolean().optional().default(false),
  reason: z.string().optional(),
});

/**
 * POST /api/subscription/cancel
 * Allows a school admin to cancel their own active subscription.
 * Defaults to cancel-at-period-end (not immediate).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = session.user.schoolId;
    if (!schoolId) {
      return NextResponse.json({ success: false, message: 'School context required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { immediate, reason } = cancelSchema.parse(body);

    const activeSubscription = await db.enhancedSubscription.findFirst({
      where: { schoolId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeSubscription) {
      return NextResponse.json({ success: false, message: 'No active subscription found' }, { status: 404 });
    }

    await subscriptionService.cancelSubscription(activeSubscription.id, {
      immediate,
      reason: reason || 'User requested cancellation',
    });

    return NextResponse.json({
      success: true,
      message: immediate
        ? 'Subscription cancelled immediately.'
        : `Subscription will be cancelled on ${activeSubscription.currentPeriodEnd.toLocaleDateString('en-IN')}.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ success: false, message: 'Failed to cancel subscription' }, { status: 500 });
  }
}
