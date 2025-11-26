export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { getStudentTimetable } from "@/lib/actions/student-academics-actions";
import { TimetableView } from "@/components/student/timetable-view";

export const metadata: Metadata = {
  title: "Class Schedule | Student Portal",
  description: "View your class timetable and schedule",
};

export default async function ClassSchedulePage() {
  const { timetable, days } = await getStudentTimetable();

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Class Schedule</h1>
        <p className="text-muted-foreground mt-1">
          View your weekly class timetable
        </p>
      </div>

      <TimetableView days={days || []} timetable={timetable} />
    </div>
  );
}
