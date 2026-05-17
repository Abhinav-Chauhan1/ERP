"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";

async function getAttendanceOverviewData() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const schoolId = session.user.schoolId;
  if (!schoolId) redirect("/login");

  const parent = await db.parent.findFirst({
    where: { userId: session.user.id },
  });
  if (!parent) redirect("/login");

  const studentParents = await db.studentParent.findMany({
    where: { parentId: parent.id, student: { schoolId } },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          enrollments: {
            where: { status: "ACTIVE", schoolId },
            include: { class: { select: { name: true } }, section: { select: { name: true } } },
            take: 1,
          },
        },
      },
    },
  });

  const currentDate = new Date();
  const yearStart = new Date(
    currentDate.getMonth() >= 6
      ? currentDate.getFullYear()
      : currentDate.getFullYear() - 1,
    6, 1
  );
  const yearEnd = new Date(yearStart.getFullYear() + 1, 5, 30);

  const childrenData = await Promise.all(
    studentParents.map(async ({ student }) => {
      const records = await db.studentAttendance.findMany({
        where: {
          studentId: student.id,
          schoolId,
          date: { gte: yearStart, lte: yearEnd },
        },
        select: { status: true, date: true },
      });

      const total    = records.length;
      const present  = records.filter((r) => r.status === "PRESENT").length;
      const absent   = records.filter((r) => r.status === "ABSENT").length;
      const late     = records.filter((r) => r.status === "LATE").length;
      const leave    = records.filter((r) => r.status === "LEAVE").length;
      const pct      = total > 0 ? Math.round((present / total) * 100) : 0;
      const enrollment = student.enrollments[0];

      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`.trim(),
        class: enrollment ? `${enrollment.class.name} ${enrollment.section.name}` : "—",
        total, present, absent, late, leave,
        percentage: pct,
      };
    })
  );

  return childrenData;
}

export default async function ParentAttendanceOverviewPage() {
  const children = await getAttendanceOverviewData();

  if (children.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No children found in your account.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Overview</h1>
        <p className="text-sm text-muted-foreground">Academic year attendance summary for your children</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{child.name}</CardTitle>
                <Badge variant="outline">{child.class}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={child.percentage} className="h-2 flex-1" />
                <span className="text-sm font-semibold tabular-nums w-10 text-right">
                  {child.percentage}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Total days</span>
                  <span className="ml-auto font-medium">{child.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Present</span>
                  <span className="ml-auto font-medium text-green-700">{child.present}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">Absent</span>
                  <span className="ml-auto font-medium text-red-600">{child.absent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-muted-foreground">Late</span>
                  <span className="ml-auto font-medium text-amber-600">{child.late}</span>
                </div>
                {child.leave > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Leave</span>
                    <span className="ml-auto font-medium text-blue-600">{child.leave}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
