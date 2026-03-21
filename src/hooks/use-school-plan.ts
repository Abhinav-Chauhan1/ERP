'use client'

import { useSession } from 'next-auth/react'
import {
  type PlanType,
  type FeatureKey,
  planHasFeature,
  PLAN_LIMITS,
} from '@/lib/config/plan-features'

export interface SchoolPlanInfo {
  plan: PlanType
  hasFeature: (feature: FeatureKey) => boolean
  limits: typeof PLAN_LIMITS[PlanType]
}

/**
 * Client-side hook to read the school plan from the session.
 * The session must include `schoolPlan` — set in the admin layout via server fetch.
 * Falls back to STARTER if not present.
 */
export function useSchoolPlan(): SchoolPlanInfo {
  const { data: session } = useSession()
  const plan = ((session?.user as any)?.schoolPlan ?? 'STARTER') as PlanType

  return {
    plan,
    hasFeature: (feature: FeatureKey) => planHasFeature(plan, feature),
    limits: PLAN_LIMITS[plan],
  }
}
