"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, addDays } from "date-fns";
import { formatFullName } from "@/lib/utils";

// ---------------------------------------------------------------------------
// getTeacherDashboardData — single entry point, all queries parallelised
// ---------------------------------------------------------------------------
export async function getTeacherDashboardData() {
  try {
    const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");

    // Resolve session + schoolId in parallel — no sequential await
    const [session, schoolId] = await Promise.all([
      auth(),
      getRequiredSchoolId(),
    ]);

    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch user + teacher in parallel
    const [user, teacherByUserId] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.teacher.findFirst({
        where: { userId, schoolId },
        include: { user: true },
      }),
    ]);

    if (!user) return { success: false, error: "User not found" };
    if (!teacherByUserId) return { success: false, error: "Teacher not found" };

    const teacher = teacherByUserId;
    const teacherId = teacher.id;

    const today = new Date();
    const dayName = format(today, "EEEE").toUpperCase() as any;
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
    const nextWeek = addDays(today, 7);

    // -----------------------------------------------------------------------
    // Wave 1 — all independent queries fire together
    // -----------------------------------------------------------------------
    const [
      todayClasses,
      studentCount,
      pendingAssignmentsRaw,
      upcomingExams,
      announcements,
      unreadMessagesCount,
      weekAttendanceRecords,
      recentAssignments,
      pendingTasksRaw,
      classes,
    ] = await Promise.all([
      // Today's timetable slots
      db.timetableSlot.findMany({
        where: {
          schoolId,
          subjectTeacher: { teacherId, schoolId },
          day: dayName,
          timetable: { isActive: true },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          classId: true,
          sectionId: true,
          class: { select: { name: true } },
          section: { select: { name: true } },
          subjectTeacher: { select: { subject: { select: { name: true } } } },
          room: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),

      // Total active students across teacher's classes/sections
      // Use SubjectClass.teacherId (precise) + ClassTeacher as fallback
      db.classEnrollment.count({
        where: {
          schoolId,
          OR: [
            // Students in sections/classes where teacher is assigned via SubjectClass
            {
              sectionId: {
                in: await db.subjectClass
                  .findMany({
                    where: { teacherId, schoolId, sectionId: { not: null } },
                    select: { sectionId: true },
                  })
                  .then((rows) => rows.map((r) => r.sectionId as string)),
              },
            },
            // Students in classes via ClassTeacher (class head etc.)
            {
              class: { teachers: { some: { teacherId } } },
            },
          ],
          status: "ACTIVE",
        },
      }),

      // Pending assignments needing grading — findMany only (count from .length)
      db.assignment.findMany({
        where: {
          schoolId,
          creatorId: teacherId,
          submissions: { some: { status: "SUBMITTED", marks: null } },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          subject: { select: { name: true } },
          classes: { select: { class: { select: { name: true } } } },
          submissions: {
            where: { status: "SUBMITTED", marks: null },
            select: { id: true, status: true },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),

      // Upcoming exams (next 7 days)
      db.exam.findMany({
        where: {
          schoolId,
          creatorId: teacherId,
          examDate: { gte: today, lte: nextWeek },
        },
        select: {
          id: true,
          title: true,
          examDate: true,
          totalMarks: true,
          subject: { select: { name: true } },
          examType: { select: { name: true } },
          term: { select: { name: true } },
        },
        orderBy: { examDate: "asc" },
        take: 10,
      }),

      // Recent announcements for teachers
      db.announcement.findMany({
        where: {
          schoolId,
          isActive: true,
          startDate: { lte: today },
          OR: [{ endDate: null }, { endDate: { gte: today } }],
          targetAudience: { has: "TEACHER" },
        },
        select: {
          id: true,
          title: true,
          content: true,
          startDate: true,
          createdAt: true,
          publisher: { select: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Unread messages count — use userId directly, no extra teacher lookup
      db.message.count({
        where: { recipientId: userId, isRead: false, schoolId },
      }),

      // Weekly attendance — single fetch, used for BOTH percentage stat AND chart
      db.studentAttendance.findMany({
        where: {
          schoolId,
          date: { gte: startOfThisWeek, lte: endOfThisWeek },
          section: {
            schoolId,
            class: { schoolId, teachers: { some: { teacherId } } },
          },
        },
        include: { section: { select: { classId: true } } },
      }),

      // Recent assignments for the tab panel (take:3)
      db.assignment.findMany({
        where: { schoolId, creatorId: teacherId },
        include: {
          subject: true,
          classes: { include: { class: true } },
          submissions: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),

      // Pending tasks (due in future, has ungraded submissions)
      db.assignment.findMany({
        where: {
          schoolId,
          creatorId: teacherId,
          dueDate: { gte: today },
          submissions: { some: { status: "SUBMITTED", marks: null } },
        },
        include: {
          subject: true,
          classes: { include: { class: true } },
          submissions: { where: { status: "SUBMITTED", marks: null } },
        },
        orderBy: { dueDate: "asc" },
        take: 4,
      }),

      // Teacher's classes (for chart & performance data)
      db.class.findMany({
        where: { schoolId, teachers: { some: { teacherId } } },
        select: { id: true, name: true },
        take: 10,
      }),
    ]);

    // -----------------------------------------------------------------------
    // Wave 2 — needs classIds from wave 1
    // -----------------------------------------------------------------------
    const classIds = classes.map((c) => c.id);

    const [examResults, assignmentSubmissionStats] = await Promise.all([
      // Aggregated exam performance per exam
      db.examResult.groupBy({
        by: ["examId"],
        where: {
          schoolId,
          exam: {
            subject: { classes: { some: { classId: { in: classIds } } } },
          },
          isAbsent: false,
        },
        _avg: { marks: true },
      }),

      // Assignment submission counts grouped by status — replaces unbounded findMany+all submissions
      db.assignmentSubmission.groupBy({
        by: ["status"],
        where: {
          schoolId,
          assignment: { creatorId: teacherId, schoolId },
        },
        _count: { _all: true },
      }),
    ]);

    // -----------------------------------------------------------------------
    // Wave 3 — needs examIds from wave 2
    // -----------------------------------------------------------------------
    const examIds = examResults.map((r) => r.examId);
    const exams = examIds.length > 0
      ? await db.exam.findMany({
          where: { id: { in: examIds }, schoolId },
          select: { id: true, totalMarks: true, subject: { select: { name: true } } },
        })
      : [];

    // -----------------------------------------------------------------------
    // Compute derived values from fetched data
    // -----------------------------------------------------------------------

    // Attendance percentage from the single weekAttendanceRecords fetch
    const presentCount = weekAttendanceRecords.filter((r) => r.status === "PRESENT").length;
    const attendancePercentage =
      weekAttendanceRecords.length > 0
        ? ((presentCount / weekAttendanceRecords.length) * 100).toFixed(1)
        : "0.0";

    // Student attendance chart — reuse weekAttendanceRecords, group by class
    const studentAttendanceData = classes.slice(0, 4).map((cls) => {
      const forClass = weekAttendanceRecords.filter(
        (r) => r.section.classId === cls.id
      );
      const present = forClass.filter((r) => r.status === "PRESENT").length;
      return { class: cls.name, present, absent: forClass.length - present };
    });

    // Class performance chart
    const examMap = new Map(exams.map((e) => [e.id, e]));
    const subjectScores = new Map<string, { total: number; count: number }>();

    examResults.forEach((result) => {
      const exam = examMap.get(result.examId);
      if (!exam || !result._avg.marks) return;
      const pct = (result._avg.marks / exam.totalMarks) * 100;
      const existing = subjectScores.get(exam.subject.name) || { total: 0, count: 0 };
      existing.total += pct;
      existing.count += 1;
      subjectScores.set(exam.subject.name, existing);
    });

    const classPerformanceData = Array.from(subjectScores.entries())
      .map(([subject, scores]) => ({ subject, average: Math.round(scores.total / scores.count) }))
      .slice(0, 6);

    // Assignment pie chart — from grouped stats (no unbounded fetch)
    const statusMap = new Map(
      assignmentSubmissionStats.map((s) => [s.status, s._count._all])
    );
    const assignmentData = [
      { status: "Submitted", count: (statusMap.get("SUBMITTED") ?? 0) + (statusMap.get("GRADED") ?? 0) },
      { status: "Pending",   count: statusMap.get("PENDING") ?? 0 },
      { status: "Graded",    count: statusMap.get("GRADED") ?? 0 },
      { status: "Late",      count: statusMap.get("LATE") ?? 0 },
    ];

    // Format today's classes with status
    const formattedTodayClasses = todayClasses.map((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      const now = new Date();
      const isNow = now >= startTime && now <= endTime;
      const isCompleted = now > endTime;

      return {
        id: slot.id,
        subject: slot.subjectTeacher.subject.name,
        className: slot.class.name,
        sectionName: slot.section?.name || null,
        time: `${format(startTime, "hh:mm a")} - ${format(endTime, "hh:mm a")}`,
        room: slot.room?.name || "TBA",
        topic: "Scheduled Lesson",
        status: isCompleted ? "completed" : isNow ? "next" : "upcoming",
        classId: slot.classId,
        sectionId: slot.sectionId,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    });

    return {
      success: true,
      data: {
        teacher: {
          name: `${formatFullName(teacher.user.firstName, teacher.user.lastName)}`,
          email: teacher.user.email,
        },
        stats: {
          classesCount: formattedTodayClasses.length,
          studentsCount: studentCount,
          assignmentsNeedingGrading: pendingAssignmentsRaw.length,
          attendancePercentage,
          upcomingExamsCount: upcomingExams.length,
          unreadMessagesCount,
        },
        todayClasses: formattedTodayClasses,
        recentAnnouncements: announcements.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          publisherName: `${formatFullName(a.publisher.user.firstName, a.publisher.user.lastName)}`,
          startDate: format(a.startDate, "MMM dd, yyyy"),
          createdAt: format(a.createdAt, "MMM dd, yyyy"),
        })),
        recentLessons: [],
        recentAssignments: recentAssignments.map((assignment) => {
          const submitted = assignment.submissions.filter(
            (s) => s.status === "SUBMITTED" || s.status === "GRADED"
          ).length;
          return {
            id: assignment.id,
            title: assignment.title,
            class: assignment.classes.map((c) => c.class.name).join(", "),
            dueDate: format(assignment.dueDate, "MMM dd, yyyy"),
            submissions: `${submitted}/${assignment.submissions.length}`,
            status: new Date() > assignment.dueDate ? "completed" : "active",
          };
        }),
        pendingTasks: pendingTasksRaw.map((task) => ({
          id: task.id,
          title: `Grade ${task.title}`,
          class: task.classes.map((c) => c.class.name).join(", "),
          dueDate: format(task.dueDate, "MMM dd, yyyy"),
          priority: task.submissions.length > 10 ? "high" : "medium",
          count: task.submissions.length,
        })),
        studentAttendanceData,
        assignmentData,
        classPerformanceData,
      },
    };
  } catch (error) {
    console.error("Error fetching teacher dashboard data:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

// ---------------------------------------------------------------------------
// Legacy individual helpers — kept for backward compatibility with other pages
// ---------------------------------------------------------------------------

export async function getTotalStudents(teacherId: string) {
  try {
    const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
    const schoolId = await getRequiredSchoolId();
    const studentCount = await db.classEnrollment.count({
      where: { schoolId, class: { schoolId, teachers: { some: { teacherId } } }, status: "ACTIVE" },
    });
    return { success: true, data: studentCount };
  } catch (error) {
    console.error("Error fetching total students:", error);
    return { success: false, error: "Failed to fetch total students" };
  }
}

export async function getPendingAssignments(teacherId: string) {
  try {
    const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
    const schoolId = await getRequiredSchoolId();
    const assignments = await db.assignment.findMany({
      where: {
        schoolId,
        creatorId: teacherId,
        submissions: { some: { status: "SUBMITTED", marks: null } },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        subject: { select: { name: true } },
        classes: { select: { class: { select: { name: true } } } },
        submissions: {
          where: { status: "SUBMITTED", marks: null },
          select: { id: true, status: true, student: { select: { user: { select: { firstName: true, lastName: true } } } } },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    });
    return { success: true, data: { assignments, count: assignments.length } };
  } catch (error) {
    console.error("Error fetching pending assignments:", error);
    return { success: false, error: "Failed to fetch pending assignments" };
  }
}

export async function getUpcomingExams(teacherId: string) {
  try {
    const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
    const schoolId = await getRequiredSchoolId();
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const exams = await db.exam.findMany({
      where: { schoolId, creatorId: teacherId, examDate: { gte: today, lte: nextWeek } },
      select: {
        id: true,
        title: true,
        examDate: true,
        totalMarks: true,
        subject: { select: { name: true } },
        examType: { select: { name: true } },
        term: { select: { name: true } },
      },
      orderBy: { examDate: "asc" },
      take: 10,
    });
    return { success: true, data: { exams, count: exams.length } };
  } catch (error) {
    console.error("Error fetching upcoming exams:", error);
    return { success: false, error: "Failed to fetch upcoming exams" };
  }
}

export async function getTodaysClasses(teacherId: string) {
  try {
    const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
    const schoolId = await getRequiredSchoolId();
    const today = new Date();
    const dayName = format(today, "EEEE").toUpperCase() as any;
    const slots = await db.timetableSlot.findMany({
      where: {
        schoolId,
        subjectTeacher: { teacherId, schoolId },
        day: dayName,
        timetable: { isActive: true },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        classId: true,
        sectionId: true,
        class: { select: { name: true } },
        section: { select: { name: true } },
        subjectTeacher: { select: { subject: { select: { name: true } } } },
        room: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    });
    const formattedClasses = slots.map((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      const now = new Date();
      const isNow = now >= startTime && now <= endTime;
      const isCompleted = now > endTime;
      return {
        id: slot.id,
        subject: slot.subjectTeacher.subject.name,
        className: slot.class.name,
        sectionName: slot.section?.name || null,
        time: `${format(startTime, "hh:mm a")} - ${format(endTime, "hh:mm a")}`,
        room: slot.room?.name || "TBA",
        topic: "Scheduled Lesson",
        status: isCompleted ? "completed" : isNow ? "next" : "upcoming",
        classId: slot.classId,
        sectionId: slot.sectionId,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    });
    return { success: true, data: formattedClasses };
  } catch (error) {
    console.error("Error fetching today's classes:", error);
    return { success: false, error: "Failed to fetch today's classes" };
  }
}

export async function getRecentAnnouncements() {
  try {
    const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
    const schoolId = await getRequiredSchoolId();
    const today = new Date();
    const announcements = await db.announcement.findMany({
      where: {
        schoolId,
        isActive: true,
        startDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
        targetAudience: { has: "TEACHER" },
      },
      select: {
        id: true,
        title: true,
        content: true,
        startDate: true,
        createdAt: true,
        publisher: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return { success: true, data: announcements };
  } catch (error) {
    console.error("Error fetching recent announcements:", error);
    return { success: false, error: "Failed to fetch recent announcements" };
  }
}

export async function getUnreadMessagesCount(teacherId: string) {
  try {
    const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
    const [schoolId, teacher] = await Promise.all([
      getRequiredSchoolId(),
      db.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } }),
    ]);
    if (!teacher) return { success: false, error: "Teacher not found" };
    const unreadCount = await db.message.count({
      where: { recipientId: teacher.userId, isRead: false, schoolId },
    });
    return { success: true, data: unreadCount };
  } catch (error) {
    console.error("Error fetching unread messages count:", error);
    return { success: false, error: "Failed to fetch unread messages count" };
  }
}
