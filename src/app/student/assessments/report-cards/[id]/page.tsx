import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Award, 
  Download, 
  User, 
  BarChart2, 
  BookOpen,
  FileText,
  Calendar,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getReportCardDetails } from "@/lib/actions/student-assessment-actions";

export const metadata: Metadata = {
  title: "Report Card Details | Student Portal",
  description: "View detailed information about your academic performance",
};

export default async function ReportCardDetailsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Fix the params issue by awaiting it first
  const resolvedParams = await Promise.resolve(params);
  const reportCard = await getReportCardDetails(resolvedParams.id);
  
  // Color based on performance
  const getColorByPercentage = (percentage: number | null) => {
    if (!percentage) return "text-gray-600"; // Default color when null
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-red-600";
  };
  // Progress bar color based on performance
  const getProgressColor = (percentage: number | null) => {
    if (!percentage) return "bg-gray-500"; // Default color when null
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-red-500";
  };
  
  // Sort subjects by percentage (highest first)
  const sortedSubjects = [...reportCard.subjects].sort((a, b) => b.percentage - a.percentage);
  
  return (
    <div className="container p-6">
      <Link href="/student/assessments/report-cards">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Report Cards
        </Button>
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Report Card: {reportCard.term}</h1>
          <div className="flex items-center mt-1">
            <Calendar className="h-4 w-4 text-gray-500 mr-1.5" />
            <span className="text-gray-600 mr-2">{reportCard.academicYear}</span>
            <Badge variant="outline">
              {format(new Date(reportCard.startDate), "MMM d")} - {format(new Date(reportCard.endDate), "MMM d, yyyy")}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </a>
          </Button>
          
          <Button size="sm">
            <Award className="h-4 w-4 mr-1" />
            Print Report Card
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg border">
                <div className="text-gray-500 text-sm">Overall Percentage</div>
                <div className={`text-3xl font-bold ${getColorByPercentage(reportCard.percentage)}`}>
                  {reportCard.percentage}%
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg border">
                <div className="text-gray-500 text-sm">Grade</div>
                <div className="text-3xl font-bold">{reportCard.grade}</div>
              </div>
              
              <div className="text-center p-4 rounded-lg border">
                <div className="text-gray-500 text-sm">Rank</div>
                <div className="text-3xl font-bold">{reportCard.rank || "N/A"}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Overall Performance</span>
                  <span className="text-sm font-medium">{reportCard.percentage}%</span>
                </div>
                <Progress 
                  value={reportCard.percentage} 
                  className="h-2"
                  style={{ 
                    backgroundColor: "rgba(0,0,0,0.1)",
                    "--progress-color": getProgressColor(reportCard.percentage)
                  } as React.CSSProperties}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Attendance</span>
                  <span className="text-sm font-medium">{reportCard.attendance}%</span>
                </div>
                <Progress 
                  value={reportCard.attendance} 
                  className="h-2"
                  style={{ 
                    backgroundColor: "rgba(0,0,0,0.1)",
                    "--progress-color": getProgressColor(reportCard.attendance)
                  } as React.CSSProperties}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportCard.teacherRemarks && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Class Teacher</div>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {reportCard.teacherRemarks}
                  </div>
                </div>
              )}
              
              {reportCard.principalRemarks && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Principal</div>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {reportCard.principalRemarks}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Published On</div>
                <div className="text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                  {reportCard.publishDate ? format(new Date(reportCard.publishDate), "MMMM d, yyyy") : "Not published yet"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Detailed View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <div className="space-y-6">
                {sortedSubjects.map(subject => (
                  <div key={subject.id}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{subject.name}</span>
                      <div className="flex items-center gap-2">
                        <span 
                          className={`font-medium ${getColorByPercentage(subject.percentage)}`}
                        >
                          {subject.percentage}%
                        </span>
                        <Badge variant="outline">{subject.grade}</Badge>
                      </div>
                    </div>
                    <Progress 
                      value={subject.percentage} 
                      className="h-2"
                      style={{ 
                        backgroundColor: "rgba(0,0,0,0.1)",
                        "--progress-color": getProgressColor(subject.percentage)
                      } as React.CSSProperties}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {subject.totalMarks}/{subject.totalPossibleMarks} marks
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="details">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Marks
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedSubjects.map(subject => (
                      <tr key={subject.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-medium">{subject.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {subject.totalMarks}/{subject.totalPossibleMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge className={`${
                            subject.percentage >= 90 ? 'bg-green-100 text-green-800' :
                            subject.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                            subject.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {subject.percentage}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                          {subject.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {subject.percentage >= 35 ? (
                            <Badge variant="outline" className="border-green-500 text-green-700">Pass</Badge>
                          ) : (
                            <Badge variant="destructive">Fail</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {sortedSubjects.length > 0 && sortedSubjects[0].exams && sortedSubjects[0].exams.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Exam-wise Performance</h3>
                  <Tabs defaultValue={sortedSubjects[0].id} className="mt-4">
                    <TabsList className="flex flex-wrap">
                      {sortedSubjects.map(subject => (
                        <TabsTrigger key={subject.id} value={subject.id}>
                          {subject.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {sortedSubjects.map(subject => (
                      <TabsContent key={subject.id} value={subject.id} className="mt-4">
                        <div className="rounded-md border overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Exam
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Marks
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Percentage
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {subject.exams.map((exam: any) => (
                                <tr key={exam.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium">{exam.examTitle}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <Badge variant="outline">{exam.examType}</Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {exam.marks}/{exam.totalMarks}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <Badge className={`${
                                      exam.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                      exam.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                                      exam.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {exam.percentage}%
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
