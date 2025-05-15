import { redirect } from "next/navigation";
import { Metadata } from "next";
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { CalendarIcon, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceCalendar } from "@/components/student/attendance-calendar";
import { AttendanceStatsCards } from "@/components/student/attendance-stats-cards";
import { AttendanceTrendChart } from "@/components/student/attendance-trend-chart";

export const metadata: Metadata = {
  title: "Attendance Report | Student Portal",
  description: "View your attendance records and statistics",
};

export default async function StudentAttendanceReportPage() {
  const userDetails = await getCurrentUserDetails();
  
  if (!userDetails?.dbUser || userDetails.dbUser.role !== "STUDENT") {
    redirect("/login");
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: userDetails.dbUser.id
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1,
        include: {
          class: true,
          section: true
        }
      }
    }
  });

  if (!student) {
    redirect("/student");
  }

  const currentDate = new Date();
  const lastMonth = subMonths(currentDate, 1);
  
  // Get start and end dates for the current month
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  
  // Get all dates in the current month
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  const totalSchoolDays = daysInMonth.filter(
    date => date.getDay() !== 0 && date.getDay() !== 6 && date <= currentDate
  ).length;
  
  // Get current enrollment details
  const currentEnrollment = student.enrollments[0];
  
  if (!currentEnrollment) {
    redirect("/student");
  }
  
  // Get attendance records for current month
  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: student.id,
      sectionId: currentEnrollment.sectionId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  });
  
  // Get attendance records for previous months (for trend chart)
  const pastMonthsAttendance = await db.studentAttendance.findMany({
    where: {
      studentId: student.id,
      date: {
        gte: subMonths(currentDate, 6),
        lt: startDate
      }
    }
  });
  
  // Calculate attendance statistics
// Define interfaces for attendance data
interface AttendanceRecord {
    date: Date;
    status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "HALF_DAY";
    studentId: string;
    sectionId: string;
}

interface FormattedAttendanceData {
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "HALF_DAY";
}

interface MonthlyAttendanceData {
    month: string;
    percentage: number;
}

const presentDays: number = attendanceRecords.filter(
    (record: AttendanceRecord) => record.status === "PRESENT"
).length;
const absentDays: number = attendanceRecords.filter(
    (record: AttendanceRecord) => record.status === "ABSENT"
).length;
const lateDays: number = attendanceRecords.filter(
    (record: AttendanceRecord) => record.status === "LATE"
).length;
const onLeaveDays: number = attendanceRecords.filter(
    (record: AttendanceRecord) => record.status === "LEAVE"
).length;
  
  const attendancePercentage = totalSchoolDays > 0 
    ? (presentDays / totalSchoolDays) * 100 
    : 0;
  
// Format attendance data for the calendar component
const formattedAttendanceData: FormattedAttendanceData[] = attendanceRecords.map(
    (record: AttendanceRecord) => ({
        date: format(new Date(record.date), 'yyyy-MM-dd'),
        status: record.status
    })
);

  // Prepare trend data
  const monthlyAttendanceData = [];
  for (let i = 6; i >= 0; i--) {
    const month = subMonths(currentDate, i);
    const monthName = format(month, 'MMM');
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const recordsInMonth = [
      ...pastMonthsAttendance,
      ...attendanceRecords
    ].filter(record => {
      const date = new Date(record.date);
      return date >= monthStart && date <= monthEnd;
    });
    
    // Only include past days
    const schoolDaysInMonth = eachDayOfInterval({ 
      start: monthStart, 
      end: month > currentDate ? currentDate : monthEnd 
    }).filter(date => date.getDay() !== 0 && date.getDay() !== 6).length;
    
    const presentCount = recordsInMonth.filter(r => r.status === "PRESENT").length;
    const percentage = schoolDaysInMonth > 0 ? (presentCount / schoolDaysInMonth) * 100 : 0;
    
    monthlyAttendanceData.push({
      month: monthName,
      percentage: Math.round(percentage)
    });
  }

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-gray-500">
            Class: {currentEnrollment.class.name} {currentEnrollment.section.name}
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
        presentDays={presentDays}
        absentDays={absentDays}
        lateDays={lateDays}
        leaveDays={onLeaveDays}
        totalDays={totalSchoolDays}
        attendancePercentage={attendancePercentage}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Monthly attendance percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceTrendChart data={monthlyAttendanceData} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Attendance Status</CardTitle>
              <CardDescription>Legend for attendance marks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
          <AttendanceCalendar attendanceData={formattedAttendanceData} />
        </CardContent>
      </Card>
    </div>
  );
}
