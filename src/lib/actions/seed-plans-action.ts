"use server";

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { PLAN_FEATURES } from "@/lib/config/plan-features";

const DEFAULT_PLANS = [
  {
    name:                "STARTER",
    description:         "For small schools getting started",
    pricePerStudent:     400,    // paise = ₹4
    minimumMonthly:      50000,  // paise = ₹500
    annualDiscountMonths: 2,
    features: {
      pricePerStudent:      400,
      minimumMonthly:       50000,
      annualDiscountMonths: 2,
      storageGB:            1,
      smsLimit:             500,
      whatsappLimit:        0,
      includedFeatures:     [...PLAN_FEATURES.STARTER],
      support: { email: true, phone: false, priority: false, dedicated: false },
    },
  },
  {
    name:                "GROWTH",
    description:         "For growing schools that need more features",
    pricePerStudent:     600,    // paise = ₹6
    minimumMonthly:      100000, // paise = ₹1,000
    annualDiscountMonths: 2,
    features: {
      pricePerStudent:      600,
      minimumMonthly:       100000,
      annualDiscountMonths: 2,
      storageGB:            5,
      smsLimit:             2000,
      whatsappLimit:        1000,
      includedFeatures:     [...PLAN_FEATURES.GROWTH],
      support: { email: true, phone: true, priority: false, dedicated: false },
    },
  },
  {
    name:                "DOMINATE",
    description:         "Full access for large institutions",
    pricePerStudent:     900,    // paise = ₹9
    minimumMonthly:      250000, // paise = ₹2,500
    annualDiscountMonths: 2,
    features: {
      pricePerStudent:      900,
      minimumMonthly:       250000,
      annualDiscountMonths: 2,
      storageGB:            20,
      smsLimit:             -1,
      whatsappLimit:        5000,
      includedFeatures:     [...PLAN_FEATURES.DOMINATE],
      support: { email: true, phone: true, priority: true, dedicated: true },
    },
  },
] as const;

export async function seedDefaultPlans(): Promise<{ success: boolean; message: string; upserted: string[] }> {
  await requireSuperAdminAccess();

  const upserted: string[] = [];

  for (const plan of DEFAULT_PLANS) {
    const existing = await db.subscriptionPlan.findFirst({ where: { name: plan.name } });

    if (existing) {
      await db.subscriptionPlan.update({
        where: { id: existing.id },
        data: {
          description:         plan.description,
          pricePerStudent:     plan.pricePerStudent,
          minimumMonthly:      plan.minimumMonthly,
          annualDiscountMonths: plan.annualDiscountMonths,
          features:            plan.features,
          amount:              plan.minimumMonthly, // keep deprecated field in sync
          isActive:            true,
        },
      });
      upserted.push(`Updated ${plan.name}`);
    } else {
      await db.subscriptionPlan.create({
        data: {
          name:                plan.name,
          description:         plan.description,
          pricePerStudent:     plan.pricePerStudent,
          minimumMonthly:      plan.minimumMonthly,
          annualDiscountMonths: plan.annualDiscountMonths,
          features:            plan.features,
          amount:              plan.minimumMonthly,
          currency:            "inr",
          interval:            "monthly",
          isActive:            true,
        },
      });
      upserted.push(`Created ${plan.name}`);
    }
  }

  return { success: true, message: "Default plans seeded successfully", upserted };
}
