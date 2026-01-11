"use client";

import { useState, useEffect, useCallback } from "react";
import { getMessageAnalytics } from "@/lib/actions/messageHistoryActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimpleBarChart, SimplePieChart } from "@/components/ui/charts";
import { MessageSquare, CheckCircle, XCircle, DollarSign, Mail, Smartphone } from "lucide-react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";

interface AnalyticsData {
  overview: { totalMessages: number; totalRecipients: number; totalSent: number; totalFailed: number; successRate: number };
  channels: { sms: number; email: number };
  costs: { smsCost: number; emailCost: number; totalCost: number };
  byType: Array<{ type: string; count: number; recipients: number; cost: number }>;
  byStatus: Array<{ status: string; count: number }>;
  recentMessages: Array<{ id: string; messageType: string; subject: string | null; recipientCount: number; sentCount: number; status: string; totalCost: number; sentBy: string; sentAt: Date }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function MessageAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined = endOfDay(new Date());
      switch (dateRange) {
        case "today": startDate = startOfDay(new Date()); break;
        case "7days": startDate = startOfDay(subDays(new Date(), 7)); break;
        case "30days": startDate = startOfDay(subDays(new Date(), 30)); break;
        case "3months": startDate = startOfDay(subMonths(new Date(), 3)); break;
        case "all": startDate = undefined; endDate = undefined; break;
      }
      const result = await getMessageAnalytics(startDate, endDate);
      if (result.success && result.data) setAnalytics(result.data as any);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  if (loading) return <div className="text-center py-8">Loading analytics...</div>;
  if (!analytics) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Message Analytics</h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select period" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Messages</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.overview.totalMessages}</div><p className="text-xs text-muted-foreground">{analytics.overview.totalRecipients} recipients</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Successfully Sent</CardTitle><CheckCircle className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{analytics.overview.totalSent}</div><p className="text-xs text-muted-foreground">{analytics.overview.successRate.toFixed(1)}% success rate</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Failed</CardTitle><XCircle className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{analytics.overview.totalFailed}</div><p className="text-xs text-muted-foreground">{(100 - analytics.overview.successRate).toFixed(1)}% failure rate</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Cost</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{analytics.costs.totalCost.toFixed(2)}</div><p className="text-xs text-muted-foreground">SMS: ₹{analytics.costs.smsCost.toFixed(2)} | Email: ₹{analytics.costs.emailCost.toFixed(2)}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">SMS Messages</CardTitle><Smartphone className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.channels.sms}</div><p className="text-xs text-muted-foreground">Cost: ₹{analytics.costs.smsCost.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Email Messages</CardTitle><Mail className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.channels.email}</div><p className="text-xs text-muted-foreground">Cost: ₹{analytics.costs.emailCost.toFixed(2)}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Messages by Type</CardTitle><CardDescription>Distribution of message types</CardDescription></CardHeader><CardContent><SimplePieChart data={analytics.byType} dataKey="count" nameKey="type" colors={COLORS} height={300} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Messages by Status</CardTitle><CardDescription>Delivery status breakdown</CardDescription></CardHeader><CardContent><SimpleBarChart data={analytics.byStatus} dataKey="count" xAxisKey="status" fill="#8884d8" height={300} legendLabel="Messages" /></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Recent Messages</CardTitle><CardDescription>Last 10 messages sent</CardDescription></CardHeader><CardContent><div className="space-y-4">{analytics.recentMessages.map((m) => (<div key={m.id} className="flex items-center justify-between border-b pb-4 last:border-0"><div className="space-y-1"><p className="font-medium">{m.subject || "No subject"}</p><p className="text-sm text-muted-foreground">{m.messageType} • {m.recipientCount} recipients • {m.sentCount} sent • {m.status}</p><p className="text-xs text-muted-foreground">Sent by {m.sentBy} on {format(new Date(m.sentAt), "MMM dd, yyyy HH:mm")}</p></div><div className="text-right"><p className="font-medium">₹{m.totalCost.toFixed(2)}</p></div></div>))}</div></CardContent></Card>
    </div>
  );
}
