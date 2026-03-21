import { db } from '@/lib/db'
import { PLAN_LIMITS, PlanType } from '@/lib/config/plan-features'

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Syncs UsageCounter limits for a school to match their current plan.
 * Call this on:
 *   - School creation
 *   - Plan upgrade / downgrade
 *   - Monthly cron (to ensure new month rows have correct limits)
 *
 * sms/whatsapp = -1 means unlimited — store as-is.
 * Any limit-check code must guard: if (limit !== -1 && used >= limit) { block }
 */
export async function syncUsageCounterLimits(
  schoolId: string,
  plan: PlanType,
  month?: string
): Promise<void> {
  const targetMonth = month ?? getCurrentMonth()
  const limits = PLAN_LIMITS[plan]

  await db.usageCounter.upsert({
    where: {
      schoolId_month: { schoolId, month: targetMonth },
    },
    update: {
      whatsappLimit: limits.whatsapp,   // -1 = unlimited
      smsLimit: limits.sms,             // -1 = unlimited
      storageLimitMB: limits.storageGB * 1024,
    },
    create: {
      schoolId,
      month: targetMonth,
      whatsappUsed: 0,
      smsUsed: 0,
      storageUsedMB: 0,
      whatsappLimit: limits.whatsapp,
      smsLimit: limits.sms,
      storageLimitMB: limits.storageGB * 1024,
    },
  })
}
