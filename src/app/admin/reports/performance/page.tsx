"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Download, FileText, TrendingUp, Target,
  Award, BarChart3, Activity, Zap, Loader2
} from "lucide-react";
import {
  getStudentPerformanceReport,
  getGradeDistribution,
  getSubjectWisePerformance,
  getClassRankings,
  getProgressTracking,
} from "@/lib/actions/academicReportActions";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";

export default function PerformanceAnalyticsPage() {
  const [selectedMetric, setSelectedMetric] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [yearsResult, classesResult] = await Promise.all([
        getAcademicYears(),
        getClasses(),
      ]);

      if (yearsResult.success) setAcademicYears(yearsResult.data || []);
      if (classesResult.success) setClasses(classesResult.data || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Failed to load initial data");
    }
  };

  const generateReport = async (reportType: string) => {
    setLoading(true);
    try {
      const filters: any = {
        academicYearId: selectedAcademicYear && selectedAcademicYear !== "all" ? selectedAcademicYear : undefined,
        classId: selectedClass && selectedClass !== "all" ? selectedClass : undefined,
      };

      let result;
      switch (reportType) {
        case "overall":
          result = await getStudentPerformanceReport(filters);
          break;
        case "teacher":
          result = await getSubjectWisePerformance(filters);
          break;
        case "progress":
          result = await getProgressTracking(filters);
          break;
        case "comparative":
          result = await getClassRankings(filters);
          break;
        case "outcomes":
          result = await getGradeDistribution(filters);
          break;
        case "trends":
          result = await getProgressTracking(filters);
          break;
        default:
          throw new Error("Invalid report type");
      }

      if (result.success) {
        setReportData({ type: reportType, data: result.data });
        toast.success("Report generated successfully");
      } else {
        toast.error(result.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      title: "Overall School Performance",
      description: "Comprehensive analysis of institutional performance",
      icon: TrendingUp,
      color: "bg-primary",
    },
    {
      title: "Teacher Performance Metrics",
      description: "Evaluate teaching effectiveness and outcomes",
      icon: Award,
      color: "bg-green-500",
    },
    {
      title: "Student Progress Tracking",
      description: "Monitor individual student growth over time",
      icon: Activity,
      color: "bg-purple-500",
    },
    {
      title: "Comparative Analysis",
      description: "Compare performance across classes and years",
      icon: BarChart3,
      color: "bg-orange-500",
    },
    {
      title: "Learning Outcomes Assessment",
      description: "Measure achievement of learning objectives",
      icon: Target,
      color: "bg-pink-500",
    },
    {
      title: "Performance Trends",
      description: "Identify patterns and trends in performance data",
      icon: Zap,
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/admin/reports">
            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive performance analysis and insights
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
          <CardDescription>Configure parameters for performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Performance Metric</Label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grades">Grades</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="behavior">Behavior</SelectItem>
                  <SelectItem value="overall">Overall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comparison Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term">Term-wise</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          const reportKey = ["overall", "teacher", "progress", "comparative", "outcomes", "trends"][index];
          return (
            <Card key={report.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`${report.color} p-2 rounded-lg text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => generateReport(reportKey)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-1" />
                    )}
                    Generate
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Analytics Results</CardTitle>
            <CardDescription>
              Generated analytics data for {reportData.type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.type === "overall" && (
                <div>
                  <h3 className="font-semibold mb-2">Overall School Performance</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-primary/10 p-3 rounded">
                      <div className="text-sm text-primary">Total Exams</div>
                      <div className="text-xl font-bold">{reportData.data.statistics?.totalExams || 0}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-sm text-green-600">Average Marks</div>
                      <div className="text-xl font-bold">{reportData.data.statistics?.averageMarks?.toFixed(1) || 0}%</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-sm text-purple-600">Pass Rate</div>
                      <div className="text-xl font-bold">{reportData.data.statistics?.passPercentage?.toFixed(1) || 0}%</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-sm text-orange-600">Highest Marks</div>
                      <div className="text-xl font-bold">{reportData.data.statistics?.highestMarks || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {reportData.type === "teacher" && (
                <div>
                  <h3 className="font-semibold mb-2">Subject-wise Performance</h3>
                  <div className="space-y-2">
                    {reportData.data?.map((subject: any) => (
                      <div key={subject.subject} className="flex justify-between items-center p-3 bg-accent rounded">
                        <span className="font-medium">{subject.subject}</span>
                        <div className="text-right">
                          <div className="font-bold">{subject.averageMarks?.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">{subject.count} exams</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.type === "progress" && (
                <div>
                  <h3 className="font-semibold mb-2">Student Progress Tracking</h3>
                  <div className="space-y-2">
                    {reportData.data?.slice(0, 10).map((student: any) => (
                      <div key={student.studentId} className="p-3 bg-accent rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{student.studentName}</span>
                          <span className="text-sm text-muted-foreground">{student.className}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Current Avg</div>
                            <div className="font-bold">{student.currentAverage?.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Previous Avg</div>
                            <div className="font-bold">{student.previousAverage?.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Improvement</div>
                            <div className={`font-bold ${student.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {student.improvement >= 0 ? '+' : ''}{student.improvement?.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.type === "comparative" && (
                <div>
                  <h3 className="font-semibold mb-2">Class Rankings</h3>
                  <div className="space-y-2">
                    {reportData.data?.slice(0, 10).map((student: any) => (
                      <div key={student.studentId} className="flex justify-between items-center p-3 bg-accent rounded">
                        <div>
                          <span className="font-medium">#{student.rank} {student.studentName}</span>
                          <div className="text-sm text-muted-foreground">{student.className}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{student.averageMarks?.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">{student.examCount} exams</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.type === "outcomes" && (
                <div>
                  <h3 className="font-semibold mb-2">Grade Distribution</h3>
                  <div className="grid gap-2 md:grid-cols-7">
                    {reportData.data.distribution?.map((grade: any) => (
                      <div key={grade.grade} className="bg-accent p-3 rounded text-center">
                        <div className="font-bold text-lg">{grade.grade}</div>
                        <div className="text-sm text-muted-foreground">{grade.count} students</div>
                        <div className="text-xs text-muted-foreground">{grade.percentage?.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.type === "trends" && (
                <div>
                  <h3 className="font-semibold mb-2">Performance Trends</h3>
                  <div className="space-y-2">
                    {reportData.data?.slice(0, 10).map((student: any) => (
                      <div key={student.studentId} className="p-3 bg-accent rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{student.studentName}</span>
                          <div className="text-right">
                            <div className="font-bold">{student.currentAverage?.toFixed(1)}%</div>
                            <div className={`text-sm ${student.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {student.improvement >= 0 ? '↑' : '↓'} {Math.abs(student.improvement)?.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

