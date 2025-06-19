import { redirect } from "next/navigation";
import { Metadata } from "next";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyChildren } from "@/lib/actions/parent-children-actions"; // Fixed import
import { getChildAttendance } from "@/lib/actions/parent-attendance-actions";
import { AttendanceCalendar } from "@/components/parent/attendance-calendar";
import { AttendanceStatsCard } from "@/components/parent/attendance-stats-card";
import { AttendanceHistoryTable } from "@/components/parent/attendance-history-table";

export const metadata: Metadata = {
  title: "Attendance | Parent Portal",
  description: "View your children's attendance records",
};

export default async function ParentAttendancePage() {
  const { children } = await getMyChildren(); // Fixed function call
  
  if (!children || children.length === 0) {
    return (
      <div className="container p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">No children found in your account. Please contact the school administration.</p>
              <Button className="mt-4" asChild>
                <a href="/parent">Return to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get the first child by default
  const firstChildId = children[0].id;
  
  // Get attendance data for this child for current and previous months
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const previousMonthStart = startOfMonth(subMonths(new Date(), 1));
  const previousMonthEnd = endOfMonth(subMonths(new Date(), 1));
  
  const currentMonthAttendance = await getChildAttendance(firstChildId, currentMonthStart, currentMonthEnd);
  const previousMonthAttendance = await getChildAttendance(firstChildId, previousMonthStart, previousMonthEnd);
  
  return (
    <div className="container p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-gray-500">Monitor your children's attendance records</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">{format(new Date(), 'MMMM yyyy')}</span>
        </div>
      </div>
      
      <Tabs defaultValue={firstChildId} className="space-y-6">
        <TabsList className="mb-4">
          {children.map(child => (
            <TabsTrigger key={child.id} value={child.id}>
              {child.user.firstName} {child.user.lastName}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {children.map(child => (
          <TabsContent key={child.id} value={child.id} className="space-y-6">
            <AttendanceStatsCard child={child} attendanceData={currentMonthAttendance} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Calendar View</CardTitle>
                  <CardDescription>
                    Attendance for {format(currentMonthStart, 'MMMM yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceCalendar attendanceData={currentMonthAttendance} />
                </CardContent>
              </Card>
              
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
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">Late</p>
                      <p className="text-sm text-gray-500">Arrived late to class</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  Detailed attendance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceHistoryTable attendanceData={[...currentMonthAttendance, ...previousMonthAttendance]} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
