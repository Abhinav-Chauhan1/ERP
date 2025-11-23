import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import {
  PrimaryStatsSection,
  SecondaryStatsSection,
  ChartsSection,
  ActivitySection,
  QuickActionsSection,
} from "./dashboard-sections";
import {
  PrimaryStatsSkeleton,
  SecondaryStatsSkeleton,
  ChartsSkeleton,
  ActivitySkeleton,
  QuickActionsSkeleton,
} from "./dashboard-skeletons";

// Enable React Server Component caching with revalidation
// Dashboard data is revalidated every 60 seconds (1 minute)
export const revalidate = 60;

// Enable dynamic rendering for real-time data
export const dynamic = "force-dynamic";

/**
 * Admin Dashboard with Suspense boundaries
 * Each section loads independently to prevent layout shifts
 */
export default async function AdminDashboard() {
  const user = await currentUser();
  const firstName = user?.firstName || "Admin";
  
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}!</h1>
      
      {/* Primary Stats - Wrapped in Suspense */}
      <Suspense fallback={<PrimaryStatsSkeleton />}>
        <PrimaryStatsSection />
      </Suspense>
      
      {/* Secondary Stats - Wrapped in Suspense */}
      <Suspense fallback={<SecondaryStatsSkeleton />}>
        <SecondaryStatsSection />
      </Suspense>

      {/* Charts - Wrapped in Suspense */}
      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsSection />
      </Suspense>

      {/* Activity and Events - Wrapped in Suspense */}
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivitySection />
      </Suspense>

      {/* Quick Actions and Notifications - Wrapped in Suspense */}
      <Suspense fallback={<QuickActionsSkeleton />}>
        <QuickActionsSection />
      </Suspense>
    </div>
  );
}
