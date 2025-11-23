export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
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

export default async function ParentAttendancePage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;
  let childId = searchParams.childId;

  // Get current user
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  const dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
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
      <div className="container max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Attendance</h1>
        <p className="text-gray-700">No children found in your account.</p>
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
    <div className="container max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Records</h1>
          <p className="text-muted-foreground">
            Track daily attendance and patterns
          </p>
        </div>
      </div>
      
      {/* Child Selector */}
      {children.length > 1 && (
        <div className="mb-6">
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
        </div>
      )}
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-900">
                  {attendancePercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-blue-700">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-900">{presentDays}</div>
                <p className="text-xs text-green-700">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-900">
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-900">{absentDays}</div>
                <p className="text-xs text-red-700">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-900">
              Late
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-600 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-900">{lateDays}</div>
                <p className="text-xs text-amber-700">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-900">
              Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-900">{leaveDays}</div>
                <p className="text-xs text-purple-700">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Attendance Progress */}
      <Card className="mb-8">
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
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{totalDays}</p>
                <p className="text-xs text-muted-foreground">Total Days</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{absentDays}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{lateDays}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Calendar View */}
      <Card className="mb-8">
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
                    ${isToday ? 'border-blue-500 bg-blue-50' : 'border-transparent'}
                    ${record?.status === 'PRESENT' ? 'bg-green-100 text-green-900' : ''}
                    ${record?.status === 'ABSENT' ? 'bg-red-100 text-red-900' : ''}
                    ${record?.status === 'LATE' ? 'bg-amber-100 text-amber-900' : ''}
                    ${record?.status === 'LEAVE' ? 'bg-purple-100 text-purple-900' : ''}
                    ${!record ? 'bg-gray-50 text-gray-400' : ''}
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
              <div className="h-4 w-4 rounded bg-green-100 border-2 border-green-200" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-100 border-2 border-red-200" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-amber-100 border-2 border-amber-200" />
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-purple-100 border-2 border-purple-200" />
              <span className="text-sm">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-blue-50 border-2 border-blue-500" />
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
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      record.status === 'PRESENT' ? 'bg-green-100' :
                      record.status === 'ABSENT' ? 'bg-red-100' :
                      record.status === 'LATE' ? 'bg-amber-100' : 'bg-purple-100'
                    }`}>
                      {record.status === 'PRESENT' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {record.status === 'ABSENT' && <XCircle className="h-5 w-5 text-red-600" />}
                      {record.status === 'LATE' && <Clock className="h-5 w-5 text-amber-600" />}
                      {record.status === 'LEAVE' && <AlertCircle className="h-5 w-5 text-purple-600" />}
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
