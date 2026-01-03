import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { db } from "@/lib/db";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Mail, Phone, BookOpen, Calendar, Clock, DollarSign } from "lucide-react";
import React from "react";

interface TeacherDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  const { id } = await params;

  const teacher = await db.teacher.findUnique({
    where: { id },
    include: {
      user: true,
      subjects: {
        include: {
          subject: true
        }
      },
      classes: {
        include: {
          class: true
        }
      },
      attendance: {
        orderBy: {
          date: 'desc'
        },
        take: 10
      },
      payrolls: {
        orderBy: {
          year: 'desc',
          month: 'desc'
        },
        take: 3
      }
    },
  });

  if (!teacher) {
    notFound();
  }

  // Calculate attendance statistics
  const totalAttendanceRecords = teacher.attendance.length;
  const presentCount = teacher.attendance.filter(record => record.status === 'PRESENT').length;
  const absentCount = teacher.attendance.filter(record => record.status === 'ABSENT').length;
  const lateCount = teacher.attendance.filter(record => record.status === 'LATE').length;
  
  const attendancePercentage = totalAttendanceRecords > 0 
    ? Math.round((presentCount / totalAttendanceRecords) * 100) 
    : 0;

  // Get current month for payroll display
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/users/teachers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teachers
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold tracking-tight">
          {teacher.user.firstName} {teacher.user.lastName}
        </h1>
        <div className="flex gap-2">
          <Link href={`/admin/users/teachers/${teacher.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Teacher Information</CardTitle>
            <CardDescription>Personal and professional details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-none flex flex-col items-center gap-2">
                {teacher.user.avatar ? (
                  <OptimizedImage 
                    src={teacher.user.avatar} 
                    alt={`${teacher.user.firstName} ${teacher.user.lastName}`}
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
                    qualityPreset="high"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl font-bold border-4 border-white shadow-md">
                    {teacher.user.firstName[0]}
                    {teacher.user.lastName[0]}
                  </div>
                )}
                <div className="text-center">
                  <Badge 
                    className={teacher.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                  >
                    {teacher.user.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {teacher.user.firstName} {teacher.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{teacher.user.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{teacher.user.phone || "Not provided"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{teacher.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualification</p>
                  <p className="font-medium">{teacher.qualification || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Join Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{formatDate(teacher.joinDate)}</p>
                  </div>
                </div>
                {teacher.salary && (
                  <div>
                    <p className="text-sm text-muted-foreground">Salary</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">₹{teacher.salary.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>Last 10 recorded days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-lg font-bold text-green-600">{presentCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-lg font-bold text-red-600">{absentCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-lg font-bold text-yellow-600">{lateCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{totalAttendanceRecords}</p>
              </div>
            </div>

            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div 
                className="bg-green-500 h-4" 
                style={{ width: `${attendancePercentage}%` }}
              ></div>
            </div>
            <p className="text-center text-sm">
              <span className="font-bold">{attendancePercentage}%</span> attendance rate
            </p>

            <div className="space-y-2 mt-4">
              {teacher.attendance.slice(0, 5).map((record) => (
                <div key={record.id} className="flex justify-between items-center text-sm">
                  <span>{formatDate(record.date)}</span>
                  <Badge 
                    className={
                      record.status === 'PRESENT' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                      record.status === 'ABSENT' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                      'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                    }
                  >
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">View Full Attendance</Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Subjects Taught</CardTitle>
            <CardDescription>Subjects assigned to this teacher</CardDescription>
          </CardHeader>
          <CardContent>
            {teacher.subjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {teacher.subjects.map((subjectTeacher) => (
                  <div key={subjectTeacher.id} className="p-4 rounded-md border bg-accent flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{subjectTeacher.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subjectTeacher.subject.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
                <Button size="sm" variant="outline" className="mt-2">Assign Subject</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>Classes managed by this teacher</CardDescription>
          </CardHeader>
          <CardContent>
            {teacher.classes.length > 0 ? (
              <div className="space-y-3">
                {teacher.classes.map((classTeacher) => (
                  <div key={classTeacher.id} className="p-3 rounded-md border flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="font-medium">{classTeacher.class.name}</span>
                    </div>
                    {classTeacher.isClassHead && (
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        Class Head
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">Not assigned to any classes</p>
                <Button size="sm" variant="outline" className="mt-2">Assign Class</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Payroll</CardTitle>
            <CardDescription>Salary disbursements</CardDescription>
          </CardHeader>
          <CardContent>
            {teacher.payrolls.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Period</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Basic Salary</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Allowances</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Deductions</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Net Salary</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacher.payrolls.map((payroll) => {
                        const monthName = new Date(0, payroll.month - 1).toLocaleString('default', { month: 'long' });
                        return (
                          <tr key={payroll.id} className="border-b">
                            <td className="py-3 px-4 align-middle font-medium">
                              {monthName} {payroll.year}
                            </td>
                            <td className="py-3 px-4 align-middle">₹{payroll.basicSalary.toFixed(2)}</td>
                            <td className="py-3 px-4 align-middle">₹{payroll.allowances.toFixed(2)}</td>
                            <td className="py-3 px-4 align-middle">-₹{payroll.deductions.toFixed(2)}</td>
                            <td className="py-3 px-4 align-middle font-semibold">₹{payroll.netSalary.toFixed(2)}</td>
                            <td className="py-3 px-4 align-middle">
                              <Badge 
                                className={
                                  payroll.status === 'COMPLETED' 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                    : payroll.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                    : 'bg-red-100 text-red-800 hover:bg-red-100'
                                }
                              >
                                {payroll.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              {payroll.paymentDate ? formatDate(payroll.paymentDate) : "Pending"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">No Payroll Records</h3>
                <p className="text-muted-foreground mt-1">
                  Payroll information for {currentMonthName} {currentYear} is not available yet.
                </p>
                <Button variant="outline" className="mt-4">Process Payroll</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
