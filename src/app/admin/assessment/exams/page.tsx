export const dynamic = "force-dynamic";

import { getExamsPageData } from "@/lib/actions/examsActions";
import { ExamsClient } from "./exams-client";

export default async function ExamsPage() {
  const result = await getExamsPageData();

  return (
    <ExamsClient
      initialUpcomingExams={result.success ? result.data.upcomingExams || [] : []}
      initialPastExams={result.success ? result.data.pastExams || [] : []}
      initialExamTypes={result.success ? result.data.examTypes || [] : []}
      initialSubjects={result.success ? result.data.subjects || [] : []}
      initialClasses={result.success ? result.data.classes || [] : []}
      initialTerms={result.success ? result.data.terms || [] : []}
      initialAllTerms={result.success ? result.data.allTerms || [] : []}
      initialStatistics={result.success ? result.data.statistics : null}
      initialError={result.success ? null : result.error || "Failed to load exams"}
    />
  );
}
