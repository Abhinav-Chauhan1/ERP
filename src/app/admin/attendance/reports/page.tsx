"use client";


import { useState, useEffect, useCallback } from "react";
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
import { getAttendanceStats } from "@/lib/actions/attendanceActions";

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

export default function AttendanceReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1 + "");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + "");
  const [reportGenerateDialogOpen, setReportGenerateDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("student");
  const [loading, setLoading] = useState(false);

  // Data states
  const [todayStats, setTodayStats] = useState<any>(null);
  const [classWiseData, setClassWiseData] = useState<any[]>([]);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);

  const loadTodayStats = useCallback(async () => {
    try {
      const result = await getAttendanceStats();
      if (result.success && result.data) {
        setTodayStats(result.data);
      }
    } catch (error) {
      console.error("Error loading today's stats:", error);
    }
  }, []);

  const loadClassWiseData = useCallback(async () => {
    setLoading(true);
    try {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const result = await getClassWiseAttendance({
        startDate,
        endDate,
      });

      if (result.success && result.data) {
        setClassWiseData(result.data);
      } else {
        toast.error(result.error || "Failed to load class report");
      }
    } catch (error) {
      console.error("Error loading class report:", error);
      toast.error("Failed to load class report");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadLowAttendanceStudents = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const result = await getAbsenteeismAnalysis({
        startDate,
        endDate,
      });

      if (result.success && result.data) {
        // Filter students with more than 5 absences (low attendance)
        const lowAttendance = result.data
          .filter((student: any) => student.absenceCount >= 5)
          .slice(0, 10);
        setLowAttendanceStudents(lowAttendance);
      }
    } catch (error) {
      console.error("Error loading low attendance students:", error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadTodayStats();
    loadLowAttendanceStudents();
  }, [loadTodayStats, loadLowAttendanceStudents]);

  useEffect(() => {
    if (activeTab === "class") {
      loadClassWiseData();
    }
  }, [activeTab, loadClassWiseData]);

  const [exportFormat, setExportFormat] = useState("pdf");
  const [exporting, setExporting] = useState(false);

  const handleExportReport = async () => {
    try {
      setExporting(true);

      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Fetch data based on report type
      let reportData: any[] = [];
      let reportTitle = '';

      if (reportType === 'class') {
        const result = await getClassWiseAttendance({ startDate, endDate });
        if (result.success && result.data) {
          reportData = result.data;
          reportTitle = 'Class Attendance Report';
        }
      } else if (reportType === 'absenteeism') {
        const result = await getAbsenteeismAnalysis({ startDate, endDate });
        if (result.success && result.data) {
          reportData = result.data;
          reportTitle = 'Absenteeism Analysis Report';
        }
      } else if (reportType === 'student' || reportType === 'teacher') {
        // For daily summary, we fetch today's data
        const result = await getDailyAttendanceSummary(new Date());
        if (result.success && result.data) {
          // Wrap the summary in an array for consistent handling
          reportData = [result.data.summary];
          reportTitle = `${reportType === 'student' ? 'Student' : 'Teacher'} Attendance Report`;
        }
      }

      if (reportData.length === 0) {
        toast.error('No data available for the selected period');
        return;
      }

      const monthName = months.find(m => m.id === selectedMonth)?.name || '';
      const filename = `attendance-report-${monthName}-${year}`;

      if (exportFormat === 'pdf') {
        // Generate PDF using jsPDF
        const { default: jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(reportTitle, pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${monthName} ${year}`, 14, 25);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, 25);

        // Table data based on report type
        let headers: string[] = [];
        let tableData: any[][] = [];

        if (reportType === 'class') {
          headers = ['Class', 'Total Records', 'Present', 'Absent', 'Late', 'Attendance Rate'];
          tableData = reportData.map((r: any) => [
            r.className,
            r.totalRecords,
            r.presentCount,
            r.absentCount,
            r.lateCount || 0,
            `${r.attendanceRate?.toFixed(1) || 0}%`
          ]);
        } else if (reportType === 'absenteeism') {
          headers = ['Student Name', 'Admission ID', 'Class', 'Section', 'Absences'];
          tableData = reportData.map((r: any) => [
            r.studentName,
            r.admissionId,
            r.class,
            r.section,
            r.absenceCount
          ]);
        } else {
          headers = ['Date', 'Total', 'Present', 'Absent', 'Late', 'Attendance Rate'];
          tableData = reportData.map((r: any) => [
            new Date(r.date).toLocaleDateString(),
            r.total,
            r.present,
            r.absent,
            r.late || 0,
            `${r.attendanceRate?.toFixed(1) || 0}%`
          ]);
        }

        autoTable(doc, {
          startY: 35,
          head: [headers],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
        });

        // Download
        doc.save(`${filename}.pdf`);
        toast.success('PDF report downloaded successfully');

      } else if (exportFormat === 'excel' || exportFormat === 'csv') {
        // Generate Excel/CSV using xlsx
        const XLSX = await import('xlsx' as any);
        const workbook = XLSX.utils.book_new();

        // Prepare data
        let sheetData: any[][];

        if (reportType === 'class') {
          sheetData = [
            [reportTitle],
            [`Period: ${monthName} ${year}`],
            [],
            ['Class', 'Total Records', 'Present', 'Absent', 'Late', 'Attendance Rate'],
            ...reportData.map((r: any) => [
              r.className,
              r.totalRecords,
              r.presentCount,
              r.absentCount,
              r.lateCount || 0,
              r.attendanceRate?.toFixed(1) || 0
            ])
          ];
        } else if (reportType === 'absenteeism') {
          sheetData = [
            [reportTitle],
            [`Period: ${monthName} ${year}`],
            [],
            ['Student Name', 'Admission ID', 'Class', 'Section', 'Absences'],
            ...reportData.map((r: any) => [
              r.studentName,
              r.admissionId,
              r.class,
              r.section,
              r.absenceCount
            ])
          ];
        } else {
          sheetData = [
            [reportTitle],
            [`Period: ${monthName} ${year}`],
            [],
            ['Date', 'Total', 'Present', 'Absent', 'Late', 'Attendance Rate'],
            ...reportData.map((r: any) => [
              new Date(r.date).toLocaleDateString(),
              r.total,
              r.present,
              r.absent,
              r.late || 0,
              r.attendanceRate?.toFixed(1) || 0
            ])
          ];
        }

        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Attendance Report');

        if (exportFormat === 'csv') {
          XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
          toast.success('CSV report downloaded successfully');
        } else {
          XLSX.writeFile(workbook, `${filename}.xlsx`);
          toast.success('Excel report downloaded successfully');
        }
      }

      setReportGenerateDialogOpen(false);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  // Calculate attendance rates
  const studentAttendanceRate = todayStats?.students
    ? todayStats.students.total > 0
      ? ((todayStats.students.present / todayStats.students.total) * 100).toFixed(1)
      : "0.0"
    : "0.0";

  const teacherAttendanceRate = todayStats?.teachers
    ? todayStats.teachers.total > 0
      ? ((todayStats.teachers.present / todayStats.teachers.total) * 100).toFixed(1)
      : "0.0"
    : "0.0";

  const lowAttendanceCount = lowAttendanceStudents.length;
  const consecutiveAbsenceCount = lowAttendanceStudents.filter(
    (s: any) => s.absenceCount >= 3
  ).length;

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
                    <SelectItem value="absenteeism">Absenteeism Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                      <SelectItem value={(new Date().getFullYear()).toString()}>
                        {new Date().getFullYear()}
                      </SelectItem>
                      <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                        {new Date().getFullYear() - 1}
                      </SelectItem>
                      <SelectItem value={(new Date().getFullYear() - 2).toString()}>
                        {new Date().getFullYear() - 2}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Report Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
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
              <Button variant="outline" onClick={() => setReportGenerateDialogOpen(false)} disabled={exporting}>
                Cancel
              </Button>
              <Button onClick={handleExportReport} disabled={exporting}>
                {exporting ? 'Generating...' : 'Generate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Student Attendance</CardTitle>
            </div>
            <CardDescription>Overall student attendance rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 items-center justify-center">
              <div className="text-3xl font-bold">{studentAttendanceRate}%</div>
              <Badge className="bg-primary/10 text-primary">
                Today: {todayStats?.students?.present || 0} / {todayStats?.students?.total || 0}
              </Badge>
              <Progress value={parseFloat(studentAttendanceRate)} className="w-full mt-2" />
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
              <div className="text-3xl font-bold">{teacherAttendanceRate}%</div>
              <Badge className="bg-purple-100 text-purple-800">
                Today: {todayStats?.teachers?.present || 0} / {todayStats?.teachers?.total || 0}
              </Badge>
              <Progress value={parseFloat(teacherAttendanceRate)} className="w-full mt-2" />
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
              <div className="text-3xl font-bold">{lowAttendanceCount}</div>
              <Badge className="bg-red-100 text-red-800">High absenteeism</Badge>
              <div className="w-full mt-2 text-center text-sm text-muted-foreground">
                {consecutiveAbsenceCount} with 3+ consecutive absences
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setActiveTab("alerts")}
            >
              View Alerts
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="class">Class Reports</TabsTrigger>
          <TabsTrigger value="alerts">Attendance Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Report Templates</CardTitle>
                <CardDescription>
                  Generate commonly used attendance reports
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
                      <div className="text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>Current month data</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Generation time: ~2 minutes</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setReportType("class");
                          setReportGenerateDialogOpen(true);
                        }}
                      >
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
                      <div className="text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>Last 30 days</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Generation time: ~1 minute</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setReportType("absenteeism");
                          setReportGenerateDialogOpen(true);
                        }}
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1" />
                        Generate
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">Teacher Attendance Summary</CardTitle>
                      <CardDescription className="text-xs">Teacher attendance overview</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>Current month data</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Generation time: ~1 minute</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setReportType("teacher");
                          setReportGenerateDialogOpen(true);
                        }}
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1" />
                        Generate
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
                <CardDescription>Attendance breakdown for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Student Attendance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Present</span>
                        <Badge className="bg-green-100 text-green-800">
                          {todayStats?.students?.present || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Absent</span>
                        <Badge className="bg-red-100 text-red-800">
                          {todayStats?.students?.absent || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Late</span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {todayStats?.students?.late || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3">Teacher Attendance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Present</span>
                        <Badge className="bg-green-100 text-green-800">
                          {todayStats?.teachers?.present || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Absent</span>
                        <Badge className="bg-red-100 text-red-800">
                          {todayStats?.teachers?.absent || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Late</span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {todayStats?.teachers?.late || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={(new Date().getFullYear()).toString()}>
                        {new Date().getFullYear()}
                      </SelectItem>
                      <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                        {new Date().getFullYear() - 1}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadClassWiseData}
                    disabled={loading}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading class data...</p>
                </div>
              ) : classWiseData.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No attendance data available for the selected period</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Total Records</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Present</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Absent</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classWiseData.map((cls) => (
                        <tr key={cls.classId} className="border-b hover:bg-accent/50">
                          <td className="py-3 px-4 align-middle font-medium">{cls.className}</td>
                          <td className="py-3 px-4 align-middle">{cls.totalRecords}</td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className="bg-green-100 text-green-800">
                              {cls.presentCount}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className="bg-red-100 text-red-800">
                              {cls.absentCount}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={cls.attendanceRate}
                                className="h-2 w-16"
                              />
                              <span>{cls.attendanceRate.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Students with High Absenteeism</CardTitle>
                  <CardDescription>
                    Students with 5 or more absences in the last 30 days
                  </CardDescription>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadLowAttendanceStudents}
                  >
                    Refresh Data
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lowAttendanceStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Great News!</h3>
                  <p className="text-muted-foreground">No students with high absenteeism</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Admission ID</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Absences</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowAttendanceStudents.map((student) => (
                        <tr key={student.studentId} className="border-b hover:bg-accent/50">
                          <td className="py-3 px-4 align-middle font-medium">{student.studentName}</td>
                          <td className="py-3 px-4 align-middle">{student.admissionId}</td>
                          <td className="py-3 px-4 align-middle">{student.class} - {student.section}</td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className={
                              student.absenceCount >= 10
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }>
                              {student.absenceCount} days
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/students/${student.studentId}`}>
                                View Details
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

