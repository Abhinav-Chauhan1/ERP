import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyllabusProgress } from "@/components/academic/syllabus-progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  FileText, 
  Clock, 
  Users, 
  Play, 
  Plus,
  Download,
  Building,
  Layers,
  ArrowLeft
} from "lucide-react";
import { getTeacherSubjectDetails } from "@/lib/actions/teacherSubjectsActions";
import { ResourceUploadDialog } from "@/components/academic/resource-upload-dialog";

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const param = await params;
  const subjectId = param.id;
  const subject = await getTeacherSubjectDetails(subjectId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/teaching/subjects">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex justify-between items-center flex-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
            <p className="text-gray-500">Subject Code: {subject.code} • {subject.department}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/teacher/teaching/syllabus?subject=${subject.id}`}>
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" /> View Syllabus
              </Button>
            </Link>
            <Link href={`/teacher/teaching/lessons/create?subject=${subject.id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Lesson
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subject Overview</CardTitle>
            <CardDescription>Key information and stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">{subject.description || "No description provided"}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Classes</p>
                <p className="text-lg font-bold">{subject.classes.length}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Students</p>
                <p className="text-lg font-bold">
                  {subject.classes.reduce((sum, cls) => sum + cls.totalStudents, 0)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Syllabus</p>
                <p className="text-lg font-bold">{subject.progress}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Lessons</p>
                <p className="text-lg font-bold">{subject.recentLessons.length}</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <h3 className="text-sm font-medium">Syllabus Progress</h3>
                <span className="text-sm">
                  {subject.completedTopics}/{subject.totalTopics}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${subject.progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Associated Classes</CardTitle>
            <CardDescription>Classes where this subject is taught</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subject.classes.map((cls) => (
                <div key={cls.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{cls.name}</h3>
                      <p className="text-sm text-gray-500">
                        {cls.sections.map(section => section.name).join(", ")} • 
                        {cls.totalStudents} students
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/teacher/teaching/classes?class=${cls.id}&subject=${subject.id}`}>
                        <Button variant="outline" size="sm">
                          <Users className="mr-1 h-3.5 w-3.5" /> View Class
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="syllabus">
        <TabsList>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="syllabus" className="mt-6">
          {subject.syllabus.length > 0 ? (
            <SyllabusProgress 
              subjectName={subject.name}
              className={subject.classes.map(c => c.name).join(", ")}
              academicYear="2023-2024"
              overallProgress={subject.progress}
              lastUpdated={new Date(subject.lastUpdated).toLocaleDateString()}
              units={subject.syllabus[0].units.map(unit => ({
                ...unit,
                status: (unit.status === "completed" || unit.status === "in-progress" || unit.status === "not-started") 
                  ? unit.status as "completed" | "in-progress" | "not-started"
                  : "not-started"
              }))}
              subjectId={subject.id}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium">No Syllabus Found</h3>
                  <p className="text-gray-500 max-w-md mt-1 mb-4">
                    There is no syllabus defined for this subject yet. Create a syllabus to track your teaching progress.
                  </p>
                  <Link href={`/teacher/teaching/syllabus/create?subject=${subject.id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Syllabus
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="lessons" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Lessons</CardTitle>
                  <CardDescription>Latest teaching materials</CardDescription>
                </div>
                <Link href={`/teacher/teaching/lessons/create?subject=${subject.id}`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-3.5 w-3.5" /> Create Lesson
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {subject.recentLessons.length > 0 ? (
                <div className="space-y-3">
                  {subject.recentLessons.map((lesson) => (
                    <div key={lesson.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{lesson.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{lesson.description}</p>
                          <div className="flex gap-3 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Layers className="h-3 w-3" />
                              <span>{lesson.unit || "No unit assigned"}</span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/teacher/teaching/lessons/${lesson.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No Lessons Created</h3>
                  <p className="text-gray-500 mt-1 mb-4">
                    You haven't created any lessons for this subject yet.
                  </p>
                  <Link href={`/teacher/teaching/lessons/create?subject=${subject.id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create First Lesson
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Link href={`/teacher/teaching/lessons?subject=${subject.id}`} className="w-full">
                <Button variant="outline" className="w-full">View All Lessons</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Teaching Resources</CardTitle>
                  <CardDescription>Materials to help with teaching</CardDescription>
                </div>
                <ResourceUploadDialog subjectId={subject.id} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="p-2 bg-primary/10 border border-primary/20 rounded">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Linear Equations Worksheet</h3>
                        <p className="text-sm text-gray-500 mt-1">Practice problems for linear equations with solutions</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">Worksheet</Badge>
                          <span className="text-xs text-gray-500">Uploaded on Dec 1, 2023</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="p-2 bg-secondary border border-secondary/20 rounded">
                        <FileText className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">Quadratic Equations Presentation</h3>
                        <p className="text-sm text-gray-500 mt-1">Slides for teaching quadratic equations</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">Presentation</Badge>
                          <span className="text-xs text-gray-500">Uploaded on Nov 20, 2023</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="p-2 bg-green-50 border border-green-100 rounded">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">Calculus Test Paper</h3>
                        <p className="text-sm text-gray-500 mt-1">Sample test paper with marking scheme</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">Quiz/Test</Badge>
                          <span className="text-xs text-gray-500">Uploaded on Nov 15, 2023</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button variant="outline">
                  View All Resources
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
