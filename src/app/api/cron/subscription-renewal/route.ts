import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SubscriptionStatus } from '@prisma/client';
import { sendEmail } from '@/lib/services/email-service';

/**
 * GET /api/cron/subscription-renewal
 * Called daily by Vercel Cron (or any scheduler).
 * 1. Marks subscriptions past their currentPeriodEnd as CANCELED and resets school.plan to STARTER.
 * 2. Marks subscriptions expiring within 3 days as PAST_DUE (grace period trigger).
 * 3. Sends renewal reminder emails to schools expiring within 7 days.
 *
 * Protected by CRON_SECRET env var (x-cron-secret header).
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const gracePeriodEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);   // 3 days
  const reminderWindowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // 1 — Expire subscriptions that are past their end date
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
      db.school.updateMany({
        where: { id: { in: expired.map(s => s.schoolId) } },
        data: { plan: 'STARTER' },
      }),
    ]);
  }

  // 2 — Mark subscriptions expiring in the next 3 days as PAST_DUE
  const expiringSoon = await db.enhancedSubscription.updateMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: { gte: now, lte: gracePeriodEnd },
    },
    data: { status: SubscriptionStatus.PAST_DUE },
  });

  // 3 — Send renewal reminder emails for subscriptions expiring within 7 days
  const needsReminder = await db.enhancedSubscription.findMany({
    where: {
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
      cancelAtPeriodEnd: false,
      currentPeriodEnd: { gte: now, lte: reminderWindowEnd },
    },
    include: {
      school: { select: { name: true, email: true } },
      plan: { select: { name: true } },
    },
  });

  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  let remindersSent = 0;

  for (const sub of needsReminder) {
    const email = sub.school.email;
    if (!email) continue;

    const expiry = sub.currentPeriodEnd.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    try {
      await sendEmail({
        to: email,
        subject: `Your SikshaMitra ${sub.plan.name} subscription expires on ${expiry}`,
        html: `
          <p>Hi ${sub.school.name},</p>
          <p>Your <strong>${sub.plan.name}</strong> subscription expires on <strong>${expiry}</strong>.</p>
          <p>Renew now to keep access to all your features without interruption.</p>
          <p>
            <a href="${appUrl}/admin/settings/plan"
               style="background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
              Renew Subscription
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px;">
            If you have questions, reply to this email or contact support@sikshamitra.in.
          </p>
        `,
      });
      remindersSent++;
    } catch (err) {
      console.error(`Failed to send renewal reminder to ${email}:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    markedPastDue: expiringSoon.count,
    remindersSent,
    timestamp: now.toISOString(),
  });
}
