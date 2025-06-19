import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { 
  CalendarClock, 
  FileText, 
  ChevronRight, 
  Calendar, 
  ClipboardCheck 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentAttendanceReport } from "@/lib/actions/student-attendance-actions";

export const metadata: Metadata = {
  title: "Attendance | Student Portal",
  description: "View and manage your attendance records",
};

export default async function AttendancePage() {
  // Get attendance data for current month to show summary
  const { statistics, currentClass, currentSection } = await getStudentAttendanceReport();
  
  const attendanceLinks = [
    {
      title: "Attendance Report",
      description: "View your detailed attendance record and statistics",
      icon: CalendarClock,
      href: "/student/attendance/report",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Leave Applications",
      description: "Apply for and manage your leave requests",
      icon: FileText,
      href: "/student/attendance/leave",
      color: "bg-green-50 text-green-600",
    },
  ];
  
  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-gray-500">
          View and manage your attendance records and leave applications
        </p>
      </div>
      
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Current Attendance Status</h2>
            <p className="text-gray-600">Class: <span className="font-medium">{currentClass} {currentSection}</span></p>
          </div>
          
          <div className="flex flex-col items-center bg-white px-6 py-3 rounded-lg shadow-sm">
            <span className="text-gray-500 text-sm">Attendance</span>
            <span 
              className={`text-3xl font-bold ${
                statistics.attendancePercentage >= 90 ? 'text-green-600' :
                statistics.attendancePercentage >= 75 ? 'text-blue-600' :
                statistics.attendancePercentage >= 60 ? 'text-amber-600' :
                'text-red-600'
              }`}
            >
              {statistics.attendancePercentage}%
            </span>
          </div>
          
          <div className="flex gap-3">
            <div className="flex flex-col items-center bg-white px-4 py-3 rounded-lg shadow-sm">
              <span className="text-gray-500 text-xs">Present</span>
              <span className="text-2xl font-bold text-green-600">{statistics.presentDays}</span>
              <span className="text-xs text-gray-500">days</span>
            </div>
            
            <div className="flex flex-col items-center bg-white px-4 py-3 rounded-lg shadow-sm">
              <span className="text-gray-500 text-xs">Absent</span>
              <span className="text-2xl font-bold text-red-600">{statistics.absentDays}</span>
              <span className="text-xs text-gray-500">days</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {attendanceLinks.map((link) => (
          <Card key={link.href}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <div className={`rounded-lg p-2 mr-3 ${link.color}`}>
                  <link.icon className="h-6 w-6" />
                </div>
                {link.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">{link.description}</p>
              <Button asChild className="w-full mt-2">
                <Link href={link.href}>
                  Access {link.title}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2 text-blue-600" />
            Attendance Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Minimum Attendance Requirement</h3>
              <p className="text-sm text-gray-600">
                Students are required to maintain a minimum of 75% attendance in all classes. 
                Failure to meet this requirement may result in academic penalties.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Leave Application Process</h3>
              <p className="text-sm text-gray-600">
                For planned absences, leave applications must be submitted at least 3 days in advance.
                Medical emergencies require supporting documents to be submitted within one week.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Attendance Marking</h3>
              <p className="text-sm text-gray-600">
                Attendance is marked at the beginning of each class. Students arriving more than 
                10 minutes late may be marked as "Late" which counts as half-attendance.
              </p>
            </div>
            
            <div className="pt-2">
              <Link 
                href="/student/documents/policies/attendance"
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                View complete attendance policy document
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
