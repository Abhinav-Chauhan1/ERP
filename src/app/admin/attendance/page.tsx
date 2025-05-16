"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, User, Users, BarChart, Calendar, 
  ArrowUpRight, FileText, Clock, CheckCircle, 
  XCircle, AlertCircle, ArrowDownRight
} from "lucide-react";
import { Chart } from "@/components/dashboard/chart";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const attendanceCategories = [
  {
    title: "Student Attendance",
    icon: <Users className="h-5 w-5" />,
    description: "Track student presence",
    href: "/admin/attendance/students",
    count: "92.4%"
  },
  {
    title: "Teacher Attendance",
    icon: <User className="h-5 w-5" />,
    description: "Monitor staff presence",
    href: "/admin/attendance/teachers",
    count: "96.2%"
  },
  {
    title: "Attendance Reports",
    icon: <BarChart className="h-5 w-5" />,
    description: "Analyze attendance data",
    href: "/admin/attendance/reports",
    count: "156"
  }
];

const studentAttendanceData = [
  { date: '11/20', present: 1145, absent: 100 },
  { date: '11/21', present: 1156, absent: 89 },
  { date: '11/22', present: 1134, absent: 111 },
  { date: '11/23', present: 1165, absent: 80 },
  { date: '11/24', present: 1142, absent: 103 },
  { date: '11/27', present: 1162, absent: 83 },
  { date: '11/28', present: 1149, absent: 96 },
];

const attendanceByClass = [
  { class: "Grade 1", present: 95.8, absent: 4.2 },
  { class: "Grade 2", present: 93.2, absent: 6.8 },
  { class: "Grade 3", present: 91.5, absent: 8.5 },
  { class: "Grade 4", present: 94.0, absent: 6.0 },
  { class: "Grade 5", present: 92.7, absent: 7.3 },
  { class: "Grade 6", present: 90.5, absent: 9.5 },
];

const recentAbsences = [
  {
    id: "1",
    name: "Emily Walker",
    grade: "Grade 10-A",
    date: "Nov 28, 2023",
    status: "Absent",
    reason: "Sick Leave",
    informed: "Yes"
  },
  {
    id: "2",
    name: "James Potter",
    grade: "Grade 11-B",
    date: "Nov 28, 2023",
    status: "Absent",
    reason: "Family Emergency",
    informed: "Yes"
  },
  {
    id: "3",
    name: "Sophia Martinez",
    grade: "Grade 9-C",
    date: "Nov 28, 2023",
    status: "Absent",
    reason: "No Reason",
    informed: "No"
  },
  {
    id: "4",
    name: "Daniel Thompson",
    grade: "Grade 8-A",
    date: "Nov 28, 2023",
    status: "Absent",
    reason: "Medical Appointment",
    informed: "Yes"
  },
];

const classes = [
  { id: "c1", name: "Grade 9-A" },
  { id: "c2", name: "Grade 9-B" },
  { id: "c3", name: "Grade 10-A" },
  { id: "c4", name: "Grade 10-B" },
  { id: "c5", name: "Grade 11-A" },
  { id: "c6", name: "Grade 11-B" },
];

export default function AttendancePage() {
  const [markAttendanceDialog, setMarkAttendanceDialog] = useState(false);
  const [attendanceType, setAttendanceType] = useState("student");
  const [selectedClass, setSelectedClass] = useState("");
  
  const studentAttendancePercentage = studentAttendanceData.reduce((acc, day) => {
    return acc + (day.present / (day.present + day.absent) * 100);
  }, 0) / studentAttendanceData.length;
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
        <Dialog open={markAttendanceDialog} onOpenChange={setMarkAttendanceDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>
                Select the attendance type to begin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Attendance Type</label>
                <Select value={attendanceType} onValueChange={setAttendanceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student Attendance</SelectItem>
                    <SelectItem value="teacher">Teacher Attendance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {attendanceType === "student" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMarkAttendanceDialog(false)}>
                Cancel
              </Button>
              <Link href={attendanceType === "student" ? "/admin/attendance/students" : "/admin/attendance/teachers"}>
                <Button onClick={() => setMarkAttendanceDialog(false)}>
                  Continue
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {attendanceCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-50 rounded-md">
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
                <CardDescription>
                  Student attendance for the last 7 school days
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Chart
              title=""
              data={studentAttendanceData}
              type="bar"
              xKey="date"
              yKey="present"
              categories={["present", "absent"]}
              colors={["#10b981", "#ef4444"]}
            />
          </CardContent>
          <div className="px-6 py-3 border-t">
            <Link href="/admin/attendance/reports">
              <Button variant="ghost" size="sm" className="text-blue-600">
                View Detailed Reports
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Attendance by Grade</CardTitle>
            <CardDescription>
              Present percentage by class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceByClass.map((item) => (
                <div key={item.class}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.class}</span>
                    <span className="text-sm font-medium">{item.present}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.present >= 95 ? "bg-green-500" :
                        item.present >= 90 ? "bg-green-400" :
                        item.present >= 85 ? "bg-blue-500" :
                        item.present >= 80 ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${item.present}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-6 py-3 border-t">
            <Link href="/admin/attendance/students">
              <Button variant="ghost" size="sm" className="text-blue-600">
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
            <CardDescription>
              Students marked absent today and yesterday
            </CardDescription>
          </div>
          <Link href="/admin/attendance/students">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Reason</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Informed</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAbsences.map((absence) => (
                    <tr key={absence.id} className="border-b">
                      <td className="py-3 px-4 align-middle font-medium">{absence.name}</td>
                      <td className="py-3 px-4 align-middle">{absence.grade}</td>
                      <td className="py-3 px-4 align-middle">{absence.date}</td>
                      <td className="py-3 px-4 align-middle">
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          {absence.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-middle">{absence.reason}</td>
                      <td className="py-3 px-4 align-middle">
                        <Badge className={`${
                          absence.informed === "Yes" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {absence.informed}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Link href={`/admin/attendance/students?student=${absence.id}`}>
                          <Button variant="ghost" size="sm">Details</Button>
                        </Link>
                        <Button variant="ghost" size="sm">Update</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Quick Attendance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-blue-800">Generate attendance reports instantly</p>
              <Link href="/admin/attendance/reports">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                  Generate Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Teacher Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-purple-800">Track and manage staff attendance</p>
              <Link href="/admin/attendance/teachers">
                <Button size="sm" variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-100">
                  View Teachers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Student Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-emerald-800">Track and manage student attendance</p>
              <Link href="/admin/attendance/students">
                <Button size="sm" variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-100">
                  View Students
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Send Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-amber-800">Notify parents about student absences</p>
              <Link href="/admin/communications">
                <Button size="sm" variant="outline" className="w-full border-amber-600 text-amber-600 hover:bg-amber-100">
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
