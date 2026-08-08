export const dynamic = "force-dynamic";

import { getClasses } from "@/lib/actions/classesActions";
import { StudentFeesClient } from "./student-fees-client";

export default async function StudentFeesPage() {
  const classesResult = await getClasses();

  return (
    <StudentFeesClient
      initialClasses={classesResult.success ? classesResult.data || [] : []}
    />
  );
}
