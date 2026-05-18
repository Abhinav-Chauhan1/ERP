"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  Settings,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";

// ── API response types ──────────────────────────────────────────────────────

interface ComponentHealth {
  component: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  responseTime?: number;
  errorRate?: number;
  lastChecked: string;
}

interface HealthData {
  overall: "HEALTHY" | "DEGRADED" | "DOWN";
  components: ComponentHealth[];
  uptime: number; // seconds
  responseTime: number; // ms
}

interface AlertItem {
  id: string;
  alertType: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  title: string;
  description: string;
  isResolved: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface PerfMetrics {
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface PerfData {
  metrics: PerfMetrics;
  trends: {
    responseTime: TrendPoint[];
    throughput: TrendPoint[];
    errorRate: TrendPoint[];
  };
  bottlenecks: Array<{
    component: string;
    type: string;
    severity: string;
    description: string;
  }>;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_HEALTH: HealthData = {
  overall: "HEALTHY",
  components: [],
  uptime: 0,
  responseTime: 0,
};

const DEFAULT_PERF: PerfData = {
  metrics: {
    averageResponseTime: 0,
    throughput: 0,
    errorRate: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
  },
  trends: { responseTime: [], throughput: [], errorRate: [] },
  bottlenecks: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getTimeRangeDates(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date(endDate);
  if (range === "6h") startDate.setHours(startDate.getHours() - 6);
  else if (range === "24h") startDate.setDate(startDate.getDate() - 1);
  else if (range === "7d") startDate.setDate(startDate.getDate() - 7);
  else startDate.setHours(startDate.getHours() - 1);
  return { startDate, endDate };
}

function metricStatus(value: number, warn: number, crit: number) {
  if (value >= crit) return "CRITICAL";
  if (value >= warn) return "WARNING";
  return "GOOD";
}

function metricStatusColor(status: string) {
  if (status === "CRITICAL") return "text-red-600";
  if (status === "WARNING") return "text-yellow-600";
  return "text-green-600";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MonitoringDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [isLoading, setIsLoading] = useState(true);
  const [health, setHealth] = useState<HealthData>(DEFAULT_HEALTH);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [perf, setPerf] = useState<PerfData>(DEFAULT_PERF);

  const fetchAll = useCallback(async (range: string) => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getTimeRangeDates(range);
      const [healthRes, alertsRes, perfRes] = await Promise.all([
        fetch("/api/super-admin/monitoring/health"),
        fetch("/api/super-admin/monitoring/alerts?isResolved=false&limit=20"),
        fetch(
          `/api/super-admin/monitoring/performance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        ),
      ]);
      if (healthRes.ok) setHealth(await healthRes.json());
      if (alertsRes.ok) {
        const d = await alertsRes.json();
        setAlerts(d.alerts ?? []);
      }
      if (perfRes.ok) {
        const d = await perfRes.json();
        if (d.success && d.data) setPerf(d.data);
      }
    } catch (err) {
      console.error("Monitoring fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(selectedTimeRange);
  }, [fetchAll, selectedTimeRange]);

  const handleRefreshData = () => fetchAll(selectedTimeRange);

  // ── Derived values ──────────────────────────────────────────────────────────

  const systemMetrics = [
    {
      name: "CPU Usage",
      value: Math.round(perf.metrics.cpuUsage),
      unit: "%",
      warn: 70,
      crit: 85,
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      name: "Memory Usage",
      value: Math.round(perf.metrics.memoryUsage),
      unit: "%",
      warn: 75,
      crit: 90,
      icon: <MemoryStick className="h-4 w-4" />,
    },
    {
      name: "Disk Usage",
      value: Math.round(perf.metrics.diskUsage),
      unit: "%",
      warn: 80,
      crit: 95,
      icon: <HardDrive className="h-4 w-4" />,
    },
    {
      name: "Response Time",
      value: Math.round(perf.metrics.averageResponseTime),
      unit: "ms",
      warn: 500,
      crit: 1000,
      icon: <Wifi className="h-4 w-4" />,
    },
  ].map((m) => ({ ...m, status: metricStatus(m.value, m.warn, m.crit) }));

  // Build chart data from performance trends (align all three by responseTime timestamps)
  const chartData = perf.trends.responseTime.map((pt, i) => ({
    time: new Date(pt.timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    responseTime: pt.value,
    throughput: perf.trends.throughput[i]?.value ?? 0,
    errorRate: perf.trends.errorRate[i]?.value ?? 0,
  }));

  const alertStats = {
    total: alerts.length,
    active: alerts.filter((a) => !a.isResolved).length,
    critical: alerts.filter((a) => a.severity === "CRITICAL").length,
    warning: alerts.filter((a) => a.severity === "WARNING" || a.severity === "ERROR").length,
  };

  const healthColor =
    health.overall === "HEALTHY"
      ? "from-green-600 to-green-700"
      : health.overall === "DEGRADED"
      ? "from-orange-600 to-orange-700"
      : "from-red-600 to-red-700";

  const severityBadgeVariant = (sev: string): "default" | "secondary" | "destructive" | "outline" => {
    if (sev === "CRITICAL" || sev === "ERROR") return "destructive";
    if (sev === "WARNING") return "secondary";
    return "outline";
  };

  const severityIconColor = (sev: string) => {
    if (sev === "CRITICAL") return "text-red-600";
    if (sev === "ERROR") return "text-red-500";
    if (sev === "WARNING") return "text-yellow-600";
    return "text-blue-500";
  };

  const componentStatusBadge = (status: string): "default" | "secondary" | "destructive" => {
    if (status === "HEALTHY") return "default";
    if (status === "DEGRADED") return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            System Monitoring
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isLoading}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={`relative overflow-hidden bg-gradient-to-br ${healthColor} text-white border-0 shadow-xl`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">System Health</p>
                <p className="text-3xl font-bold">{health.overall}</p>
                <p className="text-white/60 text-xs mt-1">Overall system status</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Uptime</p>
                <p className="text-3xl font-bold">
                  {isLoading ? "—" : formatUptime(health.uptime)}
                </p>
                <p className="text-green-200 text-xs mt-1">Since last restart</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Avg Response</p>
                <p className="text-3xl font-bold">
                  {isLoading ? "—" : `${Math.round(health.responseTime)}ms`}
                </p>
                <p className="text-blue-200 text-xs mt-1">Across all components</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Active Alerts</p>
                <p className="text-3xl font-bold">{isLoading ? "—" : alertStats.active}</p>
                <p className="text-red-200 text-xs mt-1">{alertStats.critical} critical</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* ── Metrics Tab ── */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {metric.icon}
                    {metric.status === "CRITICAL" || metric.status === "WARNING" ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metricStatusColor(metric.status)}`}>
                    {metric.value === 0 && isLoading ? "—" : `${metric.value}${metric.unit}`}
                  </div>
                  <div className="mt-2">
                    <Progress value={metric.unit === "ms" ? Math.min((metric.value / metric.crit) * 100, 100) : metric.value} className="h-2" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Warn: {metric.warn}{metric.unit}</span>
                    <span>Crit: {metric.crit}{metric.unit}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                {chartData.length > 0
                  ? "Response time, throughput, and error rate over the selected period"
                  : "No performance data recorded for this period"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No metrics data for this time window.</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} name="Response Time (ms)" />
                    <Line type="monotone" dataKey="throughput" stroke="#10b981" strokeWidth={2} name="Throughput (req/s)" />
                    <Line type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2} name="Error Rate (%)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Alerts Tab ── */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alertStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{alertStats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warning / Error</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{alertStats.warning}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                {alerts.length > 0
                  ? `${alerts.length} unresolved alert${alerts.length !== 1 ? "s" : ""}`
                  : "No active alerts — system is operating normally"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No active alerts.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <AlertTriangle className={`h-5 w-5 ${severityIconColor(alert.severity)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant={severityBadgeVariant(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Type: {alert.alertType}</span>
                          <span>
                            {new Date(alert.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Performance Tab ── */}
        <TabsContent value="performance" className="space-y-4">
          {/* Bottlenecks */}
          {perf.bottlenecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Detected Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {perf.bottlenecks.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant={b.severity === "CRITICAL" || b.severity === "HIGH" ? "destructive" : "secondary"}>
                        {b.severity}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{b.component} — {b.type}</p>
                        <p className="text-xs text-muted-foreground">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
                <CardDescription>API response time over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                    No data for this window
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="responseTime"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        name="Response Time (ms)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Throughput & Error Rate</CardTitle>
                <CardDescription>Request throughput and error rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                    No data for this window
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="throughput"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Throughput (req/s)"
                      />
                      <Line
                        type="monotone"
                        dataKey="errorRate"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Error Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Period Summary</CardTitle>
              <CardDescription>Average metrics for the selected time range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Avg Response Time", value: `${Math.round(perf.metrics.averageResponseTime)} ms` },
                  { label: "Throughput", value: `${perf.metrics.throughput.toFixed(1)} req/s` },
                  { label: "Error Rate", value: `${perf.metrics.errorRate.toFixed(2)}%` },
                  { label: "CPU Usage", value: `${Math.round(perf.metrics.cpuUsage)}%` },
                  { label: "Memory Usage", value: `${Math.round(perf.metrics.memoryUsage)}%` },
                  { label: "Disk Usage", value: `${Math.round(perf.metrics.diskUsage)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Services Tab ── */}
        <TabsContent value="services" className="space-y-4">
          {health.components.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Server className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{isLoading ? "Loading services…" : "No component health data available."}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {health.components.map((comp) => (
                <Card key={comp.component}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{comp.component}</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status</span>
                        <Badge variant={componentStatusBadge(comp.status)}>{comp.status}</Badge>
                      </div>
                      {comp.responseTime !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Response Time</span>
                          <span className="text-sm font-mono">{comp.responseTime}ms</span>
                        </div>
                      )}
                      {comp.errorRate !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Error Rate</span>
                          <span className="text-sm">{comp.errorRate.toFixed(2)}%</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Checked</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comp.lastChecked).toLocaleTimeString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
