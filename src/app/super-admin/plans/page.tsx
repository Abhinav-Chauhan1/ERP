import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import { SubscriptionPlansManagement } from "@/components/super-admin/plans/subscription-plans-management";
import { db } from "@/lib/db";
import { PLAN_LIMITS, PLAN_FEATURES, calcMonthlyBill, type PlanType } from "@/lib/config/plan-features";

// ── Server-side plan summary cards ───────────────────────────────────────────

async function PlanSummaryCards() {
  const rawPlans = await db.subscriptionPlan.findMany({
    where: { isActive: true },
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Normalise to a stable shape — Prisma client may not reflect latest schema columns
  // so we read pricing from features JSON first, then top-level fields, then PLAN_LIMITS.
  const plans = rawPlans.map((p) => {
    const feat = (p.features ?? {}) as Record<string, unknown>;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      isActive: p.isActive,
      features: feat,
      // Prefer top-level DB columns (cast via unknown), fall back to features JSON
      pricePerStudent: ((p as unknown as Record<string, number>).pricePerStudent ?? feat.pricePerStudent ?? 0) as number,
      minimumMonthly:  ((p as unknown as Record<string, number>).minimumMonthly  ?? feat.minimumMonthly  ?? 0) as number,
      annualDiscountMonths: ((p as unknown as Record<string, number>).annualDiscountMonths ?? feat.annualDiscountMonths ?? 2) as number,
      _count: p._count,
    };
  });

  const FEATURE_LABELS: Record<string, string> = {
    library: "Library", transport: "Transport", admissions: "Admissions",
    bulk_messaging: "Bulk SMS", whatsapp: "WhatsApp", message_templates: "Msg Templates",
    payroll: "Payroll", budget: "Budget", finance_analytics: "Finance Analytics",
    advanced_reports: "Advanced Reports", id_cards: "ID Cards", certificates: "Certificates",
    hostel: "Hostel", alumni: "Alumni", audit_logs: "Audit Logs", lms: "LMS",
    study_tools: "Study Tools",
  };

  const PLAN_COLORS: Record<string, string> = {
    STARTER: "border-blue-500/30 bg-blue-500/5",
    GROWTH: "border-emerald-500/30 bg-emerald-500/5",
    DOMINATE: "border-purple-500/30 bg-purple-500/5",
  };

  const BADGE_COLORS: Record<string, string> = {
    STARTER: "bg-blue-600",
    GROWTH: "bg-emerald-600",
    DOMINATE: "bg-purple-600",
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No active plans found. Use the &quot;Seed default plans&quot; button below to create them.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const pps = plan.pricePerStudent > 0
          ? plan.pricePerStudent / 100
          : (PLAN_LIMITS[plan.name as PlanType]?.pricePerStudent ?? 4);
        const minMonthly = plan.minimumMonthly > 0
          ? plan.minimumMonthly / 100
          : (PLAN_LIMITS[plan.name as PlanType]?.minMonthly ?? 500);
        const features = PLAN_FEATURES[plan.name as PlanType] ?? [];
        const needsSeeding = plan.pricePerStudent === 0;
        const bill300 = calcMonthlyBill(plan.name as PlanType, 300);

        const featJson = plan.features;
        const storageGB = (featJson?.storageGB as number) ?? PLAN_LIMITS[plan.name as PlanType]?.storageGB ?? 1;
        const smsLimit = (featJson?.smsLimit as number) ?? PLAN_LIMITS[plan.name as PlanType]?.sms ?? 500;
        const waLimit = (featJson?.whatsappLimit as number) ?? PLAN_LIMITS[plan.name as PlanType]?.whatsapp ?? 0;

        return (
          <div
            key={plan.id}
            className={`relative border rounded-xl p-6 space-y-4 ${PLAN_COLORS[plan.name] ?? "border-gray-700 bg-gray-800/30"}`}
          >
            {plan.name === "GROWTH" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            {needsSeeding && (
              <div className="absolute -top-3 right-4">
                <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  Needs seeding
                </span>
              </div>
            )}

            <div className="space-y-1">
              <span className={`inline-block text-white text-xs font-bold px-2 py-0.5 rounded ${BADGE_COLORS[plan.name] ?? "bg-gray-600"}`}>
                {plan.name}
              </span>
              <h3 className="text-xl font-bold text-white capitalize">{plan.name.toLowerCase()}</h3>
              {plan.description && (
                <p className="text-sm text-gray-400">{plan.description}</p>
              )}
            </div>

            <div>
              <div className="text-3xl font-bold text-white">
                ₹{pps.toFixed(0)}
                <span className="text-base font-normal text-gray-400"> /student/month</span>
              </div>
              <div className="text-sm text-gray-400">Min ₹{minMonthly.toLocaleString("en-IN")}/month</div>
            </div>

            <div className="bg-black/20 rounded-lg p-3 text-sm space-y-1">
              <div className="text-gray-400 text-xs">Example: 300 students</div>
              <div className="text-white font-medium">
                Monthly: ₹{bill300.toLocaleString("en-IN")}
              </div>
              <div className="text-emerald-400 text-xs">
                Annual: ₹{(bill300 * 10).toLocaleString("en-IN")} (2 months free)
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="text-gray-300">✓ {storageGB} GB storage</div>
              <div className="text-gray-300">
                ✓ {smsLimit === -1 ? "Unlimited" : smsLimit} SMS/month
              </div>
              <div className={waLimit > 0 ? "text-gray-300" : "text-gray-600"}>
                {waLimit > 0
                  ? `✓ ${waLimit === -1 ? "Unlimited" : waLimit} WhatsApp/month`
                  : "✗ WhatsApp (Growth+)"}
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 space-y-1 text-xs">
              {features.slice(0, 5).map((f) => (
                <div key={f} className="text-emerald-400">✓ {FEATURE_LABELS[f] ?? f}</div>
              ))}
              {features.length > 5 && (
                <div className="text-gray-500">+{features.length - 5} more features</div>
              )}
            </div>

            <div className="text-xs text-gray-500 pt-1">
              {plan._count.subscriptions} active school{plan._count.subscriptions !== 1 ? "s" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PlansManagementPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="h-6 w-6 text-red-500" />
          Subscription Plans
        </h1>
        <p className="text-gray-400 mt-1">Per-student pricing — bill scales with school size</p>
      </div>

      {/* Live plan cards */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle className="text-white">Current Plans</CardTitle>
          <CardDescription className="text-gray-400">
            Active pricing tiers shown to schools during signup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}
            </div>
          }>
            <PlanSummaryCards />
          </Suspense>
        </CardContent>
      </Card>

      {/* Management table + editor */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle className="text-white">Plan Management</CardTitle>
          <CardDescription className="text-gray-400">
            Edit pricing, limits, and features. Use &quot;Seed default plans&quot; to populate initial data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <SubscriptionPlansManagement />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
