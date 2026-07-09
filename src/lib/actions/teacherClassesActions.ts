"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { formatFullName, compareClassNames } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtTime(d: Date) {
  return format(new Date(d), "hh:mm a");
}

async function resolveTeacher(userId: string, schoolId: string) {
  const teacher = await db.teacher.findFirst({
    where: { user: { id: userId }, schoolId },
    select: { id: true },
  });
  if (!teacher) throw new Error("Teacher not found");
  return teacher.id;
}

// ─── getTeacherClasses ───────────────────────────────────────────────────────
/**
 * Returns every class+section combination where the teacher is responsible
 * for at least one subject (via SubjectClass.teacherId) or is assigned as
 * class/section teacher (via ClassTeacher).
 *
 * Each entry represents one unique (classId, sectionId) pair with:
 *  - the subjects the teacher teaches in that scope
 *  - student count for that section (or whole class if no section)
 *  - timetable schedule derived from TimetableSlot
 */
export async function getTeacherClasses() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
  const schoolId = await getRequiredSchoolId();
  const teacherId = await resolveTeacher(userId, schoolId);

  // --- 1. SubjectClass rows where this teacher is the assigned teacher -------
  const subjectClassRows = await db.subjectClass.findMany({
    where: { teacherId, schoolId },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { name: "asc" } }, { order: "asc" }],
  });

  // --- 2. ClassTeacher rows (class/section head assignments) -----------------
  const classTeacherRows = await db.classTeacher.findMany({
    where: { teacherId, schoolId },
    include: {
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
  });

  // Build a unified set of (classId, sectionId|null) scopes
  type Scope = { classId: string; sectionId: string | null };
  const scopeMap = new Map<string, Scope>();

  for (const row of subjectClassRows) {
    const key = `${row.classId}|${row.sectionId ?? ""}`;
    if (!scopeMap.has(key)) scopeMap.set(key, { classId: row.classId, sectionId: row.sectionId ?? null });
  }
  for (const row of classTeacherRows) {
    const key = `${row.classId}|${row.sectionId ?? ""}`;
    if (!scopeMap.has(key)) scopeMap.set(key, { classId: row.classId, sectionId: row.sectionId ?? null });
  }

  if (scopeMap.size === 0) return { classes: [] };

  // --- 3. Fetch supporting data in bulk (avoid N+1) --------------------------
  const allClassIds = [...new Set([...scopeMap.values()].map((s) => s.classId))];
  const allSectionIds = [...new Set(
    [...scopeMap.values()].map((s) => s.sectionId).filter(Boolean) as string[]
  )];

  const [
    classMap,
    sectionMap,
    enrollmentCounts,
    classSectionCounts,
    timetableSlots,
  ] = await Promise.all([
    // Class name lookup
    db.class.findMany({
      where: { id: { in: allClassIds }, schoolId },
      select: { id: true, name: true },
    }).then((rows) => new Map(rows.map((r) => [r.id, r]))),

    // Section name lookup
    db.classSection.findMany({
      where: { id: { in: allSectionIds }, schoolId },
      select: { id: true, name: true, classId: true },
    }).then((rows) => new Map(rows.map((r) => [r.id, r]))),

    // Enrollment counts per section
    db.classEnrollment.groupBy({
      by: ["sectionId"],
      where: { sectionId: { in: allSectionIds }, status: "ACTIVE", schoolId },
      _count: { studentId: true },
    }).then((rows) => new Map(rows.map((r) => [r.sectionId, r._count.studentId]))),

    // Enrollment counts per class (for class-wide scopes)
    db.classEnrollment.groupBy({
      by: ["classId"],
      where: { classId: { in: allClassIds }, status: "ACTIVE", schoolId },
      _count: { studentId: true },
    }).then((rows) => new Map(rows.map((r) => [r.classId, r._count.studentId]))),

    // Timetable slots for this teacher
    db.timetableSlot.findMany({
      where: {
        schoolId,
        subjectTeacher: { teacherId, schoolId },
        timetable: { isActive: true },
      },
      include: {
        room: { select: { name: true } },
        subjectTeacher: { include: { subject: { select: { name: true, id: true } } } },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  // --- 4. Build per-scope result rows ----------------------------------------
  const classes = [...scopeMap.values()].map((scope) => {
    const cls = classMap.get(scope.classId);
    const sec = scope.sectionId ? sectionMap.get(scope.sectionId) : null;

    // Subjects taught by this teacher in this scope
    const subjects = subjectClassRows
      .filter((r) => r.classId === scope.classId && (r.sectionId ?? null) === scope.sectionId)
      .map((r) => ({ id: r.subject.id, name: r.subject.name, code: r.subject.code }));

    // Student count
    const studentCount = scope.sectionId
      ? (enrollmentCounts.get(scope.sectionId) ?? 0)
      : (classSectionCounts.get(scope.classId) ?? 0);

    // Timetable slots that match this scope
    const scopeSlots = timetableSlots.filter(
      (s) =>
        s.classId === scope.classId &&
        (scope.sectionId ? s.sectionId === scope.sectionId : true)
    );

    const days = [...new Set(scopeSlots.map((s) => s.day))];
    const scheduleDay = days.join(", ") || "Not scheduled";
    const scheduleTime =
      scopeSlots.length > 0
        ? `${fmtTime(scopeSlots[0].startTime)} – ${fmtTime(scopeSlots[0].endTime)}`
        : "Not scheduled";
    const roomName =
      scopeSlots.length > 0 && scopeSlots[0].room
        ? scopeSlots[0].room.name
        : "Not assigned";

    // Is class head?
    const isClassHead = classTeacherRows.some(
      (r) =>
        r.classId === scope.classId &&
        (r.sectionId ?? null) === scope.sectionId &&
        r.isClassHead
    );

    return {
      // use classId+sectionId as composite id
      id: scope.classId,
      sectionId: scope.sectionId,
      name: cls?.name ?? scope.classId,
      section: sec?.name ?? (scope.sectionId ? scope.sectionId : ""),
      displayName: sec ? `${cls?.name} — Section ${sec.name}` : cls?.name ?? scope.classId,
      subjects,
      // Legacy single-subject field for TeachingClassCard
      subject: subjects.map((s) => s.name).join(", ") || "—",
      studentCount,
      scheduleDay,
      scheduleTime,
      roomName,
      currentTopic: "—",
      completionPercentage: 0,
      isClassHead,
    };
  });

  // Sort: by class name (grade-aware, so "Class 2" sorts before "Class 10"), then section name
  classes.sort((a, b) => {
    const cn = compareClassNames(a.name, b.name);
    if (cn !== 0) return cn;
    return (a.section ?? "").localeCompare(b.section ?? "");
  });

  return { classes };
}

// ─── getClassDetails ─────────────────────────────────────────────────────────
/**
 * Returns detailed info for a single class (optionally filtered by section).
 * Used by /teacher/teaching/classes/[id]
 */
export async function getClassDetails(classId: string, sectionId?: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
  const schoolId = await getRequiredSchoolId();
  const teacherId = await resolveTeacher(userId, schoolId);

  // Auth check: teacher must teach in this class
  const hasAccess = await db.subjectClass.findFirst({
    where: {
      teacherId,
      classId,
      schoolId,
      ...(sectionId ? { sectionId } : {}),
    },
    select: { id: true },
  });

  // Also allow class head teachers without SubjectClass rows
  const isClassHead = await db.classTeacher.findFirst({
    where: { teacherId, classId, schoolId },
    select: { id: true },
  });

  if (!hasAccess && !isClassHead) throw new Error("Access denied");

  // Full class data
  const [classData, enrollments, timetableSlots] = await Promise.all([
    db.class.findUnique({
      where: { id: classId },
      include: {
        academicYear: { select: { name: true } },
        sections: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      },
    }),
    db.classEnrollment.findMany({
      where: {
        classId,
        schoolId,
        status: "ACTIVE",
        ...(sectionId ? { sectionId } : {}),
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
        section: { select: { id: true, name: true } },
      },
      orderBy: { rollNumber: "asc" },
    }),
    db.timetableSlot.findMany({
      where: {
        classId,
        schoolId,
        subjectTeacher: { teacherId, schoolId },
        timetable: { isActive: true },
        ...(sectionId ? { sectionId } : {}),
      },
      include: {
        room: { select: { name: true } },
        subjectTeacher: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),
  ]);

  if (!classData) throw new Error("Class not found");

  // Subjects taught by this teacher in this scope
  const subjectsInScope = await db.subjectClass.findMany({
    where: {
      teacherId,
      classId,
      schoolId,
      ...(sectionId ? { sectionId } : {}),
    },
    include: { subject: { select: { id: true, name: true, code: true } } },
    orderBy: { order: "asc" },
  });

  // Attendance today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const studentIds = enrollments.map((e) => e.studentId);
  const todayAttendance = await db.studentAttendance.findMany({
    where: {
      studentId: { in: studentIds },
      date: { gte: today, lt: new Date(today.getTime() + 86_400_000) },
      schoolId,
    },
    select: { studentId: true, status: true },
  });
  const attMap = new Map(todayAttendance.map((a) => [a.studentId, a.status]));

  const students = enrollments.map((e) => ({
    id: e.student.id,
    name: `${formatFullName(e.student.user.firstName, e.student.user.lastName)}`,
    avatar: e.student.user.avatar,
    rollNumber: e.rollNumber ?? "",
    section: e.section.name,
    sectionId: e.section.id,
    todayStatus: attMap.get(e.studentId) ?? null,
  }));

  const schedule = timetableSlots.map((s) => ({
    id: s.id,
    day: s.day,
    startTime: fmtTime(s.startTime),
    endTime: fmtTime(s.endTime),
    subject: s.subjectTeacher.subject.name,
    room: s.room?.name ?? "TBA",
  }));

  return {
    id: classData.id,
    name: classData.name,
    academicYear: classData.academicYear.name,
    sections: classData.sections,
    subjects: subjectsInScope.map((r) => r.subject),
    students,
    schedule,
    totalStudents: students.length,
    presentToday: todayAttendance.filter((a) => a.status === "PRESENT").length,
    absentToday: todayAttendance.filter((a) => a.status === "ABSENT").length,
  };
}

// ─── markClassAttendance — unchanged signature ───────────────────────────────
export async function markClassAttendance(
  classId: string,
  sectionId: string,
  attendanceData: {
    studentId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE";
    reason?: string;
  }[]
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
  const schoolId = await getRequiredSchoolId();
  const teacherId = await resolveTeacher(userId, schoolId);

  const section = await db.classSection.findFirst({
    where: { id: sectionId, classId, schoolId },
    select: { id: true },
  });
  if (!section) throw new Error("Section not found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  await Promise.all(
    attendanceData.map(async (record) => {
      const existing = await db.studentAttendance.findFirst({
        where: { studentId: record.studentId, sectionId, date: { gte: today, lt: tomorrow } },
        select: { id: true },
      });
      if (existing) {
        return db.studentAttendance.update({
          where: { id: existing.id },
          data: { status: record.status, reason: record.reason, markedBy: teacherId },
        });
      }
      return db.studentAttendance.create({
        data: {
          studentId: record.studentId,
          sectionId,
          schoolId,
          date: today,
          status: record.status,
          reason: record.reason,
          markedBy: teacherId,
        },
      });
    })
  );

  revalidatePath(`/teacher/teaching/classes/${classId}`);
  revalidatePath("/teacher/attendance/mark");
  return { success: true, count: attendanceData.length };
}

// ─── getClassStudents — unchanged public API ─────────────────────────────────
export async function getClassStudents(classId: string, sectionId?: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { getRequiredSchoolId } = await import("@/lib/utils/school-context-helper");
  const schoolId = await getRequiredSchoolId();
  const teacherId = await resolveTeacher(userId, schoolId);

  const hasAccess = await db.subjectClass.findFirst({
    where: { teacherId, classId, schoolId },
    select: { id: true },
  });
  const isClassHead = await db.classTeacher.findFirst({
    where: { teacherId, classId, schoolId },
    select: { id: true },
  });
  if (!hasAccess && !isClassHead) throw new Error("Access denied");

  const enrollments = await db.classEnrollment.findMany({
    where: {
      classId,
      status: "ACTIVE",
      schoolId,
      ...(sectionId ? { sectionId } : {}),
    },
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
      section: { select: { id: true, name: true } },
    },
  });

  return {
    students: enrollments.map((e) => ({
      id: e.student.id,
      name: `${formatFullName(e.student.user.firstName, e.student.user.lastName)}`,
      rollNumber: e.rollNumber ?? "",
      section: e.section.name,
      sectionId: e.section.id,
    })),
  };
}

// ─── getTodayAttendance — unchanged public API ───────────────────────────────
export async function getTodayAttendance(classId: string, sectionId: string) {
  const { students } = await getClassStudents(classId, sectionId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await db.studentAttendance.findMany({
    where: {
      sectionId,
      date: { gte: today, lt: new Date(today.getTime() + 86_400_000) },
      studentId: { in: students.map((s) => s.id) },
    },
    select: { studentId: true, status: true, reason: true },
  });
  const map = new Map(records.map((r) => [r.studentId, r]));

  return {
    students: students.map((s) => ({
      ...s,
      attendance: map.has(s.id)
        ? { status: map.get(s.id)!.status, date: today.toISOString().split("T")[0], reason: map.get(s.id)!.reason ?? undefined }
        : { status: "PRESENT" as const, date: today.toISOString().split("T")[0] },
    })),
  };
}
