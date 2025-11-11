"use server";

import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

export async function getDailyAttendanceSummary(date: Date, sectionId?: string) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
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
          studentName: `${a.student.user.firstName} ${a.student.user.lastName}`,
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
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (sectionId) where.sectionId = sectionId;

    const attendance = await db.studentAttendance.findMany({
      where,
    });

    // Group by date
    const dailyStats: Record<string, any> = {};
    
    attendance.forEach((record) => {
      const dateKey = record.date.toISOString().split("T")[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }
      dailyStats[dateKey].total++;
      if (record.status === AttendanceStatus.PRESENT) dailyStats[dateKey].present++;
      if (record.status === AttendanceStatus.ABSENT) dailyStats[dateKey].absent++;
      if (record.status === AttendanceStatus.LATE) dailyStats[dateKey].late++;
    });

    const trends = Object.values(dailyStats).map((stat: any) => ({
      ...stat,
      attendanceRate: stat.total > 0 ? (stat.present / stat.total) * 100 : 0,
    }));

    return { success: true, data: trends };
  } catch (error) {
    console.error("Error fetching monthly attendance trends:", error);
    return { success: false, error: "Failed to fetch monthly trends" };
  }
}

export async function getAbsenteeismAnalysis(filters?: {
  startDate?: Date;
  endDate?: Date;
  sectionId?: string;
}) {
  try {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.sectionId) where.sectionId = filters.sectionId;

    const absences = await db.studentAttendance.findMany({
      where: {
        ...where,
        status: AttendanceStatus.ABSENT,
      },
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
      },
    });

    // Group by student
    const studentAbsences: Record<string, any> = {};
    
    absences.forEach((absence) => {
      if (!studentAbsences[absence.studentId]) {
        studentAbsences[absence.studentId] = {
          studentId: absence.studentId,
          studentName: `${absence.student.user.firstName} ${absence.student.user.lastName}`,
          admissionId: absence.student.admissionId,
          class:
            absence.student.enrollments.length > 0
              ? absence.student.enrollments[0].class.name
              : "N/A",
          section:
            absence.student.enrollments.length > 0
              ? absence.student.enrollments[0].section.name
              : "N/A",
          absenceCount: 0,
          absences: [],
        };
      }
      studentAbsences[absence.studentId].absenceCount++;
      studentAbsences[absence.studentId].absences.push({
        date: absence.date,
        reason: absence.reason,
      });
    });

    const analysis = Object.values(studentAbsences).sort(
      (a: any, b: any) => b.absenceCount - a.absenceCount
    );

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
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const classes = await db.class.findMany({
      include: {
        sections: {
          include: {
            attendanceRecords: {
              where,
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const classWiseData = classes.map((cls) => {
      let totalRecords = 0;
      let presentRecords = 0;

      cls.sections.forEach((section) => {
        totalRecords += section.attendanceRecords.length;
        presentRecords += section.attendanceRecords.filter(
          (r) => r.status === AttendanceStatus.PRESENT
        ).length;
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
}) {
  try {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.sectionId) where.sectionId = filters.sectionId;

    // Get all attendance records
    const allRecords = await db.studentAttendance.findMany({
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
      },
    });

    // Group by student and check if all are present
    const studentRecords: Record<string, any> = {};
    
    allRecords.forEach((record) => {
      if (!studentRecords[record.studentId]) {
        studentRecords[record.studentId] = {
          studentId: record.studentId,
          studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
          admissionId: record.student.admissionId,
          class:
            record.student.enrollments.length > 0
              ? record.student.enrollments[0].class.name
              : "N/A",
          section:
            record.student.enrollments.length > 0
              ? record.student.enrollments[0].section.name
              : "N/A",
          totalDays: 0,
          presentDays: 0,
          isPerfect: true,
        };
      }
      studentRecords[record.studentId].totalDays++;
      if (record.status === AttendanceStatus.PRESENT) {
        studentRecords[record.studentId].presentDays++;
      } else {
        studentRecords[record.studentId].isPerfect = false;
      }
    });

    const perfectAttendance = Object.values(studentRecords).filter(
      (student: any) => student.isPerfect && student.totalDays > 0
    );

    return { success: true, data: perfectAttendance };
  } catch (error) {
    console.error("Error fetching perfect attendance:", error);
    return { success: false, error: "Failed to fetch perfect attendance" };
  }
}
