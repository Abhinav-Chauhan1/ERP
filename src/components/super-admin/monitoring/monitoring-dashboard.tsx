"use client";

import { useState } from "react";
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
  Database,
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
  Shield,
  Globe,
  Monitor
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  timestamp: Date;
  source: string;
  category: string;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'UP' | 'DOWN' | 'STABLE';
  history: Array<{ timestamp: Date; value: number }>;
}

export function MonitoringDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real implementation, this would come from API
  const alerts: Alert[] = [
    {
      id: "alert_1",
      title: "High CPU Usage",
      description: "CPU usage has exceeded 85% for the last 5 minutes",
      severity: "HIGH",
      status: "ACTIVE",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      source: "server-01",
      category: "Performance"
    },
    {
      id: "alert_2",
      title: "Database Connection Pool Full",
      description: "Database connection pool is at 95% capacity",
      severity: "CRITICAL",
      status: "ACTIVE",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      source: "database",
      category: "Database"
    },
    {
      id: "alert_3",
      title: "Failed Login Attempts",
      description: "Multiple failed login attempts detected from IP 192.168.1.100",
      severity: "MEDIUM",
      status: "ACKNOWLEDGED",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      source: "auth-service",
      category: "Security"
    },
    {
      id: "alert_4",
      title: "Disk Space Low",
      description: "Disk space on /var/log is below 10%",
      severity: "HIGH",
      status: "RESOLVED",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      source: "server-01",
      category: "Storage"
    }
  ];

  const systemMetrics: SystemMetric[] = [
    {
      name: "CPU Usage",
      value: 68,
      unit: "%",
      status: "WARNING",
      threshold: { warning: 70, critical: 85 },
      trend: "UP",
      history: [
        { timestamp: new Date(Date.now() - 60 * 60 * 1000), value: 45 },
        { timestamp: new Date(Date.now() - 50 * 60 * 1000), value: 52 },
        { timestamp: new Date(Date.now() - 40 * 60 * 1000), value: 58 },
        { timestamp: new Date(Date.now() - 30 * 60 * 1000), value: 62 },
        { timestamp: new Date(Date.now() - 20 * 60 * 1000), value: 65 },
        { timestamp: new Date(Date.now() - 10 * 60 * 1000), value: 68 },
      ]
    },
    {
      name: "Memory Usage",
      value: 72,
      unit: "%",
      status: "WARNING",
      threshold: { warning: 75, critical: 90 },
      trend: "STABLE",
      history: [
        { timestamp: new Date(Date.now() - 60 * 60 * 1000), value: 70 },
        { timestamp: new Date(Date.now() - 50 * 60 * 1000), value: 71 },
        { timestamp: new Date(Date.now() - 40 * 60 * 1000), value: 72 },
        { timestamp: new Date(Date.now() - 30 * 60 * 1000), value: 73 },
        { timestamp: new Date(Date.now() - 20 * 60 * 1000), value: 71 },
        { timestamp: new Date(Date.now() - 10 * 60 * 1000), value: 72 },
      ]
    },
    {
      name: "Disk Usage",
      value: 45,
      unit: "%",
      status: "GOOD",
      threshold: { warning: 80, critical: 95 },
      trend: "DOWN",
      history: [
        { timestamp: new Date(Date.now() - 60 * 60 * 1000), value: 48 },
        { timestamp: new Date(Date.now() - 50 * 60 * 1000), value: 47 },
        { timestamp: new Date(Date.now() - 40 * 60 * 1000), value: 46 },
        { timestamp: new Date(Date.now() - 30 * 60 * 1000), value: 46 },
        { timestamp: new Date(Date.now() - 20 * 60 * 1000), value: 45 },
        { timestamp: new Date(Date.now() - 10 * 60 * 1000), value: 45 },
      ]
    },
    {
      name: "Network Latency",
      value: 12,
      unit: "ms",
      status: "GOOD",
      threshold: { warning: 50, critical: 100 },
      trend: "STABLE",
      history: [
        { timestamp: new Date(Date.now() - 60 * 60 * 1000), value: 11 },
        { timestamp: new Date(Date.now() - 50 * 60 * 1000), value: 12 },
        { timestamp: new Date(Date.now() - 40 * 60 * 1000), value: 13 },
        { timestamp: new Date(Date.now() - 30 * 60 * 1000), value: 12 },
        { timestamp: new Date(Date.now() - 20 * 60 * 1000), value: 11 },
        { timestamp: new Date(Date.now() - 10 * 60 * 1000), value: 12 },
      ]
    }
  ];

  const performanceData = [
    { time: '00:00', cpu: 45, memory: 70, disk: 48, network: 11 },
    { time: '00:10', cpu: 52, memory: 71, disk: 47, network: 12 },
    { time: '00:20', cpu: 58, memory: 72, disk: 46, network: 13 },
    { time: '00:30', cpu: 62, memory: 73, disk: 46, network: 12 },
    { time: '00:40', cpu: 65, memory: 71, disk: 45, network: 11 },
    { time: '00:50', cpu: 68, memory: 72, disk: 45, network: 12 },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'HIGH':
        return 'destructive';
      case 'CRITICAL':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'destructive';
      case 'ACKNOWLEDGED':
        return 'secondary';
      case 'RESOLVED':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'GOOD':
        return 'text-green-600';
      case 'WARNING':
        return 'text-yellow-600';
      case 'CRITICAL':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="h-3 w-3 text-red-600" />;
      case 'DOWN':
        return <TrendingDown className="h-3 w-3 text-green-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'CPU Usage':
        return <Cpu className="h-4 w-4" />;
      case 'Memory Usage':
        return <MemoryStick className="h-4 w-4" />;
      case 'Disk Usage':
        return <HardDrive className="h-4 w-4" />;
      case 'Network Latency':
        return <Wifi className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'ACTIVE').length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    acknowledged: alerts.filter(a => a.status === 'ACKNOWLEDGED').length,
  };

  const systemHealth = {
    overall: 'WARNING', // Based on metrics
    uptime: '99.97%',
    responseTime: '145ms',
    throughput: '1,250 req/min',
  };

  return (
    <div className="space-y-8">
      {/* Premium Header */}
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
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Premium System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/90 to-orange-700/90" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">System Health</p>
                <p className="text-3xl font-bold">{systemHealth.overall}</p>
                <p className="text-orange-200 text-xs mt-1">Overall system status</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 to-green-700/90" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Uptime</p>
                <p className="text-3xl font-bold">{systemHealth.uptime}</p>
                <p className="text-green-200 text-xs mt-1">Last 30 days</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-700/90" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Response Time</p>
                <p className="text-3xl font-bold">{systemHealth.responseTime}</p>
                <p className="text-blue-200 text-xs mt-1">Average response time</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/90 to-red-700/90" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Active Alerts</p>
                <p className="text-3xl font-bold">{alertStats.active}</p>
                <p className="text-red-200 text-xs mt-1">{alertStats.critical} critical alerts</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Content */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {/* System Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {getMetricIcon(metric.name)}
                    {getTrendIcon(metric.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                    {metric.value}{metric.unit}
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={metric.value} 
                      className="h-2"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Warning: {metric.threshold.warning}{metric.unit}</span>
                    <span>Critical: {metric.threshold.critical}{metric.unit}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>System Metrics Trend</CardTitle>
              <CardDescription>Real-time system performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Memory %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="disk" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Disk %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="network" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Network ms"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Stats */}
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
                <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
                <CheckCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{alertStats.acknowledged}</div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.severity === 'CRITICAL' ? 'text-red-600' :
                        alert.severity === 'HIGH' ? 'text-red-500' :
                        alert.severity === 'MEDIUM' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        <Badge variant={getStatusColor(alert.status) as any}>
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Source: {alert.source}</span>
                        <span>Category: {alert.category}</span>
                        <span>Time: {alert.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="outline" size="sm">
                        {alert.status === 'ACTIVE' ? 'Acknowledge' : 'View'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
                <CardDescription>System resource utilization over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="cpu" 
                      stackId="1"
                      stroke="#ef4444" 
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="CPU %"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="memory" 
                      stackId="2"
                      stroke="#f59e0b" 
                      fill="#f59e0b"
                      fillOpacity={0.6}
                      name="Memory %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network & Disk Performance</CardTitle>
                <CardDescription>I/O performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="disk" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Disk %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="network" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Network ms"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Web Server', status: 'RUNNING', uptime: '15d 4h 23m', cpu: 12, memory: 256 },
              { name: 'Database', status: 'RUNNING', uptime: '15d 4h 23m', cpu: 25, memory: 1024 },
              { name: 'Redis Cache', status: 'RUNNING', uptime: '15d 4h 23m', cpu: 3, memory: 128 },
              { name: 'Message Queue', status: 'RUNNING', uptime: '15d 4h 23m', cpu: 8, memory: 64 },
              { name: 'File Storage', status: 'WARNING', uptime: '2d 1h 15m', cpu: 5, memory: 32 },
              { name: 'Backup Service', status: 'STOPPED', uptime: '0m', cpu: 0, memory: 0 },
            ].map((service) => (
              <Card key={service.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge variant={
                        service.status === 'RUNNING' ? 'default' :
                        service.status === 'WARNING' ? 'secondary' :
                        'destructive'
                      }>
                        {service.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime:</span>
                      <span className="text-sm font-mono">{service.uptime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU:</span>
                      <span className="text-sm">{service.cpu}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory:</span>
                      <span className="text-sm">{service.memory}MB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}