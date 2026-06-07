import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  FileText, 
  BarChart2, 
  Calendar, 
  UserX, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  ArrowUpRight,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Chart } from "@/components/dashboard/chart";
import { getTeacherAttendanceOverview } from "@/lib/actions/teacherAttendanceOverviewActions";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function TeacherAttendancePage() {
  const result = await getTeacherAttendanceOverview();

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load attendance data</h2>
        <p className="text-muted-foreground">{result.error || "An error occurred"}</p>
      </div>
    );
  }

  const { data } = result;
  const { stats, todayClasses, attendanceByDay, classAttendanceSummary, recentAbsences } = data;

  const categories = [
    {
      title: "Student Attendance",
      icon: <Users className="h-5 w-5" />,
      description: "Weekly attendance average",
      href: "/teacher/attendance/reports",
      count: `${stats.weeklyAverage}%`,
    },
    {
      title: "Weekly Absences",
      icon: <UserX className="h-5 w-5 text-destructive" />,
      description: "This week's absences count",
      href: "/teacher/attendance/reports",
      count: stats.absentThisWeek.toString(),
    },
    {
      title: "Pending Attendance",
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      description: "Classes to mark today",
      href: "/teacher/attendance/mark",
      count: stats.pendingCount.toString(),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage student attendance in your assigned classes
          </p>
        </div>
        <Link href="/teacher/attendance/mark">
          <Button>
            <ClipboardCheck className="mr-2 h-4 w-4" /> Mark Attendance
          </Button>
        </Link>
      </div>
      
      {/* Overview stats cards matching admin layout */}
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent rounded-md">{category.icon}</div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{category.count}</div>
                <Link href={category.href}>
                  <Button variant="outline" size="sm">
                    View
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend chart + Class Breakdown matching admin layout */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Weekly Attendance Trend</CardTitle>
                <CardDescription>Student attendance for your classes</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceByDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No attendance data</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Mark attendance to see trends here.
                </p>
              </div>
            ) : (
              <Chart
                title=""
                data={attendanceByDay}
                type="bar"
                xKey="date"
                yKey="present"
                categories={["present", "absent"]}
                colors={["#10b981", "#ef4444"]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Attendance by Class</CardTitle>
            <CardDescription>Present percentage by class</CardDescription>
          </CardHeader>
          <CardContent>
            {classAttendanceSummary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No class data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classAttendanceSummary.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm font-medium">{item.averageAttendance}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.averageAttendance >= 90
                            ? "bg-green-500"
                            : item.averageAttendance >= 75
                            ? "bg-primary"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${item.averageAttendance}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scoped Recent Absences matching admin layout */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Recent Absences</CardTitle>
            <CardDescription>Students marked absent in the last 2 days</CardDescription>
          </div>
          <Link href="/teacher/attendance/reports">
            <Button variant="outline" size="sm">View Reports</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentAbsences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recent absences</h3>
              <p className="text-muted-foreground">All students are present!</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Reason</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Informed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAbsences.map((absence) => (
                      <tr key={absence.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-4 align-middle font-medium">{absence.name}</td>
                        <td className="py-3 px-4 align-middle">{absence.grade}</td>
                        <td className="py-3 px-4 align-middle">{absence.date}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            <XCircle className="h-3 w-3 mr-1" />
                            {absence.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle">{absence.reason}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge
                            className={`${
                              absence.informed === "Yes"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            }`}
                          >
                            {absence.informed}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Today's Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Classes</CardTitle>
          <CardDescription>Mark attendance for your scheduled classes</CardDescription>
        </CardHeader>
        <CardContent>
          {todayClasses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayClasses.map((classInfo) => (
                <Card key={classInfo.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-base">{classInfo.className}</CardTitle>
                        <CardDescription>{classInfo.subject}</CardDescription>
                      </div>
                      {classInfo.isNow && (
                        <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                          Now
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Section:</span>
                        <span className="font-medium">{classInfo.sectionName || "All"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium">{classInfo.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Room:</span>
                        <span className="font-medium">{classInfo.room}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link href={`/teacher/attendance/mark?classId=${classInfo.classId}&sectionId=${classInfo.sectionId}`} className="w-full">
                      <Button className="w-full">
                        <ClipboardCheck className="mr-2 h-4 w-4" /> Mark Attendance
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Classes Today</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You don't have any classes scheduled for today. Check back later or view previous attendance records.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/teacher/attendance/mark">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-primary/20 hover:bg-primary/5 transition-colors text-center cursor-pointer">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Mark Attendance</span>
            </div>
          </Link>
          <Link href="/teacher/attendance/reports">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-primary/20 hover:bg-primary/5 transition-colors text-center cursor-pointer">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Attendance Reports</span>
            </div>
          </Link>
          <Link href="/teacher/attendance/reports">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-primary/20 hover:bg-primary/5 transition-colors text-center cursor-pointer">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <BarChart2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Attendance Analysis</span>
            </div>
          </Link>
          <Link href="/teacher/communication/messages/compose?template=attendance">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-primary/20 hover:bg-primary/5 transition-colors text-center cursor-pointer">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <UserX className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Contact Absent Students</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
