import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Download, FileText, BookOpen } from "lucide-react";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Lesson Materials | Student Portal",
  description: "View lesson materials and resources",
};

export default async function LessonMaterialPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const userDetails = await getCurrentUserDetails();
  
  if (!userDetails?.dbUser || userDetails.dbUser.role !== "STUDENT") {
    redirect("/login");
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: userDetails.dbUser.id
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1,
        include: {
          class: true
        }
      }
    }
  });

  if (!student || student.enrollments.length === 0) {
    redirect("/student");
  }

  const currentClass = student.enrollments[0].class;
  
  // Get the lesson
  const lesson = await db.lesson.findUnique({
    where: {
      id: params.id
    },
    include: {
      subject: {
        include: {
          classes: {
            where: {
              classId: currentClass.id
            }
          }
        }
      },
      syllabusUnit: {
        include: {
          syllabus: true
        }
      }
    }
  });

  // Check if the lesson exists and belongs to a subject the student is enrolled in
  if (!lesson || lesson.subject.classes.length === 0) {
    redirect("/student/academics/materials");
  }

  // Parse resources JSON string if it exists
  const resources = lesson.resources ? JSON.parse(lesson.resources) : [];

  return (
    <div className="container p-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-auto">
          <Link href="/student/academics/materials">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Materials
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-blue-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{lesson.title}</CardTitle>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4 mr-1 text-blue-600" />
                  <span>{lesson.subject.name}</span>
                  {lesson.syllabusUnit && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Unit {lesson.syllabusUnit.order}: {lesson.syllabusUnit.title}</span>
                    </>
                  )}
                </div>
              </div>
              {lesson.duration && (
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Duration: {lesson.duration} minutes
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {lesson.description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Overview</h3>
                <p className="text-gray-600">{lesson.description}</p>
              </div>
            )}

            <div className="prose max-w-none">
              {lesson.content ? (
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              ) : (
                <div className="text-center py-12 text-gray-500 border rounded-md">
                  <FileText className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium">No Content Available</h3>
                  <p className="mt-1 text-gray-500">
                    This lesson doesn't have any content yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map((resource: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-medium">{resource.name}</h4>
                        {resource.description && (
                          <p className="text-sm text-gray-500">{resource.description}</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {resource.type === "download" ? (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </>
                        )}
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
