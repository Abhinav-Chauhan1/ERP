import { cache } from 'react'
import { db } from '@/lib/db'
import {
  type PlanType,
  type FeatureKey,
  planHasFeature,
  PLAN_LIMITS,
} from '@/lib/config/plan-features'

export const getSchoolPlan = cache(async (schoolId: string) => {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { plan: true },
  })

  const plan = (school?.plan ?? 'STARTER') as PlanType

  return {
    plan,
    hasFeature: (feature: FeatureKey) => planHasFeature(plan, feature),
    limits: PLAN_LIMITS[plan],
  }
})
