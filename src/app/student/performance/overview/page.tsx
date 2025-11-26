export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceSummaryCard } from "@/components/student/performance-summary-card";
import { SubjectPerformanceTable } from "@/components/student/subject-performance-table";
import { PerformanceChart } from "@/components/student/performance-chart";
import { AttendanceVsPerformanceChart } from "@/components/student/attendance-vs-performance-chart";
import { 
  getPerformanceSummary, 
  getSubjectPerformance, 
  getPerformanceTrends, 
  getAttendanceVsPerformance 
} from "@/lib/actions/student-performance-actions";

export const metadata: Metadata = {
  title: "Performance Overview | Student Portal",
  description: "View your academic performance statistics and analytics",
};

export default async function StudentPerformanceOverviewPage() {
  // Fetch all required data
  const summary = await getPerformanceSummary();
  const subjects = await getSubjectPerformance();
  const trends = await getPerformanceTrends();
  const attendancePerformance = await getAttendanceVsPerformance();
  
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance Overview</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive view of your academic performance and progress
        </p>
      </div>
      
      {/* Performance Summary Card */}
      <PerformanceSummaryCard
        overallPercentage={summary.overallPercentage}
        grade={summary.grade}
        totalExams={summary.totalExams}
        className={summary.className}
        rank={summary.rank}
      />
      
      {/* Tabbed Content */}
      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subjects" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Subject Performance</CardTitle>
              <CardDescription>
                Your performance breakdown by subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectPerformanceTable subjects={subjects} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Term-wise Performance</CardTitle>
                <CardDescription>
                  Your performance across academic terms
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <PerformanceChart data={trends.termPerformance} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Attendance vs. Performance</CardTitle>
                <CardDescription>
                  Correlation between attendance and academic performance
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <AttendanceVsPerformanceChart data={attendancePerformance} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
