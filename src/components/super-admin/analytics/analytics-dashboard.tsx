"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Building,
  DollarSign,
  Activity,
  RefreshCw,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Clock
} from "lucide-react";
import {
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getDashboardAnalytics } from "@/lib/actions/analytics-actions";
import { toast } from "sonner";
import { UserGrowthChart } from "./user-growth-chart";
import { SchoolDistributionChart } from "./school-distribution-chart";
import { RevenueChart } from "./revenue-chart";
import { ChurnAnalysisChart } from "./churn-analysis-chart";
import { PerformanceMetrics } from "./performance-metrics";
import { UsageAnalyticsChart } from "./usage-analytics-chart";

interface AnalyticsDashboardProps {
  timeRange?: string;
  initialData?: DashboardData | null;
}

interface DashboardData {
  kpiData: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    totalSchools: number;
    activeSchools: number;
    suspendedSchools: number;
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    recentSchools: number;
    activeSubscriptions: number;
    totalSubscriptions: number;
    churnRate: number | null;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    conversionRate: number;
    hasPaymentData?: boolean;
  };
  userGrowthData: Array<{
    month: string;
    users: number;
  }>;
  schoolDistribution: Array<{
    plan: string;
    count: number;
    percentage: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userName: string;
    userEmail: string;
    createdAt: Date;
    metadata: any;
  }>;
  timeRange: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
}

export function AnalyticsDashboard({ timeRange = "30d", initialData = null }: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(initialData ? Date.now() : 0);

  // Cache analytics data for 5 minutes to prevent excessive queries
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchAnalytics = useCallback(async (range: string, forceRefresh = false) => {
    const now = Date.now();

    // Check if we have cached data that's still valid
    if (!forceRefresh && data && (now - lastFetchTime) < CACHE_DURATION) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getDashboardAnalytics(range);

      if (result.success && result.data) {
        setData(result.data);
        setLastFetchTime(now);
      } else {
        setError(result.error || "Failed to fetch analytics");
        toast.error("Failed to load analytics data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [data, lastFetchTime]);

  useEffect(() => {
    fetchAnalytics(selectedTimeRange);
  }, [selectedTimeRange, fetchAnalytics]);

  const handleRefreshData = useCallback(async () => {
    await fetchAnalytics(selectedTimeRange, true); // Force refresh
    toast.success("Analytics data refreshed");
  }, [selectedTimeRange, fetchAnalytics]);

  const handleTimeRangeChange = useCallback((newRange: string) => {
    setSelectedTimeRange(newRange);
    setLastFetchTime(0); // Reset cache when time range changes
  }, []);

  // Memoize expensive calculations
  const formattedData = useMemo(() => {
    if (!data) return null;

    return {
      ...data,
      formattedRevenue: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(data.kpiData.totalRevenue / 100),
      formattedMRR: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(data.kpiData.monthlyRecurringRevenue / 100),
    };
  }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
        <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading analytics: {error}</span>
        </div>
        <Button onClick={handleRefreshData} className="mt-4 mx-auto block">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-3">
          <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40 bg-[hsl(var(--card))]/80 backdrop-blur-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="mtd">Month to date</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefreshData}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="bg-[hsl(var(--card))]/80 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Premium KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : data ? (
          <>
            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(data.kpiData.totalRevenue)}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Projected MRR: {formatCurrency(data.kpiData.monthlyRecurringRevenue)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Schools</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatNumber(data.kpiData.totalSchools)}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {data.kpiData.activeSchools} active
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {data.kpiData.suspendedSchools} suspended
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(data.kpiData.totalUsers)}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                    <Users className="h-3 w-3 mr-1" />
                    {formatNumber(data.kpiData.totalStudents)} students
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatNumber(data.kpiData.totalTeachers)} teachers
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Churn Rate</CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.kpiData.churnRate ?? 'N/A'}{data.kpiData.churnRate !== null ? '%' : ''}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {data.kpiData.recentSchools} new
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    this period
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">ARPU</CardTitle>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(data.kpiData.averageRevenuePerUser)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Average revenue per user
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Customer LTV</CardTitle>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(data.kpiData.customerLifetimeValue)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lifetime value
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Conversion Rate</CardTitle>
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Activity className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.kpiData.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Schools to subscriptions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Subscriptions</CardTitle>
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(data.kpiData.activeSubscriptions)}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  of {formatNumber(data.kpiData.totalSubscriptions)} total
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Premium Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[hsl(var(--card))]/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center space-x-2">
            <LineChart className="h-4 w-4" />
            <span>Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="schools" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Schools</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-teal-600" />
                  <span>User Growth (12 months)</span>
                </CardTitle>
                <CardDescription>Cumulative registered users over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : data && data.userGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <ReLineChart data={data.userGrowthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" fontSize={10} tickLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12 }}
                        formatter={(v) => [(v as number).toLocaleString("en-IN"), "Users"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        dot={false}
                        name="Users"
                      />
                    </ReLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No user growth data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>Schools by Plan</span>
                </CardTitle>
                <CardDescription>Distribution of active schools across plans</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : data && data.schoolDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={data.schoolDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="plan" fontSize={12} tickLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12 }}
                        formatter={(v) => [v as number, "Schools"]}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Schools" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No school distribution data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-emerald-600" />
                  <span>School Distribution</span>
                </CardTitle>
                <CardDescription>Schools by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : data ? (
                  <div className="space-y-3">
                    {data.schoolDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-emerald-500' :
                                index === 2 ? 'bg-teal-500' : 'bg-orange-500'
                            }`} />
                          <span className="font-medium">{item.plan}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{item.count}</div>
                          <div className="text-xs text-slate-500">{item.percentage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Latest system events and changes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : data ? (
                  <div className="space-y-3">
                    {data.recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{activity.action}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {activity.userName} • {activity.entityType}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="space-y-4">
            {data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Projected MRR", value: formatCurrency(data.kpiData.monthlyRecurringRevenue), note: "Based on active schools × per-student rate" },
                  { label: "Projected ARR", value: formatCurrency(data.kpiData.monthlyRecurringRevenue * 12), note: "Annualised from MRR" },
                  { label: "Collected Revenue", value: data.kpiData.hasPaymentData ? formatCurrency(data.kpiData.totalRevenue) : "₹0", note: data.kpiData.hasPaymentData ? "All-time from Payment records" : "No Razorpay payments yet" },
                ].map(({ label, value, note }) => (
                  <Card key={label} className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{value}</div><p className="text-xs text-muted-foreground mt-1">{note}</p></CardContent>
                  </Card>
                ))}
              </div>
            )}
            <RevenueChart timeRange={selectedTimeRange} />
            <ChurnAnalysisChart timeRange={selectedTimeRange} />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-4">
            {data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Students", value: data.kpiData.totalStudents },
                  { label: "Teachers", value: data.kpiData.totalTeachers },
                  { label: "Admins", value: data.kpiData.totalAdmins },
                  { label: "Total Users", value: data.kpiData.totalUsers },
                ].map(({ label, value }) => (
                  <Card key={label} className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{formatNumber(value)}</div>
                      <div className="text-sm text-muted-foreground">{label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {data && <UserGrowthChart data={data.userGrowthData} />}
            <UsageAnalyticsChart timeRange={selectedTimeRange} />
          </div>
        </TabsContent>

        <TabsContent value="schools">
          <div className="space-y-4">
            {data && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Schools", value: data.kpiData.totalSchools },
                  { label: "Active", value: data.kpiData.activeSchools },
                  { label: "Suspended", value: data.kpiData.suspendedSchools },
                ].map(({ label, value }) => (
                  <Card key={label} className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{value}</div>
                      <div className="text-sm text-muted-foreground">{label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {data && <SchoolDistributionChart data={data.schoolDistribution} />}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}