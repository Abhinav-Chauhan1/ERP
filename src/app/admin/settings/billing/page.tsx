export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSchoolPlan } from "@/lib/server/get-school-plan";
import {
  calcMonthlyBill,
  PLAN_FEATURES,
  PLAN_LIMITS,
  FEATURE_LABELS,
  UPGRADE_NUDGE,
  type PlanType,
  type FeatureKey,
} from "@/lib/config/plan-features";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, ArrowUpRight, CreditCard, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { CancelSubscriptionButton } from "@/components/admin/settings/cancel-subscription-button";


// ── Plan pill colours ─────────────────────────────────────────────────────────
const PLAN_BADGE_CLASS: Record<PlanType, string> = {
  STARTER:  "bg-emerald-100 text-emerald-800",
  GROWTH:   "bg-violet-100 text-violet-800",
  DOMINATE: "bg-amber-100 text-amber-800",
};

// ── Which plan first unlocks a feature ───────────────────────────────────────
function firstPlanWithFeature(feature: FeatureKey): PlanType | null {
  const order: PlanType[] = ["STARTER", "GROWTH", "DOMINATE"];
  for (const p of order) {
    if (PLAN_FEATURES[p].includes(feature)) return p;
  }
  return null;
}

// ── Usage bar ─────────────────────────────────────────────────────────────────
function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  if (limit === 0) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">Not available on this plan</span>
      </div>
    );
  }
  if (limit === -1) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{used.toLocaleString()} / Unlimited</span>
      </div>
    );
  }
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{used.toLocaleString()} / {limit.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.schoolId) redirect("/login");

  const schoolId = session.user.schoolId;

  // ── Fetch school + student count ──────────────────────────────────────────
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      plan: true,
      createdAt: true,
      _count: { select: { students: true } },
    },
  });

  if (!school) redirect("/admin");

  const { plan, limits } = await getSchoolPlan(schoolId);
  const studentCount = school._count.students;
  const monthlyBill = calcMonthlyBill(plan, studentCount);
  const annualBill = monthlyBill * 10;
  const annualSaving = monthlyBill * 2;

  // ── Usage this month ──────────────────────────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = await db.usageCounter.findUnique({
    where: { schoolId_month: { schoolId, month: currentMonth } },
  });

  const storageUsedMB = usage?.storageUsedMB ?? 0;
  const storageLimitMB = usage?.storageLimitMB ?? limits.storageGB * 1024;
  const smsUsed = usage?.smsUsed ?? 0;
  const whatsappUsed = usage?.whatsappUsed ?? 0;

  // ── Features ──────────────────────────────────────────────────────────────
  const allFeatures = Object.keys(FEATURE_LABELS) as FeatureKey[];
  const included = allFeatures.filter(f => PLAN_FEATURES[plan].includes(f));
  const locked   = allFeatures.filter(f => !PLAN_FEATURES[plan].includes(f));

  // ── Upgrade nudge ─────────────────────────────────────────────────────────
  const nudge = UPGRADE_NUDGE[plan];

  // ── Subscription history ──────────────────────────────────────────────────
  const subscription = await db.enhancedSubscription.findFirst({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      plan: { select: { name: true, pricePerStudent: true } },
      invoices: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing &amp; Plan</h1>
        <p className="text-muted-foreground mt-1">
          View your current plan, usage, and billing estimates.
        </p>
      </div>

      {/* ── Section 1: Current plan ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${PLAN_BADGE_CLASS[plan]}`}>
                {plan}
              </span>
              {subscription && (
                <Badge variant="outline" className={
                  subscription.status === "ACTIVE"    ? "text-emerald-700 border-emerald-300" :
                  subscription.status === "PAST_DUE"  ? "text-amber-700 border-amber-300" :
                  subscription.status === "INCOMPLETE" ? "text-slate-600 border-slate-300" :
                  "text-red-700 border-red-300"
                }>
                  {subscription.status === "ACTIVE" ? "✓ Active" : subscription.status}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Since {school.createdAt.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
            </div>
            <Link href="/admin/settings/plan">
              <Button size="sm" className="gap-1.5">
                <CreditCard className="h-4 w-4" />
                {subscription?.status === "ACTIVE" ? "Manage Plan" : "Subscribe / Upgrade"}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="text-xl font-bold">{studentCount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Monthly estimate</p>
              <p className="text-xl font-bold">₹{monthlyBill.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Annual estimate</p>
              <p className="text-xl font-bold">₹{annualBill.toLocaleString()}</p>
              <p className="text-xs text-emerald-600">Save ₹{annualSaving.toLocaleString()} (2 months free)</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pricing</p>
              <p className="text-sm font-semibold">₹{limits.pricePerStudent}/student/mo</p>
              <p className="text-xs text-muted-foreground">Min ₹{limits.minMonthly.toLocaleString()}/mo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Expiry / renewal warning ── */}
      {subscription?.status === "ACTIVE" && (() => {
        const daysLeft = Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / 86400000);
        if (daysLeft > 14) return null;
        return (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 flex flex-wrap items-center justify-between gap-3">
              <span>
                Your subscription expires on{" "}
                <strong>{subscription.currentPeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>
                {daysLeft <= 3 ? " — access will be restricted soon." : "."}
                {" "}Renew now to avoid interruption.
              </span>
              <Link
                href="/admin/settings/plan"
                className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
              >
                Renew Now <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </AlertDescription>
          </Alert>
        );
      })()}

      {/* ── Section 2: Usage this month ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage — {currentMonth}</CardTitle>
          <CardDescription>Resets at the start of each month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar
            label="Storage"
            used={Math.round(storageUsedMB)}
            limit={storageLimitMB}
          />
          <UsageBar
            label="SMS"
            used={smsUsed}
            limit={limits.sms}
          />
          <UsageBar
            label="WhatsApp"
            used={whatsappUsed}
            limit={limits.whatsapp}
          />
        </CardContent>
      </Card>

      {/* ── Section 3: Features ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Features on {plan}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {included.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{FEATURE_LABELS[f]}</span>
              </div>
            ))}
            {locked.map(f => {
              const unlockedBy = firstPlanWithFeature(f);
              return (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>{FEATURE_LABELS[f]}</span>
                  {unlockedBy && (
                    <span className={`ml-auto text-xs rounded-full px-2 py-0.5 ${PLAN_BADGE_CLASS[unlockedBy]}`}>
                      {unlockedBy}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Upgrade nudge ── */}
      {nudge && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-violet-900">
                  Upgrade to {nudge.upgradesTo}
                </p>
                <p className="text-sm text-violet-700 mt-0.5">
                  Unlock: {nudge.missing}
                </p>
                <p className="text-sm text-violet-700 mt-0.5">
                  ₹{PLAN_LIMITS[nudge.upgradesTo].pricePerStudent}/student/mo — Min ₹{PLAN_LIMITS[nudge.upgradesTo].minMonthly.toLocaleString()}/mo
                </p>
              </div>
              <Link
                href="/admin/settings/plan"
                className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors whitespace-nowrap"
              >
                Upgrade Now
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 5: Subscription history ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription History</CardTitle>
        </CardHeader>
        <CardContent>
          {!subscription ? (
            <p className="text-sm text-muted-foreground">
              No subscription record yet — billing will be set up when you process your first payment.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-medium">{subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline">{subscription.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Current period</p>
                  <p className="font-medium">
                    {subscription.currentPeriodStart.toLocaleDateString("en-IN")} –{" "}
                    {subscription.currentPeriodEnd.toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {subscription.status === "ACTIVE" && !subscription.cancelAtPeriodEnd && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">
                    Renews on{" "}
                    {subscription.currentPeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <CancelSubscriptionButton periodEnd={subscription.currentPeriodEnd.toISOString()} />
                </div>
              )}
              {subscription.cancelAtPeriodEnd && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  Cancels on{" "}
                  <strong>
                    {subscription.currentPeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </strong>
                  . You can re-subscribe anytime.
                </p>
              )}

              {subscription.invoices.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recent invoices</p>
                  <div className="divide-y rounded-md border text-sm">
                    {subscription.invoices.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between px-3 py-2">
                        <span className="text-muted-foreground">
                          {inv.createdAt.toLocaleDateString("en-IN")}
                        </span>
                        <span className="font-medium">
                          ₹{inv.amount.toLocaleString()}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            inv.status === "PAID"
                              ? "border-emerald-300 text-emerald-700"
                              : inv.status === "OPEN" || inv.status === "DRAFT"
                              ? "border-amber-300 text-amber-700"
                              : "border-red-300 text-red-700"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
