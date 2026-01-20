"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, BookOpen, Users,
  GraduationCap, Clock, FileText, Plus,
  BookMarked, Download, PenTool, AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import toast from "react-hot-toast";

import { getSubjectById } from "@/lib/actions/subjectsActions";

export default function SubjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubject() {
      setLoading(true);
      setError(null);

      try {
        const id = params.id as string;
        const result = await getSubjectById(id);

        if (result.success) {
          setSubject(result.data);
        } else {
          setError(result.error || "Failed to fetch subject details");
          toast.error(result.error || "Failed to fetch subject details");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubject();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/teaching/subjects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Subject not found</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/teaching/subjects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/teaching/subjects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subjects
            </Button>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href={`/admin/teaching/subjects/${subject.id}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Edit Subject
            </Button>
          </Link>
          <Link href={`/admin/teaching/subjects/${subject.id}/assign-teacher`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Users className="h-4 w-4 mr-2" />
              Manage Teachers
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl">{subject.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold">{subject.code}</span>
                  <span>|</span>
                  <Badge className="bg-muted text-foreground hover:bg-muted">
                    {subject.department}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-foreground mb-4">
              {subject.description || "No description available for this subject."}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <BookMarked className="h-6 w-6 text-primary mx-auto mb-1" />
                <span className="text-xs block text-muted-foreground">Subject Type</span>
                <span className="font-medium">{subject.hasLabs ? "Theory + Lab" : "Theory"}</span>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <Users className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <span className="text-xs block text-muted-foreground">Teachers</span>
                <span className="font-medium">{subject.teachers?.length || 0}</span>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <GraduationCap className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <span className="text-xs block text-muted-foreground">Classes</span>
                <span className="font-medium">{subject.classes?.length || 0}</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                <span className="text-xs block text-muted-foreground">Lessons</span>
                <span className="font-medium">
                  {subject.syllabus?.units.reduce((total: number, unit: any) => total + (unit.lessons?.length || 0), 0) || 0}
                </span>
              </div>
            </div>

            <h3 className="font-medium mb-2">Applicable Classes</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {subject.grades?.map((grade: string) => (
                <Badge key={grade} variant="outline">
                  {grade}
                </Badge>
              ))}
              {(!subject.grades || subject.grades.length === 0) && (
                <p className="text-sm text-muted-foreground">No classes assigned to this subject yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resources</CardTitle>
            <CardDescription>
              Subject materials and references
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subject.resources?.length > 0 ? (
              subject.resources.map((resource: any) => (
                <div key={resource.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{resource.name}</p>
                      <p className="text-xs text-muted-foreground">{resource.type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="mb-2">No resources available</p>
              </div>
            )}
            <Link href={`/admin/academic/syllabus?subject=${subject.id}`}>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="syllabus" className="mt-2">
        <TabsList>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Subject Syllabus</CardTitle>
                <CardDescription>
                  View and manage course outline and lessons
                </CardDescription>
              </div>
              <Link href={`/admin/academic/syllabus?subject=${subject.id}`}>
                <Button size="sm">
                  <PenTool className="h-4 w-4 mr-2" />
                  {subject.syllabus ? "Edit Syllabus" : "Create Syllabus"}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {subject.syllabus ? (
                <div className="space-y-6">
                  {subject.syllabus.units?.map((unit: any) => (
                    <div key={unit.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-accent p-4 border-b">
                        <h3 className="font-medium">{unit.title}</h3>
                        {unit.description && (
                          <p className="text-sm text-muted-foreground mt-1">{unit.description}</p>
                        )}
                      </div>
                      <div className="divide-y">
                        {unit.lessons?.length > 0 ? (
                          unit.lessons.map((lesson: any) => (
                            <div key={lesson.id} className="p-4 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                                  <BookOpen className="h-4 w-4" />
                                </div>
                                <span>{lesson.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                <Link href={`/admin/academic/syllabus/${subject.syllabus.id}/lessons/${lesson.id}`}>
                                  <Button variant="ghost" size="sm">
                                    View
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            <p>No lessons in this unit</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No syllabus has been created for this subject yet.</p>
                  <Link href={`/admin/academic/syllabus?subject=${subject.id}`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Syllabus
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            {subject.syllabus && (
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Syllabus
                </Button>
                <Link href={`/admin/academic/syllabus/${subject.syllabus.id}/units/new`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Teachers</CardTitle>
                <CardDescription>
                  Teachers currently teaching this subject
                </CardDescription>
              </div>
              <Link href={`/admin/teaching/subjects/${subject.id}/assign-teacher`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Teacher
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {subject.teachers?.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {subject.teachers.map((teacher: any) => (
                      <div key={teacher.id} className="border rounded-lg p-4 flex gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={teacher.avatar} />
                          <AvatarFallback>{teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{teacher.name}</h3>
                          <p className="text-sm text-muted-foreground">{teacher.qualification}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {teacher.classes?.map((cls: string) => (
                              <Badge key={cls} variant="outline" className="text-xs">
                                {cls}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Link href={`/admin/staff/teachers/${teacher.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 self-start">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                  {subject.teachers.length > 3 && (
                    <div className="text-center mt-2">
                      <Link href={`/admin/teaching/subjects/${subject.id}/assign-teacher`}>
                        <Button variant="outline" size="sm">
                          View All Teachers ({subject.teachers.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No teachers assigned to this subject yet</p>
                  <Link href={`/admin/teaching/subjects/${subject.id}/assign-teacher`}>
                    <Button variant="outline" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Teachers
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Classes</CardTitle>
                <CardDescription>
                  Classes where this subject is taught
                </CardDescription>
              </div>
              <Link href={`/admin/curriculum?subject=${subject.id}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Class
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {subject.classes?.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Teacher</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Students</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subject.classes.map((cls: any) => (
                        <tr key={cls.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">
                            {cls.name}
                            {cls.isCurrent && (
                              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 align-middle">{cls.teacher}</td>
                          <td className="py-3 px-4 align-middle">{cls.students}</td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Link href={`/admin/classes/${cls.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link href={`/admin/timetable?class=${cls.id}&subject=${subject.id}`}>
                              <Button variant="ghost" size="sm">
                                Timetable
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">This subject is not currently assigned to any classes.</p>
                  <Link href={`/admin/curriculum?subject=${subject.id}`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Class
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
