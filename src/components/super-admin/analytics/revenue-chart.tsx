"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { subDays, startOfDay } from "date-fns";

interface RevenueChartProps {
  timeRange: string;
}

interface RevenueTrend {
  period: string;
  revenue: number;
  subscriptions: number;
}

export function RevenueChart({ timeRange }: RevenueChartProps) {
  const [data, setData] = useState<RevenueTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : timeRange === "1y" ? 365 : 30;
    const endDate = new Date();
    const startDate = startOfDay(subDays(endDate, days));
    fetch(
      `/api/super-admin/analytics/revenue?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    )
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { revenueTrends?: RevenueTrend[] }) => setData(d.revenueTrends ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(value / 100);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
          <CardDescription>Total revenue and MRR trends</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">No payment data yet — revenue trends will appear once schools pay via Cashfree.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
        <CardDescription>Monthly revenue collected from payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Revenue Collected (INR)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis tickFormatter={v => formatCurrency(v)} fontSize={12} />
                <Tooltip formatter={(v) => [formatCurrency(v as number), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#93c5fd" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-3">Active Subscriptions</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => [v, "Subscriptions"]} />
                <Line type="monotone" dataKey="subscriptions" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
