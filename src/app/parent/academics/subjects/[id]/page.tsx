import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, BarChart2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getChildSubjectProgress } from "@/lib/actions/parent-academic-actions";

export const metadata: Metadata = {
  title: "Subject Details | Parent Portal",
  description: "View your child's performance in a specific subject",
};

export default async function SubjectDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, searchParams: Promise<{ childId?: string }> 
}) {
  // Await both params and searchParams before using them
  const pathParams = await params;
  const queryParams = await searchParams;
  
  const subjectId = pathParams.id;
  const childId = queryParams.childId;
  
  if (!childId) {
    redirect("/parent/academics/subjects");
  }
  
  const subjectData = await getChildSubjectProgress(childId, subjectId);
  
  // Calculate overall performance
  const totalExams = subjectData.examResults.length;
  let totalMarks = 0;
  let obtainedMarks = 0;
  
  subjectData.examResults.forEach((result: any) => {
    totalMarks += result.exam.totalMarks;
    obtainedMarks += result.marks;
  });
  
  const performancePercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
  
  // Calculate assignment completion
  const totalAssignments = subjectData.assignments.length;
  const completedAssignments = subjectData.assignments.filter(
    (assignment: any) => assignment.status === "GRADED" || assignment.status === "SUBMITTED"
  ).length;
  const completionPercentage = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
  
  return (
    <div className="container p-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-2" asChild>
          <Link href="/parent/academics/subjects">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Subjects
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{subjectData.subject.name}</h1>
        <Badge className="ml-2">{subjectData.subject.code}</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Performance overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-2">
              <div className="w-24 h-24 rounded-full border-8 border-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {performancePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span>Total Exams</span>
                <span>{totalExams}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Total Marks</span>
                <span>{obtainedMarks}/{totalMarks}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Grade</span>
                <Badge className={
                  performancePercentage >= 90 ? "bg-green-100 text-green-800" :
                  performancePercentage >= 80 ? "bg-blue-100 text-blue-800" :
                  performancePercentage >= 70 ? "bg-yellow-100 text-yellow-800" :
                  performancePercentage >= 60 ? "bg-orange-100 text-orange-800" :
                  "bg-red-100 text-red-800"
                }>
                  {performancePercentage >= 90 ? 'A+' :
                   performancePercentage >= 80 ? 'A' :
                   performancePercentage >= 70 ? 'B' :
                   performancePercentage >= 60 ? 'C' :
                   performancePercentage >= 50 ? 'D' : 'F'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Assignment completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignment Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <Progress value={completionPercentage} className="h-2 mb-2" />
                <p className="text-sm text-gray-500">{completedAssignments} of {totalAssignments} assignments completed</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-green-50 p-3 rounded-md text-center">
                  <div className="flex justify-center mb-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="font-medium">{completedAssignments}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-md text-center">
                  <div className="flex justify-center mb-1">
                    <XCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="font-medium">{totalAssignments - completedAssignments}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Syllabus progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Syllabus</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectData.syllabus ? (
              <div>
                <p className="text-sm mb-4">{subjectData.syllabus.title}</p>
                <div className="space-y-2">
                  {subjectData.syllabus.units.slice(0, 3).map((unit: any) => (
                    <div key={unit.id} className="text-sm">
                      <p className="font-medium">{unit.title}</p>
                      <p className="text-xs text-gray-500">{unit.lessons.length} lessons</p>
                    </div>
                  ))}
                  
                  {subjectData.syllabus.units.length > 3 && (
                    <p className="text-xs text-blue-600">
                      + {subjectData.syllabus.units.length - 3} more units
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">No syllabus available for this subject</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Exam Results
            </CardTitle>
            <CardDescription>
              Performance in recent examinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjectData.examResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="text-left py-2">Exam</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-right py-2">Marks</th>
                      <th className="text-right py-2">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectData.examResults.map((result: any) => {
                      const percentage = (result.marks / result.exam.totalMarks) * 100;
                      return (
                        <tr key={result.id} className="border-b">
                          <td className="py-2">{result.exam.title || 'Exam'}</td>
                          <td className="py-2">{result.exam.examType.name}</td>
                          <td className="py-2 text-right">{result.marks}/{result.exam.totalMarks}</td>
                          <td className="py-2 text-right">
                            <Badge className={
                              percentage >= 80 ? "bg-green-100 text-green-800" :
                              percentage >= 60 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {percentage.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No exam results available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Assignments
            </CardTitle>
            <CardDescription>
              Recent assignments and homework
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjectData.assignments.length > 0 ? (
              <div className="space-y-3">
                {subjectData.assignments.map((assignment: any) => (
                  <div key={assignment.id} className="border rounded-md p-3">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{assignment.assignment.title}</h3>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(assignment.assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={
                        assignment.status === "GRADED" ? "bg-green-100 text-green-800" :
                        assignment.status === "SUBMITTED" ? "bg-blue-100 text-blue-800" :
                        assignment.status === "LATE" ? "bg-orange-100 text-orange-800" :
                        "bg-gray-100 text-gray-800"
                      }>
                        {assignment.status}
                      </Badge>
                    </div>
                    
                    {assignment.status === "GRADED" && (
                      <div className="mt-2 text-xs border-t pt-2 flex justify-between">
                        <span>Marks: {assignment.marks}/{assignment.assignment.totalMarks}</span>
                        <span className={
                          (assignment.marks / assignment.assignment.totalMarks) * 100 >= 70 
                            ? "text-green-600" 
                            : "text-orange-600"
                        }>
                          {((assignment.marks / assignment.assignment.totalMarks) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No assignments found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
