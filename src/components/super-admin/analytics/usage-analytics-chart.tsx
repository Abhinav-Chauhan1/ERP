"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface UsageAnalyticsChartProps {
  timeRange?: string;
}

interface ResourceRow {
  schoolName: string;
  plan: string;
  storageUsedMB: number;
  storageLimitMB: number;
  smsUsed: number;
  whatsappUsed: number;
}

interface FeatureRow {
  feature: string;
  usage: number;
  schools: number;
}

export function UsageAnalyticsChart({ timeRange: _timeRange = "30d" }: UsageAnalyticsChartProps) {
  const [resource, setResource] = useState<ResourceRow[]>([]);
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/analytics/usage")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { resourceConsumption?: ResourceRow[]; usageByFeature?: FeatureRow[] }) => {
        setResource(d.resourceConsumption ?? []);
        setFeatures((d.usageByFeature ?? []).slice(0, 10));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const topStorage = resource.slice(0, 10).map(r => ({
    name: r.schoolName.length > 20 ? r.schoolName.slice(0, 20) + "…" : r.schoolName,
    usedMB: r.storageUsedMB,
    limitMB: r.storageLimitMB,
    sms: r.smsUsed,
    whatsapp: r.whatsappUsed,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Analytics</CardTitle>
        <CardDescription>Platform resource consumption across all schools</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Storage by school */}
          {topStorage.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-3">Storage Usage (MB) — Top 10 Schools</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topStorage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis dataKey="name" type="category" width={140} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="usedMB" name="Used (MB)" fill="#3b82f6" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4">No storage usage data for the current month yet.</p>
          )}

          {/* Feature usage */}
          {features.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Feature Events (Top 10)</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={features}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" fontSize={11} angle={-30} textAnchor="end" height={50} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usage" name="Events" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="schools" name="Schools" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
