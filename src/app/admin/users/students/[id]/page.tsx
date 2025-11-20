import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Mail, Phone, BookOpen, GraduationCap, Calendar, User } from "lucide-react";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      user: true,
      parents: {
        include: {
          parent: {
            include: {
              user: true
            }
          }
        }
      },
      enrollments: {
        include: {
          class: true,
          section: true,
        },
        where: {
          status: "ACTIVE"
        },
        take: 1
      },
      examResults: {
        include: {
          exam: {
            include: {
              subject: true
            }
          }
        },
        orderBy: {
          exam: {
            examDate: 'desc'
          }
        },
        take: 5
      },
      attendance: {
        orderBy: {
          date: 'desc'
        },
        take: 10
      }
    },
  });

  if (!student) {
    notFound();
  }

  // Calculate attendance statistics
  const totalAttendanceRecords = student.attendance.length;
  const presentCount = student.attendance.filter(record => record.status === 'PRESENT').length;
  const absentCount = student.attendance.filter(record => record.status === 'ABSENT').length;
  const lateCount = student.attendance.filter(record => record.status === 'LATE').length;
  
  const attendancePercentage = totalAttendanceRecords > 0 
    ? Math.round((presentCount / totalAttendanceRecords) * 100) 
    : 0;

  const currentEnrollment = student.enrollments[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/users/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold tracking-tight">
          {student.user.firstName} {student.user.lastName}
        </h1>
        <div className="flex gap-2">
          <Link href={`/admin/users/students/${student.id}/edit`}>
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
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Personal and academic details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-none flex flex-col items-center gap-2">
                {student.user.avatar ? (
                  <img 
                    src={student.user.avatar} 
                    alt={`${student.user.firstName} ${student.user.lastName}`}
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl font-bold border-4 border-white shadow-md">
                    {student.user.firstName[0]}
                    {student.user.lastName[0]}
                  </div>
                )}
                <div className="text-center">
                  <Badge 
                    className={student.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                  >
                    {student.user.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {student.user.firstName} {student.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{student.user.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{student.user.phone || "Not provided"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{formatDate(student.dateOfBirth)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium capitalize">{student.gender.toLowerCase()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{student.bloodGroup || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission ID</p>
                  <p className="font-medium">{student.admissionId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Date</p>
                  <p className="font-medium">{formatDate(student.admissionDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{student.address || "Not provided"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentEnrollment ? (
              <>
                <div className="bg-primary/10 p-4 rounded-md border border-primary/20 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-primary">Current Class</p>
                    <p className="font-bold text-primary">{currentEnrollment.class.name} - {currentEnrollment.section.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{currentEnrollment.rollNumber || student.rollNumber || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment Date</p>
                  <p className="font-medium">{formatDate(currentEnrollment.enrollDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    className={currentEnrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}
                  >
                    {currentEnrollment.status}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">Not currently enrolled in any class</p>
                <Button size="sm" variant="outline" className="mt-2">Enroll Student</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Parents/Guardians</CardTitle>
            <CardDescription>Associated family members</CardDescription>
          </CardHeader>
          <CardContent>
            {student.parents.length > 0 ? (
              <div className="space-y-4">
                {student.parents.map((parentRelation) => (
                  <div key={parentRelation.id} className="flex justify-between items-center p-4 rounded-md border">
                    <div className="flex items-center gap-4">
                      {parentRelation.parent.user.avatar ? (
                        <img 
                          src={parentRelation.parent.user.avatar} 
                          alt={`${parentRelation.parent.user.firstName} ${parentRelation.parent.user.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          {parentRelation.parent.user.firstName[0]}
                          {parentRelation.parent.user.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{parentRelation.parent.user.firstName} {parentRelation.parent.user.lastName}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{parentRelation.parent.user.email}</span>
                          </div>
                          {parentRelation.parent.user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{parentRelation.parent.user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={parentRelation.isPrimary ? 'bg-primary/10 text-primary hover:bg-primary/10' : 'bg-muted text-foreground hover:bg-muted'}>
                        {parentRelation.isPrimary ? 'Primary Contact' : parentRelation.parent.relation?.toLowerCase() || 'Guardian'}
                      </Badge>
                      <Link href={`/admin/users/parents/${parentRelation.parent.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">No parents or guardians associated</p>
                <Button size="sm" variant="outline" className="mt-2">Add Parent</Button>
              </div>
            )}
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
              {student.attendance.slice(0, 5).map((record) => (
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

            <Button variant="outline" size="sm" className="w-full">View Full Attendance</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Exam Results</CardTitle>
            <CardDescription>Performance in the latest examinations</CardDescription>
          </CardHeader>
          <CardContent>
            {student.examResults.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Exam</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Marks</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.examResults.map((result) => (
                        <tr key={result.id} className="border-b">
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              {result.exam.subject.name}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">{result.exam.title}</td>
                          <td className="py-3 px-4 align-middle">{formatDate(result.exam.examDate)}</td>
                          <td className="py-3 px-4 align-middle font-semibold">{result.marks} / {result.exam.totalMarks}</td>
                          <td className="py-3 px-4 align-middle">{result.grade || "-"}</td>
                          <td className="py-3 px-4 align-middle">
                            <Badge 
                              className={
                                result.marks >= result.exam.passingMarks 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-100'
                              }
                            >
                              {result.marks >= result.exam.passingMarks ? "Pass" : "Fail"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">No exam results recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
