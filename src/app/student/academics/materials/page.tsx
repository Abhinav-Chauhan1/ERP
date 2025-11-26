export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import Link from "next/link";
import { getStudentSubjects } from "@/lib/actions/student-academics-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Clock, Download, ExternalLink, FileText } from "lucide-react";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Learning Materials | Student Portal",
  description: "Access all your subject learning materials",
};

// Define proper interfaces to fix type issues
interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  resources?: string | null;
}

interface SyllabusUnit {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: Lesson[];
}

interface Syllabus {
  id: string;
  title: string;
  description?: string | null;
  units: SyllabusUnit[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  syllabus?: Syllabus | null;
}

export default async function LearningMaterialsPage({
  searchParams
}: {
  searchParams: Promise<{ subject?: string }>
}) {
  // Fix: await searchParams before accessing its properties
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const selectedSubjectId = resolvedSearchParams.subject || "";
  
  const subjects = await getStudentSubjects();
  
  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learning Materials</h1>
        <p className="text-muted-foreground mt-1">
          Access all your course materials and resources
        </p>
      </div>

      <Tabs defaultValue={selectedSubjectId || "all"}>
        <div className="overflow-auto pb-2">
          <TabsList className="mb-4 w-auto inline-flex">
            <TabsTrigger value="all">All Subjects</TabsTrigger>
            {subjects.map(subject => (
              <TabsTrigger key={subject.id} value={subject.id}>
                {subject.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-2">
          {subjects.map(subject => {
            // Use proper type handling for potentially undefined properties
            const units = subject.syllabus?.units || [];
            // Safely map and flatten lessons, ensuring we don't try to access lessons if units don't have them
            const subjectLessons = units.flatMap(unit => 
              'lessons' in unit ? (unit.lessons as Lesson[]) : []
            );
            
            if (subjectLessons.length === 0) return null;
            
            return (
              <Card key={subject.id} className="mb-6 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    {subject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectLessons.slice(0, 3).map((lesson) => (
                      <div key={lesson.id} className="flex items-start p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="rounded-md bg-primary/10 p-2 flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-3 flex-grow">
                          <h3 className="font-medium">{lesson.title}</h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            {lesson.description?.substring(0, 60)}
                            {lesson.description && lesson.description.length > 60 ? "..." : ""}
                          </div>
                          {lesson.duration && (
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              Duration: {lesson.duration} minutes
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto flex-shrink-0"
                          asChild
                        >
                          <Link href={`/student/academics/materials/${lesson.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    ))}
                    
                    {subjectLessons.length > 3 && (
                      <div className="flex justify-end">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="font-normal"
                          asChild
                        >
                          <Link href={`/student/academics/materials?subject=${subject.id}`}>
                            View all ({subjectLessons.length}) <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {subjects.every(subject => {
            const units = subject.syllabus?.units || [];
            return !units.some(unit => 'lessons' in unit && (unit as SyllabusUnit).lessons.length > 0);
          }) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Materials Available</h3>
              <p className="text-muted-foreground max-w-sm">
                There are no learning materials uploaded for your subjects yet
              </p>
            </div>
          )}
        </TabsContent>

        {subjects.map(subject => (
          <TabsContent key={subject.id} value={subject.id} className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  {subject.name} Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subject.syllabus?.units && subject.syllabus.units.length > 0 ? (
                  <div className="space-y-6">
                    {subject.syllabus.units.map((unit) => (
                      <div key={unit.id}>
                        <h3 className="font-medium mb-3">Unit {unit.order}: {unit.title}</h3>
                        
                        {'lessons' in unit && unit.lessons && (unit.lessons as Lesson[]).length > 0 ? (
                          <div className="space-y-3">
                            {(unit.lessons as Lesson[]).map((lesson: Lesson) => (
                              <div key={lesson.id} className="flex items-start p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                <div className="rounded-md bg-primary/10 p-2 flex-shrink-0">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="ml-3 flex-grow">
                                  <h4 className="font-medium">{lesson.title}</h4>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {lesson.description}
                                  </div>
                                  {lesson.duration && (
                                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Duration: {lesson.duration} minutes
                                    </div>
                                  )}
                                </div>
                                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                                  {lesson.resources && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Resources
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/student/academics/materials/${lesson.id}`}>
                                      View Lesson
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground border rounded-md">
                            No lessons available for this unit
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Materials Available</h3>
                    <p className="text-muted-foreground max-w-sm">
                      There are no learning materials uploaded for this subject yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
