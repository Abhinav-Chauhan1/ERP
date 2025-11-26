export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceCalendar } from "@/components/student/attendance-calendar";
import { AttendanceStatsCards } from "@/components/student/attendance-stats-cards";
import { AttendanceTrendChart } from "@/components/student/attendance-trend-chart";
import { getStudentAttendanceReport, getAttendanceTrends } from "@/lib/actions/student-attendance-actions";

export const metadata: Metadata = {
  title: "Attendance Report | Student Portal",
  description: "View your attendance records and statistics",
};

export default async function StudentAttendanceReportPage() {
  // Get attendance data for current month
  const { 
    student, 
    attendanceRecords, 
    statistics, 
    currentClass, 
    currentSection 
  } = await getStudentAttendanceReport();
  
  if (!student) {
    redirect("/student");
  }
  
  // Get attendance trends
  const trendData = await getAttendanceTrends();
  
  const currentDate = new Date();
  
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Report</h1>
        <p className="text-muted-foreground mt-1">
          Track your attendance record • Class: {currentClass} {currentSection}
        </p>
      </div>
      
      {/* Attendance Summary */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-900 mb-1">Current Attendance</p>
              <div className="text-5xl font-bold text-green-900">{statistics.attendancePercentage}%</div>
              <p className="text-sm text-green-700 mt-2">
                {statistics.presentDays} present out of {statistics.totalDays} days
              </p>
            </div>
            <div className="w-32 h-32 relative flex items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AttendanceStatsCards 
        presentDays={statistics.presentDays}
        absentDays={statistics.absentDays}
        lateDays={statistics.lateDays}
        leaveDays={statistics.leaveDays}
        totalDays={statistics.totalDays}
        attendancePercentage={statistics.attendancePercentage}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Attendance Trend</CardTitle>
              <CardDescription>Monthly attendance percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceTrendChart data={trendData} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Attendance Status</CardTitle>
              <CardDescription>Legend for attendance marks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Present</p>
                  <p className="text-sm text-muted-foreground">Attended the class</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Absent</p>
                  <p className="text-sm text-muted-foreground">Not present in class</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Late</p>
                  <p className="text-sm text-muted-foreground">Arrived late to class</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Badge className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-700 hover:bg-blue-100 border-none">
                  L
                </Badge>
                <div>
                  <p className="font-medium">Leave</p>
                  <p className="text-sm text-muted-foreground">On approved leave</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Monthly Calendar View</CardTitle>
          <CardDescription>
            Attendance for {format(currentDate, 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar attendanceData={attendanceRecords} />
        </CardContent>
      </Card>
    </div>
  );
}
