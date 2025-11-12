import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { SyllabusProgress } from "@/components/academic/syllabus-progress";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";

export const dynamic = 'force-dynamic';

export default async function TeacherSyllabusPage() {
  const { subjects } = await getTeacherSubjects();

  // Filter subjects that have syllabus
  const subjectsWithSyllabus = subjects.filter(
    (subject) => subject.syllabus && subject.syllabus.length > 0
  );

  if (subjectsWithSyllabus.length === 0) {
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
                There are no syllabus records for your subjects yet. Please contact the
                administrator to set up syllabus for your subjects.
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

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {subjectsWithSyllabus.slice(0, 3).map((subject) => (
          <Card key={subject.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{subject.name}</CardTitle>
              <CardDescription>
                {subject.grade} ({subject.sections.join(", ")})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium">{subject.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {subject.completedTopics}/{subject.totalTopics} topics
                  </span>
                  <Badge
                    variant={subject.progress >= 75 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {subject.progress >= 75
                      ? "On Track"
                      : subject.progress >= 50
                      ? "In Progress"
                      : "Behind"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Syllabus Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Syllabus Progress</CardTitle>
          <CardDescription>
            View and update progress for each subject's syllabus units
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={subjectsWithSyllabus[0]?.id} className="mt-2">
            <TabsList className="mb-4 flex-wrap h-auto">
              {subjectsWithSyllabus.map((subject) => (
                <TabsTrigger key={subject.id} value={subject.id} className="mb-2">
                  {subject.name} - {subject.grade}
                </TabsTrigger>
              ))}
            </TabsList>

            {subjectsWithSyllabus.map((subject) => (
              <TabsContent key={subject.id} value={subject.id}>
                <SyllabusProgress
                  subjectName={subject.name}
                  className={`${subject.grade} (${subject.sections.join(", ")})`}
                  academicYear="2023-2024"
                  overallProgress={subject.progress}
                  lastUpdated="Recently"
                  units={(subject.syllabus[0]?.units || []).map((unit) => ({
                    ...unit,
                    status:
                      (unit.status as "completed" | "in-progress" | "not-started") ||
                      "not-started",
                  }))}
                  subjectId={subject.id}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectsWithSyllabus.map((subject) => {
                const completedUnits =
                  subject.syllabus[0]?.units.filter(
                    (unit) => unit.status === "completed"
                  ).length || 0;
                const totalUnits = subject.syllabus[0]?.units.length || 0;

                return (
                  <div key={subject.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {subject.progress >= 75 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : subject.progress >= 50 ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{subject.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {completedUnits}/{totalUnits} units
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/teacher/teaching/lessons/create" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Create New Lesson
                </Button>
              </Link>
              <Link href="/teacher/teaching/lessons" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View All Lessons
                </Button>
              </Link>
              <Link href="/teacher/teaching/subjects" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manage Subjects
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
