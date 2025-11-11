import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getSubjectDetails } from "@/lib/actions/student-academics-actions";
import { SubjectDetail } from "@/components/student/subject-detail";

export const metadata: Metadata = {
  title: "Subject Details | Student Portal",
  description: "View detailed information about your subject",
};

export default async function SubjectDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Fix by awaiting the params object if it's a promise
  const paramsResolved = await Promise.resolve(params);
  const subjectId = await paramsResolved.id;
  const subjectDetails = await getSubjectDetails(subjectId);

  return (
    <div className="container p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/academics/subjects">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Subjects
          </Link>
        </Button>
      </div>

      <SubjectDetail 
        subject={subjectDetails.subject}
        syllabus={subjectDetails.syllabus}
        teachers={subjectDetails.teachers}
        lessons={subjectDetails.lessons}
        assignments={subjectDetails.assignments}
        exams={subjectDetails.exams}
      />
    </div>
  );
}
