import { Suspense } from "react";
import { getTeacherDashboardData } from "@/lib/actions/teacherDashboardActions";
import { AlertCircle } from "lucide-react";
import {
  StatsSection,
  UpcomingClassesSection,
  RecentActivitySection,
  QuickActionsSection,
} from "./dashboard-sections";
import {
  StatsSkeleton,
  UpcomingClassesSkeleton,
  RecentActivitySkeleton,
  QuickActionsSkeleton,
} from "./dashboard-skeletons";

// Enable React Server Component caching with revalidation
// Dashboard data is revalidated every 60 seconds (1 minute)
export const revalidate = 60;

// Enable dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

/**
 * Teacher Dashboard with Suspense boundaries
 * Each section loads independently to prevent layout shifts
 */
export default async function TeacherDashboard() {
  const result = await getTeacherDashboardData();

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
        <p className="text-muted-foreground">{result.error || "An error occurred"}</p>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {data.teacher.name}! Here's an overview of your teaching activities.
        </p>
      </div>

      {/* Stats Section - Wrapped in Suspense */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Upcoming Classes Section - Wrapped in Suspense */}
      <Suspense fallback={<UpcomingClassesSkeleton />}>
        <UpcomingClassesSection />
      </Suspense>

      {/* Recent Activity Section - Wrapped in Suspense */}
      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivitySection />
      </Suspense>

      {/* Quick Actions Section - Wrapped in Suspense */}
      <Suspense fallback={<QuickActionsSkeleton />}>
        <QuickActionsSection />
      </Suspense>
    </div>
  );
}
