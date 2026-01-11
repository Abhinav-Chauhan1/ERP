export const dynamic = 'force-dynamic';

/**
 * Alumni Dashboard Page
 * 
 * Main dashboard for alumni users showing welcome message, quick stats,
 * recent school news, and quick links to profile and directory.
 * 
 * Requirements: 12.1, 12.5
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { AlumniDashboard } from "@/components/alumni/alumni-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata = {
  title: "Alumni Dashboard - SikshaMitra",
  description: "Welcome to your alumni portal",
};

/**
 * Loading component for alumni dashboard
 */
function AlumniDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Fetch alumni dashboard data
 */
async function getAlumniDashboardData(userId: string) {
  // Find the student record for this user
  const student = await db.student.findFirst({
    where: {
      user: {
        id: userId,
      },
    },
    include: {
      user: true,
      alumni: true,
    },
  });

  if (!student || !student.alumni) {
    return null;
  }

  const alumni = student.alumni;

  // Get graduation year
  const graduationYear = new Date(alumni.graduationDate).getFullYear();

  // Get total alumni count
  const totalAlumni = await db.alumni.count();

  // Get classmates count (same graduation year and class)
  const classmates = await db.alumni.count({
    where: {
      finalClass: alumni.finalClass,
      graduationDate: {
        gte: new Date(graduationYear, 0, 1),
        lt: new Date(graduationYear + 1, 0, 1),
      },
    },
  });

  // Get unread messages count (placeholder - would integrate with actual messaging system)
  const unreadMessages = 0;

  // Get recent news (placeholder - would integrate with actual news system)
  const recentNews = [
    {
      id: "1",
      title: "Annual Alumni Meet 2026 Announced",
      excerpt: "Join us for our annual alumni gathering on March 15th, 2026. Reconnect with old friends and make new connections.",
      date: new Date("2026-01-05"),
      category: "Events",
    },
    {
      id: "2",
      title: "New Science Block Inaugurated",
      excerpt: "Our state-of-the-art science laboratory has been inaugurated, providing students with world-class facilities.",
      date: new Date("2025-12-20"),
      category: "Infrastructure",
    },
    {
      id: "3",
      title: "Alumni Scholarship Program Launched",
      excerpt: "We're proud to announce a new scholarship program funded by our generous alumni to support deserving students.",
      date: new Date("2025-12-10"),
      category: "Achievements",
    },
  ];

  // Get upcoming events (placeholder - would integrate with actual events system)
  const upcomingEvents = [
    {
      id: "1",
      title: "Annual Alumni Meet 2026",
      date: new Date("2026-03-15"),
      location: "School Auditorium",
    },
    {
      id: "2",
      title: "Career Guidance Workshop",
      date: new Date("2026-02-20"),
      location: "Virtual Event",
    },
  ];

  return {
    alumniProfile: {
      id: alumni.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      graduationDate: alumni.graduationDate,
      finalClass: alumni.finalClass,
      finalSection: alumni.finalSection,
      currentOccupation: alumni.currentOccupation || undefined,
      currentCity: alumni.currentCity || undefined,
      profilePhoto: alumni.profilePhoto || student.user.avatar || undefined,
    },
    stats: {
      totalAlumni,
      graduationYear,
      classmates,
      unreadMessages,
    },
    recentNews,
    upcomingEvents,
  };
}

/**
 * Alumni Dashboard Content Component
 */
async function AlumniDashboardContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get dashboard data
  const dashboardData = await getAlumniDashboardData(session.user.id);

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Alumni Profile Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          We couldn't find an alumni profile associated with your account.
          Please contact the administration if you believe this is an error.
        </p>
      </div>
    );
  }

  return <AlumniDashboard {...dashboardData} />;
}

/**
 * Alumni Dashboard Page Component
 * 
 * Handles authentication, authorization, and renders the alumni dashboard.
 * Only accessible to users with STUDENT role who have an alumni profile.
 */
export default async function AlumniDashboardPage() {
  // Check authentication
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is a student (alumni are students who graduated)
  if (session.user.role !== UserRole.STUDENT) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<AlumniDashboardLoading />}>
        <AlumniDashboardContent />
      </Suspense>
    </div>
  );
}
