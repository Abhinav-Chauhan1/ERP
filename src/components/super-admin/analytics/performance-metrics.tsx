"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Database, Server, Shield } from "lucide-react";

interface ComponentHealth {
  component: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  responseTime?: number;
  errorRate?: number;
  lastChecked: string;
}

interface SystemHealth {
  overall: "HEALTHY" | "DEGRADED" | "DOWN";
  components: ComponentHealth[];
  uptime: number;
  responseTime: number;
}

interface PerformanceData {
  metrics: {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

export function PerformanceMetrics() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    Promise.all([
      fetch("/api/super-admin/monitoring/health").then(r => r.ok ? r.json() : null),
      fetch(`/api/super-admin/monitoring/performance?startDate=${start.toISOString()}&endDate=${end.toISOString()}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([h, p]) => { setHealth(h); setPerf(p); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const statusColor = (s: string) =>
    s === "HEALTHY" ? "text-green-600" : s === "DEGRADED" ? "text-yellow-600" : "text-red-600";

  const usageColor = (pct: number) =>
    pct >= 90 ? "text-red-600" : pct >= 75 ? "text-yellow-600" : "text-green-600";

  return (
    <div className="space-y-4">
      {/* System Health */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Health
            </CardTitle>
            <CardDescription>
              Overall: <span className={statusColor(health.overall)}>{health.overall}</span>
              {" · "}Uptime: {Math.floor(health.uptime / 3600)}h
              {" · "}Avg response: {health.responseTime.toFixed(0)}ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.components.length === 0 && (
                <p className="text-muted-foreground text-sm">No component health data recorded yet.</p>
              )}
              {health.components.map(c => (
                <div key={c.component} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.component}</span>
                  <div className="flex items-center gap-3">
                    {c.responseTime != null && <span className="text-muted-foreground">{c.responseTime.toFixed(0)}ms</span>}
                    <Badge variant={c.status === "HEALTHY" ? "default" : "destructive"}>{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {perf && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Infrastructure Metrics
            </CardTitle>
            <CardDescription>Based on last 24h of recorded metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "CPU Usage", value: perf.metrics.cpuUsage },
                { label: "Memory Usage", value: perf.metrics.memoryUsage },
                { label: "Disk Usage", value: perf.metrics.diskUsage },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className={usageColor(value)}>{value.toFixed(1)}%</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}

              <div className="grid grid-cols-3 gap-4 pt-2 border-t text-center text-sm">
                <div>
                  <div className="font-semibold">{perf.metrics.averageResponseTime.toFixed(0)}ms</div>
                  <div className="text-muted-foreground">Avg Response</div>
                </div>
                <div>
                  <div className="font-semibold">{perf.metrics.throughput.toFixed(1)}/s</div>
                  <div className="text-muted-foreground">Throughput</div>
                </div>
                <div>
                  <div className="font-semibold">{perf.metrics.errorRate.toFixed(2)}%</div>
                  <div className="text-muted-foreground">Error Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!health && !perf && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No performance metrics recorded yet. They will appear as the system runs.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
