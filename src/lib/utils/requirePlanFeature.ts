import { db } from "@/lib/db";
import { planHasFeature, type FeatureKey, type PlanType } from "@/lib/config/plan-features";

// Cache plan lookups within the same request to avoid redundant DB hits
const planCache = new Map<string, PlanType>();

export async function requirePlanFeature(schoolId: string, feature: FeatureKey): Promise<void> {
  if (!schoolId) {
    throw new Error("School context required to check plan features.");
  }

  let plan = planCache.get(schoolId);

  if (!plan) {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { plan: true },
    });

    if (!school) {
      throw new Error("School not found.");
    }

    plan = school.plan as PlanType;
    planCache.set(schoolId, plan);
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
