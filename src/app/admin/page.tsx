import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { schoolContextService } from "@/lib/services/school-context-service";
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
import { PendingClassTeachersSection } from "./dashboard/pending-class-teachers";

// Enable React Server Component caching with revalidation
// Dashboard data is revalidated every 60 seconds (1 minute)
export const revalidate = 60;

// Enable dynamic rendering for real-time data
export const dynamic = "force-dynamic";

/**
 * Admin Dashboard with Suspense boundaries
 * Each section loads independently to prevent layout shifts
 * 
 * Requirements: 9.2 - Implements onboarding check for school admin dashboard
 */
export default async function AdminDashboard() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] || "Admin";

  // Requirement 9.2: Check if school admin needs onboarding
  if (session?.user?.role === "ADMIN" && session?.user?.schoolId) {
    try {
      const onboardingStatus = await schoolContextService.getSchoolOnboardingStatus(session.user.schoolId);
      
      // If school is not onboarded, redirect to setup wizard
      if (onboardingStatus && !onboardingStatus.isOnboarded) {
        redirect("/setup");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // Continue to dashboard if there's an error checking onboarding status
      // This prevents the dashboard from being completely inaccessible due to service errors
    }
  }

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
        <div className="grid gap-4">
          {/* @ts-ignore - PendingClassTeachersSection is an async server component */}
          <PendingClassTeachersSection />
          <QuickActionsSection />
        </div>
      </Suspense>
    </div>
  );
}
