"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2, Lock, Zap, Star, Crown,
  Users, AlertCircle, Loader2, ArrowRight, RefreshCw
} from "lucide-react";
import { FEATURE_LABELS, type FeatureKey } from "@/lib/config/plan-features";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: "STARTER" | "GROWTH" | "DOMINATE";
  description: string | null;
  pricePerStudent: number; // INR
  minMonthly: number;      // INR
  storageGB: number;
  sms: number;
  whatsapp: number;
  features: string[];
  interval: string;
  annualDiscountMonths: number;
}

interface Subscription {
  id: string;
  status: string;
  planName: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface PlansData {
  plans: Plan[];
  subscription: Subscription | null;
  studentCount: number;
}

// ── Plan metadata ─────────────────────────────────────────────────────────────
const PLAN_META = {
  STARTER:  { icon: Zap,   color: "emerald", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", btnClass: "bg-emerald-600 hover:bg-emerald-700" },
  GROWTH:   { icon: Star,  color: "violet",  badge: "bg-violet-100 text-violet-800 border-violet-200",   btnClass: "bg-violet-600 hover:bg-violet-700"   },
  DOMINATE: { icon: Crown, color: "amber",   badge: "bg-amber-100 text-amber-800 border-amber-200",      btnClass: "bg-amber-600 hover:bg-amber-700"     },
} as const;

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    "text-emerald-700 bg-emerald-50 border-emerald-200",
  PAST_DUE:  "text-amber-700 bg-amber-50 border-amber-200",
  INCOMPLETE:"text-slate-600 bg-slate-50 border-slate-200",
  TRIALING:  "text-blue-700 bg-blue-50 border-blue-200",
  CANCELED:  "text-red-700 bg-red-50 border-red-200",
};

function calcBill(plan: Plan, students: number) {
  return Math.max(students * plan.pricePerStudent, plan.minMonthly);
}

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  studentCount,
  currentPlanName,
  subscriptionStatus,
  onSelect,
  loading,
}: {
  plan: Plan;
  studentCount: number;
  currentPlanName: string;
  subscriptionStatus: string | null;
  onSelect: (plan: Plan) => void;
  loading: boolean;
}) {
  const meta = PLAN_META[plan.name];
  const Icon = meta.icon;
  const monthlyBill = calcBill(plan, studentCount);
  const annualBill = monthlyBill * 10;
  const isCurrentActive = plan.name === currentPlanName && subscriptionStatus === "ACTIVE";
  const isCurrent = plan.name === currentPlanName;
  const allFeatures = Object.keys(FEATURE_LABELS) as FeatureKey[];
  const included = allFeatures.filter(f => plan.features.includes(f));
  const locked = allFeatures.filter(f => !plan.features.includes(f));

  const planOrder = { STARTER: 1, GROWTH: 2, DOMINATE: 3 };
  const currentOrder = planOrder[currentPlanName as keyof typeof planOrder] || 0;
  const thisOrder = planOrder[plan.name];
  const buttonLabel = isCurrentActive ? "Current Plan" :
    !subscriptionStatus || subscriptionStatus === "CANCELED" ? "Subscribe" :
    thisOrder > currentOrder ? "Upgrade" : "Switch";

  return (
    <Card className={`relative flex flex-col ${plan.name === "GROWTH" ? "ring-2 ring-violet-500 shadow-md" : ""}`}>
      {plan.name === "GROWTH" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`p-1.5 rounded-md bg-${meta.color}-100`}>
            <Icon className={`h-4 w-4 text-${meta.color}-600`} />
          </div>
          <CardTitle className="text-base">{plan.name}</CardTitle>
          {isCurrent && (
            <Badge variant="outline" className={`text-xs ml-auto ${STATUS_COLOR[subscriptionStatus || "INCOMPLETE"]}`}>
              {subscriptionStatus === "ACTIVE" ? "Active" : subscriptionStatus || "Inactive"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 space-y-4">
        {/* Pricing */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">₹{plan.pricePerStudent}</span>
            <span className="text-sm text-muted-foreground">/student/mo</span>
          </div>
          <p className="text-xs text-muted-foreground">Min ₹{plan.minMonthly.toLocaleString()}/mo</p>
          <div className="pt-1 border-t border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your bill ({studentCount} students)</span>
              <span className="font-semibold">₹{monthlyBill.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>Annual (10 months)</span>
              <span className="text-emerald-600 font-medium">₹{annualBill.toLocaleString()}/yr</span>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Storage</span><span className="font-medium text-foreground">{plan.storageGB} GB</span></div>
          <div className="flex justify-between"><span>SMS/month</span><span className="font-medium text-foreground">{plan.sms === -1 ? "Unlimited" : plan.sms.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>WhatsApp/month</span><span className="font-medium text-foreground">{plan.whatsapp === 0 ? "Not included" : plan.whatsapp === -1 ? "Unlimited" : plan.whatsapp.toLocaleString()}</span></div>
        </div>

        {/* Features */}
        <div className="flex-1 space-y-1">
          {included.map(f => (
            <div key={f} className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className={`h-3.5 w-3.5 text-${meta.color}-500 shrink-0`} />
              <span>{FEATURE_LABELS[f as FeatureKey]}</span>
            </div>
          ))}
          {locked.map(f => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>{FEATURE_LABELS[f as FeatureKey]}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          className={`w-full text-white ${isCurrentActive ? "opacity-60 cursor-not-allowed" : meta.btnClass}`}
          disabled={isCurrentActive || loading}
          onClick={() => !isCurrentActive && onSelect(plan)}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PlanPage() {
  const router = useRouter();
  const [data, setData] = useState<PlansData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, schoolRes] = await Promise.all([
        fetch("/api/subscription/plans"),
        fetch("/api/school/current"),
      ]);

      if (!plansRes.ok) throw new Error("Failed to load plans");
      const plansData = await plansRes.json();

      let studentCount = 1;
      if (schoolRes.ok) {
        const schoolData = await schoolRes.json();
        studentCount = schoolData.studentCount ?? 1;
      }

      setData({ ...plansData, studentCount });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleSelectPlan = async (plan: Plan) => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);

    try {
      const orderRes = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          studentCount: data?.studentCount ?? 1,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to create checkout");
      }

      const { paymentSessionId } = orderData.data;

      // Launch Cashfree checkout — it will redirect to returnUrl on completion
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({
        mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV as "sandbox" | "production") || "sandbox",
      });
      cashfree.checkout({ paymentSessionId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed. Please try again.");
      setCheckoutLoading(false);
    }
    // Don't reset checkoutLoading — user is being redirected to Cashfree
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[520px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="ghost" size="sm" onClick={fetchPlans} className="ml-2">
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const { plans, subscription, studentCount } = data;
  const currentPlanName = subscription?.planName || "STARTER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Choose a Plan</h1>
          <p className="text-muted-foreground mt-1">
            Select or upgrade your SikshaMitra subscription.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Students:</span>
          <span className="font-semibold">{studentCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Subscription status banner */}
      {subscription && subscription.status !== "ACTIVE" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your <strong>{subscription.planName}</strong> subscription is{" "}
            <strong className="capitalize">{subscription.status.toLowerCase()}</strong>.
            {subscription.status === "PAST_DUE" && " Please renew to restore access to premium features."}
            {subscription.status === "INCOMPLETE" && " Complete your payment to activate your plan."}
          </AlertDescription>
        </Alert>
      )}

      {/* Checkout loading overlay message */}
      {checkoutLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Redirecting to secure payment gateway... please wait.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-4">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            studentCount={studentCount}
            currentPlanName={currentPlanName}
            subscriptionStatus={subscription?.planName === plan.name ? subscription.status : null}
            onSelect={handleSelectPlan}
            loading={checkoutLoading}
          />
        ))}
      </div>

      {/* Billing note */}
      <p className="text-xs text-muted-foreground text-center">
        Billed monthly in advance. Annual plan = 10 months billed (2 months free).
        Student count is taken at the time of payment.
        Need help?{" "}
        <a href="mailto:support@sikshamitra.in" className="underline">Contact support</a>
      </p>
    </div>
  );
}
