"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function ReceiptAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  const stats = {
    avgTurnaroundTime: 2.3, // days
    rejectionRate: 12.5, // percentage
    totalProcessed: 156,
    pendingOldest: 5, // days
  };

  const turnaroundData = [
    { range: "< 1 day", count: 45 },
    { range: "1-2 days", count: 67 },
    { range: "2-3 days", count: 28 },
    { range: "3-5 days", count: 12 },
    { range: "> 5 days", count: 4 },
  ];

  const rejectionReasons = [
    { reason: "Unclear image", count: 8, percentage: 32 },
    { reason: "Amount mismatch", count: 6, percentage: 24 },
    { reason: "Invalid receipt", count: 5, percentage: 20 },
    { reason: "Missing details", count: 4, percentage: 16 },
    { reason: "Other", count: 2, percentage: 8 },
  ];

  const monthlyTrends = [
    { month: "Jul", verified: 45, rejected: 5, pending: 8 },
    { month: "Aug", verified: 52, rejected: 7, pending: 6 },
    { month: "Sep", verified: 61, rejected: 4, pending: 9 },
    { month: "Oct", verified: 58, rejected: 6, pending: 7 },
    { month: "Nov", verified: 67, rejected: 8, pending: 5 },
    { month: "Dec", verified: 72, rejected: 5, pending: 12 },
  ];

  const agingData = [
    { days: "0-1", count: 8 },
    { days: "1-2", count: 5 },
    { days: "2-3", count: 3 },
    { days: "3-5", count: 2 },
    { days: "> 5", count: 1 },
  ];

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, [timeRange]);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/admin/finance" className="hover:text-gray-900">
          Finance
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/finance/receipt-verification" className="hover:text-gray-900">
          Receipt Verification
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Analytics</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipt Analytics</h1>
          <p className="text-muted-foreground">
            Insights and metrics for receipt verification process
          </p>
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
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              <span>12% faster than last month</span>
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
            <div className="flex items-center text-xs text-red-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>3% higher than last month</span>
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
              Last 30 days
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={turnaroundData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={rejectionReasons}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ reason, percentage }) => `${reason} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {rejectionReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="days" label={{ value: "Days Pending", position: "insideBottom", offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
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
              {rejectionReasons.map((item, index) => (
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
              ))}
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
          <p>• <strong>Reduce turnaround time:</strong> {stats.pendingOldest} receipts have been pending for more than 5 days. Consider prioritizing older receipts.</p>
          <p>• <strong>Improve receipt quality:</strong> 32% of rejections are due to unclear images. Consider adding image quality guidelines on the upload page.</p>
          <p>• <strong>Training opportunity:</strong> Amount mismatches account for 24% of rejections. Students may need clearer instructions on entering payment amounts.</p>
        </CardContent>
      </Card>
    </div>
  );
}
