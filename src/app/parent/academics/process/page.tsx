import { redirect } from "next/navigation";
import { getChildAcademicProcess } from "@/lib/actions/parent-academic-actions";
import { AcademicProgressTracker } from "@/components/parent/academics/academic-progress-tracker";
import { ChildSelector } from "@/components/parent/child-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { format } from "date-fns";

export default async function ParentAcademicProcessPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const childId = searchParams.childId;

  if (!childId) {
    redirect("/parent");
  }

  const academicData = await getChildAcademicProcess(childId);

  const studentName = academicData.student
    ? `${academicData.student.user.firstName} ${academicData.student.user.lastName}`
    : undefined;

  const academicYear = academicData.currentEnrollment
    ? `Academic Year ${format(academicData.currentEnrollment.enrollDate, "yyyy")}-${format(academicData.currentEnrollment.enrollDate, "yyyy") + 1}`
    : undefined;

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Academic Progress</h1>
          <p className="text-muted-foreground mt-1">
            Track curriculum completion and learning milestones
          </p>
        </div>
        <ChildSelector selectedChildId={childId} />
      </div>

      {/* Progress Tracker */}
      {academicData.curriculumCompletion.length > 0 ? (
        <AcademicProgressTracker
          curriculumCompletion={academicData.curriculumCompletion}
          studentName={studentName}
          academicYear={academicYear}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Progress Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                No curriculum progress data is available for this student yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      {academicData.currentEnrollment && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Class</p>
                <p className="font-medium">{academicData.currentEnrollment.class.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Section</p>
                <p className="font-medium">{academicData.currentEnrollment.section.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Enrollment Date</p>
                <p className="font-medium">
                  {format(new Date(academicData.currentEnrollment.enrollDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects Overview */}
      {academicData.subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {academicData.subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{subject.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{subject.code}</p>
                      {subject.teachers.length > 0 && (
                        <p className="text-xs text-gray-600 mt-2">
                          Teacher: {subject.teachers[0].name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
