import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Users, BarChart } from "lucide-react";
import { Chart } from "@/components/dashboard/chart";

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

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Mark Attendance
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {attendanceCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-md text-blue-700">
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
            <CardTitle className="text-xl">Weekly Attendance Trend</CardTitle>
            <CardDescription>
              Student attendance for the last 7 school days
            </CardDescription>
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
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.present}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-xl">Recent Absences</CardTitle>
          <CardDescription>
            Students marked absent today and yesterday
          </CardDescription>
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
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          {absence.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle">{absence.reason}</td>
                      <td className="py-3 px-4 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          absence.informed === "Yes" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {absence.informed}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Button variant="ghost" size="sm">Details</Button>
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
    </div>
  );
}
