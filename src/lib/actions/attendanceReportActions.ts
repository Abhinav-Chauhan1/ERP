"use server";

import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";
import { formatFullName, sortByClassName } from "@/lib/utils";

export async function getDailyAttendanceSummary(date: Date, sectionId?: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      schoolId, // Add school isolation
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (sectionId) where.sectionId = sectionId;

    const attendance = await db.studentAttendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                class: true,
                section: true,
              },
              take: 1,
            },
          },
        },
        section: {
          include: {
            class: true,
          },
        },
      },
    });

    const presentCount = attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const absentCount = attendance.filter((a) => a.status === AttendanceStatus.ABSENT).length;
    const lateCount = attendance.filter((a) => a.status === AttendanceStatus.LATE).length;
    const totalStudents = attendance.length;

    return {
      success: true,
      data: {
        attendance: attendance.map((a) => ({
          id: a.id,
          studentName: `${formatFullName(a.student.user.firstName, a.student.user.lastName)}`,
          class: a.section.class.name,
          section: a.section.name,
          status: a.status,
          reason: a.reason,
        })),
        summary: {
          date: date.toISOString(),
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          attendanceRate: totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching daily attendance summary:", error);
    return { success: false, error: "Failed to fetch daily attendance summary" };
  }
}

export async function getMonthlyAttendanceTrends(month: number, year: number, sectionId?: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const where: any = {
      schoolId, // Add school isolation
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (sectionId) where.sectionId = sectionId;

    // groupBy(date, status) instead of fetching every attendance row for the
    // month just to tally them in JS.
    const dailyStatusCounts = await db.studentAttendance.groupBy({
      by: ['date', 'status'],
      where,
      _count: { id: true },
    });

    const dailyStats = new Map<string, { present: number; absent: number; late: number; total: number }>();
    dailyStatusCounts.forEach((row) => {
      const dateKey = row.date.toISOString().split("T")[0];
      if (!dailyStats.has(dateKey)) dailyStats.set(dateKey, { present: 0, absent: 0, late: 0, total: 0 });
      const stat = dailyStats.get(dateKey)!;
      stat.total += row._count.id;
      if (row.status === AttendanceStatus.PRESENT) stat.present += row._count.id;
      if (row.status === AttendanceStatus.ABSENT) stat.absent += row._count.id;
      if (row.status === AttendanceStatus.LATE) stat.late += row._count.id;
    });

    const trends = Array.from(dailyStats.entries())
      .map(([date, stat]) => ({
        date,
        ...stat,
        attendanceRate: stat.total > 0 ? (stat.present / stat.total) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalDays = trends.length;
    const averageAttendanceRate =
      totalDays > 0 ? trends.reduce((sum, t) => sum + t.attendanceRate, 0) / totalDays : 0;

    return {
      success: true,
      data: {
        trends,
        summary: { averageAttendanceRate, totalDays },
      },
    };
  } catch (error) {
    console.error("Error fetching monthly attendance trends:", error);
    return { success: false, error: "Failed to fetch monthly trends" };
  }
}

export async function getAbsenteeismAnalysis(filters?: {
  startDate?: Date;
  endDate?: Date;
  sectionId?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const where: any = {
      schoolId, // Add school isolation
    };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.sectionId) where.sectionId = filters.sectionId;

    // Per-student absence counts via one groupBy instead of fetching every
    // absence row (with a 3-level student/enrollment/class include) just to
    // count them and build a per-absence detail array nobody reads.
    const absenceCounts = await db.studentAttendance.groupBy({
      by: ['studentId'],
      where: { ...where, status: AttendanceStatus.ABSENT },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    if (absenceCounts.length === 0) return { success: true, data: [] };

    // Pagination is opt-in: callers that don't pass `page` (e.g. the report
    // export, which needs every row) get the full result, same as before —
    // only requests that explicitly ask for a page get sliced.
    const pagedCounts =
      filters?.page && filters.page > 0
        ? absenceCounts.slice(
            (filters.page - 1) * (filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 50),
            filters.page * (filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 50)
          )
        : absenceCounts;

    const students = await db.student.findMany({
      where: { id: { in: pagedCounts.map((row) => row.studentId) }, schoolId },
      include: {
        user: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: { class: true, section: true },
          take: 1,
        },
      },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const analysis = pagedCounts
      .map((row) => {
        const student = studentMap.get(row.studentId);
        if (!student) return null;
        return {
          studentId: row.studentId,
          studentName: `${formatFullName(student.user.firstName, student.user.lastName)}`,
          admissionId: student.admissionId,
          class: student.enrollments[0]?.class.name ?? "N/A",
          section: student.enrollments[0]?.section.name ?? "N/A",
          absenceCount: row._count.id,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return { success: true, data: analysis };
  } catch (error) {
    console.error("Error fetching absenteeism analysis:", error);
    return { success: false, error: "Failed to fetch absenteeism analysis" };
  }
}

export async function getClassWiseAttendance(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const where: any = {
      schoolId, // Add school isolation
    };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const classes = sortByClassName(await db.class.findMany({
      where: {
        schoolId, // Add school isolation
      },
      select: {
        id: true,
        name: true,
        sections: { select: { id: true } },
      },
    }));

    // groupBy(sectionId, status) instead of loading every attendance record
    // for every section into memory just to count them.
    const sectionStatusCounts = await db.studentAttendance.groupBy({
      by: ['sectionId', 'status'],
      where,
      _count: { id: true },
    });
    const countsBySection = new Map<string, { total: number; present: number }>();
    sectionStatusCounts.forEach((row) => {
      if (!countsBySection.has(row.sectionId)) countsBySection.set(row.sectionId, { total: 0, present: 0 });
      const counts = countsBySection.get(row.sectionId)!;
      counts.total += row._count.id;
      if (row.status === AttendanceStatus.PRESENT) counts.present += row._count.id;
    });

    const classWiseData = classes.map((cls) => {
      let totalRecords = 0;
      let presentRecords = 0;

      cls.sections.forEach((section) => {
        const counts = countsBySection.get(section.id);
        if (counts) {
          totalRecords += counts.total;
          presentRecords += counts.present;
        }
      });

      const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

      return {
        classId: cls.id,
        className: cls.name,
        totalRecords,
        presentCount: presentRecords,
        absentCount: totalRecords - presentRecords,
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
      };
    });

    return { success: true, data: classWiseData };
  } catch (error) {
    console.error("Error fetching class-wise attendance:", error);
    return { success: false, error: "Failed to fetch class-wise attendance" };
  }
}

export async function getPerfectAttendance(filters?: {
  startDate?: Date;
  endDate?: Date;
  sectionId?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const where: any = {
      schoolId, // Add school isolation
    };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.sectionId) where.sectionId = filters.sectionId;

    // Per-student (totalDays, presentDays) via one groupBy instead of loading
    // every attendance row (with a 3-level student/enrollment/class include)
    // into memory just to tally them.
    const perStudentStatusCounts = await db.studentAttendance.groupBy({
      by: ['studentId', 'status'],
      where,
      _count: { id: true },
    });

    const totalsByStudent = new Map<string, { total: number; present: number }>();
    perStudentStatusCounts.forEach((row) => {
      if (!totalsByStudent.has(row.studentId)) totalsByStudent.set(row.studentId, { total: 0, present: 0 });
      const totals = totalsByStudent.get(row.studentId)!;
      totals.total += row._count.id;
      if (row.status === AttendanceStatus.PRESENT) totals.present += row._count.id;
    });

    const perfectStudentIds = Array.from(totalsByStudent.entries())
      .filter(([, totals]) => totals.total > 0 && totals.total === totals.present)
      .map(([studentId]) => studentId);

    if (perfectStudentIds.length === 0) {
      return { success: true, data: { count: 0, students: [] } };
    }

    // Pagination is opt-in: callers that don't pass `page` get every matching
    // student, same as before — only requests that explicitly ask for a page
    // get sliced.
    const pagedStudentIds =
      filters?.page && filters.page > 0
        ? perfectStudentIds.slice(
            (filters.page - 1) * (filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 50),
            filters.page * (filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 50)
          )
        : perfectStudentIds;

    const students = await db.student.findMany({
      where: { id: { in: pagedStudentIds }, schoolId },
      include: {
        user: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: { class: true, section: true },
          take: 1,
        },
      },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const perfectAttendance = pagedStudentIds
      .map((studentId) => {
        const student = studentMap.get(studentId);
        const totals = totalsByStudent.get(studentId)!;
        if (!student) return null;
        return {
          studentId,
          studentName: `${formatFullName(student.user.firstName, student.user.lastName)}`,
          admissionId: student.admissionId,
          class: student.enrollments[0]?.class.name ?? "N/A",
          section: student.enrollments[0]?.section.name ?? "N/A",
          totalDays: totals.total,
          presentDays: totals.present,
          isPerfect: true,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return {
      success: true,
      data: {
        count: perfectStudentIds.length,
        students: perfectAttendance,
      },
    };
  } catch (error) {
    console.error("Error fetching perfect attendance:", error);
    return { success: false, error: "Failed to fetch perfect attendance" };
  }
}
