import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsDashboard } from "@/components/super-admin/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500 mt-0.5">Revenue tracking, user growth, and business insights</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                    <AnalyticsDashboard />
                </Suspense>
            </div>
        </div>
    );
}
