"use client";

import { useState, useEffect } from "react";
import { getMessageAnalytics } from "@/lib/actions/messageHistoryActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import {
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  DollarSign,
  Mail,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";

interface AnalyticsData {
  overview: {
    totalMessages: number;
    totalRecipients: number;
    totalSent: number;
    totalFailed: number;
    successRate: number;
  };
  channels: {
    sms: number;
    email: number;
  };
  costs: {
    smsCost: number;
    emailCost: number;
    totalCost: number;
  };
  byType: Array<{
    type: string;
    count: number;
    recipients: number;
    cost: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  recentMessages: Array<{
    id: string;
    messageType: string;
    subject: string | null;
    recipientCount: number;
    sentCount: number;
    status: string;
    totalCost: number;
    sentBy: string;
    sentAt: Date;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function MessageAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined = endOfDay(new Date());

      switch (dateRange) {
        case "today":
          startDate = startOfDay(new Date());
          break;
        case "7days":
          startDate = startOfDay(subDays(new Date(), 7));
          break;
        case "30days":
          startDate = startOfDay(subDays(new Date(), 30));
          break;
        case "3months":
          startDate = startOfDay(subMonths(new Date(), 3));
          break;
        case "all":
          startDate = undefined;
          endDate = undefined;
          break;
      }

      const result = await getMessageAnalytics(startDate, endDate);
      if (result.success && result.data) {
        setAnalytics(result.data as any);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Message Analytics</h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.totalRecipients} recipients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successfully Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.overview.totalSent}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.successRate.toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.overview.totalFailed}
            </div>
            <p className="text-xs text-muted-foreground">
              {(100 - analytics.overview.successRate).toFixed(1)}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.costs.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              SMS: ${analytics.costs.smsCost.toFixed(2)} | Email: $
              {analytics.costs.emailCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Messages</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.channels.sms}</div>
            <p className="text-xs text-muted-foreground">
              Cost: ${analytics.costs.smsCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Messages</CardTitle>
            <Mail className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.channels.email}</div>
            <p className="text-xs text-muted-foreground">
              Cost: ${analytics.costs.emailCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Messages by Type</CardTitle>
            <CardDescription>Distribution of message types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.byType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Messages by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Messages by Status</CardTitle>
            <CardDescription>Delivery status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Last 10 messages sent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {message.subject || "No subject"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {message.messageType} • {message.recipientCount} recipients •{" "}
                    {message.sentCount} sent • {message.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent by {message.sentBy} on{" "}
                    {format(new Date(message.sentAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${message.totalCost.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
