import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MeetingScheduleForm } from "@/components/parent/meetings/meeting-schedule-form";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck } from "lucide-react";

/**
 * Schedule Meeting Page
 * Requirements: 1.1, 1.2, 1.3
 * 
 * This page integrates:
 * - MeetingScheduleForm component for scheduling meetings
 * - TeacherAvailabilityCalendar component (integrated within the form)
 * - Form submission and navigation handling
 * - Success/error feedback via toast notifications
 */

async function ScheduleMeetingContent() {
  const session = await auth();
    const userId = session?.user?.id;
  
  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { parent: true },
  });

  if (!user || !user.parent) {
    redirect("/parent");
  }

  // Fetch all active teachers
  const rawTeachers = await db.teacher.findMany({
    where: {
      user: {
        active: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      user: {
        firstName: "asc",
      },
    },
  });

  // Transform teachers to ensure firstName and lastName are strings
  const teachers = rawTeachers.map(teacher => ({
    ...teacher,
    user: {
      ...teacher.user,
      firstName: teacher.user.firstName || '',
      lastName: teacher.user.lastName || '',
      email: teacher.user.email || '',
    }
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          Schedule a Meeting
        </h1>
        <p className="text-muted-foreground mt-1">
          Schedule a meeting with your child's teacher to discuss academic progress and concerns
        </p>
      </div>

      <MeetingScheduleForm teachers={teachers} schoolId={user.parent?.schoolId || ''} />
    </div>
  );
}

function ScheduleMeetingLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export default function ScheduleMeetingPage() {
  return (
    <Suspense fallback={<ScheduleMeetingLoading />}>
      <ScheduleMeetingContent />
    </Suspense>
  );
}
