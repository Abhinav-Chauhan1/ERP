import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  FileText,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plan-features";
import { format } from "date-fns";

interface SchoolAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolAnalyticsPage({ params }: SchoolAnalyticsPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    await requireSuperAdminAccess();
  } catch (error) {
    redirect("/");
  }

  const school = await db.school.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      schoolCode: true,
      status: true,
      plan: true,
      createdAt: true,
      _count: {
        select: {
          teachers: true,
          students: true,
          administrators: true,
          classes: true,
          Subject: true,
          parents: true,
        },
      },
    },
  });

  if (!school) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">School Not Found</h1>
        <p className="text-gray-500 mb-6">The school you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/super-admin/schools">Return to Schools List</Link>
        </Button>
      </div>
    );
  }

  // Fetch real usage data from UsageCounter for current month
  const currentMonth = format(new Date(), "yyyy-MM");
  const usageCounter = await db.usageCounter.findUnique({
    where: { schoolId_month: { schoolId: id, month: currentMonth } },
  }).catch(() => null);

  const planLimits = PLAN_LIMITS[school.plan as PlanType];
  const smsUsed = usageCounter?.smsUsed ?? 0;
  const smsLimit = usageCounter?.smsLimit ?? planLimits?.sms ?? 500;
  const waUsed = usageCounter?.whatsappUsed ?? 0;
  const waLimit = usageCounter?.whatsappLimit ?? planLimits?.whatsapp ?? 0;
  const storageMB = usageCounter?.storageUsedMB ?? 0;
  const storageLimitMB = usageCounter?.storageLimitMB ?? (planLimits?.storageGB ?? 1) * 1024;
  const storageGB = storageMB / 1024;
  const storageLimitGB = storageLimitMB / 1024;

  const smsPct = smsLimit > 0 ? Math.min(100, Math.round((smsUsed / smsLimit) * 100)) : 0;
  const waPct = waLimit > 0 ? Math.min(100, Math.round((waUsed / waLimit) * 100)) : 0;
  const storagePct = storageLimitMB > 0 ? Math.min(100, Math.round((storageMB / storageLimitMB) * 100)) : 0;

  const barColor = (pct: number) => pct >= 90 ? "bg-red-600" : pct >= 70 ? "bg-yellow-500" : "bg-blue-600";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/super-admin/schools/${school.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">School Analytics</h1>
          <p className="text-muted-foreground">{school.name} • {school.schoolCode}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
            {school.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{school._count.students}</p>
                    <p className="text-xs text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{school._count.teachers}</p>
                    <p className="text-xs text-muted-foreground">Total Teachers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-teal-600" />
                  <div>
                    <p className="text-2xl font-bold">{school._count.classes}</p>
                    <p className="text-xs text-muted-foreground">Total Classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{school._count.parents}</p>
                    <p className="text-xs text-muted-foreground">Total Parents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  School Summary
                </CardTitle>
                <CardDescription>Key school statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Students", value: school._count.students },
                    { label: "Teachers", value: school._count.teachers },
                    { label: "Admins", value: school._count.administrators },
                    { label: "Parents", value: school._count.parents },
                    { label: "Classes", value: school._count.classes },
                    { label: "Subjects", value: school._count.Subject },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">{label}</span>
                      <span className="text-sm font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Plan & Subscription
                </CardTitle>
                <CardDescription>Current plan tier and capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Plan</span>
                    <Badge>{school.plan}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Storage Limit</span>
                    <span className="text-sm font-semibold">{planLimits?.storageGB ?? 1} GB</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">SMS / month</span>
                    <span className="text-sm font-semibold">
                      {planLimits?.sms === -1 ? "Unlimited" : (planLimits?.sms ?? 500)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">WhatsApp / month</span>
                    <span className="text-sm font-semibold">
                      {(planLimits?.whatsapp ?? 0) === 0 ? "Not included" : planLimits?.whatsapp === -1 ? "Unlimited" : planLimits?.whatsapp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Registered</span>
                    <span className="text-sm font-semibold">
                      {new Date(school.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Resource Usage — {currentMonth}
              </CardTitle>
              <CardDescription>
                Current month usage tracked from UsageCounter
                {!usageCounter && " · No usage data recorded yet for this month"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>SMS Messages</span>
                    <span>
                      {smsUsed} / {smsLimit === -1 ? "Unlimited" : smsLimit}
                      {smsLimit > 0 && ` (${smsPct}%)`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${barColor(smsPct)} h-2 rounded-full transition-all`}
                      style={{ width: `${smsPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>WhatsApp Messages</span>
                    <span>
                      {waLimit === 0
                        ? "Not included in plan"
                        : `${waUsed} / ${waLimit === -1 ? "Unlimited" : waLimit}${waLimit > 0 ? ` (${waPct}%)` : ""}`}
                    </span>
                  </div>
                  {waLimit > 0 && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${barColor(waPct)} h-2 rounded-full transition-all`}
                        style={{ width: `${waPct}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Used</span>
                    <span>
                      {storageGB.toFixed(2)} GB / {storageLimitGB.toFixed(1)} GB
                      {` (${storagePct}%)`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${barColor(storagePct)} h-2 rounded-full transition-all`}
                      style={{ width: `${storagePct}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports & Logs
              </CardTitle>
              <CardDescription>Access activity logs and audit reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link href={`/super-admin/schools/${school.id}/activity`}>
                    <Activity className="h-6 w-6 mb-2" />
                    <span>Activity & Audit Logs</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link href={`/super-admin/schools/${school.id}/users`}>
                    <Users className="h-6 w-6 mb-2" />
                    <span>User Report</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link href={`/super-admin/schools/${school.id}/subscription`}>
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span>Subscription Details</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link href={`/super-admin/schools/${school.id}/billing`}>
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Billing History</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
