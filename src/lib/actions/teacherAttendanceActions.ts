"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AttendanceStatus } from "@prisma/client";
import { sendAttendanceNotification } from "@/lib/services/notification-service";

type StudentAttendanceData = {
  studentId: string;
  status: AttendanceStatus;
  reason?: string;
  date: Date;
};

/**
 * Get students for a class to mark attendance
 */
export async function getClassStudentsForAttendance(classId: string, sectionId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify that this teacher is the HEAD CLASS TEACHER for this class/section
    const classTeacher = await db.classTeacher.findFirst({
      where: {
        classId,
        teacherId: teacher.id,
        sectionId: sectionId || undefined, // If sectionId provided, match it. If not, match specific or null? logic needs care
        isClassHead: true, // STRICTLY ENFORCE THIS
      },
    });

    if (!classTeacher) {
      throw new Error("Unauthorized: Only the Head Class Teacher can take attendance.");
    }

    // Get class details
    const classDetails = await db.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        sections: true,
      },
    });

    if (!classDetails) {
      throw new Error("Class not found");
    }

    // Get all sections if sectionId is not provided
    const sections = sectionId
      ? classDetails.sections.filter(s => s.id === sectionId)
      : classDetails.sections;

    // First section as default if no section is specified
    const defaultSection = sections[0]?.id;

    // Get students enrolled in this class and sections
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId,
        sectionId: sectionId || defaultSection,
        status: "ACTIVE",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        section: true,
      },
      orderBy: {
        student: {
          rollNumber: 'asc',
        },
      },
    });

    // Check if attendance has already been marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await db.studentAttendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        sectionId: sectionId || defaultSection,
        student: {
          enrollments: {
            some: {
              classId,
              sectionId: sectionId || defaultSection,
            },
          },
        },
      },
    });

    // Map to keep track of existing attendance records by student ID
    const existingAttendanceByStudentId = new Map();
    existingAttendance.forEach(record => {
      existingAttendanceByStudentId.set(record.studentId, record);
    });

    const students = enrollments.map(enrollment => {
      const existingRecord = existingAttendanceByStudentId.get(enrollment.studentId);

      return {
        id: enrollment.student.id,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        rollNumber: enrollment.student.rollNumber || enrollment.rollNumber || "N/A",
        className: classDetails.name,
        section: enrollment.section.name,
        sectionId: enrollment.section.id,
        attendance: existingRecord ? {
          id: existingRecord.id,
          status: existingRecord.status,
          date: existingRecord.date.toISOString(),
          reason: existingRecord.reason || undefined,
        } : {
          status: "PRESENT" as AttendanceStatus,
          date: new Date().toISOString(),
        }
      };
    });

    // Get recent attendance records for this class
    const recentAttendance = await db.studentAttendance.groupBy({
      by: ['date', 'sectionId'],
      where: {
        section: {
          classId,
        },
        date: {
          lt: today,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 3,
    });

    // Get counts for each date
    const attendanceSummary = [];

    for (const record of recentAttendance) {
      const date = record.date;
      const sectionId = record.sectionId;

      const allStudents = await db.classEnrollment.count({
        where: {
          classId,
          sectionId,
          status: "ACTIVE",
        },
      });

      const presentStudents = await db.studentAttendance.count({
        where: {
          sectionId,
          date,
          status: "PRESENT",
        },
      });

      const absentStudents = await db.studentAttendance.count({
        where: {
          sectionId,
          date,
          status: "ABSENT",
        },
      });

      attendanceSummary.push({
        date: date.toISOString().split('T')[0],
        total: allStudents,
        present: presentStudents,
        absent: absentStudents,
      });
    }

    return {
      classInfo: {
        id: classDetails.id,
        name: classDetails.name,
        sections,
        selectedSection: sectionId || defaultSection,
      },
      students,
      recentAttendance: attendanceSummary,
      alreadyMarked: existingAttendance.length > 0,
    };
  } catch (error) {
    console.error("Failed to get class students for attendance:", error);
    throw new Error(`Failed to get class students: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get teacher's classes for attendance
 * Only returns classes where the teacher is a Head Class Teacher
 */
export async function getTeacherClassesForAttendance() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get teacher's assigned classes where they are Head Class Teacher
    const headClasses = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
        isClassHead: true, // STRICTLY ENFORCE THIS
      },
      include: {
        class: true,
        section: true,
      },
    });

    // Format classes data
    const classes = headClasses.map(classTeacher => {
      // Count students in this class/section
      const studentCount = db.classEnrollment.count({
        where: {
          classId: classTeacher.classId,
          sectionId: classTeacher.sectionId || undefined,
          status: "ACTIVE",
        },
      });

      return {
        id: classTeacher.classId,
        name: classTeacher.class.name,
        sectionId: classTeacher.sectionId,
        sectionName: classTeacher.section?.name || "All Sections",
        studentCount: studentCount,
        isClassHead: true,
      };
    });

    return {
      classes,
      todayClasses: [], // Deprecated: No longer using schedule for attendance
    };
  } catch (error) {
    console.error("Failed to get teacher classes for attendance:", error);
    throw new Error("Failed to fetch classes");
  }
}

/**
 * Save attendance records for students
 */
export async function saveAttendanceRecords(classId: string, sectionId: string, attendanceRecords: StudentAttendanceData[]) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify that this teacher is the HEAD CLASS TEACHER for this class/section
    const classTeacher = await db.classTeacher.findFirst({
      where: {
        classId,
        teacherId: teacher.id,
        sectionId: sectionId,
        isClassHead: true, // STRICTLY ENFORCE THIS
      },
    });

    if (!classTeacher) {
      throw new Error("Unauthorized: Only the Head Class Teacher can mark attendance.");
    }

    // Process each attendance record
    for (const record of attendanceRecords) {
      // Check if record already exists
      const existingRecord = await db.studentAttendance.findFirst({
        where: {
          studentId: record.studentId,
          date: {
            gte: new Date(record.date.setHours(0, 0, 0, 0)),
            lt: new Date(new Date(record.date).setHours(24, 0, 0, 0)),
          },
          sectionId,
        },
      });

      if (existingRecord) {
        // Update existing record
        await db.studentAttendance.update({
          where: {
            id: existingRecord.id,
          },
          data: {
            status: record.status,
            reason: record.reason,
            markedBy: userId,
          },
        });
      } else {
        // Create new record
        await db.studentAttendance.create({
          data: {
            student: {
              connect: {
                id: record.studentId,
              },
            },
            section: {
              connect: {
                id: sectionId,
              },
            },
            date: record.date,
            status: record.status,
            reason: record.reason,
            markedBy: userId,
          },
        });
      }

      // Trigger notification (async, don't await blocking)
      sendAttendanceNotification(record.studentId, record.status, record.date)
        .catch(err => console.error("Error triggering attendance notification:", err));
    }

    revalidatePath(`/teacher/attendance/mark`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save attendance records:", error);
    return { success: false, error: "Failed to save attendance records" };
  }
}

/**
 * Get attendance records for a class on a specific date
 */
export async function getClassAttendanceForDate(classId: string, sectionId: string, date: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Convert date string to Date object
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get class details
    const classDetails = await db.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        sections: true,
      },
    });

    if (!classDetails) {
      throw new Error("Class not found");
    }

    // Get students enrolled in this class and section
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId,
        sectionId,
        status: "ACTIVE",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        section: true,
      },
      orderBy: {
        student: {
          rollNumber: 'asc',
        },
      },
    });

    // Get attendance records for the day
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDay,
        },
        sectionId,
        student: {
          enrollments: {
            some: {
              classId,
              sectionId,
            },
          },
        },
      },
    });

    // Map to keep track of existing attendance records by student ID
    const attendanceByStudentId = new Map();
    attendanceRecords.forEach(record => {
      attendanceByStudentId.set(record.studentId, record);
    });

    const students = enrollments.map(enrollment => {
      const record = attendanceByStudentId.get(enrollment.studentId);

      return {
        id: enrollment.student.id,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        rollNumber: enrollment.student.rollNumber || enrollment.rollNumber || "N/A",
        status: record ? record.status : "ABSENT",
        reason: record?.reason || null,
      };
    });

    // Calculate summary statistics
    const total = students.length;
    const present = students.filter(s => s.status === "PRESENT").length;
    const absent = students.filter(s => s.status === "ABSENT").length;
    const late = students.filter(s => s.status === "LATE").length;
    const leave = students.filter(s => s.status === "LEAVE").length;
    const halfDay = students.filter(s => s.status === "HALF_DAY").length;

    return {
      classInfo: {
        id: classDetails.id,
        name: classDetails.name,
        section: classDetails.sections.find(s => s.id === sectionId)?.name || "",
      },
      date: targetDate.toISOString(),
      students,
      summary: {
        total,
        present,
        absent,
        late,
        leave,
        halfDay,
        presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      isMarked: attendanceRecords.length > 0,
    };
  } catch (error) {
    console.error("Failed to get class attendance for date:", error);
    throw new Error("Failed to fetch attendance records");
  }
}

/**
 * Get attendance reports for a teacher's classes
 */
export async function getTeacherAttendanceReports(filters?: {
  classId?: string;
  sectionId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get teacher's assigned classes
    const teacherClasses = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        class: {
          include: {
            sections: true,
          },
        },
      },
    });

    const classIds = teacherClasses.map(tc => tc.classId);

    // Prepare date range for filtering
    const startDateObj = filters?.startDate ? new Date(filters.startDate) : new Date();
    startDateObj.setDate(startDateObj.getDate() - 30); // Default to last 30 days
    startDateObj.setHours(0, 0, 0, 0);

    const endDateObj = filters?.endDate ? new Date(filters.endDate) : new Date();
    endDateObj.setHours(23, 59, 59, 999);

    // Build the where clause for attendance records
    const whereClause: any = {
      date: {
        gte: startDateObj,
        lte: endDateObj,
      },
    };

    // Add sectionId filter if provided
    if (filters?.sectionId) {
      whereClause.sectionId = filters.sectionId;
    } else {
      // Otherwise, filter by sections that belong to the teacher's classes
      const sectionIds = teacherClasses.flatMap(tc => tc.class.sections.map(s => s.id));

      if (filters?.classId) {
        // If classId is provided, get only sections from that class
        const classSections = teacherClasses
          .find(tc => tc.classId === filters.classId)?.class.sections || [];
        whereClause.sectionId = { in: classSections.map(s => s.id) };
      } else {
        whereClause.sectionId = { in: sectionIds };
      }
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    // Get attendance summary for the period
    const attendanceStats = await db.studentAttendance.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Convert to a more usable format
    const stats = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      LEAVE: 0,
      HALF_DAY: 0,
      total: 0,
    };

    attendanceStats.forEach(stat => {
      stats[stat.status] = stat._count.id;
      stats.total += stat._count.id;
    });

    // Get daily attendance trends
    const dailyTrends = await db.studentAttendance.groupBy({
      by: ['date', 'status'],
      where: whereClause,
      _count: {
        id: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Format daily trends for chart display
    const dailyTrendsFormatted: Record<string, any> = {};

    dailyTrends.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dailyTrendsFormatted[dateStr]) {
        dailyTrendsFormatted[dateStr] = {
          date: dateStr,
          PRESENT: 0,
          ABSENT: 0,
          LATE: 0,
          LEAVE: 0,
          HALF_DAY: 0,
        };
      }
      dailyTrendsFormatted[dateStr][record.status] = record._count.id;
    });

    const dailyTrendsArray = Object.values(dailyTrendsFormatted);

    // Optimized aggregation using groupBy instead of fetching all records
    // We group by sectionId and status, then aggregate by classId in memory
    const attendanceStatsBySection = await db.studentAttendance.groupBy({
      by: ['sectionId', 'status'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Create a map of sectionId to classId from the already fetched teacherClasses
    const sectionToClassId = new Map<string, string>();
    teacherClasses.forEach(tc => {
      tc.class.sections.forEach(section => {
        sectionToClassId.set(section.id, tc.classId);
      });
    });

    // Process attendance by class
    const classWiseFormatted: Record<string, any> = {};

    // Initialize data for all teacher classes
    teacherClasses.forEach(tc => {
      classWiseFormatted[tc.classId] = {
        id: tc.classId,
        name: tc.class.name,
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        LEAVE: 0,
        HALF_DAY: 0,
        total: 0,
      };
    });

    // Aggregate counts
    attendanceStatsBySection.forEach(stat => {
      const classId = sectionToClassId.get(stat.sectionId);
      if (classId && classWiseFormatted[classId]) {
        classWiseFormatted[classId][stat.status] += stat._count.id;
        classWiseFormatted[classId].total += stat._count.id;
      }
    });

    // Calculate percentages and other metrics for each class
    Object.values(classWiseFormatted).forEach((classStats: any) => {
      classStats.presentPercentage = classStats.total > 0
        ? Math.round((classStats.PRESENT / classStats.total) * 100)
        : 0;

      classStats.absentPercentage = classStats.total > 0
        ? Math.round((classStats.ABSENT / classStats.total) * 100)
        : 0;
    });

    // Get student-wise attendance statistics for the most concerning students
    // Fix: Use simple query instead of raw SQL
    const studentsAttendance = await db.studentAttendance.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: true,
          }
        },
        section: {
          include: {
            class: true
          }
        }
      },
    });

    // Group and calculate statistics by student
    const studentMap = new Map();

    studentsAttendance.forEach(record => {
      const studentId = record.studentId;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
          rollNumber: record.student.rollNumber || '',
          className: record.section.class.name,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          leaveCount: 0,
          halfDayCount: 0,
          totalRecords: 0
        });
      }

      const studentStats = studentMap.get(studentId);
      studentStats.totalRecords++;

      switch (record.status) {
        case "PRESENT":
          studentStats.presentCount++;
          break;
        case "ABSENT":
          studentStats.absentCount++;
          break;
        case "LATE":
          studentStats.lateCount++;
          break;
        case "LEAVE":
          studentStats.leaveCount++;
          break;
        case "HALF_DAY":
          studentStats.halfDayCount++;
          break;
      }
    });

    // Convert to array and sort by attendance percentage (ascending)
    const studentsWithLowAttendance = Array.from(studentMap.values())
      .sort((a, b) => {
        const aPercent = a.totalRecords ? a.presentCount / a.totalRecords : 0;
        const bPercent = b.totalRecords ? b.presentCount / b.totalRecords : 0;
        return aPercent - bPercent;
      })
      .slice(0, 10); // Get top 10 lowest attendance

    // Get recent attendance records
    const recentAttendance = await db.studentAttendance.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: true,
          }
        },
        section: {
          include: {
            class: true,
          }
        }
      },
      orderBy: {
        date: 'desc',
      },
      take: 50,
    });

    // Format recent attendance records for display
    const recentAttendanceFormatted = recentAttendance.map(record => ({
      id: record.id,
      studentId: record.studentId,
      studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
      rollNumber: record.student.rollNumber || '',
      className: record.section.class.name,
      sectionName: record.section.name,
      date: record.date.toISOString(),
      status: record.status,
      reason: record.reason || '',
    }));

    return {
      stats,
      dailyTrends: dailyTrendsArray,
      classWiseStats: Object.values(classWiseFormatted),
      studentsWithLowAttendance,
      recentAttendance: recentAttendanceFormatted,
      classes: teacherClasses.map(tc => ({
        id: tc.class.id,
        name: tc.class.name,
        sections: tc.class.sections.map(section => ({
          id: section.id,
          name: section.name,
        })),
      })),
      filters: {
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        classId: filters?.classId || null,
        sectionId: filters?.sectionId || null,
        status: filters?.status || null,
      }
    };
  } catch (error) {
    console.error("Failed to get attendance reports:", error);
    throw new Error(`Failed to get attendance reports: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a single student's attendance report
 */
export async function getStudentAttendanceReport(studentId: string, filters?: {
  startDate?: string;
  endDate?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get student details
    const student = await db.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        user: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: true,
            section: true,
          }
        }
      }
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Prepare date range for filtering
    const startDateObj = filters?.startDate ? new Date(filters.startDate) : new Date();
    startDateObj.setDate(startDateObj.getDate() - 30); // Default to last 30 days
    startDateObj.setHours(0, 0, 0, 0);

    const endDateObj = filters?.endDate ? new Date(filters.endDate) : new Date();
    endDateObj.setHours(23, 59, 59, 999);

    // Get attendance records
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        studentId,
        date: {
          gte: startDateObj,
          lte: endDateObj,
        }
      },
      include: {
        section: {
          include: {
            class: true,
          }
        }
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => record.status === "PRESENT").length;
    const absentDays = attendanceRecords.filter(record => record.status === "ABSENT").length;
    const lateDays = attendanceRecords.filter(record => record.status === "LATE").length;
    const leaveDays = attendanceRecords.filter(record => record.status === "LEAVE").length;
    const halfDays = attendanceRecords.filter(record => record.status === "HALF_DAY").length;

    // Group by month for trend analysis
    const monthlyTrends: Record<string, any> = {};

    attendanceRecords.forEach(record => {
      const month = record.date.toLocaleString('default', { month: 'short' });
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = {
          month,
          PRESENT: 0,
          ABSENT: 0,
          LATE: 0,
          LEAVE: 0,
          HALF_DAY: 0,
          total: 0,
        };
      }

      monthlyTrends[month][record.status]++;
      monthlyTrends[month].total++;
    });

    // Format monthly trends for chart
    const monthlyTrendsArray = Object.values(monthlyTrends).map(trend => ({
      ...trend,
      presentPercentage: trend.total > 0 ? Math.round((trend.PRESENT / trend.total) * 100) : 0,
    }));

    // Format attendance records for display
    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toISOString(),
      status: record.status,
      className: record.section.class.name,
      sectionName: record.section.name,
      reason: record.reason || '',
    }));

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber || '',
        class: student.enrollments[0]?.class.name || 'Not Assigned',
        section: student.enrollments[0]?.section.name || 'Not Assigned',
      },
      stats: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        halfDays,
        attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
      },
      monthlyTrends: monthlyTrendsArray,
      records: formattedRecords,
      filters: {
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
      }
    };
  } catch (error) {
    console.error("Failed to get student attendance report:", error);
    throw new Error(`Failed to get student attendance report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to format time
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Helper function to check if current time is within a range
 */
function isTimeInRange(current: Date, start: Date, end: Date): boolean {
  const currentTime = current.getHours() * 60 + current.getMinutes();
  const startTime = start.getHours() * 60 + start.getMinutes();
  const endTime = end.getHours() * 60 + end.getMinutes();

  return currentTime >= startTime && currentTime <= endTime;
}
