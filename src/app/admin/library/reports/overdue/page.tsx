export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getOverdueBooksReport } from "@/lib/actions/libraryReportActions";
import { OverdueBooksReport } from "@/components/admin/library/reports/overdue-books-report";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Overdue Books Report | Library Management",
  description: "View all overdue books and calculate fines",
};

async function OverdueBooksData() {
  const result = await getOverdueBooksReport({ limit: 100 });

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Failed to load report data
          </p>
        </CardContent>
      </Card>
    );
  }

  return <OverdueBooksReport data={result.data as any} />;
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverdueBooksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Overdue Books Report
          </h1>
          <p className="text-muted-foreground">
            Track overdue books and calculate potential fines
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/library/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Link>
        </Button>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <OverdueBooksData />
      </Suspense>
    </div>
  );
}
