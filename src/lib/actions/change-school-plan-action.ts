"use server";

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { runWithTenantContext } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";
import { type PlanType } from "@/lib/config/plan-features";

export async function changeSchoolPlan(
  schoolId: string,
  newPlan: PlanType
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdminAccess();

    // Find the target subscription plan record
    const planRecord = await db.subscriptionPlan.findFirst({
      where: { name: newPlan, isActive: true },
    });

    if (!planRecord) {
      return { success: false, error: `Plan "${newPlan}" not found. Seed default plans first.` };
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Update school.plan field (School has no schoolId field — not RLS-gated)
    await db.school.update({
      where: { id: schoolId },
      data: { plan: newPlan },
    });

    // EnhancedSubscription has schoolId and is RLS-gated; scope explicitly as super-admin
    await runWithTenantContext({ schoolId, isSuperAdmin: true }, async () => {
      await (db.enhancedSubscription as any).updateMany({
        where: { schoolId, status: "ACTIVE" },
        data: { status: "CANCELED", cancelAtPeriodEnd: false },
      });

      await (db.enhancedSubscription as any).create({
        data: {
          schoolId,
          planId: planRecord.id,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });
    });

    revalidatePath(`/super-admin/schools/${schoolId}/subscription`);
    return { success: true };
  } catch (err) {
    console.error("[changeSchoolPlan]", err);
    return { success: false, error: "Failed to change plan. Please try again." };
  }
}
