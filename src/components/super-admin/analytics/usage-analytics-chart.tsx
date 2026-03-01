"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export function UsageAnalyticsChart() {
  // Mock data - in real implementation, this would be fetched based on timeRange
  const usageData = [
    { date: '2024-01-01', whatsapp: 45000, sms: 25000, storage: 850, apiCalls: 125000 },
    { date: '2024-01-02', whatsapp: 48000, sms: 27000, storage: 865, apiCalls: 132000 },
    { date: '2024-01-03', whatsapp: 46000, sms: 26000, storage: 870, apiCalls: 128000 },
    { date: '2024-01-04', whatsapp: 52000, sms: 29000, storage: 885, apiCalls: 145000 },
    { date: '2024-01-05', whatsapp: 49000, sms: 28000, storage: 890, apiCalls: 138000 },
    { date: '2024-01-06', whatsapp: 51000, sms: 30000, storage: 905, apiCalls: 142000 },
    { date: '2024-01-07', whatsapp: 54000, sms: 31000, storage: 920, apiCalls: 148000 },
  ];

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
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
        <CardTitle>Usage Analytics</CardTitle>
        <CardDescription>Platform usage metrics across all schools</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Communication Usage */}
          <div>
            <h4 className="text-sm font-medium mb-3">Communication Usage</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={usageData}>
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
                    name === 'whatsapp' ? 'WhatsApp Messages' : 'SMS Messages'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="whatsapp" 
                  stackId="1"
                  stroke="#25d366" 
                  fill="#25d366"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="sms" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Storage Usage */}
          <div>
            <h4 className="text-sm font-medium mb-3">Storage Usage (GB)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}GB`}
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value) => [`${value}GB`, 'Storage Used']}
                />
                <Line 
                  type="monotone" 
                  dataKey="storage" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* API Calls */}
          <div>
            <h4 className="text-sm font-medium mb-3">API Calls</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={usageData}>
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
                  formatter={(value) => [formatNumber(value as number), 'API Calls']}
                />
                <Area 
                  type="monotone" 
                  dataKey="apiCalls" 
                  stroke="#f59e0b" 
                  fill="#f59e0b"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Usage Summary */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {formatNumber(usageData[usageData.length - 1].whatsapp)}
              </div>
              <div className="text-sm text-muted-foreground">WhatsApp Messages</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {formatNumber(usageData[usageData.length - 1].sms)}
              </div>
              <div className="text-sm text-muted-foreground">SMS Messages</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-teal-600">
                {usageData[usageData.length - 1].storage}GB
              </div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">
                {formatNumber(usageData[usageData.length - 1].apiCalls)}
              </div>
              <div className="text-sm text-muted-foreground">API Calls</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}