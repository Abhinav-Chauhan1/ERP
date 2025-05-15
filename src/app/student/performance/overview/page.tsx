import { redirect } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceSummaryCard } from "@/components/student/performance-summary-card";
import { SubjectPerformanceTable } from "@/components/student/subject-performance-table";
import { PerformanceChart } from "@/components/student/performance-chart";
import { AttendanceVsPerformanceChart } from "@/components/student/attendance-vs-performance-chart";

export const metadata: Metadata = {
  title: "Performance Overview | Student Portal",
  description: "View your academic performance statistics and analytics",
};

export default async function StudentPerformanceOverviewPage() {
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
          class: {
            include: {
              academicYear: true
            }
          }
        }
      }
    }
  });

  if (!student) {
    redirect("/student");
  }

  // Get current enrollment
  const currentEnrollment = student.enrollments[0];
  
  if (!currentEnrollment) {
    redirect("/student");
  }

  // Get terms for the academic year
  const terms = await db.term.findMany({
    where: {
      academicYearId: currentEnrollment.class.academicYearId
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Get subjects for the student's class
  const subjects = await db.subjectClass.findMany({
    where: {
      classId: currentEnrollment.classId
    },
    include: {
      subject: true
    }
  });

  // Get all exam results for the student
  const examResults = await db.examResult.findMany({
    where: {
      studentId: student.id
    },
    include: {
      exam: {
        include: {
          subject: true,
          examType: true,
          term: true
        }
      }
    }
  });

  // Get report cards
  const reportCards = await db.reportCard.findMany({
    where: {
      studentId: student.id
    },
    include: {
      term: true
    },
    orderBy: {
      term: {
        startDate: 'asc'
      }
    }
  });

  // Calculate overall statistics
  const totalExams = examResults.length;
  const totalMarks = examResults.reduce((sum: number, result: any) => sum + result.marks, 0);
  const totalPossibleMarks = examResults.reduce((sum: number, result: any) => sum + result.exam.totalMarks, 0);
  const overallPercentage = totalPossibleMarks > 0 ? (totalMarks / totalPossibleMarks) * 100 : 0;
  
  // Calculate subject-wise performance
  const subjectsPerformance = subjects.map((subjectClass: any) => {
    const subjectResults = examResults.filter(
      (result: any) => result.exam.subjectId === subjectClass.subjectId
    );
    
    const totalSubjectMarks = subjectResults.reduce((sum: number, result: any) => sum + result.marks, 0);
    const totalPossibleSubjectMarks = subjectResults.reduce(
      (sum: number, result: any) => sum + result.exam.totalMarks, 0
    );
    
    const subjectPercentage = totalPossibleSubjectMarks > 0 
      ? (totalSubjectMarks / totalPossibleSubjectMarks) * 100 
      : 0;
    
    return {
      id: subjectClass.subjectId,
      name: subjectClass.subject.name,
      code: subjectClass.subject.code,
      percentage: subjectPercentage,
      examsTaken: subjectResults.length,
      lastScore: subjectResults.length > 0 
        ? subjectResults.sort((a: any, b: any) => 
            new Date(b.exam.examDate).getTime() - new Date(a.exam.examDate).getTime()
          )[0].marks 
        : null,
      lastScoreTotal: subjectResults.length > 0 
        ? subjectResults.sort((a: any, b: any) => 
            new Date(b.exam.examDate).getTime() - new Date(a.exam.examDate).getTime()
          )[0].exam.totalMarks 
        : null,
    };
  });

  // Prepare term-wise performance data for chart
  const termWisePerformance = terms.map((term: any) => {
    const termResults = examResults.filter(
      (result: any) => result.exam.termId === term.id
    );
    
    const totalTermMarks = termResults.reduce((sum: number, result: any) => sum + result.marks, 0);
    const totalPossibleTermMarks = termResults.reduce(
      (sum: number, result: any) => sum + result.exam.totalMarks, 0
    );
    
    const termPercentage = totalPossibleTermMarks > 0 
      ? (totalTermMarks / totalPossibleTermMarks) * 100 
      : 0;
    
    // Get report card if available
    const reportCard = reportCards.find((rc: { termId: string }) => rc.termId === term.id);
    
    return {
      term: term.name,
      percentage: Math.round(termPercentage * 10) / 10,
      averageMarks: reportCard?.averageMarks || null,
      rank: reportCard?.rank || null
    };
  });
  
  // Get letter grade based on percentage
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D+';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Overview</h1>
      
      <PerformanceSummaryCard
        overallPercentage={overallPercentage}
        grade={getGrade(overallPercentage)}
        totalExams={totalExams}
        className={currentEnrollment.class.name}
      />
      
      <div className="mt-8">
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-8">
            <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subjects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>
                  Your performance breakdown by subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectPerformanceTable subjects={subjectsPerformance} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Term-wise Performance</CardTitle>
                  <CardDescription>
                    Your performance across academic terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <PerformanceChart data={termWisePerformance} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Attendance vs. Performance</CardTitle>
                  <CardDescription>
                    Correlation between attendance and academic performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <AttendanceVsPerformanceChart />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>
                  Your academic progress throughout the academic year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {/* This would be a more detailed chart showing progress over time */}
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Detailed performance trend will be displayed here
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
