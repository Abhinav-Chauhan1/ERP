export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
// Note: Replace currentUser() calls with auth() and access session.user
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Attendance | Parent Portal",
  description: "View your children's attendance records",
};

interface PageProps {
  searchParams: Promise<{
    childId?: string;
  }>;
}

import { auth } from "@/auth";

export default async function ParentAttendancePage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;
  let childId = searchParams.childId;

  // Get current user
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id }
  });

  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }

  const parent = await db.parent.findUnique({
    where: { userId: dbUser.id }
  });

  if (!parent) {
    redirect("/login");
  }

  // Get all children
  const parentChildren = await db.studentParent.findMany({
    where: { parentId: parent.id },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          enrollments: {
            where: { status: "ACTIVE" },
            orderBy: { enrollDate: 'desc' },
            take: 1,
            include: {
              class: true,
              section: true
            }
          }
        }
      }
    }
  });

  const children = parentChildren.map(pc => ({
    id: pc.student.id,
    name: `${pc.student.user.firstName} ${pc.student.user.lastName}`,
    firstName: pc.student.user.firstName,
    lastName: pc.student.user.lastName,
    avatar: pc.student.user.avatar,
    class: pc.student.enrollments[0]?.class.name || "N/A",
    section: pc.student.enrollments[0]?.section.name || "N/A",
    sectionId: pc.student.enrollments[0]?.sectionId,
    isPrimary: pc.isPrimary
  }));

  if (children.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">No children found in your account.</p>
      </div>
    );
  }

  // If no childId, redirect with first child
  if (!childId) {
    redirect(`/parent/attendance?childId=${children[0].id}`);
  }

  const selectedChild = children.find(c => c.id === childId) || children[0];

  // Fetch attendance records for the current month
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: selectedChild.id,
      date: {
        gte: monthStart,
        lte: monthEnd
      }
    },
    include: {
      section: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Calculate statistics
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(r => r.status === "PRESENT").length;
  const absentDays = attendanceRecords.filter(r => r.status === "ABSENT").length;
  const lateDays = attendanceRecords.filter(r => r.status === "LATE").length;
  const leaveDays = attendanceRecords.filter(r => r.status === "LEAVE").length;
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Get all days in current month for calendar view
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground">
          Track daily attendance and patterns
        </p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <Tabs value={childId}>
          <TabsList>
            {children.map(child => (
              <TabsTrigger key={child.id} value={child.id} asChild>
                <Link href={`/parent/attendance?childId=${child.id}`}>
                  {child.firstName}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {attendancePercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-600 dark:bg-green-700 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold">{presentDays}</div>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-destructive flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive-foreground" />
              </div>
              <div>
                <div className="text-3xl font-bold">{absentDays}</div>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Late
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-600 dark:bg-amber-700 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold">{lateDays}</div>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-600 dark:bg-purple-700 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold">{leaveDays}</div>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Progress</CardTitle>
          <CardDescription>
            {format(currentDate, "MMMM yyyy")} attendance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Attendance Rate</span>
                <span className="text-sm font-bold">{attendancePercentage.toFixed(1)}%</span>
              </div>
              <Progress value={attendancePercentage} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{totalDays}</p>
                <p className="text-xs text-muted-foreground">Total Days</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-500">{presentDays}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-destructive">{absentDays}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{lateDays}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>{format(currentDate, "MMMM yyyy")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

            {/* Days of month */}
            {daysInMonth.map(day => {
              const record = attendanceRecords.find(r => isSameDay(new Date(r.date), day));
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    p-2 text-center rounded-lg border-2 transition-colors
                    ${isToday ? 'border-primary bg-primary/10' : 'border-transparent'}
                    ${record?.status === 'PRESENT' ? 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100' : ''}
                    ${record?.status === 'ABSENT' ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100' : ''}
                    ${record?.status === 'LATE' ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100' : ''}
                    ${record?.status === 'LEAVE' ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100' : ''}
                    ${!record ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  <div className="text-sm font-semibold">{format(day, 'd')}</div>
                  {record && (
                    <div className="text-xs mt-1">
                      {record.status === 'PRESENT' && '✓'}
                      {record.status === 'ABSENT' && '✗'}
                      {record.status === 'LATE' && '⏰'}
                      {record.status === 'LEAVE' && '📋'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-950 border-2 border-green-200 dark:border-green-800" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-100 dark:bg-red-950 border-2 border-red-200 dark:border-red-800" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-amber-100 dark:bg-amber-950 border-2 border-amber-200 dark:border-amber-800" />
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-purple-100 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800" />
              <span className="text-sm">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-primary/10 border-2 border-primary" />
              <span className="text-sm">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Last 15 days attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="space-y-2">
              {attendanceRecords.slice(0, 15).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${record.status === 'PRESENT' ? 'bg-green-100 dark:bg-green-950' :
                        record.status === 'ABSENT' ? 'bg-red-100 dark:bg-red-950' :
                          record.status === 'LATE' ? 'bg-amber-100 dark:bg-amber-950' : 'bg-purple-100 dark:bg-purple-950'
                      }`}>
                      {record.status === 'PRESENT' && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />}
                      {record.status === 'ABSENT' && <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />}
                      {record.status === 'LATE' && <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500" />}
                      {record.status === 'LEAVE' && <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-500" />}
                    </div>
                    <div>
                      <p className="font-medium">{format(new Date(record.date), "EEEE, MMMM d, yyyy")}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.section?.name || "N/A"}
                        {record.reason && ` • ${record.reason}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    record.status === 'PRESENT' ? 'default' :
                      record.status === 'ABSENT' ? 'destructive' :
                        record.status === 'LATE' ? 'secondary' : 'outline'
                  }>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No attendance records found for this month
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
