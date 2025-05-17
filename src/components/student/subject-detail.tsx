"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Download,
  ChevronRight,
  ListChecks,
  MailIcon,
  BookMarked,
  School,
  FileQuestion
} from "lucide-react";
import { format } from "date-fns";

interface SubjectDetailProps {
  subject: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    department: string;
  };
  syllabus: any | null;
  teachers: {
    id: string;
    name: string;
    email: string;
  }[];
  lessons: any[];
  assignments: {
    id: string;
    title: string;
    dueDate: Date;
    totalMarks: number;
    status: string;
    submissionId: string | null;
  }[];
  exams: {
    id: string;
    title: string;
    examDate: Date;
    examType: string;
    totalMarks: number;
    result: any | null;
  }[];
}

export function SubjectDetail({ 
  subject,
  syllabus,
  teachers,
  lessons,
  assignments,
  exams
}: SubjectDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-blue-50 pb-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
                {subject.name}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="font-mono">
                  {subject.code}
                </Badge>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">{subject.department}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Materials
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance
              </Button>
              {syllabus && (
                <Button variant="outline" size="sm">
                  <BookMarked className="h-4 w-4 mr-2" />
                  Syllabus
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {subject.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-gray-600 text-sm">{subject.description}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium mb-1">Instructors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {teachers.map(teacher => (
                  <div 
                    key={teacher.id} 
                    className="flex items-center p-3 rounded-md border"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">{teacher.name}</h4>
                      <div className="flex items-center text-sm text-gray-500">
                        <MailIcon className="h-3 w-3 mr-1" />
                        {teacher.email}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto text-blue-600"
                      asChild
                    >
                      <Link href={`/student/communication/messages/compose?teacherId=${teacher.id}`}>
                        Contact
                      </Link>
                    </Button>
                  </div>
                ))}
                {teachers.length === 0 && (
                  <div className="text-gray-500 text-sm">No instructors assigned yet</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-blue-800">Upcoming Assignments</h3>
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {assignments.filter(a => new Date(a.dueDate) > new Date()).length}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-amber-800">Pending Exams</h3>
                    <FileQuestion className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {exams.filter(e => new Date(e.examDate) > new Date()).length}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-green-800">Available Materials</h3>
                    <School className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {lessons.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Latest Materials</CardTitle>
              </CardHeader>
              <CardContent>
                {lessons.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {lessons.slice(0, 3).map(lesson => (
                      <div key={lesson.id} className="flex items-start p-3 rounded-md border">
                        <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="ml-3">
                          <h4 className="font-medium text-sm">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-gray-500 text-sm line-clamp-1">{lesson.description}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto text-blue-600"
                          asChild
                        >
                          <Link href={`/student/academics/materials/${lesson.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600"
                        asChild
                      >
                        <Link href={`/student/academics/materials?subject=${subject.id}`}>
                          All Materials <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No materials available yet
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming Activities</CardTitle>
              </CardHeader>
              <CardContent>
                {[...assignments.filter(a => new Date(a.dueDate) > new Date()), 
                  ...exams.filter(e => new Date(e.examDate) > new Date())]
                  .sort((a, b) => {
                    const dateA = 'dueDate' in a ? new Date(a.dueDate) : new Date(a.examDate);
                    const dateB = 'dueDate' in b ? new Date(b.dueDate) : new Date(b.examDate);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .slice(0, 3)
                  .length > 0 ? (
                  <div className="space-y-3">
                    {[...assignments.filter(a => new Date(a.dueDate) > new Date()), 
                      ...exams.filter(e => new Date(e.examDate) > new Date())]
                      .sort((a, b) => {
                        const dateA = 'dueDate' in a ? new Date(a.dueDate) : new Date(a.examDate);
                        const dateB = 'dueDate' in b ? new Date(b.dueDate) : new Date(b.examDate);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .slice(0, 3)
                      .map(item => {
                        const isAssignment = 'dueDate' in item;
                        return (
                          <div 
                            key={item.id} 
                            className="flex items-start p-3 rounded-md border"
                          >
                            {isAssignment ? (
                              <FileText className="h-5 w-5 text-amber-600 mt-0.5" />
                            ) : (
                              <FileQuestion className="h-5 w-5 text-red-600 mt-0.5" />
                            )}
                            <div className="ml-3">
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              <div className="flex items-center text-gray-500 text-xs mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(
                                  new Date(isAssignment ? item.dueDate : item.examDate),
                                  "MMM dd, yyyy"
                                )}
                                <span className="mx-1">•</span>
                                <Badge variant="outline" className="text-xs h-5">
                                  {isAssignment ? "Assignment" : item.examType}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-auto text-blue-600"
                              asChild
                            >
                              <Link href={
                                isAssignment 
                                  ? `/student/assessments/assignments/${item.id}` 
                                  : `/student/assessments/exams/${item.id}`
                              }>
                                View
                              </Link>
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No upcoming activities
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="curriculum" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Curriculum & Syllabus</CardTitle>
            </CardHeader>
            <CardContent>
              {syllabus ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h3 className="font-medium">{syllabus.title}</h3>
                      {syllabus.description && (
                        <p className="text-gray-600 text-sm mt-1">{syllabus.description}</p>
                      )}
                    </div>
                    
                    {syllabus.document && (
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Syllabus
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {syllabus.units.map((unit: any) => (
                      <div key={unit.id} className="border rounded-md overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b">
                          <h3 className="font-medium">Unit {unit.order}: {unit.title}</h3>
                          {unit.description && (
                            <p className="text-gray-600 text-sm mt-1">{unit.description}</p>
                          )}
                        </div>
                        {unit.lessons.length > 0 ? (
                          <div className="divide-y">
                            {unit.lessons.map((lesson: any) => (
                              <div key={lesson.id} className="flex items-center p-3">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                <div className="ml-3">
                                  <h4 className="text-sm font-medium">{lesson.title}</h4>
                                  {lesson.duration && (
                                    <div className="flex items-center text-gray-500 text-xs mt-1">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {lesson.duration} minutes
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="ml-auto text-blue-600"
                                  asChild
                                >
                                  <Link href={`/student/academics/materials/${lesson.id}`}>
                                    View
                                  </Link>
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No lessons available for this unit
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {syllabus.units.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BookMarked className="h-12 w-12 text-gray-300 mx-auto" />
                        <h3 className="mt-4 font-medium">No units defined</h3>
                        <p className="text-sm mt-1">The syllabus structure has not been defined yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookMarked className="h-16 w-16 text-gray-300 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium">No Syllabus Available</h3>
                  <p className="text-sm mt-1">The syllabus for this subject hasn't been uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marks
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assignments.map(assignment => (
                          <tr key={assignment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="font-medium">{assignment.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`${
                                new Date(assignment.dueDate) < new Date() && 
                                assignment.status !== "SUBMITTED" && 
                                assignment.status !== "GRADED" 
                                  ? "text-red-600" 
                                  : "text-gray-600"
                              }`}>
                                {format(new Date(assignment.dueDate), "MMM dd, yyyy")}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {assignment.totalMarks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <Badge className={`${
                                assignment.status === "GRADED" 
                                  ? "bg-green-100 text-green-800 border-green-300" 
                                  : assignment.status === "SUBMITTED" 
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : new Date(assignment.dueDate) < new Date()
                                  ? "bg-red-100 text-red-800 border-red-300"
                                  : "bg-amber-100 text-amber-800 border-amber-300"
                              }`}>
                                {assignment.status === "GRADED" 
                                  ? "Graded" 
                                  : assignment.status === "SUBMITTED" 
                                  ? "Submitted"
                                  : new Date(assignment.dueDate) < new Date()
                                  ? "Overdue"
                                  : "Pending"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Button 
                                size="sm"
                                variant={
                                  assignment.status === "SUBMITTED" || assignment.status === "GRADED"
                                    ? "outline"
                                    : "default"
                                }
                                asChild
                              >
                                <Link href={`/student/assessments/assignments/${assignment.id}`}>
                                  {assignment.status === "SUBMITTED" 
                                    ? "View Submission" 
                                    : assignment.status === "GRADED"
                                    ? "View Feedback"
                                    : "Submit"}
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium">No Assignments</h3>
                  <p className="text-sm mt-1">No assignments have been given for this subject yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exams" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Exams</CardTitle>
            </CardHeader>
            <CardContent>
              {exams.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exam Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Marks
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {exams.map(exam => (
                          <tr key={exam.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileQuestion className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="font-medium">{exam.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">
                                {exam.examType}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {format(new Date(exam.examDate), "MMM dd, yyyy")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {exam.totalMarks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <Badge className={`${
                                exam.result
                                  ? "bg-green-100 text-green-800 border-green-300" 
                                  : new Date(exam.examDate) < new Date()
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : "bg-amber-100 text-amber-800 border-amber-300"
                              }`}>
                                {exam.result
                                  ? "Results Available" 
                                  : new Date(exam.examDate) < new Date()
                                  ? "Completed"
                                  : "Upcoming"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Button 
                                size="sm"
                                variant={exam.result ? "default" : "outline"}
                                asChild
                              >
                                <Link href={`/student/assessments/exams/${exam.id}`}>
                                  {exam.result 
                                    ? "View Results" 
                                    : "View Details"}
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileQuestion className="h-16 w-16 text-gray-300 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium">No Exams</h3>
                  <p className="text-sm mt-1">No exams have been scheduled for this subject yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
