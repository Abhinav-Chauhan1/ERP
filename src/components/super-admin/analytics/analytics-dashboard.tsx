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
import { getDashboardAnalytics } from "@/lib/actions/analytics-actions";
import { toast } from "sonner";

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
    churnRate: number;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    conversionRate: number;
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
      {/* Premium Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>
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
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12.5%
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    MRR: {formatCurrency(data.kpiData.monthlyRecurringRevenue)}
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
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.kpiData.churnRate}%</div>
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
                  <LineChart className="h-5 w-5 text-blue-600" />
                  <span>Revenue Trends</span>
                </CardTitle>
                <CardDescription>Monthly revenue and growth patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Revenue chart will be displayed here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-teal-600" />
                  <span>User Growth</span>
                </CardTitle>
                <CardDescription>User acquisition and growth trends</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gradient-to-br from-teal-50 to-pink-50 dark:from-teal-950/20 dark:to-pink-950/20 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-teal-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">User growth chart will be displayed here</p>
                    </div>
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
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardContent className="p-8">
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
                <div className="text-center">
                  <DollarSign className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Revenue Analytics</h3>
                  <p className="text-slate-600 dark:text-slate-400">Detailed revenue charts and analysis will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardContent className="p-8">
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-teal-50 to-pink-50 dark:from-teal-950/20 dark:to-pink-950/20 rounded-lg">
                <div className="text-center">
                  <Users className="h-16 w-16 text-teal-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">User Analytics</h3>
                  <p className="text-slate-600 dark:text-slate-400">User growth and engagement metrics will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardContent className="p-8">
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
                <div className="text-center">
                  <Building className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">School Analytics</h3>
                  <p className="text-slate-600 dark:text-slate-400">School distribution and performance metrics will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardContent className="p-8">
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg">
                <div className="text-center">
                  <Activity className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Performance Metrics</h3>
                  <p className="text-slate-600 dark:text-slate-400">System performance and health metrics will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}