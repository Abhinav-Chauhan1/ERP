import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getSubjectDetails } from "@/lib/actions/student-academics-actions";
import { StudentSyllabusView } from "@/components/student/student-syllabus-view";
import { Card, CardContent } from "@/components/ui/card";
import { BookMarked } from "lucide-react";

export const metadata: Metadata = {
  title: "Syllabus | Student Portal",
  description: "View subject syllabus and learning materials",
};

export default async function SubjectSyllabusPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const paramsResolved = await Promise.resolve(params);
  const subjectId = await paramsResolved.id;
  const subjectDetails = await getSubjectDetails(subjectId);

  return (
    <div className="container p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/student/academics/subjects/${subjectId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Subject
          </Link>
        </Button>
      </div>

      {subjectDetails.syllabus &&
        subjectDetails.syllabus.modules &&
        subjectDetails.syllabus.modules.length > 0 ? (
        <StudentSyllabusView
          modules={subjectDetails.syllabus.modules}
          syllabusTitle={`${subjectDetails.subject.name} - ${subjectDetails.syllabus.title}`}
          syllabusDescription={subjectDetails.syllabus.description ?? undefined}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookMarked className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No Syllabus Available
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              The syllabus for this subject hasn't been created yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
