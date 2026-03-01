"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  SimpleBarChart,
  SimplePieChart,
  SimpleLineChart,
} from "@/components/ui/charts";

export default function ReceiptAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    avgTurnaroundTime: "0",
    rejectionRate: "0",
    totalProcessed: 0,
    pendingOldest: 0,
  });

  const [turnaroundData, setTurnaroundData] = useState<any[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [agingData, setAgingData] = useState<any[]>([]);

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#14b8a6"];

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        // Dynamic import to avoid server-side issues if any, though standard import is fine for server actions
        const { getReceiptAnalytics } = await import("@/lib/actions/receiptWidgetActions");
        const result = await getReceiptAnalytics();

        if (result.success && result.data) {
          setStats(result.data.stats);
          setTurnaroundData(result.data.turnaroundData);
          setRejectionReasons(result.data.rejectionReasons);
          setMonthlyTrends(result.data.monthlyTrends);
          setAgingData(result.data.agingData);
        }
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance/receipt-verification">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Receipt Analytics</h1>
            <p className="text-muted-foreground">
              Insights and metrics for receipt verification process
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <CardDescription>Avg Turnaround Time</CardDescription>
            </div>
            <CardTitle className="text-3xl text-blue-600">
              {stats.avgTurnaroundTime} days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-xs">Time from upload to verification</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <CardDescription>Rejection Rate</CardDescription>
            </div>
            <CardTitle className="text-3xl text-red-600">
              {stats.rejectionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Of total processed receipts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <CardDescription>Total Processed</CardDescription>
            </div>
            <CardTitle className="text-3xl text-green-600">
              {stats.totalProcessed}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Verified or Rejected (Last 30 days)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <CardDescription>Oldest Pending</CardDescription>
            </div>
            <CardTitle className="text-3xl text-amber-600">
              {stats.pendingOldest} days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Needs attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Turnaround Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Turnaround Time</CardTitle>
            <CardDescription>
              Distribution of time taken to verify receipts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={turnaroundData}
              dataKey="count"
              xAxisKey="range"
              fill="#3b82f6"
              height={300}
              legendLabel="Receipts"
            />
          </CardContent>
        </Card>

        {/* Rejection Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Top Rejection Reasons</CardTitle>
            <CardDescription>
              Most common reasons for receipt rejection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rejectionReasons.length > 0 ? (
              <SimplePieChart
                data={rejectionReasons}
                dataKey="count"
                nameKey="reason"
                colors={COLORS}
                height={300}
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No rejection data available
              </div>
            )}

          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Verification Trends</CardTitle>
            <CardDescription>
              Receipt verification activity over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={monthlyTrends}
              lines={[
                { dataKey: "verified", stroke: "#10b981", name: "Verified" },
                { dataKey: "rejected", stroke: "#ef4444", name: "Rejected" },
                { dataKey: "pending", stroke: "#f59e0b", name: "Pending" },
              ]}
              xAxisKey="month"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Pending Receipts Aging */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Receipts Aging</CardTitle>
            <CardDescription>
              How long receipts have been waiting for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={agingData}
              dataKey="count"
              xAxisKey="days"
              fill="#f59e0b"
              height={300}
              legendLabel="Days Pending"
            />
          </CardContent>
        </Card>

        {/* Detailed Rejection Reasons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rejection Reasons Breakdown</CardTitle>
            <CardDescription>
              Detailed view of why receipts are being rejected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rejectionReasons.length > 0 ? (rejectionReasons.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{item.reason}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{item.count} receipts</span>
                    <span className="text-sm font-semibold">{item.percentage}%</span>
                  </div>
                </div>
              ))) : (
                <div className="text-center text-muted-foreground py-4">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <BarChart3 className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          {stats.pendingOldest > 5 && (
            <p>• <strong>Reduce turnaround time:</strong> {stats.pendingOldest} days pending is high. Consider prioritizing older receipts.</p>
          )}
          {Number(stats.rejectionRate) > 10 && (
            <p>• <strong>Improve receipt quality:</strong> High rejection rate ({stats.rejectionRate}%). Check if image quality instructions are clear.</p>
          )}
          {turnaroundData.some((d: any) => d.range === "> 5 days" && d.count > 0) && (
            <p>• <strong>Backlog Alert:</strong> There are receipts pending for more than 5 days.</p>
          )}
          {stats.pendingOldest <= 5 && Number(stats.rejectionRate) <= 10 && (
            <p>• <strong>System Healthy:</strong> Verification metrics are within good ranges.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
