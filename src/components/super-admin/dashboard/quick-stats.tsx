import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  CreditCard, 
  Activity,
  DollarSign,
  UserCheck,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface QuickStatsProps {
  analytics?: {
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
      churnRate: number;
      conversionRate: number;
      averageRevenuePerUser: number;
    };
    schoolDistribution: Array<{
      plan: string;
      count: number;
      percentage: string;
    }>;
  };
  billing?: {
    metrics: {
      totalRevenue: number;
      monthlyRecurringRevenue: number;
      revenueInPeriod: number;
      totalSubscriptions: number;
      activeSubscriptions: number;
      expiredSubscriptions: number;
      pendingSubscriptions: number;
      churnRate: number;
      averageRevenuePerSubscription: number;
    };
  };
}

export function QuickStats({ analytics, billing }: QuickStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const kpi = analytics?.kpiData;
  const billingMetrics = billing?.metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Revenue Metrics */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {kpi?.totalRevenue ? formatCurrency(kpi.totalRevenue) : "₹0"}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Recurring</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {kpi?.monthlyRecurringRevenue ? formatCurrency(kpi.monthlyRecurringRevenue) : "₹0"}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">ARPU</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {kpi?.averageRevenuePerUser ? formatCurrency(kpi.averageRevenuePerUser) : "₹0"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Metrics */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            School Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Schools</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {kpi?.totalSchools || 0}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Active</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-green-600">
                  {kpi?.activeSchools || 0}
                </span>
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Suspended</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-red-600">
                  {kpi?.suspendedSchools || 0}
                </span>
                <AlertTriangle className="h-3 w-3 text-red-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Metrics */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            User Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Users</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {kpi?.totalUsers?.toLocaleString() || "0"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Students</span>
              <span className="font-medium">{kpi?.totalStudents || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Teachers</span>
              <span className="font-medium">{kpi?.totalTeachers || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Admins</span>
              <span className="font-medium">{kpi?.totalAdmins || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Health */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Active Subscriptions</span>
              <span className="text-lg font-semibold text-green-600">
                {billingMetrics?.activeSubscriptions || 0}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Churn Rate</span>
              <div className="flex items-center space-x-1">
                <span className={`text-sm font-medium ${
                  (kpi?.churnRate || 0) > 5 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {kpi?.churnRate?.toFixed(1) || "0.0"}%
                </span>
                {(kpi?.churnRate || 0) > 5 ? (
                  <TrendingUp className="h-3 w-3 text-red-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-600" />
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</span>
              <span className="text-sm font-medium text-blue-600">
                {kpi?.conversionRate?.toFixed(1) || "0.0"}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Plan Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics?.schoolDistribution?.map((plan) => (
            <div key={plan.plan} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{plan.plan}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {plan.count}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {plan.percentage}%
                  </Badge>
                </div>
              </div>
              <Progress value={parseFloat(plan.percentage)} className="h-1" />
            </div>
          )) || (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No plan data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Uptime</span>
              <span className="text-lg font-semibold text-green-600">99.97%</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Avg Response</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">145ms</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}