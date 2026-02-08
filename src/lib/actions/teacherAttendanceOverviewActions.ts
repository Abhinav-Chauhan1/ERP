"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, format } from "date-fns";

/**
 * Get teacher attendance overview data
 */
export async function getTeacherAttendanceOverview() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user first, then teacher record
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get teacher record
    const teacher = await db.teacher.findUnique({
      where: {
        userId: user.id,
        schoolId, // CRITICAL: Ensure teacher belongs to current school
      },
    });

    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found",
      };
    }

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    // Get all classes taught by this teacher
    const teacherClasses = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
        schoolId, // CRITICAL: Filter by school
      },
      include: {
        class: {
          include: {
            sections: {
              where: {
                schoolId, // CRITICAL: Filter sections by school
              },
              include: {
                enrollments: {
                  where: {
                    status: "ACTIVE",
                    schoolId, // CRITICAL: Filter enrollments by school
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get today's classes from timetable
    const todayClasses = await db.timetableSlot.findMany({
      where: {
        subjectTeacher: {
          teacherId: teacher.id,
          schoolId, // CRITICAL: Filter by school
        },
        day: format(today, "EEEE").toUpperCase() as any,
        timetable: {
          isActive: true,
          schoolId, // CRITICAL: Filter timetable by school
        },
      },
      include: {
        class: true,
        section: true,
        subjectTeacher: {
          include: {
            subject: true,
          },
        },
        room: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get weekly attendance data for all teacher's classes
    const weeklyAttendance = await db.studentAttendance.findMany({
      where: {
        date: {
          gte: startOfThisWeek,
          lte: endOfThisWeek,
        },
        student: {
          schoolId, // CRITICAL: Filter through student relation
        },
        section: {
          schoolId, // CRITICAL: Filter through section relation
          class: {
            schoolId, // CRITICAL: Filter through class relation
            teachers: {
              some: {
                teacherId: teacher.id,
                schoolId, // CRITICAL: Filter by school
              },
            },
          },
        },
      },
    });

    // Calculate weekly average
    const presentCount = weeklyAttendance.filter(
      (record) => record.status === "PRESENT"
    ).length;
    const weeklyAverage =
      weeklyAttendance.length > 0
        ? ((presentCount / weeklyAttendance.length) * 100).toFixed(1)
        : "0.0";

    // Count absent students this week
    const absentThisWeek = weeklyAttendance.filter(
      (record) => record.status === "ABSENT" || record.status === "LEAVE"
    ).length;

    // Count absences with reasons
    const absentWithReasons = weeklyAttendance.filter(
      (record) =>
        (record.status === "ABSENT" || record.status === "LEAVE") && record.reason
    ).length;

    // Get attendance data by day for chart
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const attendanceByDay = await Promise.all(
      daysOfWeek.map(async (day, index) => {
        const dayDate = new Date(startOfThisWeek);
        dayDate.setDate(dayDate.getDate() + index);

        const dayStart = startOfDay(dayDate);
        const dayEnd = endOfDay(dayDate);

        const dayAttendance = await db.studentAttendance.findMany({
          where: {
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
            student: {
              schoolId, // CRITICAL: Filter through student relation
            },
            section: {
              schoolId, // CRITICAL: Filter through section relation
              class: {
                schoolId, // CRITICAL: Filter through class relation
                teachers: {
                  some: {
                    teacherId: teacher.id,
                    schoolId, // CRITICAL: Filter by school
                  },
                },
              },
            },
          },
        });

        const present = dayAttendance.filter((r) => r.status === "PRESENT").length;
        const absent = dayAttendance.length - present;

        return {
          date: day.substring(0, 3),
          present,
          absent,
        };
      })
    );

    // Get class-wise attendance summary
    const classAttendanceSummary = await Promise.all(
      teacherClasses.map(async (tc) => {
        const classAttendance = await db.studentAttendance.findMany({
          where: {
            date: {
              gte: startOfThisWeek,
              lte: endOfThisWeek,
            },
            student: {
              schoolId, // CRITICAL: Filter through student relation
            },
            section: {
              classId: tc.classId,
              schoolId, // CRITICAL: Filter by school
            },
          },
        });

        const totalStudents = tc.class.sections.reduce(
          (sum, section) => sum + section.enrollments.length,
          0
        );

        const presentInClass = classAttendance.filter(
          (r) => r.status === "PRESENT"
        ).length;
        const averageAttendance =
          classAttendance.length > 0
            ? Math.round((presentInClass / classAttendance.length) * 100)
            : 0;

        const thisWeekPresent = classAttendance.filter(
          (r) => r.status === "PRESENT"
        ).length;
        const thisWeekAbsent = classAttendance.length - thisWeekPresent;

        return {
          id: tc.classId,
          name: tc.class.name,
          subject: "All Subjects", // Could be enhanced to show specific subject
          studentCount: totalStudents,
          averageAttendance,
          thisWeekPresent,
          thisWeekAbsent,
          status:
            averageAttendance >= 90
              ? "Good"
              : averageAttendance >= 75
                ? "Fair"
                : "Needs Attention",
        };
      })
    );

    // Get students with low attendance (below 75%)
    const allStudents = teacherClasses.flatMap((tc) =>
      tc.class.sections.flatMap((section) =>
        section.enrollments.map((enrollment) => ({
          studentId: enrollment.studentId,
          classId: tc.classId,
          className: tc.class.name,
        }))
      )
    );

    const studentsWithLowAttendance = await Promise.all(
      allStudents.slice(0, 5).map(async (student) => {
        const studentAttendance = await db.studentAttendance.findMany({
          where: {
            studentId: student.studentId,
            student: {
              schoolId, // CRITICAL: Filter through student relation
            },
            date: {
              gte: startOfThisWeek,
              lte: endOfThisWeek,
            },
          },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        });

        const present = studentAttendance.filter(
          (r) => r.status === "PRESENT"
        ).length;
        const attendanceRate =
          studentAttendance.length > 0
            ? Math.round((present / studentAttendance.length) * 100)
            : 0;
        const absences = studentAttendance.length - present;

        return {
          id: student.studentId,
          name: studentAttendance[0]
            ? `${studentAttendance[0].student.user.firstName} ${studentAttendance[0].student.user.lastName}`
            : "Unknown",
          admissionId: studentAttendance[0]?.student.admissionId || "N/A",
          className: student.className,
          attendanceRate,
          absences,
          status: attendanceRate >= 75 ? "Good" : "Needs attention",
        };
      })
    );

    // Format today's classes
    const formattedTodayClasses = todayClasses.map((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      const now = new Date();

      const isNow = now >= startTime && now <= endTime;

      return {
        id: slot.id,
        classId: slot.classId,
        sectionId: slot.sectionId,
        className: slot.class.name,
        sectionName: slot.section?.name || null,
        subject: slot.subjectTeacher.subject.name,
        time: `${format(startTime, "hh:mm a")} - ${format(endTime, "hh:mm a")}`,
        room: slot.room?.name || "TBA",
        isNow,
        startTime: slot.startTime,
      };
    });

    // Pending classes (upcoming today)
    const pendingClasses = formattedTodayClasses.filter(
      (cls) => new Date(cls.startTime) > new Date()
    );

    return {
      success: true,
      data: {
        stats: {
          todayClassesCount: todayClasses.length,
          weeklyAverage: weeklyAverage,
          absentThisWeek: absentThisWeek,
          absentWithReasons: absentWithReasons,
          pendingCount: pendingClasses.length,
        },
        todayClasses: formattedTodayClasses,
        attendanceByDay,
        classAttendanceSummary,
        studentsWithLowAttendance: studentsWithLowAttendance.filter(
          (s) => s.attendanceRate < 75
        ),
      },
    };
  } catch (error) {
    console.error("Error fetching teacher attendance overview:", error);
    return {
      success: false,
      error: "Failed to fetch attendance overview",
    };
  }
}
