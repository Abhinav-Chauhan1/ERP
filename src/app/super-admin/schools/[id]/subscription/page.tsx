import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, CreditCard, Calendar, AlertCircle, CheckCircle, Clock, Layers } from "lucide-react";
import { PLAN_LIMITS, PLAN_FEATURES, calcMonthlyBill, type PlanType } from "@/lib/config/plan-features";
import { ChangePlanDialog } from "@/components/super-admin/schools/change-plan-dialog";

const FEATURE_LABELS: Record<string, string> = {
  library: "Library", transport: "Transport", admissions: "Admissions Portal",
  bulk_messaging: "Bulk Messaging", whatsapp: "WhatsApp", message_templates: "Message Templates",
  payroll: "Payroll", budget: "Budget", finance_analytics: "Finance Analytics",
  advanced_reports: "Advanced Reports", id_cards: "ID Cards", certificates: "Certificates",
  hostel: "Hostel", alumni: "Alumni", audit_logs: "Audit Logs", lms: "LMS / Courses",
  study_tools: "Study Tools",
};

function fmt(inr: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(inr);
}

export default async function SubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try { await requireSuperAdminAccess(); } catch { redirect("/"); }

  const school = await db.school.findUnique({
    where: { id },
    select: {
      id: true, name: true, schoolCode: true, status: true, plan: true,
      _count: { select: { students: true } },
      enhancedSubscriptions: {
        select: {
          id: true, status: true, currentPeriodStart: true, currentPeriodEnd: true,
          cancelAtPeriodEnd: true, trialEnd: true, createdAt: true,
          plan: {
            select: { id: true, name: true, interval: true, features: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!school) redirect("/super-admin/schools");

  const currentSub = school.enhancedSubscriptions.find(s => s.status === "ACTIVE");
  const studentCount = school._count.students;

  // Resolve per-student pricing from plan record features JSON or PLAN_LIMITS fallback
  function getPlanPricing(planName: string, featJson: unknown) {
    const feat = (featJson ?? {}) as Record<string, unknown>;
    const pps = typeof feat.pricePerStudent === "number"
      ? feat.pricePerStudent / 100
      : (PLAN_LIMITS[planName as PlanType]?.pricePerStudent ?? 4);
    const minMonthly = typeof feat.minimumMonthly === "number"
      ? feat.minimumMonthly / 100
      : (PLAN_LIMITS[planName as PlanType]?.minMonthly ?? 500);
    const discountMonths = typeof feat.annualDiscountMonths === "number"
      ? feat.annualDiscountMonths
      : 2;
    return { pps, minMonthly, discountMonths };
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/super-admin/schools/${school.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-7 w-7 text-red-500" />
            Plan Management
          </h1>
          <p className="text-muted-foreground">{school.name} • {school.schoolCode}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{studentCount} students</span>
          <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
            {school.status}
          </Badge>
        </div>
      </div>

      {currentSub ? (
        <div className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>Active plan details and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const { pps, minMonthly, discountMonths } = getPlanPricing(currentSub.plan.name, currentSub.plan.features);
                const monthlyBill = Math.max(studentCount * pps, minMonthly);
                const annualBill = monthlyBill * (12 - discountMonths);
                const isAnnual = currentSub.plan.interval === "yearly";

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="text-2xl font-bold capitalize">{currentSub.plan.name.toLowerCase()} Plan</p>
                        <Badge variant={currentSub.status === "ACTIVE" ? "default" : "secondary"}>
                          {currentSub.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Pricing</p>
                        <p className="text-2xl font-bold">
                          {fmt(pps)}<span className="text-sm font-normal text-muted-foreground">/student/mo</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Min {fmt(minMonthly)}/mo · Est. {fmt(monthlyBill)}/mo for {studentCount} students
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Next Billing</p>
                        <p className="text-lg font-semibold">
                          {currentSub.currentPeriodEnd.toLocaleDateString("en-IN")}
                        </p>
                        {currentSub.cancelAtPeriodEnd && (
                          <Badge variant="destructive">Cancels at period end</Badge>
                        )}
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Period</p>
                        <p className="font-medium">
                          {currentSub.currentPeriodStart.toLocaleDateString("en-IN")} –{" "}
                          {currentSub.currentPeriodEnd.toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-medium">{currentSub.createdAt.toLocaleDateString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Est. Monthly Bill</p>
                        <p className="font-medium text-emerald-600">{fmt(monthlyBill)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Est. Annual Bill</p>
                        <p className="font-medium text-emerald-600">
                          {fmt(annualBill)}
                          <span className="text-xs text-muted-foreground ml-1">({discountMonths} mo free)</span>
                        </p>
                      </div>
                    </div>

                    {currentSub.trialEnd && new Date() < currentSub.trialEnd && (
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-300">
                            Trial ends {currentSub.trialEnd.toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex gap-2">
                      <ChangePlanDialog
                        schoolId={school.id}
                        currentPlan={school.plan}
                        studentCount={studentCount}
                      />
                      {!currentSub.cancelAtPeriodEnd && (
                        <Button variant="destructive">Cancel Subscription</Button>
                      )}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>Features included in the {currentSub.plan.name.toLowerCase()} plan</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Use PLAN_FEATURES config as source of truth — DB JSON may be stale
                const planFeatures = PLAN_FEATURES[currentSub.plan.name as PlanType] ?? [];
                const feat = (currentSub.plan.features ?? {}) as Record<string, unknown>;
                const storageGB = (feat.storageGB as number) ?? PLAN_LIMITS[currentSub.plan.name as PlanType]?.storageGB ?? 1;
                const smsLimit = (feat.smsLimit as number) ?? PLAN_LIMITS[currentSub.plan.name as PlanType]?.sms ?? 500;
                const waLimit = (feat.whatsappLimit as number) ?? PLAN_LIMITS[currentSub.plan.name as PlanType]?.whatsapp ?? 0;
                const support = (feat.support ?? {}) as Record<string, boolean>;

                return (
                  <div className="space-y-6">
                    {/* Usage limits */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Storage", value: `${storageGB} GB` },
                        { label: "SMS / month", value: smsLimit === -1 ? "Unlimited" : String(smsLimit) },
                        { label: "WhatsApp / month", value: waLimit === 0 ? "Not included" : waLimit === -1 ? "Unlimited" : String(waLimit) },
                      ].map(({ label, value }) => (
                        <div key={label} className="border rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">{label}</p>
                          <p className="font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Included features */}
                    {planFeatures.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Included Features</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {planFeatures.map(f => (
                            <div key={f} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <span>{FEATURE_LABELS[f] ?? f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Support */}
                    {Object.keys(support).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Support</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {(["email", "phone", "priority", "dedicated"] as const).map(k => (
                            <div key={k} className="flex items-center gap-2 text-sm">
                              {support[k]
                                ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                                : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                              <span className="capitalize">{k} support</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Plan</h3>
            <p className="text-muted-foreground mb-4">This school does not have an active subscription.</p>
            <ChangePlanDialog
              schoolId={school.id}
              currentPlan={school.plan}
              studentCount={studentCount}
            />
          </CardContent>
        </Card>
      )}

      {/* History */}
      {school.enhancedSubscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Plan History
            </CardTitle>
            <CardDescription>Complete history of plan changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {school.enhancedSubscriptions.map((sub, i) => {
                const { pps, minMonthly } = getPlanPricing(sub.plan.name, sub.plan.features);
                const bill = Math.max(studentCount * pps, minMonthly);
                return (
                  <div key={sub.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"}>
                          {sub.status}
                        </Badge>
                        <span className="font-medium capitalize">{sub.plan.name.toLowerCase()} Plan</span>
                        {i === 0 && sub.status === "ACTIVE" && (
                          <Badge variant="outline">Current</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Est. {fmt(bill)}/mo
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        Period: {sub.currentPeriodStart.toLocaleDateString("en-IN")} –{" "}
                        {sub.currentPeriodEnd.toLocaleDateString("en-IN")}
                      </div>
                      <div>Created: {sub.createdAt.toLocaleDateString("en-IN")}</div>
                    </div>
                    {sub.cancelAtPeriodEnd && (
                      <Badge variant="destructive" className="mt-2 text-xs">Scheduled for cancellation</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
