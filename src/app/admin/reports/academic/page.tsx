"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Download, FileText, BarChart3, TrendingUp,
  Users, Award, BookOpen, Target, Loader2
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

export default function AcademicReportsPage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
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
      const filters = {
        academicYearId: selectedAcademicYear && selectedAcademicYear !== "all" ? selectedAcademicYear : undefined,
        classId: selectedClass && selectedClass !== "all" ? selectedClass : undefined,
        termId: selectedTerm && selectedTerm !== "all" ? selectedTerm : undefined,
        subjectId: selectedSubject && selectedSubject !== "all" ? selectedSubject : undefined,
      };

      let result;
      switch (reportType) {
        case "performance":
          result = await getStudentPerformanceReport(filters);
          break;
        case "distribution":
          result = await getGradeDistribution(filters);
          break;
        case "subject":
          result = await getSubjectWisePerformance(filters);
          break;
        case "rankings":
          result = await getClassRankings(filters);
          break;
        case "progress":
          // Progress tracking requires a specific student ID
          toast.error("Progress tracking requires selecting a specific student");
          setLoading(false);
          return;
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
      title: "Student Performance Report",
      description: "Comprehensive analysis of individual student performance",
      icon: Users,
      color: "bg-primary",
    },
    {
      title: "Grade Distribution",
      description: "Statistical breakdown of grades across classes",
      icon: BarChart3,
      color: "bg-green-500",
    },
    {
      title: "Subject-wise Analysis",
      description: "Performance metrics for each subject",
      icon: BookOpen,
      color: "bg-purple-500",
    },
    {
      title: "Class Rankings",
      description: "Student rankings based on academic performance",
      icon: Award,
      color: "bg-orange-500",
    },
    {
      title: "Progress Tracking",
      description: "Track student progress over time",
      icon: TrendingUp,
      color: "bg-pink-500",
    },
    {
      title: "Learning Outcomes",
      description: "Assessment of learning objectives achievement",
      icon: Target,
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
            <h1 className="text-3xl font-bold tracking-tight">Academic Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate and analyze academic performance reports
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select criteria to generate reports</CardDescription>
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
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          const reportKey = ["performance", "distribution", "subject", "rankings", "progress", "outcomes"][index];
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
            <CardTitle>Report Results</CardTitle>
            <CardDescription>
              Generated report data for {reportData.type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.type === "performance" && (
                <div>
                  <h3 className="font-semibold mb-2">Performance Statistics</h3>
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

              {reportData.type === "distribution" && (
                <div>
                  <h3 className="font-semibold mb-2">Grade Distribution</h3>
                  <div className="grid gap-2 md:grid-cols-7">
                    {reportData.data.distribution?.map((grade: any) => (
                      <div key={grade.grade} className="bg-accent p-3 rounded text-center">
                        <div className="font-bold text-lg">{grade.grade}</div>
                        <div className="text-sm text-muted-foreground">{grade.count} students</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.type === "subject" && (
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

              {reportData.type === "rankings" && (
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

