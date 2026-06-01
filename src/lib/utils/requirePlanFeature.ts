import { cache } from "react";
import { db } from "@/lib/db";
import { planHasFeature, type FeatureKey, type PlanType } from "@/lib/config/plan-features";

// Request-scoped cache — safe in server components and API routes
const getSchoolPlanCached = cache(async (schoolId: string): Promise<PlanType | null> => {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { plan: true },
  });
  return school ? (school.plan as PlanType) : null;
});

export async function requirePlanFeature(schoolId: string, feature: FeatureKey): Promise<void> {
  if (!schoolId) {
    throw new Error("School context required to check plan features.");
  }

  const plan = await getSchoolPlanCached(schoolId);

  if (!plan) {
    throw new Error("School not found.");
  }

  if (!planHasFeature(plan, feature)) {
    const err = new Error("This feature is not available on your current plan.");
    (err as any).code = "PLAN_FEATURE_RESTRICTED";
    (err as any).status = 403;
    throw err;
  }

  // STARTER is the free tier — no subscription required
  if (plan === 'STARTER') return;

  // For paid plans, verify there is an active, non-expired subscription
  const subscription = await db.enhancedSubscription.findFirst({
    where: { schoolId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    select: { currentPeriodEnd: true },
  });

  if (!subscription || subscription.currentPeriodEnd < new Date()) {
    const err = new Error("Subscription expired or inactive.");
    (err as any).code = "PLAN_FEATURE_RESTRICTED";
    (err as any).status = 403;
    throw err;
  }
}
