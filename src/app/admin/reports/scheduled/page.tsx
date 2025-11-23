export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ScheduledReportsList } from "@/components/admin/reports/scheduled-reports-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScheduledReportsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Reports</h1>
          <p className="text-muted-foreground mt-1">
            Automate report generation and delivery
          </p>
        </div>
        <Link href="/admin/reports/scheduled/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Scheduled Report
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Scheduled Reports</CardTitle>
          <CardDescription>
            Manage automated reports that are generated and emailed on a schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ScheduledReportsListSkeleton />}>
            <ScheduledReportsList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduledReportsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );
}
