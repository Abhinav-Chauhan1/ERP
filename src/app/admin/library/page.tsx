export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getLibraryStats, getRecentLibraryActivity } from "@/lib/actions/libraryActions";
import { LibraryDashboard } from "@/components/admin/library/library-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Library Management | Admin Dashboard",
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
