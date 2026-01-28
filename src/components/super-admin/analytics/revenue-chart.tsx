"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface RevenueChartProps {
  timeRange: string;
}

export function RevenueChart({ timeRange }: RevenueChartProps) {
  // Mock data - in real implementation, this would be fetched based on timeRange
  const revenueData = [
    { date: '2024-01-01', revenue: 125000, mrr: 45000, newRevenue: 15000 },
    { date: '2024-01-02', revenue: 130000, mrr: 46000, newRevenue: 18000 },
    { date: '2024-01-03', revenue: 128000, mrr: 45500, newRevenue: 12000 },
    { date: '2024-01-04', revenue: 135000, mrr: 47000, newRevenue: 22000 },
    { date: '2024-01-05', revenue: 142000, mrr: 48500, newRevenue: 25000 },
    { date: '2024-01-06', revenue: 138000, mrr: 48000, newRevenue: 20000 },
    { date: '2024-01-07', revenue: 145000, mrr: 49000, newRevenue: 28000 },
    { date: '2024-01-08', revenue: 150000, mrr: 50000, newRevenue: 30000 },
    { date: '2024-01-09', revenue: 148000, mrr: 49500, newRevenue: 26000 },
    { date: '2024-01-10', revenue: 155000, mrr: 51000, newRevenue: 32000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
        <CardDescription>Total revenue and monthly recurring revenue trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total Revenue Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Total Revenue</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* MRR and New Revenue Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">MRR vs New Revenue</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value, name) => [
                    formatCurrency(value as number), 
                    name === 'mrr' ? 'Monthly Recurring Revenue' : 'New Revenue'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="mrr" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="newRevenue" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(revenueData[revenueData.length - 1].revenue)}
              </div>
              <div className="text-sm text-muted-foreground">Latest Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(revenueData[revenueData.length - 1].mrr)}
              </div>
              <div className="text-sm text-muted-foreground">Current MRR</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(revenueData.reduce((sum, item) => sum + item.newRevenue, 0) / revenueData.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg New Revenue</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}