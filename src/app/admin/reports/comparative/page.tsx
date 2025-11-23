export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { ComparativeAnalysis } from "@/components/admin/reports/comparative-analysis";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Comparative Analysis | Admin Dashboard",
  description: "Compare performance metrics across different time periods",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ComparativeAnalysisPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Comparative Analysis</h1>
        <p className="text-gray-600 mt-2">
          Compare performance metrics across academic years and terms to identify trends and insights
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ComparativeAnalysis />
      </Suspense>
    </div>
  );
}
