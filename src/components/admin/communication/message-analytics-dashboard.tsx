'use client';

/**
 * Message Analytics Dashboard Component
 * 
 * Interactive dashboard for viewing message analytics with:
 * - Date range filtering
 * - Channel filtering
 * - Message count charts
 * - Cost comparison charts
 * - Delivery statistics
 * - Export functionality
 * 
 * Requirements: 15.2, 15.4, 15.5
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  TrendingUp,
  MessageSquare,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  getMessageAnalytics,
  getMessageTimeSeriesData,
  getCostComparisonData,
  getDeliveryStatistics,
  exportAnalyticsData,
  type AnalyticsSummary,
  type TimeSeriesData
} from '@/lib/actions/messageAnalyticsActions';
import { CommunicationChannel } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import {
  SimpleBarChart,
  SimpleLineChart,
  SimplePieChart,
} from '@/components/ui/charts';

// ============================================================================
// Types
// ============================================================================

interface DateRangeState {
  from: Date;
  to: Date;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_COLORS = {
  SMS: '#3b82f6',
  WHATSAPP: '#10b981',
  EMAIL: '#f59e0b',
  IN_APP: '#8b5cf6'
};

const STATUS_COLORS = {
  DELIVERED: '#10b981',
  SENT: '#3b82f6',
  FAILED: '#ef4444',
  QUEUED: '#f59e0b',
  SENDING: '#8b5cf6',
  READ: '#06b6d4'
};

const PRESET_RANGES = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 }
];

// ============================================================================
// Component
// ============================================================================

export default function MessageAnalyticsDashboard() {
  const { toast } = useToast();

  // State
  const [dateRange, setDateRange] = useState<DateRangeState>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date())
  });
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | 'ALL'>('ALL');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Load analytics data
  const loadAnalytics = useCallback(async function () {
    try {
      setLoading(true);

      const params = {
        startDate: dateRange.from,
        endDate: dateRange.to,
        channel: selectedChannel === 'ALL' ? undefined : selectedChannel
      };

      const [analyticsData, timeSeriesData, deliveryData] = await Promise.all([
        getMessageAnalytics(params),
        getMessageTimeSeriesData(params),
        getDeliveryStatistics(params)
      ]);

      setAnalytics(analyticsData);
      setTimeSeriesData(timeSeriesData);
      setDeliveryStats(deliveryData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, selectedChannel, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  async function handleExport() {
    try {
      setExporting(true);

      const params = {
        startDate: dateRange.from,
        endDate: dateRange.to,
        channel: selectedChannel === 'ALL' ? undefined : selectedChannel
      };

      const data = await exportAnalyticsData(params);

      // Convert to CSV
      const csv = convertToCSV(data.logs);

      // Download file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `message-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export data',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  }

  function convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  function handlePresetRange(days: number) {
    setDateRange({
      from: startOfDay(days === 0 ? new Date() : subDays(new Date(), days)),
      to: endOfDay(new Date())
    });
  }

  if (loading || !analytics) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter analytics by date range and channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Preset Ranges */}
            <div className="flex gap-2">
              {PRESET_RANGES.map(preset => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetRange(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Date Range Picker */}
            <DateRangePicker
              value={{ from: dateRange.from, to: dateRange.to }}
              onValueChange={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({
                    from: startOfDay(range.from),
                    to: endOfDay(range.to)
                  });
                }
              }}
              className="w-auto"
            />

            {/* Channel Filter */}
            <Select value={selectedChannel} onValueChange={(value: any) => setSelectedChannel(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Channels</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="IN_APP">In-App</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button onClick={handleExport} disabled={exporting} className="ml-auto">
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all channels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ₹{analytics.averageCostPerMessage.toFixed(4)} per message
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.deliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.channelBreakdown.length > 0
                ? analytics.channelBreakdown.reduce((max, stat) =>
                  stat.total > max.total ? stat : max
                ).channel
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Primary channel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Message Count by Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Messages by Channel</CardTitle>
                <CardDescription>Distribution across communication channels</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={analytics.channelBreakdown as unknown as { [key: string]: unknown }[]}
                  dataKey="total"
                  xAxisKey="channel"
                  fill="#3b82f6"
                  height={300}
                  legendLabel="Total Messages"
                />
              </CardContent>
            </Card>

            {/* Time Series */}
            <Card>
              <CardHeader>
                <CardTitle>Messages Over Time</CardTitle>
                <CardDescription>Daily message volume</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart
                  data={timeSeriesData as unknown as { [key: string]: unknown }[]}
                  lines={[
                    { dataKey: 'SMS', stroke: CHANNEL_COLORS.SMS, name: 'SMS' },
                    { dataKey: 'WHATSAPP', stroke: CHANNEL_COLORS.WHATSAPP, name: 'WhatsApp' },
                    { dataKey: 'EMAIL', stroke: CHANNEL_COLORS.EMAIL, name: 'Email' },
                    { dataKey: 'IN_APP', stroke: CHANNEL_COLORS.IN_APP, name: 'In-App' },
                  ]}
                  xAxisKey="date"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cost by Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Channel</CardTitle>
                <CardDescription>Total spending per channel</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={analytics.channelBreakdown as unknown as { [key: string]: unknown }[]}
                  dataKey="totalCost"
                  xAxisKey="channel"
                  fill="#10b981"
                  height={300}
                  legendLabel="Total Cost (₹)"
                  formatter={(value) => `₹${value.toFixed(2)}`}
                />
              </CardContent>
            </Card>

            {/* Cost Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Per Message</CardTitle>
                <CardDescription>Comparison of per-message costs</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={(analytics.costComparison || []) as unknown as { [key: string]: unknown }[]}
                  dataKey="costPerMessage"
                  xAxisKey="channel"
                  fill="#f59e0b"
                  height={300}
                  legendLabel="Cost Per Message (₹)"
                  formatter={(value) => `₹${value.toFixed(4)}`}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Delivery Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
                <CardDescription>Message status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <SimplePieChart
                  data={deliveryStats}
                  dataKey="count"
                  nameKey="status"
                  colors={Object.values(STATUS_COLORS)}
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Delivery Rate by Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Rate by Channel</CardTitle>
                <CardDescription>Success rate per channel</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={analytics.channelBreakdown as unknown as { [key: string]: unknown }[]}
                  dataKey="deliveryRate"
                  xAxisKey="channel"
                  fill="#10b981"
                  height={300}
                  legendLabel="Delivery Rate (%)"
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Channel Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Breakdown</CardTitle>
          <CardDescription>Detailed statistics by channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Channel</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-right p-2">Sent</th>
                  <th className="text-right p-2">Delivered</th>
                  <th className="text-right p-2">Failed</th>
                  <th className="text-right p-2">Delivery Rate</th>
                  <th className="text-right p-2">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {analytics.channelBreakdown.map((stat) => (
                  <tr key={stat.channel} className="border-b">
                    <td className="p-2">
                      <Badge style={{ backgroundColor: CHANNEL_COLORS[stat.channel as keyof typeof CHANNEL_COLORS] }}>
                        {stat.channel}
                      </Badge>
                    </td>
                    <td className="text-right p-2">{stat.total.toLocaleString()}</td>
                    <td className="text-right p-2">{stat.sent.toLocaleString()}</td>
                    <td className="text-right p-2">{stat.delivered.toLocaleString()}</td>
                    <td className="text-right p-2">{stat.failed.toLocaleString()}</td>
                    <td className="text-right p-2">{stat.deliveryRate.toFixed(1)}%</td>
                    <td className="text-right p-2">₹{stat.totalCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
