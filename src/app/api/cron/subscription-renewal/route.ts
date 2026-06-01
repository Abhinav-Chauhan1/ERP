import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SubscriptionStatus } from '@prisma/client';

/**
 * GET /api/cron/subscription-renewal
 * Called daily by Vercel Cron (or any scheduler).
 * 1. Marks subscriptions past their currentPeriodEnd as EXPIRED and resets school.plan to STARTER.
 * 2. Marks subscriptions expiring within 3 days as PAST_DUE (grace period trigger).
 *
 * Protect with CRON_SECRET env var so only the scheduler can call it.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const gracePeriodEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  // 1 — Find and expire subscriptions that are past their end date
  const expired = await db.enhancedSubscription.findMany({
    where: {
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
      currentPeriodEnd: { lt: now },
    },
    select: { id: true, schoolId: true },
  });

  if (expired.length > 0) {
    await Promise.all([
      db.enhancedSubscription.updateMany({
        where: { id: { in: expired.map(s => s.id) } },
        data: { status: SubscriptionStatus.CANCELED },
      }),
      // Reset all expired schools to STARTER plan
      db.school.updateMany({
        where: { id: { in: expired.map(s => s.schoolId) } },
        data: { plan: 'STARTER' },
      }),
    ]);
  }

  // 2 — Mark subscriptions expiring in the next 3 days as PAST_DUE (grace period warning)
  const expiringSoon = await db.enhancedSubscription.updateMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: { gte: now, lte: gracePeriodEnd },
    },
    data: { status: SubscriptionStatus.PAST_DUE },
  });

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    markedPastDue: expiringSoon.count,
    timestamp: now.toISOString(),
  });
}
