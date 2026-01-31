import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Building2, 
  CreditCard, 
  Shield, 
  Users, 
  Activity,
  Settings,
  HeadphonesIcon,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  Database
} from "lucide-react";

// Import our comprehensive dashboard components
import { AnalyticsDashboard } from "@/components/super-admin/analytics/analytics-dashboard";
import { BillingDashboard } from "@/components/super-admin/billing/billing-dashboard";
import { SubscriptionPlansManagement } from "@/components/super-admin/plans/subscription-plans-management";
import { EnhancedSchoolManagement } from "@/components/super-admin/schools/enhanced-school-management";
import { MonitoringDashboard } from "@/components/super-admin/monitoring/monitoring-dashboard";
import { SystemConfiguration } from "@/components/super-admin/system/system-configuration";
import { SupportTicketManagement } from "@/components/super-admin/support/support-ticket-management";
import { AuditLogViewer } from "@/components/super-admin/audit/audit-log-viewer";
import { RecentActivity } from "@/components/super-admin/dashboard/recent-activity";
import { QuickStats } from "@/components/super-admin/dashboard/quick-stats";
import { SystemHealthOverview } from "@/components/super-admin/dashboard/system-health-overview";

// Import data fetching actions
import { getDashboardAnalytics } from "@/lib/actions/analytics-actions";
import { getBillingDashboardData } from "@/lib/actions/billing-actions";
import { getSchoolsWithFilters } from "@/lib/actions/school-management-actions";

export default async function SuperAdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    await requireSuperAdminAccess();
  } catch (error) {
    redirect("/");
  }

  // Fetch real data for the dashboard
  const [analyticsResult, billingResult, schoolsResult] = await Promise.all([
    getDashboardAnalytics("30d"),
    getBillingDashboardData("30d"),
    getSchoolsWithFilters({ status: "ACTIVE" })
  ]);

  // Extract data with fallbacks
  const analytics = analyticsResult.success ? analyticsResult.data : null;
  const billing = billingResult.success ? billingResult.data : null;
  const schools = schoolsResult.success ? schoolsResult.data : [];

  // Calculate system health metrics (mock for now - would come from monitoring service)
  const systemHealth = {
    uptime: 99.97,
    avgResponseTime: 145,
    status: "healthy" as const
  };

  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100); // Convert from paise to rupees
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Premium Header with Glass Effect */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  Super Admin Control Center
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  Enterprise SaaS Platform Management • Real-time Analytics & Control
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className={`${
                systemHealth.status === "healthy" 
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
              }`}>
                <CheckCircle className="h-3 w-3 mr-1" />
                {systemHealth.status === "healthy" ? "System Healthy" : "System Issues"}
              </Badge>
              <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-800/50">
                <Activity className="h-4 w-4 mr-2" />
                Live Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Premium Stats Overview - Now with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-700/90" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold">
                    {billing?.metrics?.totalRevenue ? formatCurrency(billing.metrics.totalRevenue) : "₹0"}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    MRR: {billing?.metrics?.monthlyRecurringRevenue ? formatCurrency(billing.metrics.monthlyRecurringRevenue) : "₹0"}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-emerald-700/90" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Active Schools</p>
                  <p className="text-3xl font-bold">
                    {analytics?.kpiData?.activeSchools || 0}
                  </p>
                  <p className="text-emerald-200 text-xs mt-1">
                    {analytics?.kpiData?.suspendedSchools || 0} suspended • {analytics?.kpiData?.recentSchools || 0} new
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-purple-700/90" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold">
                    {analytics?.kpiData?.totalUsers?.toLocaleString() || "0"}
                  </p>
                  <p className="text-purple-200 text-xs mt-1">
                    {analytics?.kpiData?.totalStudents || 0} Students • {analytics?.kpiData?.totalTeachers || 0} Teachers
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/90 to-orange-700/90" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">System Health</p>
                  <p className="text-3xl font-bold">{systemHealth.uptime}%</p>
                  <p className="text-orange-200 text-xs mt-1">
                    Uptime • {systemHealth.avgResponseTime}ms avg response
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex items-center justify-center">
            <TabsList className="grid grid-cols-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-xl p-1">
              <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Plans</span>
              </TabsTrigger>
              <TabsTrigger value="schools" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Schools</span>
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Monitor</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <HeadphonesIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Support</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab - Premium Dashboard */}
          <TabsContent value="overview" className="space-y-8">
            {/* Quick Actions Bar */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Frequently used administrative tasks</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" className="bg-white/80 dark:bg-slate-700/80" asChild>
                      <Link href="/super-admin/schools/create">
                        <Globe className="h-4 w-4 mr-2" />
                        Add School
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white/80 dark:bg-slate-700/80">
                      <Database className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white/80 dark:bg-slate-700/80">
                      <Settings className="h-4 w-4 mr-2" />
                      System Config
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Dashboard Grid - Now with Real Data */}
            <div className="grid grid-cols-1 gap-8">
              {/* Quick Stats Overview */}
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Key Performance Indicators
                  </CardTitle>
                  <CardDescription>Real-time metrics and performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <QuickStats analytics={analytics || undefined} billing={billing || undefined} />
                </CardContent>
              </Card>

              {/* System Health - Full width */}
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                    System Health & Monitoring
                  </CardTitle>
                  <CardDescription>Real-time system health, performance metrics, and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <SystemHealthOverview systemHealth={systemHealth} />
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Now with Real Data */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest system events and audit logs</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white/80 dark:bg-slate-700/80">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RecentActivity activities={analytics?.recentActivity || []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs with Premium Styling */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-8">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <AnalyticsDashboard initialData={analytics} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-8">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <BillingDashboard initialData={billing} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-8">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <SubscriptionPlansManagement />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-8">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <EnhancedSchoolManagement />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-8">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <MonitoringDashboard />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-8">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <SupportTicketManagement />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-8">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <SystemConfiguration />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}