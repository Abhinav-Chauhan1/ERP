"use client";


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chart } from "@/components/dashboard/chart";
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertCircle,
  Users,
  BarChart3,
  Target
} from "lucide-react";
import { getTeacherStudentsPerformance } from "@/lib/actions/teacherStudentsActions";
import Link from "next/link";

interface PerformanceData {
  classPerformance: Array<{
    className: string;
    average: number;
    highest: number;
    lowest: number;
    studentCount: number;
  }>;
  subjectPerformance: Array<{
    subject: string;
    average: number;
    passRate: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    average: number;
    className: string;
  }>;
  needsAttention: Array<{
    id: string;
    name: string;
    average: number;
    className: string;
  }>;
  overallStats: {
    totalStudents: number;
    averageScore: number;
    passRate: number;
    trend: "up" | "down" | "stable";
  };
}

export default function TeacherStudentsPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTeacherStudentsPerformance();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load performance data</h2>
        <p className="text-muted-foreground">{error || "An error occurred"}</p>
        <Button onClick={loadData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Student Performance</h1>
        <p className="text-muted-foreground">
          Overview of student academic performance across your classes
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overallStats.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Across all your classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isNaN(data.overallStats.averageScore) ? '0.0' : data.overallStats.averageScore.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.overallStats.trend === "up" && (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">Improving</span>
                </>
              )}
              {data.overallStats.trend === "down" && (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">Declining</span>
                </>
              )}
              {data.overallStats.trend === "stable" && (
                <span>Stable performance</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isNaN(data.overallStats.passRate) ? '0.0' : data.overallStats.passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Students passing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.topPerformers.length || 0}</div>
            <p className="text-xs text-muted-foreground">Excellent students</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Class Performance</CardTitle>
            <CardDescription>Average scores by class</CardDescription>
          </CardHeader>
          <CardContent>
            {data.classPerformance.length > 0 ? (
              <Chart
                title=""
                data={data.classPerformance.map(c => ({
                  class: c.className,
                  average: isNaN(c.average) ? 0 : c.average,
                  highest: isNaN(c.highest) ? 0 : c.highest,
                  lowest: isNaN(c.lowest) ? 0 : c.lowest
                }))}
                type="bar"
                xKey="class"
                yKey="average"
                categories={["average", "highest", "lowest"]}
                colors={["#3b82f6", "#10b981", "#f59e0b"]}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No class performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {data.subjectPerformance.length > 0 ? (
              <Chart
                title=""
                data={data.subjectPerformance.map(s => ({
                  subject: s.subject,
                  average: isNaN(s.average) ? 0 : s.average,
                  passRate: isNaN(s.passRate) ? 0 : s.passRate
                }))}
                type="bar"
                xKey="subject"
                yKey="average"
                categories={["average"]}
                colors={["#8b5cf6"]}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No subject performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers and Students Needing Attention */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Students with excellent performance</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {data.topPerformers.map((student, index) => (
                  <Link key={student.id} href={`/teacher/students/${student.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.className}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {isNaN(student.average) ? '0.0' : student.average.toFixed(1)}%
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No top performers yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Needs Attention
            </CardTitle>
            <CardDescription>Students requiring additional support</CardDescription>
          </CardHeader>
          <CardContent>
            {data.needsAttention.length > 0 ? (
              <div className="space-y-3">
                {data.needsAttention.map((student) => (
                  <Link key={student.id} href={`/teacher/students/${student.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.className}</p>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {isNaN(student.average) ? '0.0' : student.average.toFixed(1)}%
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>All students performing well</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
          <CardDescription>Detailed performance metrics by class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Class</th>
                  <th className="text-right p-3 font-medium">Students</th>
                  <th className="text-right p-3 font-medium">Average</th>
                  <th className="text-right p-3 font-medium">Highest</th>
                  <th className="text-right p-3 font-medium">Lowest</th>
                </tr>
              </thead>
              <tbody>
                {data.classPerformance.map((cls) => (
                  <tr key={cls.className} className="border-b hover:bg-accent">
                    <td className="p-3 font-medium">{cls.className}</td>
                    <td className="text-right p-3">{cls.studentCount || 0}</td>
                    <td className="text-right p-3">
                      <Badge variant="secondary">{isNaN(cls.average) ? '0.0' : cls.average.toFixed(1)}%</Badge>
                    </td>
                    <td className="text-right p-3 text-green-600">{isNaN(cls.highest) ? '0.0' : cls.highest.toFixed(1)}%</td>
                    <td className="text-right p-3 text-orange-600">{isNaN(cls.lowest) ? '0.0' : cls.lowest.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

