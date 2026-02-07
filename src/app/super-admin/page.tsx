import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  HardDrive,
  Activity,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";

// Import data fetching actions
import { getDashboardAnalytics } from "@/lib/actions/analytics-actions";
import { getBillingDashboardData } from "@/lib/actions/billing-actions";
import { getSchoolsWithFilters } from "@/lib/actions/school-management-actions";
import { getStorageAnalytics } from "@/lib/actions/storage-actions";

// Import dashboard components
import { RecentActivity } from "@/components/super-admin/dashboard/recent-activity";
import { StorageOverview } from "@/components/super-admin/dashboard/storage-overview";

export default async function SuperAdminDashboard() {
  // Fetch real data for the dashboard
  const [analyticsResult, billingResult, schoolsResult, storageResult] = await Promise.all([
    getDashboardAnalytics("30d"),
    getBillingDashboardData("30d"),
    getSchoolsWithFilters({ status: "ACTIVE" }),
    getStorageAnalytics()
  ]);

  // Extract data with fallbacks
  const analytics = analyticsResult.success ? analyticsResult.data : null;
  const billing = billingResult.success ? billingResult.data : null;
  const schools = schoolsResult.success ? schoolsResult.data : [];
  const storage = storageResult.success ? storageResult.data : null;

  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's your platform overview.</p>
        </div>
        <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
          <Link href="/super-admin/schools/create">
            <Plus className="h-4 w-4 mr-2" />
            Add School
          </Link>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-red-600 to-red-700 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  {billing?.metrics?.totalRevenue ? formatCurrency(billing.metrics.totalRevenue) : "₹0"}
                </p>
                <p className="text-red-200 text-xs mt-1">
                  MRR: {billing?.metrics?.monthlyRecurringRevenue ? formatCurrency(billing.metrics.monthlyRecurringRevenue) : "₹0"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Schools */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Schools</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analytics?.kpiData?.activeSchools || 0}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {analytics?.kpiData?.suspendedSchools || 0} suspended • {analytics?.kpiData?.recentSchools || 0} new
                </p>
              </div>
              <div className="p-3 bg-red-600/20 rounded-xl">
                <Building2 className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analytics?.kpiData?.totalUsers?.toLocaleString() || "0"}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {analytics?.kpiData?.totalStudents || 0} students • {analytics?.kpiData?.totalTeachers || 0} teachers
                </p>
              </div>
              <div className="p-3 bg-red-600/20 rounded-xl">
                <Users className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Subscriptions</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {billing?.metrics?.activeSubscriptions || 0}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Churn: {billing?.metrics?.churnRate || 0}%
                </p>
              </div>
              <div className="p-3 bg-red-600/20 rounded-xl">
                <TrendingUp className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild className="border-[hsl(var(--border))] text-gray-300 hover:bg-red-600/20 hover:text-white hover:border-red-600">
              <Link href="/super-admin/schools">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Schools
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-[hsl(var(--border))] text-gray-300 hover:bg-red-600/20 hover:text-white hover:border-red-600">
              <Link href="/super-admin/analytics">
                <Activity className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-[hsl(var(--border))] text-gray-300 hover:bg-red-600/20 hover:text-white hover:border-red-600">
              <Link href="/super-admin/billing">
                <DollarSign className="h-4 w-4 mr-2" />
                Billing & Plans
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-[hsl(var(--border))] text-gray-300 hover:bg-red-600/20 hover:text-white hover:border-red-600">
              <Link href="/super-admin/storage">
                <HardDrive className="h-4 w-4 mr-2" />
                Storage Usage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Schools */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg text-white">Recent Schools</CardTitle>
              <CardDescription className="text-gray-500">Latest registered schools</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-red-500 hover:text-red-400 hover:bg-red-600/20">
              <Link href="/super-admin/schools">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(schools || []).slice(0, 5).map((school) => (
                <div key={school.id} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--secondary))]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{school.name}</p>
                      <p className="text-xs text-gray-500">{school.schoolCode}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={school.status === "ACTIVE"
                      ? "bg-green-950/50 text-green-400 border-green-800"
                      : "bg-red-950/50 text-red-400 border-red-800"
                    }
                  >
                    {school.status}
                  </Badge>
                </div>
              ))}
              {(schools || []).length === 0 && (
                <p className="text-center text-gray-500 py-4">No schools registered yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg text-white flex items-center">
                <Clock className="h-5 w-5 mr-2 text-red-500" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-gray-500">Latest system events</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-red-500 hover:text-red-400 hover:bg-red-600/20">
              <Link href="/super-admin/audit">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <RecentActivity activities={analytics?.recentActivity || []} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Storage Overview */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white flex items-center">
            <HardDrive className="h-5 w-5 mr-2 text-red-500" />
            Storage Analytics
          </CardTitle>
          <CardDescription className="text-gray-500">Platform storage usage overview</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <StorageOverview storageData={storage} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}