export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getClassSchedule } from "@/lib/actions/parent-academic-actions";
import { TimetableGrid } from "@/components/parent/academics/timetable-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { ChildSelector } from "@/components/parent/child-selector";
import { PrintScheduleButton } from "@/components/parent/academics/print-schedule-button";
import { auth } from "@/auth";

// Enable caching with revalidation
export const revalidate = 1800; // Revalidate every 30 minutes

export default async function ClassSchedulePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  // Await searchParams as required by Next.js 15
  const searchParams = await searchParamsPromise;
  let childId = searchParams.childId;

  // If no childId provided, get the first child
  if (!childId) {
    const session = await auth();

    if (!session?.user?.id) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!dbUser || dbUser.role !== UserRole.PARENT) {
      redirect("/login");
    }

    const parent = await db.parent.findUnique({
      where: { userId: dbUser.id }
    });

    if (!parent) {
      redirect("/login");
    }

    // Get first child
    const firstChild = await db.studentParent.findFirst({
      where: { parentId: parent.id },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ],
      select: { studentId: true }
    });

    if (!firstChild) {
      redirect("/parent");
    }

    // Redirect with childId
    redirect(`/parent/academics/schedule?childId=${firstChild.studentId}`);
  }

  const { schedule, enrollment } = await getClassSchedule(childId);

  const studentName = enrollment
    ? `${enrollment.class.name} - ${enrollment.section.name}`
    : undefined;

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Weekly timetable and class schedule
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ChildSelector selectedChildId={childId} />
          <PrintScheduleButton />
        </div>
      </div>

      {/* Schedule Grid */}
      {schedule.length > 0 ? (
        <TimetableGrid schedule={schedule} studentName={studentName} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Schedule Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                No class schedule has been set up for this student yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
