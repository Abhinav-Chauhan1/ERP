import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getStudentDashboardData,
  getStudentSubjectPerformance,
  getStudentTodaySchedule
} from "@/lib/actions/student-actions";
import { StudentDashboardClient } from "./student-dashboard-client";
import { DashboardSkeleton } from "./dashboard-skeleton";

// Enable dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

// Revalidate every 60 seconds
export const revalidate = 60;

/**
 * Student Dashboard - Server Component
 * Fetches all data in parallel on the server for optimal performance
 */
export default async function StudentDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all dashboard data in parallel on the server
  const dashboardData = await getStudentDashboardData();

  if (!dashboardData.student) {
    redirect("/login");
  }

  const [subjectPerformance, todaySchedule] = await Promise.all([
    getStudentSubjectPerformance(dashboardData.student.id),
    getStudentTodaySchedule(dashboardData.student.id)
  ]);

  const data = {
    ...dashboardData,
    subjectPerformance,
    todaySchedule
  };

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StudentDashboardClient data={data} />
    </Suspense>
  );
}
