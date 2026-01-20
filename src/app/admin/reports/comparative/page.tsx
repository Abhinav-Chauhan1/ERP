export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { ComparativeAnalysis } from "@/components/admin/reports/comparative-analysis";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <Link href="/admin/reports">
            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comparative Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Compare performance metrics across different time periods
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ComparativeAnalysis />
      </Suspense>
    </div>
  );
}
