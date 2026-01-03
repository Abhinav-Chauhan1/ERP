import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { SyllabusProgress } from "@/components/academic/syllabus-progress";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";
import { getModulesBySyllabus } from "@/lib/actions/moduleActions";
import { TeacherSyllabusView } from "@/components/teacher/syllabus/teacher-syllabus-view";
import { auth } from "@/auth";
import { isEnhancedSyllabusEnabled } from "@/lib/utils/feature-flags";

export const dynamic = 'force-dynamic';

export default async function TeacherSyllabusPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const enhancedSyllabusEnabled = isEnhancedSyllabusEnabled();

  if (!userId) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
              <p className="text-gray-500 max-w-md">
                Please sign in to view your syllabus.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subjects } = await getTeacherSubjects();

  // If enhanced syllabus is not enabled, show message
  if (!enhancedSyllabusEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Management</h1>
        </div>

        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Enhanced Syllabus Not Enabled</h3>
              <p className="text-gray-500 max-w-md">
                The enhanced module-based syllabus system is currently disabled.
                Please contact your administrator to enable this feature.
              </p>
              <div className="mt-4">
                <Link href="/teacher/teaching/subjects">
                  <Button variant="outline">View My Subjects</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter subjects that have syllabus with modules
  const subjectsWithSyllabus = await Promise.all(
    subjects
      .filter((subject) => subject.syllabus && subject.syllabus.length > 0)
      .map(async (subject) => {
        const syllabusId = subject.syllabus[0].id;
        const modulesResult = await getModulesBySyllabus(syllabusId);

        return {
          ...subject,
          modules: modulesResult.success ? modulesResult.data : [],
          syllabusId
        };
      })
  );

  // Filter out subjects with no modules
  const subjectsWithModules = subjectsWithSyllabus.filter(
    (subject) => subject.modules && subject.modules.length > 0
  );

  if (subjectsWithModules.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Management</h1>
        </div>

        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Syllabus Available</h3>
              <p className="text-gray-500 max-w-md">
                There are no syllabus modules for your subjects yet. Please contact the
                administrator to set up syllabus modules for your subjects.
              </p>
              <div className="mt-4">
                <Link href="/teacher/teaching/subjects">
                  <Button variant="outline">View My Subjects</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Management</h1>
          <p className="text-muted-foreground">
            Track and manage syllabus progress for your subjects
          </p>
        </div>
        <Link href="/teacher/teaching/subjects">
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" /> My Subjects
          </Button>
        </Link>
      </div>

      {/* Syllabus Tabs */}
      <Tabs defaultValue={subjectsWithModules[0]?.id} className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          {subjectsWithModules.map((subject) => (
            <TabsTrigger key={subject.id} value={subject.id} className="mb-2">
              {subject.name} - {subject.grade}
            </TabsTrigger>
          ))}
        </TabsList>

        {subjectsWithModules.map((subject) => (
          <TabsContent key={subject.id} value={subject.id}>
            <TeacherSyllabusView
              modules={subject.modules}
              syllabusId={subject.syllabusId}
              teacherId={userId}
              subjectName={`${subject.name} - ${subject.grade}`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
