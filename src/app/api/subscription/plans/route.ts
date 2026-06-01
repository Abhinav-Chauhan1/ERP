import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { PLAN_LIMITS, PLAN_FEATURES, FEATURE_LABELS, type PlanType } from '@/lib/config/plan-features';

// Seed plan records if they don't exist yet
async function ensurePlansSeeded() {
  const count = await db.subscriptionPlan.count();
  if (count >= 3) return;

  const plans: Array<{ name: PlanType; desc: string }> = [
    { name: 'STARTER',  desc: 'Perfect for small schools getting started' },
    { name: 'GROWTH',   desc: 'For growing schools that need more tools' },
    { name: 'DOMINATE', desc: 'Full-featured for large institutions' },
  ];

  for (const { name, desc } of plans) {
    const limits = PLAN_LIMITS[name];
    await db.subscriptionPlan.upsert({
      where: { name },
      update: {
        description: desc,
        pricePerStudent: limits.pricePerStudent * 100, // store in paise
        minimumMonthly: limits.minMonthly * 100,        // store in paise
        features: PLAN_FEATURES[name] as any,
        isActive: true,
      },
      create: {
        name,
        description: desc,
        currency: 'inr',
        interval: 'monthly',
        pricePerStudent: limits.pricePerStudent * 100,
        minimumMonthly: limits.minMonthly * 100,
        features: PLAN_FEATURES[name] as any,
        isActive: true,
      },
    });
  }
}

/**
 * GET /api/subscription/plans
 * Returns available subscription plans for the school admin checkout UI.
 * Also returns the school's current subscription status.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const schoolId = session.user.schoolId;
  if (!schoolId && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No school context' }, { status: 403 });
  }

  await ensurePlansSeeded();

  const [plans, subscription] = await Promise.all([
    db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { pricePerStudent: 'asc' },
    }),
    schoolId
      ? db.enhancedSubscription.findFirst({
          where: { schoolId },
          orderBy: { createdAt: 'desc' },
          include: { plan: { select: { name: true } } },
        })
      : null,
  ]);

  // Merge DB plan records with code-level limits/features for the UI
  const enrichedPlans = plans.map(p => {
    const planName = p.name as PlanType;
    const limits = PLAN_LIMITS[planName];
    return {
      id: p.id,
      name: planName,
      description: p.description,
      pricePerStudent: limits.pricePerStudent,   // INR
      minMonthly: limits.minMonthly,             // INR
      storageGB: limits.storageGB,
      sms: limits.sms,
      whatsapp: limits.whatsapp,
      features: PLAN_FEATURES[planName],
      featureLabels: FEATURE_LABELS,
      interval: p.interval,
      annualDiscountMonths: p.annualDiscountMonths,
    };
  });

  return NextResponse.json({
    plans: enrichedPlans,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          planName: subscription.plan.name,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
  });
}
