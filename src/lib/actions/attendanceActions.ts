"use server";

import { db } from "@/lib/db";
import { AttendanceStatus, PermissionAction } from "@prisma/client";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/utils/permissions";
import { sendAttendanceAlert } from "@/lib/services/communication-service";

// Helper to check permission and throw if denied
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Unauthorized: You must be logged in');
  }

  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }

  return userId;
}

export async function getAttendanceOverview() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStudentAttendance,
      totalTeacherAttendance,
      studentPresentToday,
      teacherPresentToday,
    ] = await Promise.all([
      db.studentAttendance.count({
        where: { date: { gte: today } },
      }),
      db.teacherAttendance.count({
        where: { date: { gte: today } },
      }),
      db.studentAttendance.count({
        where: {
          date: { gte: today },
          status: AttendanceStatus.PRESENT,
        },
      }),
      db.teacherAttendance.count({
        where: {
          date: { gte: today },
          status: AttendanceStatus.PRESENT,
        },
      }),
    ]);

    const studentAttendanceRate =
      totalStudentAttendance > 0
        ? ((studentPresentToday / totalStudentAttendance) * 100).toFixed(1)
        : "0.0";

    const teacherAttendanceRate =
      totalTeacherAttendance > 0
        ? ((teacherPresentToday / totalTeacherAttendance) * 100).toFixed(1)
        : "0.0";

    return {
      success: true,
      data: {
        studentAttendanceRate: `${studentAttendanceRate}%`,
        teacherAttendanceRate: `${teacherAttendanceRate}%`,
        totalReports: totalStudentAttendance + totalTeacherAttendance,
      },
    };
  } catch (error) {
    console.error("Error fetching attendance overview:", error);
    return { success: false, error: "Failed to fetch attendance overview" };
  }
}

export async function getWeeklyAttendanceTrend() {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      select: {
        date: true,
        status: true,
      },
    });

    // Group by date
    const groupedByDate = attendanceRecords.reduce((acc, record) => {
      const dateKey = record.date.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { present: 0, absent: 0 };
      }
      if (record.status === AttendanceStatus.PRESENT) {
        acc[dateKey].present++;
      } else if (record.status === AttendanceStatus.ABSENT) {
        acc[dateKey].absent++;
      }
      return acc;
    }, {} as Record<string, { present: number; absent: number }>);

    // Convert to array and format
    const trendData = Object.entries(groupedByDate)
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        }),
        present: counts.present,
        absent: counts.absent,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    return { success: true, data: trendData };
  } catch (error) {
    console.error("Error fetching weekly attendance trend:", error);
    return { success: false, error: "Failed to fetch attendance trend" };
  }
}

export async function getAttendanceByClass() {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const classes = await db.class.findMany({
      include: {
        sections: {
          include: {
            attendanceRecords: {
              where: {
                date: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
        },
      },
      take: 6,
      orderBy: { name: "asc" },
    });

    const classAttendance = classes.map((cls) => {
      let totalRecords = 0;
      let presentRecords = 0;

      cls.sections.forEach((section) => {
        totalRecords += section.attendanceRecords.length;
        presentRecords += section.attendanceRecords.filter(
          (r) => r.status === AttendanceStatus.PRESENT
        ).length;
      });

      const presentPercentage =
        totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
      const absentPercentage = 100 - presentPercentage;

      return {
        class: cls.name,
        present: parseFloat(presentPercentage.toFixed(1)),
        absent: parseFloat(absentPercentage.toFixed(1)),
      };
    });

    return { success: true, data: classAttendance };
  } catch (error) {
    console.error("Error fetching attendance by class:", error);
    return { success: false, error: "Failed to fetch class attendance" };
  }
}

export async function getRecentAbsences(limit: number = 10) {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const absences = await db.studentAttendance.findMany({
      where: {
        date: { gte: twoDaysAgo },
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
      orderBy: { date: "desc" },
      take: limit,
    });

    const formattedAbsences = absences.map((absence) => ({
      id: absence.id,
      name: `${absence.student.user.firstName} ${absence.student.user.lastName}`,
      grade:
        absence.student.enrollments.length > 0
          ? `${absence.student.enrollments[0].class.name}-${absence.student.enrollments[0].section.name}`
          : "N/A",
      date: absence.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: "Absent",
      reason: absence.reason || "No Reason",
      informed: absence.reason ? "Yes" : "No",
      studentId: absence.studentId,
    }));

    return { success: true, data: formattedAbsences };
  } catch (error) {
    console.error("Error fetching recent absences:", error);
    return { success: false, error: "Failed to fetch recent absences" };
  }
}

export async function getAttendanceStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [studentStats, teacherStats] = await Promise.all([
      db.studentAttendance.groupBy({
        by: ["status"],
        where: { date: { gte: today } },
        _count: true,
      }),
      db.teacherAttendance.groupBy({
        by: ["status"],
        where: { date: { gte: today } },
        _count: true,
      }),
    ]);

    const studentTotal = studentStats.reduce((sum, stat) => sum + stat._count, 0);
    const teacherTotal = teacherStats.reduce((sum, stat) => sum + stat._count, 0);

    return {
      success: true,
      data: {
        students: {
          total: studentTotal,
          present:
            studentStats.find((s) => s.status === AttendanceStatus.PRESENT)?._count || 0,
          absent:
            studentStats.find((s) => s.status === AttendanceStatus.ABSENT)?._count || 0,
          late: studentStats.find((s) => s.status === AttendanceStatus.LATE)?._count || 0,
        },
        teachers: {
          total: teacherTotal,
          present:
            teacherStats.find((s) => s.status === AttendanceStatus.PRESENT)?._count || 0,
          absent:
            teacherStats.find((s) => s.status === AttendanceStatus.ABSENT)?._count || 0,
          late: teacherStats.find((s) => s.status === AttendanceStatus.LATE)?._count || 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return { success: false, error: "Failed to fetch attendance stats" };
  }
}

export async function getClassSectionsForDropdown() {
  try {
    const classes = await db.class.findMany({
      include: {
        sections: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        sections: cls.sections.map((section) => ({
          id: section.id,
          name: section.name,
          fullName: `${cls.name} - ${section.name}`,
        })),
      })),
    };
  } catch (error) {
    console.error("Error fetching class sections:", error);
    return { success: false, error: "Failed to fetch class sections" };
  }
}

export async function getStudentAttendanceByDate(date: Date, sectionId?: string) {
  try {
    if (!sectionId) {
      return { success: false, error: "Section ID is required" };
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all students enrolled in the section
    const enrollments = await db.classEnrollment.findMany({
      where: {
        sectionId: sectionId,
        status: "ACTIVE",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        class: true,
        section: true,
      },
      orderBy: {
        student: {
          user: {
            firstName: "asc",
          },
        },
      },
    });

    // Get attendance records for this date and section
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        sectionId: sectionId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Create a map of student attendance
    const attendanceMap = new Map(
      attendanceRecords.map((record) => [
        record.studentId,
        {
          id: record.id,
          status: record.status,
          reason: record.reason,
        },
      ])
    );

    // Combine enrollment data with attendance data
    const studentsWithAttendance = enrollments.map((enrollment) => {
      const attendance = attendanceMap.get(enrollment.studentId);

      return {
        id: enrollment.studentId,
        studentId: enrollment.studentId,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        avatar: enrollment.student.user.avatar,
        rollNumber: enrollment.rollNumber,
        admissionId: enrollment.student.admissionId,
        class: enrollment.class.name,
        section: enrollment.section.name,
        status: attendance?.status || "PRESENT",
        reason: attendance?.reason || "",
        attendanceId: attendance?.id || null,
        date: date,
      };
    });

    return {
      success: true,
      data: studentsWithAttendance,
    };
  } catch (error) {
    console.error("Error fetching student attendance by date:", error);
    return { success: false, error: "Failed to fetch attendance records" };
  }
}

export async function markStudentAttendance(data: {
  studentId: string;
  sectionId: string;
  date: Date;
  status: AttendanceStatus;
  reason?: string;
  markedBy?: string;
}) {
  try {
    // Permission check: require ATTENDANCE:CREATE
    await checkPermission('ATTENDANCE', 'CREATE', 'You do not have permission to mark attendance');

    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if attendance already exists
    const existing = await db.studentAttendance.findFirst({
      where: {
        studentId: data.studentId,
        sectionId: data.sectionId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let attendanceRecord;
    if (existing) {
      // Update existing record
      attendanceRecord = await db.studentAttendance.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          reason: data.reason,
          markedBy: data.markedBy,
        },
      });
    } else {
      // Create new record
      attendanceRecord = await db.studentAttendance.create({
        data: {
          studentId: data.studentId,
          sectionId: data.sectionId,
          date: data.date,
          status: data.status,
          reason: data.reason,
          markedBy: data.markedBy,
        },
      });
    }

    // Send notification for ABSENT or LATE status
    // Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
    if (data.status === AttendanceStatus.ABSENT || data.status === AttendanceStatus.LATE) {
      try {
        // Get student details with parent information
        const student = await db.student.findUnique({
          where: { id: data.studentId },
          include: {
            user: true,
            parents: {
              include: {
                parent: true,
              },
            },
          },
        });

        if (student && student.parents.length > 0) {
          // Calculate attendance percentage
          const totalAttendance = await db.studentAttendance.count({
            where: { studentId: data.studentId },
          });

          const presentCount = await db.studentAttendance.count({
            where: {
              studentId: data.studentId,
              status: AttendanceStatus.PRESENT,
            },
          });

          const attendancePercentage = totalAttendance > 0
            ? (presentCount / totalAttendance) * 100
            : 100;

          // Send notification to all parents
          for (const parentRelation of student.parents) {
            await sendAttendanceAlert({
              studentId: data.studentId,
              studentName: `${student.user.firstName} ${student.user.lastName}`,
              date: data.date,
              status: data.status,
              attendancePercentage,
              parentId: parentRelation.parentId,
            }).catch(error => {
              // Log error but don't fail the attendance marking
              console.error('Failed to send attendance notification:', error);
            });
          }
        }
      } catch (notificationError) {
        // Log error but don't fail the attendance marking
        console.error('Error sending attendance notification:', notificationError);
      }
    }

    return { success: true, data: attendanceRecord };
  } catch (error) {
    console.error("Error marking student attendance:", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

export async function markBulkStudentAttendance(data: {
  sectionId: string;
  date: Date;
  attendanceRecords: Array<{
    studentId: string;
    status: AttendanceStatus;
    reason?: string;
  }>;
  markedBy?: string;
}) {
  try {
    const results = await Promise.all(
      data.attendanceRecords.map((record) =>
        markStudentAttendance({
          studentId: record.studentId,
          sectionId: data.sectionId,
          date: data.date,
          status: record.status,
          reason: record.reason,
          markedBy: data.markedBy,
        })
      )
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return {
      success: true,
      data: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    };
  } catch (error) {
    console.error("Error marking bulk attendance:", error);
    return { success: false, error: "Failed to mark bulk attendance" };
  }
}

export async function deleteStudentAttendance(id: string) {
  try {
    // Permission check: require ATTENDANCE:DELETE
    await checkPermission('ATTENDANCE', 'DELETE', 'You do not have permission to delete attendance records');

    await db.studentAttendance.delete({
      where: { id },
    });

    return { success: true, message: "Attendance record deleted successfully" };
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    return { success: false, error: "Failed to delete attendance record" };
  }
}

export async function getStudentAttendanceReport(
  studentId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const whereClause: any = { studentId };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = startDate;
      if (endDate) whereClause.date.lte = endDate;
    }

    const records = await db.studentAttendance.findMany({
      where: whereClause,
      include: {
        section: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absentDays = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const lateDays = records.filter((r) => r.status === AttendanceStatus.LATE).length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      success: true,
      data: {
        records: records.map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          reason: r.reason,
          class: r.section.class.name,
          section: r.section.name,
        })),
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching student attendance report:", error);
    return { success: false, error: "Failed to fetch attendance report" };
  }
}

export async function getTeachersForDropdown() {
  try {
    const teachers = await db.teacher.findMany({
      where: {
        user: {
          active: true,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return {
      success: true,
      data: teachers.map((teacher) => ({
        id: teacher.id,
        userId: teacher.userId,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        employeeId: teacher.employeeId,
      })),
    };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return { success: false, error: "Failed to fetch teachers" };
  }
}

export async function getStudentsForDropdown() {
  try {
    const students = await db.student.findMany({
      where: {
        user: {
          active: true,
        },
      },
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
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return {
      success: true,
      data: students.map((student) => ({
        id: student.id,
        userId: student.userId,
        name: `${student.user.firstName} ${student.user.lastName}`,
        admissionId: student.admissionId,
        class:
          student.enrollments.length > 0
            ? `${student.enrollments[0].class.name}-${student.enrollments[0].section.name}`
            : "N/A",
      })),
    };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Failed to fetch students" };
  }
}

export async function getTeacherAttendanceByDate(date: Date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await db.teacherAttendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        teacher: {
          user: {
            firstName: "asc",
          },
        },
      },
    });

    return {
      success: true,
      data: attendanceRecords.map((record) => ({
        id: record.id,
        teacherId: record.teacherId,
        teacherName: `${record.teacher.user.firstName} ${record.teacher.user.lastName}`,
        employeeId: record.teacher.employeeId,
        status: record.status,
        reason: record.reason,
        date: record.date,
      })),
    };
  } catch (error) {
    console.error("Error fetching teacher attendance by date:", error);
    return { success: false, error: "Failed to fetch attendance records" };
  }
}

export async function markTeacherAttendance(data: {
  teacherId: string;
  date: Date;
  status: AttendanceStatus;
  reason?: string;
  markedBy?: string;
}) {
  try {
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if attendance already exists
    const existing = await db.teacherAttendance.findFirst({
      where: {
        teacherId: data.teacherId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existing) {
      // Update existing record
      const updated = await db.teacherAttendance.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          reason: data.reason,
          markedBy: data.markedBy,
        },
      });
      return { success: true, data: updated };
    } else {
      // Create new record
      const created = await db.teacherAttendance.create({
        data: {
          teacherId: data.teacherId,
          date: data.date,
          status: data.status,
          reason: data.reason,
          markedBy: data.markedBy,
        },
      });
      return { success: true, data: created };
    }
  } catch (error) {
    console.error("Error marking teacher attendance:", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

export async function markBulkTeacherAttendance(data: {
  date: Date;
  attendanceRecords: Array<{
    teacherId: string;
    status: AttendanceStatus;
    reason?: string;
  }>;
  markedBy?: string;
}) {
  try {
    const results = await Promise.all(
      data.attendanceRecords.map((record) =>
        markTeacherAttendance({
          teacherId: record.teacherId,
          date: data.date,
          status: record.status,
          reason: record.reason,
          markedBy: data.markedBy,
        })
      )
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return {
      success: true,
      data: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    };
  } catch (error) {
    console.error("Error marking bulk teacher attendance:", error);
    return { success: false, error: "Failed to mark bulk attendance" };
  }
}
