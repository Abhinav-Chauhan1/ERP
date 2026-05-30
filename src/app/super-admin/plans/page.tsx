import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionPlansManagement } from "@/components/super-admin/plans/subscription-plans-management";
import { db } from "@/lib/db";
import { PLAN_LIMITS, PLAN_FEATURES, FEATURE_LABELS, calcMonthlyBill, type PlanType } from "@/lib/config/plan-features";
import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PLAN_ACCENT: Record<string, { border: string; badge: string; label: string }> = {
    STARTER: { border: "border-blue-200", badge: "bg-blue-600", label: "Starter" },
    GROWTH: { border: "border-emerald-200", badge: "bg-emerald-600", label: "Growth" },
    DOMINATE: { border: "border-violet-200", badge: "bg-violet-600", label: "Dominate" },
};

async function PlanCards() {
    let rawPlans: Array<Record<string, unknown>> = [];
    try {
        rawPlans = await (db.subscriptionPlan.findMany as Function)({
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
        });
    } catch {
        return (
            <p className="text-sm text-amber-600 text-center py-6">
                Could not load plans. Run <code className="bg-gray-100 px-1 rounded">prisma generate</code> and redeploy,
                or use &quot;Seed default plans&quot; below.
            </p>
        );
    }

    if (rawPlans.length === 0) {
        return (
            <p className="text-sm text-gray-400 text-center py-6">
                No active plans. Use &quot;Seed default plans&quot; below to create them.
            </p>
        );
    }

    const plans = rawPlans.map((p) => {
        const feat = (p.features ?? {}) as Record<string, unknown>;
        return {
            id: p.id as string,
            name: p.name as string,
            description: p.description as string | null,
            features: feat,
            pricePerStudent: typeof p.pricePerStudent === "number" ? p.pricePerStudent : (feat.pricePerStudent as number) ?? 0,
            minimumMonthly: typeof p.minimumMonthly === "number" ? p.minimumMonthly : (feat.minimumMonthly as number) ?? 0,
        };
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
                const accent = PLAN_ACCENT[plan.name] ?? { border: "border-gray-200", badge: "bg-gray-500", label: plan.name };
                const pps = plan.pricePerStudent > 0
                    ? plan.pricePerStudent / 100
                    : (PLAN_LIMITS[plan.name as PlanType]?.pricePerStudent ?? 4);
                const minMonthly = plan.minimumMonthly > 0
                    ? plan.minimumMonthly / 100
                    : (PLAN_LIMITS[plan.name as PlanType]?.minMonthly ?? 500);
                const features = PLAN_FEATURES[plan.name as PlanType] ?? [];
                const validPlanType = (["STARTER", "GROWTH", "DOMINATE"] as string[]).includes(plan.name);
                const bill300 = validPlanType ? calcMonthlyBill(plan.name as PlanType, 300) : Math.max(300 * pps, minMonthly);
                const feat = plan.features;
                const storageGB = (feat?.storageGB as number) ?? PLAN_LIMITS[plan.name as PlanType]?.storageGB ?? 1;
                const smsLimit = (feat?.smsLimit as number) ?? PLAN_LIMITS[plan.name as PlanType]?.sms ?? 500;
                const waLimit = (feat?.whatsappLimit as number) ?? PLAN_LIMITS[plan.name as PlanType]?.whatsapp ?? 0;

                return (
                    <div key={plan.id} className={`relative bg-white border-2 ${accent.border} rounded-xl p-5 space-y-4`}>
                        {plan.name === "GROWTH" && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-emerald-600 text-white text-[11px] font-semibold px-3 py-0.5 rounded-full">
                                    Most Popular
                                </span>
                            </div>
                        )}

                        <div>
                            <span className={`inline-block text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full ${accent.badge}`}>
                                {accent.label}
                            </span>
                            {plan.description && (
                                <p className="text-xs text-gray-500 mt-1.5">{plan.description}</p>
                            )}
                        </div>

                        <div>
                            <div className="text-2xl font-bold text-gray-900">
                                ₹{pps.toFixed(0)}
                                <span className="text-sm font-normal text-gray-400"> /student/mo</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">Min ₹{minMonthly.toLocaleString("en-IN")}/month</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <div className="text-xs text-gray-400 mb-1">Example: 300 students</div>
                            <div className="font-semibold text-gray-900">₹{bill300.toLocaleString("en-IN")}/mo</div>
                            <div className="text-xs text-emerald-600 mt-0.5">
                                ₹{(bill300 * 10).toLocaleString("en-IN")}/yr (2 months free)
                            </div>
                        </div>

                        <ul className="space-y-1.5 text-sm">
                            <li className="flex items-center gap-2 text-gray-700">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                {storageGB} GB storage
                            </li>
                            <li className="flex items-center gap-2 text-gray-700">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                {smsLimit === -1 ? "Unlimited" : smsLimit} SMS/month
                            </li>
                            <li className={`flex items-center gap-2 ${waLimit > 0 ? "text-gray-700" : "text-gray-400"}`}>
                                {waLimit > 0
                                    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                    : <XCircle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
                                {waLimit > 0 ? `${waLimit === -1 ? "Unlimited" : waLimit} WhatsApp/mo` : "WhatsApp (Growth+)"}
                            </li>
                            {features.slice(0, 4).map((f) => (
                                <li key={f} className="flex items-center gap-2 text-gray-700">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                    {FEATURE_LABELS[f] ?? f}
                                </li>
                            ))}
                            {features.length > 4 && (
                                <li className="text-xs text-gray-400 pl-5">+{features.length - 4} more features</li>
                            )}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}

export default async function PlansPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Plans</h1>
                <p className="text-sm text-gray-500 mt-0.5">Subscription tiers with per-student pricing</p>
            </div>

            {/* Plan cards */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-700">Active Plans</h2>
                    <p className="text-xs text-gray-400">Pricing tiers available to schools during signup</p>
                </div>
                <Suspense fallback={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}
                    </div>
                }>
                    <PlanCards />
                </Suspense>
            </div>

            {/* Plan management */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-700">Plan Management</h2>
                    <p className="text-xs text-gray-400">Edit pricing and limits. Use &quot;Seed default plans&quot; to populate initial data.</p>
                </div>
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                    <SubscriptionPlansManagement />
                </Suspense>
            </div>
        </div>
    );
}
