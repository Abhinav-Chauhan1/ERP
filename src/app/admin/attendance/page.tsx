import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, User, Users, BarChart, 
  ArrowUpRight, XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Chart } from "@/components/dashboard/chart";
import {
  getAttendanceOverview,
  getWeeklyAttendanceTrend,
  getAttendanceByClass,
  getRecentAbsences,
} from "@/lib/actions/attendanceActions";

export default async function AttendancePage() {
  const [overviewResult, trendResult, classByResult, absencesResult] = await Promise.all([
    getAttendanceOverview(),
    getWeeklyAttendanceTrend(),
    getAttendanceByClass(),
    getRecentAbsences(10),
  ]);

  const overview = (overviewResult.success ? overviewResult.data : null) ?? {
    studentAttendanceRate: "0%",
    teacherAttendanceRate: "0%",
    totalReports: 0,
  };

  const trendData = (trendResult.success ? trendResult.data : null) ?? [];
  const classAttendance = (classByResult.success ? classByResult.data : null) ?? [];
  const recentAbsences = (absencesResult.success ? absencesResult.data : null) ?? [];

  const attendanceCategories = [
    {
      title: "Student Attendance",
      icon: <Users className="h-5 w-5" />,
      description: "Track student presence",
      href: "/admin/attendance/students",
      count: overview.studentAttendanceRate,
    },
    {
      title: "Teacher Attendance",
      icon: <User className="h-5 w-5" />,
      description: "Monitor staff presence",
      href: "/admin/attendance/teachers",
      count: overview.teacherAttendanceRate,
    },
    {
      title: "Attendance Reports",
      icon: <BarChart className="h-5 w-5" />,
      description: "Analyze attendance data",
      href: "/admin/attendance/reports",
      count: overview.totalReports.toString(),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage student and teacher attendance
          </p>
        </div>
        <Link href="/admin/attendance/students">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Mark Attendance
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {attendanceCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent rounded-md">
                  {category.icon}
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{category.count}</div>
                <Link href={category.href}>
                  <Button variant="outline" size="sm">
                    Manage
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Weekly Attendance Trend</CardTitle>
                <CardDescription>Student attendance for the last 7 school days</CardDescription>
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
            {trendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No attendance data</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start marking attendance to see trends here.
                </p>
                <Link href="/admin/attendance/students">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Button>
                </Link>
              </div>
            ) : (
              <Chart
                title=""
                data={trendData}
                type="bar"
                xKey="date"
                yKey="present"
                categories={["present", "absent"]}
                colors={["#10b981", "#ef4444"]}
              />
            )}
          </CardContent>
          <div className="px-6 py-3 border-t">
            <Link href="/admin/attendance/reports">
              <Button variant="ghost" size="sm" className="text-primary">
                View Detailed Reports
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Attendance by Grade</CardTitle>
            <CardDescription>Present percentage by class</CardDescription>
          </CardHeader>
          <CardContent>
            {classAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No class data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classAttendance.map((item) => (
                  <div key={item.class}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{item.class}</span>
                      <span className="text-sm font-medium">{item.present}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.present >= 95
                            ? "bg-green-500"
                            : item.present >= 90
                            ? "bg-green-400"
                            : item.present >= 85
                            ? "bg-primary"
                            : item.present >= 80
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${item.present}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="px-6 py-3 border-t">
            <Link href="/admin/attendance/students">
              <Button variant="ghost" size="sm" className="text-primary">
                View Student Attendance
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Recent Absences</CardTitle>
            <CardDescription>Students marked absent in the last 2 days</CardDescription>
          </div>
          <Link href="/admin/attendance/students">
            <Button variant="outline" size="sm">
              View All
            </Button>
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
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
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
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={`/admin/attendance/students?student=${absence.studentId}`}>
                            <Button variant="ghost" size="sm">
                              Details
                            </Button>
                          </Link>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Card className="bg-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Quick Attendance Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-primary">Generate attendance reports instantly</p>
              <Link href="/admin/attendance/reports">
                <Button size="sm" className="w-full">
                  Generate Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Teacher Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-purple-800">Track and manage staff attendance</p>
              <Link href="/admin/attendance/teachers">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-purple-600 text-purple-600 hover:bg-purple-100"
                >
                  View Teachers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">
              Student Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-emerald-800">Track and manage student attendance</p>
              <Link href="/admin/attendance/students">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-100"
                >
                  View Students
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Send Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-amber-800">Notify parents about student absences</p>
              <Link href="/admin/communication">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-600 text-amber-600 hover:bg-amber-100"
                >
                  Send Notifications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
