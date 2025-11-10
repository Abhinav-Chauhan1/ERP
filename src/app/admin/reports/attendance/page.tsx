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
  ChevronLeft, Download, FileText, Users, Calendar,
  UserCheck, UserX, TrendingUp, Clock, Loader2
} from "lucide-react";
import {
  getDailyAttendanceSummary,
  getMonthlyAttendanceTrends,
  getAbsenteeismAnalysis,
  getClassWiseAttendance,
  getPerfectAttendance,
} from "@/lib/actions/attendanceReportActions";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";

export default function AttendanceReportsPage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
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
      let result;
      const filters: any = {
        classId: selectedClass || undefined,
      };

      switch (reportType) {
        case "daily":
          const today = new Date();
          result = await getDailyAttendanceSummary(today, selectedClass || undefined);
          break;
        case "monthly":
          const month = parseInt(selectedMonth) || new Date().getMonth() + 1;
          const year = parseInt(selectedYear) || new Date().getFullYear();
          result = await getMonthlyAttendanceTrends(month, year, selectedClass || undefined);
          break;
        case "absenteeism":
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          result = await getAbsenteeismAnalysis({
            ...filters,
            startDate,
            endDate: new Date(),
            threshold: 5,
          });
          break;
        case "classwise":
          const monthStart = new Date();
          monthStart.setDate(1);
          result = await getClassWiseAttendance({
            startDate: monthStart,
            endDate: new Date(),
          });
          break;
        case "perfect":
          const termStart = new Date();
          termStart.setMonth(termStart.getMonth() - 3);
          result = await getPerfectAttendance({
            ...filters,
            startDate: termStart,
            endDate: new Date(),
          });
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
      title: "Daily Attendance Summary",
      description: "Day-wise attendance records for all classes",
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "Monthly Attendance Trends",
      description: "Monthly attendance patterns and statistics",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Absenteeism Analysis",
      description: "Identify students with high absenteeism",
      icon: UserX,
      color: "bg-red-500",
    },
    {
      title: "Class-wise Attendance",
      description: "Attendance breakdown by class and section",
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Perfect Attendance",
      description: "Students with 100% attendance record",
      icon: UserCheck,
      color: "bg-emerald-500",
    },
    {
      title: "Late Arrivals Report",
      description: "Track students arriving late to school",
      icon: Clock,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/reports">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Reports</h1>
            <p className="text-muted-foreground mt-1">
              Track and analyze student attendance patterns
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select criteria to generate attendance reports</CardDescription>
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
                  <SelectItem value="">All Years</SelectItem>
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
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Current Month</SelectItem>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          const reportKey = ["daily", "monthly", "absenteeism", "classwise", "perfect", "late"][index];
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
            <CardTitle>Attendance Report Results</CardTitle>
            <CardDescription>
              Generated report data for {reportData.type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.type === "daily" && (
                <div>
                  <h3 className="font-semibold mb-2">Daily Attendance Summary</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-blue-600">Total Students</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.totalStudents || 0}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-sm text-green-600">Present</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.presentCount || 0}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-sm text-red-600">Absent</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.absentCount || 0}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-sm text-orange-600">Attendance Rate</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.attendanceRate?.toFixed(1) || 0}%</div>
                    </div>
                  </div>
                </div>
              )}
              
              {reportData.type === "monthly" && (
                <div>
                  <h3 className="font-semibold mb-2">Monthly Attendance Trends</h3>
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-blue-600">Average Attendance Rate</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.averageAttendanceRate?.toFixed(1) || 0}%</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-sm text-green-600">Total Days</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.totalDays || 0}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {reportData.type === "absenteeism" && (
                <div>
                  <h3 className="font-semibold mb-2">High Absenteeism Analysis</h3>
                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-sm text-red-600">Total Absences</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.totalAbsences || 0}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-sm text-orange-600">High Absenteeism Students</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.studentsWithHighAbsenteeism || 0}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-sm text-purple-600">Threshold</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.threshold || 0} days</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Students with High Absenteeism</h4>
                    {reportData.data.highAbsenteeism?.slice(0, 10).map((student: any) => (
                      <div key={student.studentId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{student.studentName}</span>
                          <div className="text-sm text-gray-600">{student.className}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">{student.absenceCount} days</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {reportData.type === "classwise" && (
                <div>
                  <h3 className="font-semibold mb-2">Class-wise Attendance</h3>
                  <div className="space-y-2">
                    {reportData.data?.map((cls: any) => (
                      <div key={cls.className} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{cls.className}</span>
                        <div className="text-right">
                          <div className="font-bold">{cls.attendanceRate.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">{cls.present}/{cls.total} present</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {reportData.type === "perfect" && (
                <div>
                  <h3 className="font-semibold mb-2">Perfect Attendance</h3>
                  <div className="bg-green-50 p-3 rounded mb-4">
                    <div className="text-sm text-green-600">Students with Perfect Attendance</div>
                    <div className="text-xl font-bold">{reportData.data.count || 0}</div>
                  </div>
                  <div className="space-y-2">
                    {reportData.data.students?.map((student: any) => (
                      <div key={student.studentId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{student.studentName}</span>
                          <div className="text-sm text-gray-600">{student.className}</div>
                        </div>
                        <div className="text-green-600 font-bold">100%</div>
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
