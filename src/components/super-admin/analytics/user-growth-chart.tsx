"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface UserGrowthChartProps {
  data: Array<{
    month: string;
    users: number;
  }>;
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  // Transform the data for charts - add mock additional data for visualization
  const userGrowthData = data.map((item, index) => ({
    date: item.month,
    totalUsers: item.users,
    newUsers: Math.floor(item.users * 0.05), // Mock 5% new users
    activeUsers: Math.floor(item.users * 0.85), // Mock 85% active
    churnedUsers: Math.floor(item.users * 0.02), // Mock 2% churned
  }));

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
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
        <CardTitle>User Growth Analytics</CardTitle>
        <CardDescription>User acquisition, retention, and churn metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total Users Growth */}
          <div>
            <h4 className="text-sm font-medium mb-3">Total Users Growth</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatNumber}
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value) => [formatNumber(value as number), 'Total Users']}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalUsers" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* New Users vs Churned Users */}
          <div>
            <h4 className="text-sm font-medium mb-3">New Users vs Churned Users</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatNumber}
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value, name) => [
                    formatNumber(value as number), 
                    name === 'newUsers' ? 'New Users' : 'Churned Users'
                  ]}
                />
                <Bar 
                  dataKey="newUsers" 
                  fill="#10b981" 
                  name="newUsers"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="churnedUsers" 
                  fill="#ef4444" 
                  name="churnedUsers"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Active Users Trend */}
          <div>
            <h4 className="text-sm font-medium mb-3">Active Users Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatNumber}
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value) => [formatNumber(value as number), 'Active Users']}
                />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth Summary */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {formatNumber(userGrowthData[userGrowthData.length - 1].totalUsers)}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {formatNumber(userGrowthData.reduce((sum, item) => sum + item.newUsers, 0))}
              </div>
              <div className="text-sm text-muted-foreground">New Users</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {formatNumber(userGrowthData[userGrowthData.length - 1].activeUsers)}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {((userGrowthData.reduce((sum, item) => sum + item.churnedUsers, 0) / userGrowthData[userGrowthData.length - 1].totalUsers) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Churn Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}