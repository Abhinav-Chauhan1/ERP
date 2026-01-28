"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export function ChurnAnalysisChart() {
  // Mock data - in real implementation, this would be fetched based on timeRange
  const churnData = [
    { date: '2024-01-01', churnRate: 2.5, newSubscriptions: 12, cancelledSubscriptions: 3, retentionRate: 97.5 },
    { date: '2024-01-02', churnRate: 1.8, newSubscriptions: 15, cancelledSubscriptions: 2, retentionRate: 98.2 },
    { date: '2024-01-03', churnRate: 2.2, newSubscriptions: 10, cancelledSubscriptions: 3, retentionRate: 97.8 },
    { date: '2024-01-04', churnRate: 1.5, newSubscriptions: 18, cancelledSubscriptions: 2, retentionRate: 98.5 },
    { date: '2024-01-05', churnRate: 2.8, newSubscriptions: 8, cancelledSubscriptions: 4, retentionRate: 97.2 },
    { date: '2024-01-06', churnRate: 2.1, newSubscriptions: 14, cancelledSubscriptions: 3, retentionRate: 97.9 },
    { date: '2024-01-07', churnRate: 1.9, newSubscriptions: 16, cancelledSubscriptions: 3, retentionRate: 98.1 },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Churn Analysis</CardTitle>
        <CardDescription>Customer retention and churn metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Churn Rate vs Retention Rate */}
          <div>
            <h4 className="text-sm font-medium mb-3">Churn Rate vs Retention Rate</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatPercentage}
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value, name) => [
                    formatPercentage(value as number), 
                    name === 'churnRate' ? 'Churn Rate' : 'Retention Rate'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="churnRate" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="retentionRate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* New vs Cancelled Subscriptions */}
          <div>
            <h4 className="text-sm font-medium mb-3">New vs Cancelled Subscriptions</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value, name) => [
                    value, 
                    name === 'newSubscriptions' ? 'New Subscriptions' : 'Cancelled Subscriptions'
                  ]}
                />
                <Bar 
                  dataKey="newSubscriptions" 
                  fill="#10b981" 
                  name="newSubscriptions"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="cancelledSubscriptions" 
                  fill="#ef4444" 
                  name="cancelledSubscriptions"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Churn Insights */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Churn Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Payment Issues</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Feature Limitations</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Support Issues</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Competitor Switch</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Other</span>
                    <span className="font-medium">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Retention Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Proactive Support</span>
                    <span className="font-medium text-green-600">+15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Feature Training</span>
                    <span className="font-medium text-green-600">+12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Loyalty Programs</span>
                    <span className="font-medium text-green-600">+8%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Custom Pricing</span>
                    <span className="font-medium text-green-600">+6%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Regular Check-ins</span>
                    <span className="font-medium text-green-600">+4%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Churn Summary */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {formatPercentage(churnData[churnData.length - 1].churnRate)}
              </div>
              <div className="text-sm text-muted-foreground">Current Churn Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {formatPercentage(churnData[churnData.length - 1].retentionRate)}
              </div>
              <div className="text-sm text-muted-foreground">Retention Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {churnData.reduce((sum, item) => sum + item.newSubscriptions, 0)}
              </div>
              <div className="text-sm text-muted-foreground">New Subscriptions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {churnData.reduce((sum, item) => sum + item.cancelledSubscriptions, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Cancellations</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}