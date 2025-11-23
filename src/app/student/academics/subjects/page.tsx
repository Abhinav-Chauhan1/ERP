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
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Subjects</h1>
        <p className="text-gray-500">
          View and explore all your enrolled subjects
        </p>
      </div>

      <StudentSubjectList subjects={subjects} />
    </div>
  );
}
