export const dynamic = "force-dynamic";

import { getStudentEditPageData } from "@/lib/actions/studentActions";
import { EditStudentClient } from "./edit-student-client";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getStudentEditPageData(id);

  return (
    <EditStudentClient
      id={id}
      initialStudent={data.student}
      initialClasses={data.classes}
      initialSections={data.initialSections}
      initialClassId={data.initialClassId}
      initialSectionId={data.initialSectionId}
      initialEnrollmentId={data.enrollmentId}
    />
  );
}
