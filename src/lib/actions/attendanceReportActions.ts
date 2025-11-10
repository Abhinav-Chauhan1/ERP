"use server";

import { db } from "@/lib/db";

// Get daily attendance summary
export async function getDailyAttendanceSummary(date: Date, classId?: string) {
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

    if (classId) where.classId = classId;

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            class: true,
          },
        },
      },
    });

    const presentCount = attendance.filter(a => a.status === "PRESENT").length;
    const absentCount = attendance.filter(a => a.status === "ABSENT").length;
    const lateCount = attendance.filter(a => a.status === "LATE").length;
    const totalStudents = attendance.length;

    return {
      success: true,
      data: {
        attendance,
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

// Get monthly attendance trends
export async function getMonthlyAttendanceTrends(month: number, year: number, classId?: string) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (classId) where.classId = classId;

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
    });

    // Group by date
    const dailyStats = attendance.reduce((acc: any, record) => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }
      acc[dateKey].total++;
      if (record.status === "PRESENT") acc[dateKey].present++;
      if (record.status === "ABSENT") acc[dateKey].absent++;
      if (record.status === "LATE") acc[dateKey].late++;
      return acc;
    }, {});

    const trends = Object.values(dailyStats).map((day: any) => ({
      ...day,
      attendanceRate: day.total > 0 ? (day.present / day.total) * 100 : 0,
    }));

    const totalPresent = attendance.filter(a => a.status === "PRESENT").length;
    const totalRecords = attendance.length;

    return {
      success: true,
      data: {
        trends,
        summary: {
          month,
          year,
          averageAttendanceRate: totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0,
          totalDays: Object.keys(dailyStats).length,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching monthly attendance trends:", error);
    return { success: false, error: "Failed to fetch monthly attendance trends" };
  }
}

// Get absenteeism analysis
export async function getAbsenteeismAnalysis(filters?: {
  startDate?: Date;
  endDate?: Date;
  classId?: string;
  threshold?: number;
}) {
  try {
    const where: any = {
      status: "ABSENT",
    };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.classId) where.classId = filters.classId;

    const absences = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            class: true,
          },
        },
      },
    });

    // Group by student
    const studentAbsences = absences.reduce((acc: any, record) => {
      const studentId = record.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
          className: record.student.class?.name || "N/A",
          absenceCount: 0,
          dates: [],
        };
      }
      acc[studentId].absenceCount++;
      acc[studentId].dates.push(record.date);
      return acc;
    }, {});

    const threshold = filters?.threshold || 5;
    const highAbsenteeism = Object.values(studentAbsences)
      .filter((student: any) => student.absenceCount >= threshold)
      .sort((a: any, b: any) => b.absenceCount - a.absenceCount);

    return {
      success: true,
      data: {
        highAbsenteeism,
        summary: {
          totalAbsences: absences.length,
          studentsWithHighAbsenteeism: highAbsenteeism.length,
          threshold,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching absenteeism analysis:", error);
    return { success: false, error: "Failed to fetch absenteeism analysis" };
  }
}

// Get class-wise attendance
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

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
    });

    // Group by class
    const classStats = attendance.reduce((acc: any, record) => {
      const className = record.student.class?.name || "Unknown";
      if (!acc[className]) {
        acc[className] = {
          className,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }
      acc[className].total++;
      if (record.status === "PRESENT") acc[className].present++;
      if (record.status === "ABSENT") acc[className].absent++;
      if (record.status === "LATE") acc[className].late++;
      return acc;
    }, {});

    const classData = Object.values(classStats).map((cls: any) => ({
      ...cls,
      attendanceRate: cls.total > 0 ? (cls.present / cls.total) * 100 : 0,
    }));

    return {
      success: true,
      data: classData,
    };
  } catch (error) {
    console.error("Error fetching class-wise attendance:", error);
    return { success: false, error: "Failed to fetch class-wise attendance" };
  }
}

// Get perfect attendance
export async function getPerfectAttendance(filters?: {
  startDate?: Date;
  endDate?: Date;
  classId?: string;
}) {
  try {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.classId) where.classId = filters.classId;

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            class: true,
          },
        },
      },
    });

    // Group by student
    const studentRecords = attendance.reduce((acc: any, record) => {
      const studentId = record.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
          className: record.student.class?.name || "N/A",
          totalDays: 0,
          presentDays: 0,
        };
      }
      acc[studentId].totalDays++;
      if (record.status === "PRESENT") acc[studentId].presentDays++;
      return acc;
    }, {});

    // Filter perfect attendance (100%)
    const perfectAttendance = Object.values(studentRecords)
      .filter((student: any) => student.totalDays === student.presentDays && student.totalDays > 0)
      .map((student: any) => ({
        ...student,
        attendanceRate: 100,
      }));

    return {
      success: true,
      data: {
        students: perfectAttendance,
        count: perfectAttendance.length,
      },
    };
  } catch (error) {
    console.error("Error fetching perfect attendance:", error);
    return { success: false, error: "Failed to fetch perfect attendance" };
  }
}
