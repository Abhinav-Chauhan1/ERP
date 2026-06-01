import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { billingService } from '@/lib/services/billing-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { addMonths } from 'date-fns';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const updateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  metadata: z.record(z.string()).optional(),
  action: z.literal('activate').optional(),
  endDate: z.string().datetime().optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/billing/subscriptions/[id]
 * Get a specific subscription
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await billingService.getSubscription((await params).id);
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SUBSCRIPTION',
      resourceId: (await params).id,
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/billing/subscriptions/[id]
 * Update a subscription
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);
    const subscriptionId = (await params).id;

    if (validatedData.action === 'activate') {
      const sub = await db.enhancedSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: { select: { name: true } } },
      });

      if (!sub) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }

      const now = new Date();
      const periodEnd = validatedData.endDate ? new Date(validatedData.endDate) : addMonths(now, 1);

      await Promise.all([
        db.enhancedSubscription.update({
          where: { id: subscriptionId },
          data: { status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: periodEnd },
        }),
        db.school.update({
          where: { id: sub.schoolId },
          data: { plan: sub.plan.name as any },
        }),
      ]);

      await logAuditEvent({
        userId: session.user.id,
        action: AuditAction.UPDATE,
        resource: 'SUBSCRIPTION',
        resourceId: subscriptionId,
        changes: { action: 'activate', periodEnd: periodEnd.toISOString() },
      });

      return NextResponse.json({ message: 'Subscription activated successfully' });
    }

    const subscription = await billingService.updateSubscription(subscriptionId, validatedData);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SUBSCRIPTION',
      resourceId: subscriptionId,
      changes: validatedData,
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/super-admin/billing/subscriptions/[id]
 * Cancel a subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await billingService.updateSubscription((await params).id, { cancelAtPeriodEnd: true });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.DELETE,
      resource: 'SUBSCRIPTION',
      resourceId: (await params).id,
      changes: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}