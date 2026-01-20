export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getLibraryStats, getRecentLibraryActivity } from "@/lib/actions/libraryActions";
import { LibraryDashboard } from "@/components/admin/library/library-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Library Management | Admin Dashboard",
  description: "Library management dashboard",
};

export default async function LibraryPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Library Management</h1>
        <p className="text-muted-foreground mt-2">
          Overview of library operations and statistics
        </p>
      </div>

      <Suspense fallback={<LibraryDashboardSkeleton />}>
        <LibraryDashboardContent />
      </Suspense>
    </div>
  );
}

async function LibraryDashboardContent() {
  const [stats, recentActivity] = await Promise.all([
    getLibraryStats(),
    getRecentLibraryActivity(5),
  ]);

  return <LibraryDashboard stats={stats} recentActivity={recentActivity} />;
}

function LibraryDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
