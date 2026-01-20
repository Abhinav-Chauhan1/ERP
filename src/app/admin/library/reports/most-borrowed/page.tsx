export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getMostBorrowedBooksReport } from "@/lib/actions/libraryReportActions";
import { MostBorrowedBooksReport } from "@/components/admin/library/reports/most-borrowed-books-report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Most Borrowed Books Report | Library Management",
  description: "View the most borrowed books in the library",
};

async function MostBorrowedBooksData() {
  const result = await getMostBorrowedBooksReport({ limit: 50 });

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

  return <MostBorrowedBooksReport data={result.data} />;
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
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MostBorrowedBooksPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/library/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Most Borrowed Books Report
            </h1>
            <p className="text-muted-foreground">
              View the most popular books in your library
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <MostBorrowedBooksData />
      </Suspense>
    </div>
  );
}
