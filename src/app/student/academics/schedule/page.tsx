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
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Class Schedule</h1>
        <p className="text-gray-500">
          View your weekly class timetable
        </p>
      </div>

      <TimetableView days={days || []} timetable={timetable} />
    </div>
  );
}
