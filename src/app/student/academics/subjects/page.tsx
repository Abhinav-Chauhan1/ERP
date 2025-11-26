export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { getStudentSubjects } from "@/lib/actions/student-academics-actions";
import { StudentSubjectList } from "@/components/student/student-subject-list";

export const metadata: Metadata = {
  title: "My Subjects | Student Portal",
  description: "View all your enrolled subjects",
};

export default async function StudentSubjectsPage() {
  const subjects = await getStudentSubjects();

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Subjects</h1>
        <p className="text-muted-foreground mt-1">
          View and explore all your enrolled subjects
        </p>
      </div>

      <StudentSubjectList subjects={subjects} />
    </div>
  );
}
