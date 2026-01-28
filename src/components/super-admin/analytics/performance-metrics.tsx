"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Clock, 
  Shield, 
  TrendingUp, 
  Server, 
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export function PerformanceMetrics() {
  // Mock data - in real implementation, this would be fetched based on timeRange
  const performanceData = {
    systemHealth: {
      uptime: 99.97,
      responseTime: 145, // ms
      errorRate: 0.03,
      throughput: 1250, // requests per minute
    },
    infrastructure: {
      cpuUsage: 68,
      memoryUsage: 72,
      diskUsage: 45,
      networkLatency: 12, // ms
    },
    database: {
      queryTime: 23, // ms
      connectionPool: 85, // % utilization
      cacheHitRate: 94.5,
      indexEfficiency: 92.1,
    },
    security: {
      threatsBlocked: 1247,
      securityScore: 96,
      vulnerabilities: 2,
      lastSecurityScan: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    userExperience: {
      pageLoadTime: 1.2, // seconds
      bounceRate: 12.5,
      sessionDuration: 18.5, // minutes
      userSatisfaction: 4.6, // out of 5
    }
  };

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
    if (value >= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {performanceData.systemHealth.uptime}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.systemHealth.responseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.systemHealth.errorRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Error rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.systemHealth.throughput}
            </div>
            <p className="text-xs text-muted-foreground">
              Requests per minute
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Infrastructure Performance
          </CardTitle>
          <CardDescription>Server resource utilization and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>CPU Usage</span>
                  <span className={`font-medium ${getUsageColor(performanceData.infrastructure.cpuUsage)}`}>
                    {performanceData.infrastructure.cpuUsage}%
                  </span>
                </div>
                <Progress value={performanceData.infrastructure.cpuUsage} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Memory Usage</span>
                  <span className={`font-medium ${getUsageColor(performanceData.infrastructure.memoryUsage)}`}>
                    {performanceData.infrastructure.memoryUsage}%
                  </span>
                </div>
                <Progress value={performanceData.infrastructure.memoryUsage} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Disk Usage</span>
                  <span className={`font-medium ${getUsageColor(performanceData.infrastructure.diskUsage)}`}>
                    {performanceData.infrastructure.diskUsage}%
                  </span>
                </div>
                <Progress value={performanceData.infrastructure.diskUsage} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Network Latency</span>
                </div>
                <span className="text-lg font-bold">{performanceData.infrastructure.networkLatency}ms</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">DB Query Time</span>
                </div>
                <span className="text-lg font-bold">{performanceData.database.queryTime}ms</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Security Score</span>
                </div>
                <span className="text-lg font-bold text-green-600">{performanceData.security.securityScore}/100</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Performance
          </CardTitle>
          <CardDescription>Database optimization and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {performanceData.database.queryTime}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Query Time</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {performanceData.database.cacheHitRate}%
              </div>
              <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {performanceData.database.indexEfficiency}%
              </div>
              <div className="text-sm text-muted-foreground">Index Efficiency</div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {performanceData.database.connectionPool}%
              </div>
              <div className="text-sm text-muted-foreground">Connection Pool</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & User Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Metrics
            </CardTitle>
            <CardDescription>Security monitoring and threat detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Threats Blocked (24h)</span>
                <Badge variant="destructive">{performanceData.security.threatsBlocked}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security Score</span>
                <Badge variant="default">{performanceData.security.securityScore}/100</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Open Vulnerabilities</span>
                <Badge variant={performanceData.security.vulnerabilities > 0 ? "destructive" : "default"}>
                  {performanceData.security.vulnerabilities}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Security Scan</span>
                <span className="text-sm text-muted-foreground">
                  {performanceData.security.lastSecurityScan.toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              User Experience
            </CardTitle>
            <CardDescription>User engagement and satisfaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Page Load Time</span>
                <span className="text-lg font-bold">{performanceData.userExperience.pageLoadTime}s</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bounce Rate</span>
                <span className="text-lg font-bold">{performanceData.userExperience.bounceRate}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Session Duration</span>
                <span className="text-lg font-bold">{performanceData.userExperience.sessionDuration}min</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User Satisfaction</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600">
                    {performanceData.userExperience.userSatisfaction}
                  </span>
                  <span className="text-sm text-muted-foreground">/5.0</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}