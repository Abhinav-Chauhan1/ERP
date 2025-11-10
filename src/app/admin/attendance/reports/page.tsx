"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  ChevronLeft, Download, Filter, BarChart2, 
  Users, User, PrinterIcon, FileDown, FileText,
  Calendar, Clock, CheckCircle, XCircle, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  getClassWiseAttendance,
  getDailyAttendanceSummary,
  getAbsenteeismAnalysis,
  getMonthlyAttendanceTrends,
  getPerfectAttendance,
} from "@/lib/actions/attendanceReportActions";
import { getClasses } from "@/lib/actions/classesActions";

// Mock data for grades/classes (fallback)
const mockClasses = [
  { id: "1", name: "Grade 9-A" },
  { id: "2", name: "Grade 9-B" },
  { id: "3", name: "Grade 10-A" },
  { id: "4", name: "Grade 10-B" },
  { id: "5", name: "Grade 11-A" },
  { id: "6", name: "Grade 11-B" },
];

// Mock data for departments
const departments = [
  { id: "d1", name: "Science" },
  { id: "d2", name: "Mathematics" },
  { id: "d3", name: "Languages" },
  { id: "d4", name: "Social Studies" },
  { id: "d5", name: "Arts" },
];

// Month data for reports
const months = [
  { id: "1", name: "January" },
  { id: "2", name: "February" },
  { id: "3", name: "March" },
  { id: "4", name: "April" },
  { id: "5", name: "May" },
  { id: "6", name: "June" },
  { id: "7", name: "July" },
  { id: "8", name: "August" },
  { id: "9", name: "September" },
  { id: "10", name: "October" },
  { id: "11", name: "November" },
  { id: "12", name: "December" },
];

// Mock attendance summary data
const classAttendanceSummary = [
  { id: "1", className: "Grade 9-A", totalStudents: 28, averageAttendance: 94.5, trend: "+1.2%" },
  { id: "2", className: "Grade 9-B", totalStudents: 30, averageAttendance: 92.8, trend: "-0.5%" },
  { id: "3", className: "Grade 10-A", totalStudents: 32, averageAttendance: 89.6, trend: "-2.3%" },
  { id: "4", className: "Grade 10-B", totalStudents: 29, averageAttendance: 91.2, trend: "+0.8%" },
  { id: "5", className: "Grade 11-A", totalStudents: 26, averageAttendance: 95.7, trend: "+2.1%" },
  { id: "6", className: "Grade 11-B", totalStudents: 27, averageAttendance: 93.4, trend: "+0.7%" },
];

// Mock department attendance summary data
const departmentAttendanceSummary = [
  { id: "1", departmentName: "Science", totalTeachers: 18, averageAttendance: 96.2, trend: "+0.5%" },
  { id: "2", departmentName: "Mathematics", totalTeachers: 15, averageAttendance: 97.8, trend: "+1.2%" },
  { id: "3", departmentName: "Languages", totalTeachers: 20, averageAttendance: 94.5, trend: "-0.8%" },
  { id: "4", departmentName: "Social Studies", totalTeachers: 12, averageAttendance: 95.3, trend: "+0.2%" },
  { id: "5", departmentName: "Arts", totalTeachers: 8, averageAttendance: 93.7, trend: "-1.5%" },
];

// Mock students with low attendance
const lowAttendanceStudents = [
  { id: "1", name: "John Smith", grade: "Grade 10-A", attendance: 78.5, absences: 12, consecutiveDaysAbsent: 0 },
  { id: "2", name: "Mary Johnson", grade: "Grade 9-B", attendance: 65.2, absences: 18, consecutiveDaysAbsent: 3 },
  { id: "3", name: "David Wilson", grade: "Grade 11-B", attendance: 72.4, absences: 14, consecutiveDaysAbsent: 0 },
  { id: "4", name: "Sarah Brown", grade: "Grade 10-B", attendance: 76.8, absences: 12, consecutiveDaysAbsent: 0 },
  { id: "5", name: "Michael Davis", grade: "Grade 9-A", attendance: 71.3, absences: 15, consecutiveDaysAbsent: 2 },
];

export default function AttendanceReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1 + "");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + "");
  const [reportGenerateDialogOpen, setReportGenerateDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("student");
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [classReport, setClassReport] = useState<any>(null);
  const [departmentReport, setDepartmentReport] = useState<any>(null);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  // Load data on mount
  useEffect(() => {
    loadClasses();
    loadLowAttendanceStudents();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassReport();
    }
  }, [selectedClass, selectedMonth, selectedYear]);

  const loadClasses = async () => {
    try {
      const result = await getClasses();
      if (result.success && result.data) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const loadClassReport = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const dateFrom = new Date(year, month - 1, 1);
      const dateTo = new Date(year, month, 0);

      const result = await getClassAttendanceReport(selectedClass, dateFrom, dateTo);
      if (result.success && result.data) {
        setClassReport(result.data);
      } else {
        toast.error(result.error || "Failed to load class report");
      }
    } catch (error) {
      console.error("Error loading class report:", error);
      toast.error("Failed to load class report");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentReport = async () => {
    setLoading(true);
    try {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const dateFrom = new Date(year, month - 1, 1);
      const dateTo = new Date(year, month, 0);

      const result = await getDepartmentAttendanceReport(dateFrom, dateTo);
      if (result.success && result.data) {
        setDepartmentReport(result.data);
      } else {
        toast.error(result.error || "Failed to load department report");
      }
    } catch (error) {
      console.error("Error loading department report:", error);
      toast.error("Failed to load department report");
    } finally {
      setLoading(false);
    }
  };

  const loadLowAttendanceStudents = async () => {
    try {
      const result = await getLowAttendanceStudents(75);
      if (result.success && result.data) {
        setLowAttendanceStudents(result.data);
      }
    } catch (error) {
      console.error("Error loading low attendance students:", error);
    }
  };

  const handleExportReport = async () => {
    try {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const dateFrom = new Date(year, month - 1, 1);
      const dateTo = new Date(year, month, 0);

      const result = await exportAttendanceReport({
        classId: selectedClass,
        dateFrom,
        dateTo,
        type: reportType === "student" ? "CLASS" : "DEPARTMENT",
      });

      if (result.success) {
        toast.success("Report exported successfully");
        setReportGenerateDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to export report");
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/attendance">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
        </div>
        <Dialog open={reportGenerateDialogOpen} onOpenChange={setReportGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Download className="mr-2 h-4 w-4" /> Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Attendance Report</DialogTitle>
              <DialogDescription>
                Select options to generate a customized attendance report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student Attendance</SelectItem>
                    <SelectItem value="teacher">Teacher Attendance</SelectItem>
                    <SelectItem value="class">Class-wise Attendance</SelectItem>
                    <SelectItem value="department">Department-wise Attendance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {reportType === "student" || reportType === "class" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
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
              ) : null}
              
              {reportType === "teacher" || reportType === "department" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <div className="grid grid-cols-2 gap-4">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.id} value={month.id}>
                          {month.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Format</label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setReportGenerateDialogOpen(false)}>
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Student Attendance</CardTitle>
            </div>
            <CardDescription>Overall student attendance rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 items-center justify-center">
              <div className="text-3xl font-bold">92.4%</div>
              <Badge className="bg-green-100 text-green-800">+1.2% vs. last month</Badge>
              <Progress value={92.4} className="w-full mt-2" />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-3">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/admin/attendance/students">
                View Details
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-md text-purple-700">
                <User className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Teacher Attendance</CardTitle>
            </div>
            <CardDescription>Overall teacher attendance rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 items-center justify-center">
              <div className="text-3xl font-bold">96.2%</div>
              <Badge className="bg-green-100 text-green-800">+0.5% vs. last month</Badge>
              <Progress value={96.2} className="w-full mt-2" />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-3">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/admin/attendance/teachers">
                View Details
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 rounded-md text-red-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Attendance Alerts</CardTitle>
            </div>
            <CardDescription>Students with low attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 items-center justify-center">
              <div className="text-3xl font-bold">15</div>
              <Badge className="bg-red-100 text-red-800">Below 80% attendance</Badge>
              <div className="w-full mt-2 text-center text-sm text-gray-500">
                5 students with consecutive absences
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-3">
            <Button variant="outline" size="sm" className="w-full">
              View Alerts
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="class">Class Reports</TabsTrigger>
          <TabsTrigger value="teacher">Teacher Reports</TabsTrigger>
          <TabsTrigger value="alerts">Attendance Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Monthly Attendance Trend</CardTitle>
                <CardDescription>
                  School-wide attendance rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-400">Monthly attendance chart would display here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Attendance by Day of Week</CardTitle>
                <CardDescription>
                  Attendance patterns across different weekdays
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-400">Day of week attendance chart would display here</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle>Top Report Templates</CardTitle>
              <CardDescription>
                Frequently used attendance report templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Monthly Class Report</CardTitle>
                    <CardDescription className="text-xs">Detailed monthly attendance for each class</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last generated: 2 days ago</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Generation time: ~2 minutes</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileDown className="h-3.5 w-3.5 mr-1" />
                      Generate
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Teacher Attendance Summary</CardTitle>
                    <CardDescription className="text-xs">Department-wise teacher attendance</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last generated: 1 week ago</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Generation time: ~1 minute</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileDown className="h-3.5 w-3.5 mr-1" />
                      Generate
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Student Absence Report</CardTitle>
                    <CardDescription className="text-xs">List of students with high absences</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last generated: 3 days ago</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Generation time: ~1 minute</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileDown className="h-3.5 w-3.5 mr-1" />
                      Generate
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="class">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Class Attendance Summary</CardTitle>
                  <CardDescription>
                    Attendance rates by class
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Select>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.id} value={month.id}>
                          {month.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Total Students</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Avg. Attendance</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Trend</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classAttendanceSummary.map((cls) => (
                      <tr key={cls.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{cls.className}</td>
                        <td className="py-3 px-4 align-middle">{cls.totalStudents}</td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={cls.averageAttendance}
                              className="h-2 w-16"
                            />
                            <span>{cls.averageAttendance.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={
                            cls.trend.startsWith("+") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }>
                            {cls.trend}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">
                            View Report
                          </Button>
                          <Button variant="ghost" size="sm">
                            <PrinterIcon className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teacher">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Department Attendance Summary</CardTitle>
                  <CardDescription>
                    Teacher attendance rates by department
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Select>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.id} value={month.id}>
                          {month.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Department</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Total Teachers</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Avg. Attendance</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Trend</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentAttendanceSummary.map((dept) => (
                      <tr key={dept.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{dept.departmentName}</td>
                        <td className="py-3 px-4 align-middle">{dept.totalTeachers}</td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={dept.averageAttendance}
                              className="h-2 w-16"
                            />
                            <span>{dept.averageAttendance.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={
                            dept.trend.startsWith("+") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }>
                            {dept.trend}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">
                            View Report
                          </Button>
                          <Button variant="ghost" size="sm">
                            <PrinterIcon className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Students with Low Attendance</CardTitle>
                  <CardDescription>
                    Students with attendance below 80%
                  </CardDescription>
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    Send Notification to All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Attendance</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Absences</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowAttendanceStudents.map((student) => (
                      <tr key={student.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{student.name}</td>
                        <td className="py-3 px-4 align-middle">{student.grade}</td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={student.attendance}
                              className="h-2 w-16"
                            />
                            <span>{student.attendance.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">{student.absences} days</td>
                        <td className="py-3 px-4 align-middle">
                          {student.consecutiveDaysAbsent > 0 ? (
                            <Badge className="bg-red-100 text-red-800">
                              {student.consecutiveDaysAbsent} consecutive days
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">
                              Low attendance
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">
                            Attendance Log
                          </Button>
                          <Button variant="ghost" size="sm">
                            Contact Parents
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
