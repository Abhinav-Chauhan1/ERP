export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Building2,
    Users,
    DollarSign,
    TrendingUp,
    ArrowRight,
    Plus,
    Clock,
    HardDrive,
} from "lucide-react";

import { getDashboardAnalytics } from "@/lib/actions/analytics-actions";
import { getBillingDashboardData } from "@/lib/actions/billing-actions";
import { getSchoolsWithFilters } from "@/lib/actions/school-management-actions";
import { getStorageAnalytics } from "@/lib/actions/storage-actions";
import { RecentActivity } from "@/components/super-admin/dashboard/recent-activity";
import { StorageOverview } from "@/components/super-admin/dashboard/storage-overview";

function formatINR(paise: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(paise / 100);
}

export default async function SuperAdminDashboard() {
    const [analyticsResult, billingResult, schoolsResult, storageResult] = await Promise.all([
        getDashboardAnalytics("30d"),
        getBillingDashboardData("30d"),
        getSchoolsWithFilters({ status: "ACTIVE" }),
        getStorageAnalytics(),
    ]);

    const analytics = analyticsResult.success ? analyticsResult.data : null;
    const billing = billingResult.success ? billingResult.data : null;
    const schools = schoolsResult.success ? schoolsResult.data : [];
    const storage = storageResult.success ? storageResult.data : null;

    const kpis = [
        {
            label: "Active Schools",
            value: analytics?.kpiData?.activeSchools ?? 0,
            sub: `${analytics?.kpiData?.recentSchools ?? 0} new this month`,
            icon: Building2,
            color: "bg-blue-50 text-blue-600",
        },
        {
            label: "Total Users",
            value: (analytics?.kpiData?.totalUsers ?? 0).toLocaleString(),
            sub: `${analytics?.kpiData?.totalStudents ?? 0} students · ${analytics?.kpiData?.totalTeachers ?? 0} teachers`,
            icon: Users,
            color: "bg-violet-50 text-violet-600",
        },
        {
            label: "Projected MRR",
            value: billing?.metrics?.projectedMRR ? formatINR(billing.metrics.projectedMRR) : "₹0",
            sub: billing?.metrics?.hasPaymentData
                ? `Collected: ${formatINR(billing.metrics.totalCollected)}`
                : "No payments yet",
            icon: DollarSign,
            color: "bg-emerald-50 text-emerald-600",
        },
        {
            label: "Subscriptions",
            value: billing?.metrics?.activeSubscriptions ?? 0,
            sub: "Active subscriptions",
            icon: TrendingUp,
            color: "bg-amber-50 text-amber-600",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Platform overview and key metrics</p>
                </div>
                <Button asChild size="sm">
                    <Link href="/super-admin/schools/create">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add School
                    </Link>
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <Card key={kpi.label} className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                                        <p className="text-xs text-gray-400">{kpi.sub}</p>
                                    </div>
                                    <div className={`p-2.5 rounded-lg ${kpi.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Middle row: Recent Schools + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Schools */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
                        <CardTitle className="text-sm font-semibold text-gray-900">Recent Schools</CardTitle>
                        <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary h-auto p-0">
                            <Link href="/super-admin/schools" className="flex items-center gap-1">
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <div className="space-y-2">
                            {(schools || []).slice(0, 5).map((school) => (
                                <Link
                                    key={school.id}
                                    href={`/super-admin/schools/${school.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary">{school.name}</p>
                                            <p className="text-xs text-gray-400">{school.schoolCode}</p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={
                                            school.status === "ACTIVE"
                                                ? "text-emerald-600 border-emerald-200 bg-emerald-50 text-[11px]"
                                                : "text-red-600 border-red-200 bg-red-50 text-[11px]"
                                        }
                                    >
                                        {school.status}
                                    </Badge>
                                </Link>
                            ))}
                            {(schools || []).length === 0 && (
                                <p className="text-center text-sm text-gray-400 py-6">No schools registered yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
                        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            Recent Activity
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary h-auto p-0">
                            <Link href="/super-admin/audit" className="flex items-center gap-1">
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                            <RecentActivity activities={analytics?.recentActivity || []} />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>

            {/* Storage Overview */}
            <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-gray-400" />
                        Storage Overview
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary h-auto p-0">
                        <Link href="/super-admin/storage" className="flex items-center gap-1">
                            Manage <ArrowRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                        <StorageOverview storageData={storage} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
