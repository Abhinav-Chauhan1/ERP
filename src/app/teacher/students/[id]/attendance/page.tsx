"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chart } from "@/components/dashboard/chart";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  Calendar,
  Download,
  UserCheck,
  UserX,
  Clock,
  Mail,
  CalendarDays,
  FileText,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  XCircle,
  ClockIcon,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { getStudentAttendanceReport } from "@/lib/actions/teacherAttendanceActions";
import { toast } from "react-hot-toast";
import { AttendanceStatus } from "@prisma/client";
import { AttendanceCalendarWidget } from "@/components/attendance/attendance-calendar-widget";

export default function StudentAttendanceReportPage(props: { params: Promise<{ id: string }> }) {
  const paramsPromise = use(props.params);
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Unwrap params
  useEffect(() => {
    paramsPromise.then(p => setStudentId(p.id));
  }, [paramsPromise]);

  const fetchStudentAttendanceReport = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      };

      const data = await getStudentAttendanceReport(studentId, filters);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch student attendance report:", error);
      toast.error("Failed to load attendance report data");
    } finally {
      setLoading(false);
    }
  }, [studentId, dateRange]);

  useEffect(() => {
    if (!studentId) return;
    fetchStudentAttendanceReport();
  }, [studentId, fetchStudentAttendanceReport]);

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Late</Badge>;
      case "LEAVE":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Leave</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Half Day</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Create calendar events from attendance records
  const attendanceEvents = reportData?.records.map((record: any) => ({
    id: record.id,
    title: record.status,
    date: new Date(record.date),
    type: record.status === "PRESENT" ? "success" :
      record.status === "ABSENT" ? "danger" :
        record.status === "LATE" ? "warning" : "info"
  })) || [];

  if (loading && !reportData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Student Not Found</h2>
        <p className="text-gray-500 mb-4">The student you're looking for doesn't exist or you don't have permission to view their attendance.</p>
        <Button onClick={() => router.push('/teacher/students')}>
          Go to Students List
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">{reportData.student.name} - Attendance Report</h1>
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
            />
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span>Class: {reportData.student.class}</span>
            <span>•</span>
            <span>Section: {reportData.student.section}</span>
            <span>•</span>
            <span>Roll #: {reportData.student.rollNumber}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance Rate</CardTitle>
            <CardDescription>Overall percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.stats.attendancePercentage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${reportData.stats.attendancePercentage >= 90 ? 'bg-green-500' :
                    reportData.stats.attendancePercentage >= 75 ? 'bg-amber-500' :
                      'bg-red-500'
                  }`}
                style={{ width: `${reportData.stats.attendancePercentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {reportData.stats.attendancePercentage >= 90 ? 'Excellent' :
                reportData.stats.attendancePercentage >= 75 ? 'Good' :
                  'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Present</CardTitle>
            <CardDescription>Days present</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {reportData.stats.presentDays}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
              <UserCheck className="h-3.5 w-3.5 text-green-500" />
              <span>
                Out of {reportData.stats.totalDays} days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Absent</CardTitle>
            <CardDescription>Days absent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {reportData.stats.absentDays}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
              <UserX className="h-3.5 w-3.5 text-red-500" />
              <span>
                {Math.round((reportData.stats.absentDays / reportData.stats.totalDays) * 100)}% of total days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Late Arrivals</CardTitle>
            <CardDescription>Days came late</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {reportData.stats.lateDays}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {Math.round((reportData.stats.lateDays / reportData.stats.totalDays) * 100)}% of total days
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance Trends</CardTitle>
            <CardDescription>Attendance patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Chart
                title="Monthly Attendance"
                data={reportData.monthlyTrends || []}
                type="bar"
                xKey="month"
                yKey="presentPercentage"
                categories={["presentPercentage"]}
                colors={["#10b981"]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>Daily attendance status</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceCalendarWidget events={attendanceEvents} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Detailed daily attendance log</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.records.map((record: any) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{format(parseISO(record.date), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.className} {record.sectionName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(record.status as AttendanceStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.reason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500"></div>
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Leave</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Contact Parents
            </Button>
            <Link href={`/teacher/students/${studentId}`}>
              <Button>View Student Profile</Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
