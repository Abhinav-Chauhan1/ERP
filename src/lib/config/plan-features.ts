export type PlanType = 'STARTER' | 'GROWTH' | 'DOMINATE'

export const PLAN_RANK: Record<PlanType, number> = {
  STARTER: 1,
  GROWTH: 2,
  DOMINATE: 3,
}

export type FeatureKey =
  | 'library'
  | 'transport'
  | 'admissions'
  | 'bulk_messaging'
  | 'whatsapp'
  | 'message_templates'
  | 'payroll'
  | 'budget'
  | 'finance_analytics'
  | 'advanced_reports'
  | 'id_cards'
  | 'certificates'
  | 'hostel'
  | 'alumni'
  | 'audit_logs'
  | 'lms'

export const PLAN_FEATURES: Record<PlanType, FeatureKey[]> = {
  STARTER: [],
  GROWTH: [
    'library',
    'transport',
    'admissions',
    'bulk_messaging',
    'whatsapp',
    'message_templates',
    'payroll',
    'budget',
    'finance_analytics',
    'advanced_reports',
    'id_cards',
    'certificates',
  ],
  DOMINATE: [
    'library',
    'transport',
    'admissions',
    'bulk_messaging',
    'whatsapp',
    'message_templates',
    'payroll',
    'budget',
    'finance_analytics',
    'advanced_reports',
    'id_cards',
    'certificates',
    'hostel',
    'alumni',
    'audit_logs',
    'lms',
  ],
}

export const PLAN_LIMITS: Record<PlanType, {
  storageGB: number
  sms: number        // -1 = unlimited
  whatsapp: number   // -1 = unlimited
  minMonthly: number // in INR
  pricePerStudent: number // in INR
}> = {
  STARTER:  { storageGB: 1,  sms: 500,  whatsapp: 0,    minMonthly: 500,  pricePerStudent: 4 },
  GROWTH:   { storageGB: 5,  sms: 2000, whatsapp: 1000, minMonthly: 1000, pricePerStudent: 6 },
  DOMINATE: { storageGB: 20, sms: -1,   whatsapp: 5000, minMonthly: 2500, pricePerStudent: 9 },
}

export function planHasFeature(plan: PlanType, feature: FeatureKey): boolean {
  return PLAN_FEATURES[plan].includes(feature)
}

export function planAllows(schoolPlan: PlanType, requiredPlan: PlanType): boolean {
  return PLAN_RANK[schoolPlan] >= PLAN_RANK[requiredPlan]
}

export function calcMonthlyBill(plan: PlanType, studentCount: number): number {
  const limits = PLAN_LIMITS[plan]
  return Math.max(studentCount * limits.pricePerStudent, limits.minMonthly)
}

export const UPGRADE_NUDGE: Partial<Record<PlanType, {
  missing: string
  upgradesTo: PlanType
}>> = {
  STARTER: {
    missing: 'Library, Transport, WhatsApp & more',
    upgradesTo: 'GROWTH',
  },
  GROWTH: {
    missing: 'Hostel, Alumni & full access',
    upgradesTo: 'DOMINATE',
  },
}
