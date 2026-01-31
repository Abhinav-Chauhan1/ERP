"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Users, 
  Activity, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  UserCheck,
  UserX,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// Types and Interfaces
// ============================================================================

interface AuthAnalyticsDashboardProps {
  timeRange?: string;
  schoolId?: string;
}

interface AuthAnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  successRate: number;
  securityAlerts: number;
}

interface AuthAnalyticsTrend {
  date: string;
  successful: number;
  failed: number;
  total: number;
}

interface UserGrowthTrend {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface SecurityTrend {
  date: string;
  alerts: number;
  blockedAttempts: number;
}

interface AuthAnalyticsInsight {
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  title: string;
  description: string;
  value?: number;
  change?: number;
}

interface AuthAnalyticsDashboardData {
  overview: AuthAnalyticsOverview;
  trends: {
    loginTrend: AuthAnalyticsTrend[];
    userGrowthTrend: UserGrowthTrend[];
    securityTrend: SecurityTrend[];
  };
  insights: AuthAnalyticsInsight[];
}

interface AuthenticationMetrics {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  successRate: number;
  uniqueUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  peakLoginHours: Array<{
    hour: number;
    count: number;
  }>;
  loginsByRole: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  loginsBySchool: Array<{
    schoolId: string;
    schoolName: string;
    count: number;
    percentage: number;
  }>;
  authMethodDistribution: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

interface SecurityMetrics {
  suspiciousActivities: number;
  blockedAttempts: number;
  rateLimitViolations: number;
  multipleFailedLogins: number;
  unusualLocationLogins: number;
  securityAlerts: Array<{
    type: string;
    count: number;
    severity: string;
    description: string;
  }>;
  topRiskyIPs: Array<{
    ipAddress: string;
    attempts: number;
    successRate: number;
    riskScore: number;
  }>;
  authenticationErrors: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
}

// ============================================================================
// Main Component
// ============================================================================

export function AuthAnalyticsDashboard({ 
  timeRange = "30d", 
  schoolId 
}: AuthAnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'security'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<AuthAnalyticsDashboardData | null>(null);
  const [detailedData, setDetailedData] = useState<{
    authentication: AuthenticationMetrics;
    security: SecurityMetrics;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async (range: string, view: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        timeRange: range,
        type: view,
        ...(schoolId && { schoolId })
      });

      const response = await fetch(`/api/super-admin/analytics/authentication?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      if (result.success) {
        if (view === 'overview') {
          setOverviewData(result.data);
        } else if (view === 'detailed') {
          setDetailedData(result.data);
        } else if (view === 'security') {
          setDetailedData(prev => ({ 
            authentication: prev?.authentication || {} as AuthenticationMetrics,
            security: result.data 
          }));
        }
      } else {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(`Failed to load analytics: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedTimeRange, selectedView);
  }, [selectedTimeRange, selectedView, schoolId]);

  const handleRefreshData = async () => {
    await fetchAnalytics(selectedTimeRange, selectedView);
    toast.success("Analytics data refreshed");
  };

  const handleTimeRangeChange = (newRange: string) => {
    setSelectedTimeRange(newRange);
  };

  const handleViewChange = (newView: 'overview' | 'detailed' | 'security') => {
    setSelectedView(newView);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes.toFixed(1)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes.toFixed(0)}m`;
  };

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-600 dark:text-red-400">
          Error loading authentication analytics: {error}
        </AlertDescription>
        <Button onClick={handleRefreshData} className="mt-4" variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Authentication Analytics
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor authentication patterns, security events, and user activity
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefreshData} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={selectedView} onValueChange={(value) => handleViewChange(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Detailed</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : overviewData ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(overviewData.overview.totalUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(overviewData.overview.activeUsers)} active today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(overviewData.overview.successRate)}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      {overviewData.overview.successRate >= 90 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Good
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Activity className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(overviewData.overview.totalSessions)}</div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {formatDuration(overviewData.overview.averageSessionDuration)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatDuration(overviewData.overview.averageSessionDuration)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average per session
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                    <Shield className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(overviewData.overview.securityAlerts)}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      {overviewData.overview.securityAlerts === 0 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          All Clear
                        </Badge>
                      ) : overviewData.overview.securityAlerts < 10 ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Monitor
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          High Alert
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(overviewData.overview.activeUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently online
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              {overviewData.insights && overviewData.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>Key Insights</span>
                    </CardTitle>
                    <CardDescription>
                      Important patterns and recommendations based on your authentication data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {overviewData.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className={`p-2 rounded-lg ${
                            insight.type === 'SUCCESS' ? 'bg-green-100 dark:bg-green-900/30' :
                            insight.type === 'WARNING' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            insight.type === 'ERROR' ? 'bg-red-100 dark:bg-red-900/30' :
                            'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            {insight.type === 'SUCCESS' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {insight.type === 'WARNING' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                            {insight.type === 'ERROR' && <XCircle className="h-4 w-4 text-red-600" />}
                            {insight.type === 'INFO' && <Activity className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{insight.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{insight.description}</p>
                            {insight.value !== undefined && (
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-lg font-bold">{formatNumber(insight.value)}</span>
                                {insight.change !== undefined && (
                                  <Badge variant="secondary" className={
                                    insight.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }>
                                    {insight.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {Math.abs(insight.change).toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trends Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Login Trends</CardTitle>
                    <CardDescription>Daily authentication success and failure rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-center">
                        <Activity className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">Login trend chart will be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security Events</CardTitle>
                    <CardDescription>Security alerts and blocked attempts over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-center">
                        <Shield className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">Security trend chart will be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Detailed Tab */}
        <TabsContent value="detailed" className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : detailedData?.authentication ? (
            <div className="space-y-6">
              {/* Authentication Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Breakdown</CardTitle>
                  <CardDescription>Detailed authentication statistics and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatNumber(detailedData.authentication.successfulLogins)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Successful Logins</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{formatNumber(detailedData.authentication.failedLogins)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Failed Logins</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{formatNumber(detailedData.authentication.newUsers)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">New Users</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{formatNumber(detailedData.authentication.returningUsers)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Returning Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Distribution */}
              {detailedData.authentication.loginsByRole.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Logins by Role</CardTitle>
                    <CardDescription>Authentication distribution across user roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detailedData.authentication.loginsByRole.map((roleData, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-blue-500' : 
                              index === 1 ? 'bg-green-500' : 
                              index === 2 ? 'bg-purple-500' : 
                              index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                            }`} />
                            <span className="font-medium capitalize">{roleData.role.toLowerCase()}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatNumber(roleData.count)}</div>
                            <div className="text-xs text-slate-500">{formatPercentage(roleData.percentage)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Authentication Methods */}
              {detailedData.authentication.authMethodDistribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication Methods</CardTitle>
                    <CardDescription>Distribution of authentication methods used</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {detailedData.authentication.authMethodDistribution.map((method, index) => (
                        <div key={index} className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center justify-center mb-2">
                            {method.method === 'OTP' && <Smartphone className="h-6 w-6 text-blue-600" />}
                            {method.method === 'PASSWORD' && <Lock className="h-6 w-6 text-green-600" />}
                            {method.method === 'TOKEN' && <Unlock className="h-6 w-6 text-purple-600" />}
                          </div>
                          <div className="text-lg font-bold">{formatNumber(method.count)}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{method.method}</div>
                          <div className="text-xs text-slate-500">{formatPercentage(method.percentage)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : detailedData?.security ? (
            <div className="space-y-6">
              {/* Security Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(detailedData.security.suspiciousActivities)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Blocked Attempts</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(detailedData.security.blockedAttempts)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rate Limit Violations</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(detailedData.security.rateLimitViolations)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Multiple Failed Logins</CardTitle>
                    <UserX className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(detailedData.security.multipleFailedLogins)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Security Alerts */}
              {detailedData.security.securityAlerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Alerts</CardTitle>
                    <CardDescription>Recent security events requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detailedData.security.securityAlerts.map((alert, index) => (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${
                          alert.severity === 'CRITICAL' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                          alert.severity === 'HIGH' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                          alert.severity === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                          'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{alert.type.replace('_', ' ')}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{formatNumber(alert.count)}</div>
                              <Badge variant="secondary" className={
                                alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }>
                                {alert.severity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Risky IPs */}
              {detailedData.security.topRiskyIPs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Risky IP Addresses</CardTitle>
                    <CardDescription>IP addresses with suspicious authentication patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detailedData.security.topRiskyIPs.slice(0, 10).map((ip, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Globe className="h-4 w-4 text-slate-500" />
                            <span className="font-mono text-sm">{ip.ipAddress}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold">{formatNumber(ip.attempts)}</div>
                              <div className="text-xs text-slate-500">Attempts</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{formatPercentage(ip.successRate)}</div>
                              <div className="text-xs text-slate-500">Success</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-semibold ${
                                ip.riskScore >= 80 ? 'text-red-600' :
                                ip.riskScore >= 60 ? 'text-orange-600' :
                                ip.riskScore >= 40 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {ip.riskScore.toFixed(0)}
                              </div>
                              <div className="text-xs text-slate-500">Risk</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}