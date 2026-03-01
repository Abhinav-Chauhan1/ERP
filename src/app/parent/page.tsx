export const dynamic = 'force-dynamic';

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent Dashboard | SikshaMitra",
  description: "Monitor your child's academic progress, attendance, fees, and school activities through the SikshaMitra Parent Dashboard.",
  openGraph: {
    title: "Parent Dashboard | SikshaMitra",
    description: "Monitor your child's academic progress through the SikshaMitra Parent Dashboard.",
    type: "website",
  },
};

import { Suspense } from "react";
import {
  HeaderSection,
  QuickActionsSection,
  PerformanceSummarySection,
  CalendarWidgetSection,
  RecentActivityFeedSection,
} from "./dashboard-sections";
import {
  HeaderSkeleton,
  QuickActionsSkeleton,
  PerformanceSummarySkeleton,
  CalendarWidgetSkeleton,
  RecentActivityFeedSkeleton,
} from "./dashboard-skeletons";

/**
 * Parent Dashboard with Suspense boundaries
 * Each section loads independently to prevent layout shifts
 */
export default function ParentDashboard() {
  return (
    <div className="space-y-6">
      {/* Header and Children Cards - Wrapped in Suspense */}
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderSection />
      </Suspense>

      {/* Quick Actions Panel */}
      <Suspense fallback={<QuickActionsSkeleton />}>
        <QuickActionsSection />
      </Suspense>

      {/* Performance Summary Cards */}
      <Suspense fallback={<PerformanceSummarySkeleton />}>
        <PerformanceSummarySection />
      </Suspense>

      {/* Calendar Widget and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Widget - Wrapped in Suspense */}
        <Suspense fallback={<CalendarWidgetSkeleton />}>
          <CalendarWidgetSection />
        </Suspense>

        {/* Recent Activity Feed - Wrapped in Suspense */}
        <Suspense fallback={<RecentActivityFeedSkeleton />}>
          <RecentActivityFeedSection />
        </Suspense>
      </div>
    </div>
  );
}
