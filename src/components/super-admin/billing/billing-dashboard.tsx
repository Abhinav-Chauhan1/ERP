"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Eye,
  MoreHorizontal
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentHistoryChart } from "@/components/super-admin/billing/payment-history-chart";
import { getBillingDashboardData } from "@/lib/actions/billing-actions";
import { toast } from "sonner";

interface BillingDashboardProps {
  schoolId?: string;
  showAllSchools?: boolean;
}

interface BillingData {
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
  revenueByPlan: Array<{
    plan: string;
    revenue: number;
    subscriptions: number;
    percentage: string;
  }>;
  monthlyRevenueData: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
  }>;
  recentPayments: Array<{
    id: string;
    schoolName: string;
    amount: number;
    status: string;
    date: Date;
    plan: string;
  }>;
  subscriptionsByStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  timeRange: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
}

export function BillingDashboard({ showAllSchools = true }: BillingDashboardProps) {
  const [data, setData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30d");

  const fetchBillingData = async (range: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getBillingDashboardData(range);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to fetch billing data");
        toast.error("Failed to load billing data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Failed to load billing data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData(timeRange);
  }, [timeRange]);

  const handleRefresh = () => {
    fetchBillingData(timeRange);
    toast.success("Billing data refreshed");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert paise to rupees
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
      case "COMPLETED":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
      case "EXPIRED":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading billing data: {error}</span>
        </div>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing & Revenue</h2>
          <p className="text-muted-foreground">
            Comprehensive billing management and revenue analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
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
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
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
          ))
        ) : data ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.metrics.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(data.metrics.revenueInPeriod)} this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.metrics.monthlyRecurringRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {data.metrics.activeSubscriptions} active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.metrics.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  of {data.metrics.totalSubscriptions} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.metrics.churnRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {data.metrics.expiredSubscriptions} expired subscriptions
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>Revenue distribution across subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : data ? (
                  <div className="space-y-4">
                    {data.revenueByPlan.map((plan) => (
                      <div key={plan.plan} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{plan.plan}</Badge>
                            <span className="text-sm font-medium">
                              {formatCurrency(plan.revenue)}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {plan.subscriptions} subscriptions
                          </span>
                        </div>
                        <Progress 
                          value={parseFloat(plan.percentage)} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>Current subscription status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : data ? (
                  <div className="space-y-3">
                    {data.subscriptionsByStatus.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className={`w-3 h-3 rounded-full bg-${status.color}-500`}
                          />
                          <span className="text-sm font-medium">{status.status}</span>
                        </div>
                        <Badge variant="outline">{status.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPayments.slice(0, 5).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.schoolName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.plan}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          {data && <PaymentHistoryChart data={data.monthlyRevenueData} />}
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>Manage all subscriptions across schools</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Subscription management interface will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Complete payment transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.schoolName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.plan}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}