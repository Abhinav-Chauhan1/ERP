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
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Overview</h1>
      
      <PerformanceSummaryCard
        overallPercentage={summary.overallPercentage}
        grade={summary.grade}
        totalExams={summary.totalExams}
        className={summary.className}
        rank={summary.rank}
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
                <SubjectPerformanceTable subjects={subjects} />
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
                  <PerformanceChart data={trends.termPerformance} />
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
                  <AttendanceVsPerformanceChart data={attendancePerformance} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
