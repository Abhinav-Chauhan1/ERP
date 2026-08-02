export const dynamic = "force-dynamic";

import { getTimetablePageData } from "@/lib/actions/timetableActions";
import { TimetableClient } from "./timetable-client";

export default async function TimetablePage() {
  const data = await getTimetablePageData();

  return (
    <TimetableClient
      initialTimetables={data.timetables}
      initialClasses={data.classes}
      initialRooms={data.rooms}
      initialSubjectTeachers={data.subjectTeachers}
      initialTeachers={data.teachers}
      initialPeriods={data.periods}
      initialWeekDays={data.weekDays}
      initialSlots={data.initialSlots}
      initialSelectedTimetable={data.defaultTimetableId}
      initialSelectedClass={data.defaultClassId}
      initialSelectedDay={data.defaultDay}
    />
  );
}
