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
    <div className="container p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-gray-500">
            Class: {currentClass} {currentSection}
          </p>
        </div>
        <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md">
          <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
          <span className="font-medium">
            Current Month: {format(currentDate, 'MMMM yyyy')}
          </span>
        </div>
      </div>
      
      <AttendanceStatsCards 
        presentDays={statistics.presentDays}
        absentDays={statistics.absentDays}
        lateDays={statistics.lateDays}
        leaveDays={statistics.leaveDays}
        totalDays={statistics.totalDays}
        attendancePercentage={statistics.attendancePercentage}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
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
              <CardTitle>Attendance Status</CardTitle>
              <CardDescription>Legend for attendance marks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Present</p>
                  <p className="text-sm text-gray-500">Attended the class</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Absent</p>
                  <p className="text-sm text-gray-500">Not present in class</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Late</p>
                  <p className="text-sm text-gray-500">Arrived late to class</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Badge className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-700 hover:bg-blue-100 border-none">
                  L
                </Badge>
                <div>
                  <p className="font-medium">Leave</p>
                  <p className="text-sm text-gray-500">On approved leave</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Monthly Calendar View</CardTitle>
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
