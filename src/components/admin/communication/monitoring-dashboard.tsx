'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, CheckCircle2, Clock, MessageSquare, RefreshCw, TrendingUp, XCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRealTimeMetrics, getChannelHealth, getErrorLogsAction, getErrorStatisticsAction, getErrorTimeSeriesData, getMessageTimeSeriesData, resolveErrorAction, type RealTimeMetrics, type ChannelHealth } from '@/lib/actions/monitoringActions';
import { CommunicationChannel } from '@prisma/client';
import { SimpleLineChart, MultiBarChart } from '@/components/ui/charts';
import { format, subDays } from 'date-fns';

const CHANNEL_COLORS = { SMS: '#3b82f6', WHATSAPP: '#10b981', EMAIL: '#f59e0b', IN_APP: '#8b5cf6' };
const SEVERITY_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' };
const AUTO_REFRESH_INTERVAL = 30000;

export default function MonitoringDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [channelHealth, setChannelHealth] = useState<ChannelHealth[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [errorTimeSeries, setErrorTimeSeries] = useState<any[]>([]);
  const [messageTimeSeries, setMessageTimeSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadDashboardData = useCallback(async function () {
    try {
      setLoading(true);
      const now = new Date();
      const last7Days = subDays(now, 7);
      const [metricsData, healthData, errorLogsData, errorStatsData, errorTimeSeriesData, messageTimeSeriesData] = await Promise.all([
        getRealTimeMetrics(), getChannelHealth(), getErrorLogsAction({ limit: 10, resolved: false }),
        getErrorStatisticsAction(last7Days, now), getErrorTimeSeriesData(last7Days, now), getMessageTimeSeriesData(last7Days, now),
      ]);
      setMetrics(metricsData); setChannelHealth(healthData); setErrorLogs(errorLogsData.logs);
      setErrorStats(errorStatsData); setErrorTimeSeries(errorTimeSeriesData); setMessageTimeSeries(messageTimeSeriesData);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load dashboard data', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [toast]);

  const refreshData = useCallback(async function () {
    try { setRefreshing(true); await loadDashboardData(); } catch (error: any) { console.error('Error refreshing data:', error); } finally { setRefreshing(false); }
  }, [loadDashboardData]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { refreshData(); }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  async function handleResolveError(errorId: string) {
    try {
      await resolveErrorAction(errorId);
      toast({ title: 'Success', description: 'Error marked as resolved' });
      const errorLogsData = await getErrorLogsAction({ limit: 10, resolved: false });
      setErrorLogs(errorLogsData.logs);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to resolve error', variant: 'destructive' });
    }
  }

  function getHealthStatusColor(status: string): string {
    switch (status) { case 'healthy': return 'bg-green-500'; case 'degraded': return 'bg-yellow-500'; case 'down': return 'bg-red-500'; default: return 'bg-gray-500'; }
  }

  function getHealthStatusIcon(status: string) {
    switch (status) { case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-500" />; case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />; case 'down': return <XCircle className="h-5 w-5 text-red-500" />; default: return <Activity className="h-5 w-5 text-gray-500" />; }
  }

  if (loading || !metrics) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? 'default' : 'outline'}>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</Badge>
          <span className="text-sm text-muted-foreground">Last updated: {format(new Date(), 'HH:mm:ss')}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>{autoRefresh ? 'Disable' : 'Enable'} Auto-refresh</Button>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Messages (24h)</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.messagesLast24Hours.toLocaleString()}</div><p className="text-xs text-muted-foreground">{metrics.messagesLastHour} in last hour</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Errors (24h)</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.errorsLast24Hours.toLocaleString()}</div><p className="text-xs text-muted-foreground">{metrics.errorRate.toFixed(2)}% error rate</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Delivery Rate</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.deliveryRateLast24Hours.toFixed(1)}%</div><p className="text-xs text-muted-foreground">Avg: {metrics.averageDeliveryTime.toFixed(1)}s</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Critical Errors</CardTitle><XCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">{metrics.criticalErrors}</div><p className="text-xs text-muted-foreground">Requires immediate attention</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Channel Health Status</CardTitle><CardDescription>Real-time status of all communication channels</CardDescription></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{channelHealth.map((h) => (<div key={h.channel} className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center gap-3">{getHealthStatusIcon(h.status)}<div><div className="font-medium">{h.channel}</div><div className="text-sm text-muted-foreground">{h.deliveryRate.toFixed(1)}% delivery</div></div></div><Badge variant={h.status === 'healthy' ? 'default' : 'destructive'} className={getHealthStatusColor(h.status)}>{h.status}</Badge></div>))}</div></CardContent></Card>
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList><TabsTrigger value="messages">Message Volume</TabsTrigger><TabsTrigger value="errors">Error Trends</TabsTrigger><TabsTrigger value="stats">Statistics</TabsTrigger></TabsList>
        <TabsContent value="messages" className="space-y-4"><Card><CardHeader><CardTitle>Message Volume (Last 7 Days)</CardTitle><CardDescription>Daily message count by channel</CardDescription></CardHeader><CardContent><SimpleLineChart data={messageTimeSeries} lines={[{ dataKey: 'SMS', stroke: CHANNEL_COLORS.SMS, name: 'SMS' }, { dataKey: 'WHATSAPP', stroke: CHANNEL_COLORS.WHATSAPP, name: 'WhatsApp' }, { dataKey: 'EMAIL', stroke: CHANNEL_COLORS.EMAIL, name: 'Email' }, { dataKey: 'IN_APP', stroke: CHANNEL_COLORS.IN_APP, name: 'In-App' }]} xAxisKey="date" height={300} /></CardContent></Card></TabsContent>
        <TabsContent value="errors" className="space-y-4"><Card><CardHeader><CardTitle>Error Trends (Last 7 Days)</CardTitle><CardDescription>Daily error count by severity</CardDescription></CardHeader><CardContent><MultiBarChart data={errorTimeSeries} bars={[{ dataKey: 'critical', fill: SEVERITY_COLORS.CRITICAL, name: 'Critical', stackId: 'a' }, { dataKey: 'high', fill: SEVERITY_COLORS.HIGH, name: 'High', stackId: 'a' }, { dataKey: 'medium', fill: SEVERITY_COLORS.MEDIUM, name: 'Medium', stackId: 'a' }, { dataKey: 'low', fill: SEVERITY_COLORS.LOW, name: 'Low', stackId: 'a' }]} xAxisKey="date" height={300} /></CardContent></Card></TabsContent>
        <TabsContent value="stats" className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Errors by Category</CardTitle><CardDescription>Distribution of error types</CardDescription></CardHeader><CardContent><div className="space-y-2">{errorStats?.errorsByCategory.map((s: any) => (<div key={s.category} className="flex items-center justify-between"><span className="text-sm">{s.category}</span><div className="flex items-center gap-2"><div className="w-32 bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${s.percentage}%` }} /></div><span className="text-sm font-medium w-12 text-right">{s.count}</span></div></div>))}</div></CardContent></Card><Card><CardHeader><CardTitle>Errors by Severity</CardTitle><CardDescription>Distribution by severity level</CardDescription></CardHeader><CardContent><div className="space-y-2">{errorStats?.errorsBySeverity.map((s: any) => (<div key={s.severity} className="flex items-center justify-between"><Badge variant="outline" style={{ borderColor: SEVERITY_COLORS[s.severity as keyof typeof SEVERITY_COLORS], color: SEVERITY_COLORS[s.severity as keyof typeof SEVERITY_COLORS] }}>{s.severity}</Badge><div className="flex items-center gap-2"><div className="w-32 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${s.percentage}%`, backgroundColor: SEVERITY_COLORS[s.severity as keyof typeof SEVERITY_COLORS] }} /></div><span className="text-sm font-medium w-12 text-right">{s.count}</span></div></div>))}</div></CardContent></Card></div></TabsContent>
      </Tabs>
      <Card><CardHeader><CardTitle>Recent Unresolved Errors</CardTitle><CardDescription>Latest errors requiring attention</CardDescription></CardHeader><CardContent>{errorLogs.length === 0 ? (<div className="text-center py-8 text-muted-foreground"><CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" /><p>No unresolved errors</p></div>) : (<div className="space-y-4">{errorLogs.map((e) => (<div key={e.id} className="flex items-start justify-between p-4 border rounded-lg"><div className="flex-1"><div className="flex items-center gap-2 mb-2"><Badge variant="outline" style={{ borderColor: SEVERITY_COLORS[e.severity as keyof typeof SEVERITY_COLORS], color: SEVERITY_COLORS[e.severity as keyof typeof SEVERITY_COLORS] }}>{e.severity}</Badge><Badge variant="outline">{e.category}</Badge>{e.channel && (<Badge style={{ backgroundColor: CHANNEL_COLORS[e.channel as keyof typeof CHANNEL_COLORS] }}>{e.channel}</Badge>)}</div><p className="font-medium mb-1">{e.message}</p>{e.errorCode && (<p className="text-sm text-muted-foreground">Error Code: {e.errorCode}</p>)}<p className="text-xs text-muted-foreground mt-2">{format(new Date(e.createdAt), 'PPpp')}</p></div><Button variant="outline" size="sm" onClick={() => handleResolveError(e.id)}>Resolve</Button></div>))}</div>)}</CardContent></Card>
    </div>
  );
}
