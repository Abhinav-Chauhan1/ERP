"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { subDays, startOfDay } from "date-fns";

interface ChurnAnalysisChartProps {
  timeRange?: string;
}

interface ChurnByPlan {
  planName: string;
  churnRate: number;
  retentionRate: number;
}

interface ChurnData {
  churnRate: number;
  retentionRate: number;
  customerLifetimeValue: number;
  churnByPlan: ChurnByPlan[];
}

export function ChurnAnalysisChart({ timeRange = "30d" }: ChurnAnalysisChartProps) {
  const [data, setData] = useState<ChurnData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : timeRange === "1y" ? 365 : 30;
    const endDate = new Date();
    const startDate = startOfDay(subDays(endDate, days));
    fetch(
      `/api/super-admin/analytics/churn?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    )
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!data) {
    return (
      <Card>
        <CardHeader><CardTitle>Churn Analysis</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-12">Could not load churn data.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Churn Analysis</CardTitle>
        <CardDescription>Customer retention and churn metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.churnRate.toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">Churn Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.retentionRate.toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">Retention Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(data.customerLifetimeValue / 100)}
              </div>
              <div className="text-sm text-muted-foreground">Avg LTV</div>
            </div>
          </div>

          {/* Churn by plan */}
          {data.churnByPlan.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Churn Rate by Plan</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.churnByPlan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="planName" fontSize={12} />
                  <YAxis tickFormatter={v => `${v.toFixed(1)}%`} fontSize={12} />
                  <Tooltip formatter={(v) => [`${(v as number).toFixed(2)}%`]} />
                  <Legend />
                  <Bar dataKey="churnRate" name="Churn %" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="retentionRate" name="Retention %" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.churnByPlan.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No churned subscriptions in this period.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
