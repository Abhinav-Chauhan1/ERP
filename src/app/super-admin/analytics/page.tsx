import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsDashboard } from "@/components/super-admin/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
        <p className="text-gray-400 mt-1">Comprehensive analytics, revenue tracking, and business insights</p>
      </div>

      {/* Analytics Dashboard Component */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardContent className="p-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <AnalyticsDashboard />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}