export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import {
  HeaderSection,
  AttendanceFeesSection,
  MeetingsAnnouncementsSection,
} from "./dashboard-sections";
import {
  HeaderSkeleton,
  AttendanceFeesSkeleton,
  MeetingsAnnouncementsSkeleton,
} from "./dashboard-skeletons";

/**
 * Parent Dashboard with Suspense boundaries
 * Each section loads independently to prevent layout shifts
 */
export default function ParentDashboard() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header and Children Cards - Wrapped in Suspense */}
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderSection />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance and Fees - Wrapped in Suspense */}
        <Suspense fallback={<AttendanceFeesSkeleton />}>
          <AttendanceFeesSection />
        </Suspense>
        
        {/* Meetings and Announcements - Wrapped in Suspense */}
        <Suspense fallback={<MeetingsAnnouncementsSkeleton />}>
          <MeetingsAnnouncementsSection />
        </Suspense>
      </div>
    </div>
  );
}
