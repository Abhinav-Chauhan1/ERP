"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { PermissionAction } from "@prisma/client";
import {
  ExamFormValues,
  ExamUpdateFormValues,
  ExamResultFormValues
} from "../schemaValidation/examsSchemaValidation";
import {
  createCalendarEventFromExam,
  updateCalendarEventFromExam,
  deleteCalendarEventFromExam
} from "../services/exam-calendar-integration";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// ---------------------------------------------------------------------------
// Lightweight permission check — no audit log on reads, no extra auth() call
// The role is already resolved by withSchoolAuthAction wrapper.
// ---------------------------------------------------------------------------
async function checkPermission(
  userId: string,
  userRole: string,
  resource: string,
  action: PermissionAction,
  errorMessage?: string
) {
  // ADMIN role has all permissions — fast path, zero DB queries
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return;

  // Check role permission in DB
  const permission = await db.permission.findFirst({
    where: { resource, action, isActive: true },
    select: { id: true },
  });

  if (!permission) return; // No permission record = allow by default

  const rolePermission = await db.rolePermission.findUnique({
    where: { role_permissionId: { role: userRole as any, permissionId: permission.id } },
    select: { role: true },
  });

  if (!rolePermission) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }
}

// ---------------------------------------------------------------------------
// Get upcoming exams — lean select, no redundant auth() call
// ---------------------------------------------------------------------------
export const getUpcomingExams = withSchoolAuthAction(async (schoolId: string) => {
  try {
    const exams = await db.exam.findMany({
      where: { schoolId, examDate: { gte: new Date() } },
      select: {
        id: true,
        title: true,
        examDate: true,
        startTime: true,
        endTime: true,
        totalMarks: true,
        passingMarks: true,
        subjectId: true,
        classId: true,
        termId: true,
        examTypeId: true,
        subject: { select: { name: true } },
        examType: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        term: { select: { id: true, name: true, academicYear: { select: { name: true } } } },
        _count: { select: { results: true } },
      },
      orderBy: { examDate: "asc" },
    });
    return { success: true as const, data: exams };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch upcoming exams" };
  }
});

// ---------------------------------------------------------------------------
// Get past exams — use _count instead of fetching all results
// ---------------------------------------------------------------------------
export const getPastExams = withSchoolAuthAction(async (schoolId: string) => {
  try {
    const exams = await db.exam.findMany({
      where: { schoolId, examDate: { lt: new Date() } },
      select: {
        id: true,
        title: true,
        examDate: true,
        startTime: true,
        endTime: true,
        totalMarks: true,
        passingMarks: true,
        subjectId: true,
        classId: true,
        termId: true,
        examTypeId: true,
        subject: { select: { name: true } },
        examType: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        term: { select: { id: true, name: true, academicYear: { select: { name: true } } } },
        _count: { select: { results: true } },
      },
      orderBy: { examDate: "desc" },
    });
    return { success: true as const, data: exams };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch past exams" };
  }
});

// ---------------------------------------------------------------------------
// Get exam by ID — full detail for the detail page
// ---------------------------------------------------------------------------
export const getExamById = withSchoolAuthAction(async (schoolId: string, _userId: string, _role: string, id: string) => {
  try {
    const exam = await db.exam.findUnique({
      where: { schoolId, id },
      include: {
        examType: true,
        subject: true,
        class: true,
        term: { include: { academicYear: true } },
        creator: { include: { user: { select: { firstName: true, lastName: true } } } },
        results: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });
    if (!exam) return { success: false as const, error: "Exam not found" };
    return { success: true as const, data: exam };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch exam" };
  }
});

// ---------------------------------------------------------------------------
// Get exam types
// ---------------------------------------------------------------------------
export const getExamTypes = withSchoolAuthAction(async (schoolId: string) => {
  try {
    const examTypes = await db.examType.findMany({
      where: { schoolId },
      select: { id: true, name: true, cbseComponent: true },
      orderBy: { name: "asc" },
    });
    return { success: true as const, data: examTypes };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch exam types" };
  }
});

// ---------------------------------------------------------------------------
// Get subjects
// ---------------------------------------------------------------------------
export const getSubjects = withSchoolAuthAction(async (schoolId: string) => {
  try {
    const subjects = await db.subject.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { success: true as const, data: subjects };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch subjects" };
  }
});

// ---------------------------------------------------------------------------
// Get terms (current/future only — for exam creation form)
// ---------------------------------------------------------------------------
export const getTerms = withSchoolAuthAction(async (schoolId: string) => {
  try {
    const terms = await db.term.findMany({
      where: { schoolId, endDate: { gte: new Date() } },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        academicYear: { select: { name: true } },
      },
      orderBy: [{ academicYear: { isCurrent: "desc" } }, { startDate: "asc" }],
    });
    return { success: true as const, data: terms };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch terms" };
  }
});

// ---------------------------------------------------------------------------
// Get ALL terms (no date filter — for auto-generate dialog)
// ---------------------------------------------------------------------------
export const getAllTerms = withSchoolAuthAction(async (schoolId: string) => {
  try {
    const terms = await db.term.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        academicYear: { select: { name: true } },
      },
      orderBy: [{ academicYear: { isCurrent: "desc" } }, { startDate: "desc" }],
    });
    return { success: true as const, data: terms };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch terms" };
  }
});

// ---------------------------------------------------------------------------
// Get classes
// ---------------------------------------------------------------------------
export const getClasses = withSchoolAuthAction(async (schoolId: string) => {
  try {
    const classes = await db.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { success: true as const, data: classes };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch classes" };
  }
});

// ---------------------------------------------------------------------------
// Get exam statistics — single aggregation query, no N+1
// ---------------------------------------------------------------------------
export const getExamStatistics = withSchoolAuthAction(async (schoolId: string) => {
  try {
    const now = new Date();

    const [upcomingExamsCount, completedExamsCount, nextExam, classPerf] = await Promise.all([
      db.exam.count({ where: { schoolId, examDate: { gte: now } } }),
      db.exam.count({ where: { schoolId, examDate: { lt: now } } }),
      db.exam.findFirst({
        where: { schoolId, examDate: { gte: now } },
        select: { subject: { select: { name: true } } },
        orderBy: { examDate: "asc" },
      }),
      db.examResult.groupBy({
        by: ["studentId"],
        where: { schoolId, isAbsent: false, exam: { examDate: { lt: now } } },
        _avg: { marks: true },
        _count: { marks: true },
      }),
    ]);

    let highestPerformingClass: string | null = null;
    let highestPerformingAverage = 0;

    if (classPerf.length > 0) {
      const studentIds = classPerf.map((r) => r.studentId);
      const enrollments = await db.studentEnrollment.findMany({
        where: { studentId: { in: studentIds }, schoolId },
        select: { studentId: true, class: { select: { name: true } } },
        distinct: ["studentId"],
        orderBy: { enrollmentDate: "desc" },
      });

      const studentClassMap = new Map(enrollments.map((e) => [e.studentId, e.class.name]));
      const classTotals = new Map<string, { total: number; count: number }>();

      for (const r of classPerf) {
        const className = studentClassMap.get(r.studentId);
        if (!className || r._avg.marks === null) continue;
        const entry = classTotals.get(className) ?? { total: 0, count: 0 };
        entry.total += r._avg.marks * r._count.marks;
        entry.count += r._count.marks;
        classTotals.set(className, entry);
      }

      classTotals.forEach((stats, className) => {
        const avg = stats.count > 0 ? stats.total / stats.count : 0;
        if (avg > highestPerformingAverage) {
          highestPerformingClass = className;
          highestPerformingAverage = avg;
        }
      });
    }

    return {
      success: true as const,
      data: {
        upcomingExamsCount,
        completedExamsCount,
        nextExam: nextExam?.subject.name ?? null,
        highestPerformingClass,
        highestPerformingAverage: highestPerformingAverage.toFixed(1),
      },
    };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to fetch exam statistics" };
  }
});

// ---------------------------------------------------------------------------
// Create exam
// ---------------------------------------------------------------------------
export const createExam = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: ExamFormValues, creatorId?: string) => {
  await checkPermission(userId, userRole, "EXAM", "CREATE", "You do not have permission to create exams");

  const term = await db.term.findUnique({
    where: { schoolId, id: data.termId },
    select: { startDate: true, endDate: true },
  });

  if (!term) return { success: false, error: "Selected term does not exist" };
  if (data.examDate < term.startDate || data.examDate > term.endDate) {
    return { success: false, error: "Exam date must be within the selected term dates" };
  }

  const exam = await db.exam.create({
    data: {
      title: data.title,
      schoolId,
      examTypeId: data.examTypeId,
      subjectId: data.subjectId,
      classId: data.classId,
      termId: data.termId,
      examDate: data.examDate,
      startTime: data.startTime,
      endTime: data.endTime,
      totalMarks: data.totalMarks,
      passingMarks: data.passingMarks,
      instructions: data.instructions,
      ...(creatorId ? { creatorId } : {}),
    },
    include: {
      subject: true,
      examType: true,
      class: true,
      term: { include: { academicYear: true } },
    },
  });

  await createCalendarEventFromExam(exam as any, creatorId || "system");
  revalidatePath("/admin/assessment/exams");
  return { success: true, data: exam };
});

// ---------------------------------------------------------------------------
// Update exam
// ---------------------------------------------------------------------------
export const updateExam = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: ExamUpdateFormValues) => {
  await checkPermission(userId, userRole, "EXAM", "UPDATE", "You do not have permission to update exams");

  const term = await db.term.findUnique({
    where: { schoolId, id: data.termId },
    select: { startDate: true, endDate: true },
  });

  if (!term) return { success: false, error: "Selected term does not exist" };
  if (data.examDate < term.startDate || data.examDate > term.endDate) {
    return { success: false, error: "Exam date must be within the selected term dates" };
  }

  const exam = await db.exam.update({
    where: { schoolId, id: data.id },
    data: {
      title: data.title,
      examTypeId: data.examTypeId,
      subjectId: data.subjectId,
      classId: data.classId,
      termId: data.termId,
      examDate: data.examDate,
      startTime: data.startTime,
      endTime: data.endTime,
      totalMarks: data.totalMarks,
      passingMarks: data.passingMarks,
      instructions: data.instructions,
    },
    include: {
      subject: true,
      examType: true,
      class: true,
      term: { include: { academicYear: true } },
    },
  });

  await updateCalendarEventFromExam(exam as any);
  revalidatePath("/admin/assessment/exams");
  revalidatePath(`/admin/assessment/exams/${data.id}`);
  return { success: true, data: exam };
});

// ---------------------------------------------------------------------------
// Delete exam
// ---------------------------------------------------------------------------
export const deleteExam = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  await checkPermission(userId, userRole, "EXAM", "DELETE", "You do not have permission to delete exams");

  const hasResults = await db.examResult.findFirst({
    where: { schoolId, examId: id },
    select: { id: true },
  });

  if (hasResults) {
    return { success: false, error: "Cannot delete this exam because it has associated results. Remove the results first." };
  }

  await deleteCalendarEventFromExam(id);
  await db.exam.delete({ where: { schoolId, id } });

  revalidatePath("/admin/assessment/exams");
  return { success: true };
});

// ---------------------------------------------------------------------------
// Save exam result
// ---------------------------------------------------------------------------
export const saveExamResult = withSchoolAuthAction(async (schoolId: string, _userId: string, _role: string, data: ExamResultFormValues) => {
  try {
    const exam = await db.exam.findUnique({
      where: { schoolId, id: data.examId },
      select: { totalMarks: true },
    });

    if (!exam) return { success: false as const, error: "Exam not found" };
    if (data.marks > exam.totalMarks) {
      return { success: false as const, error: `Marks cannot exceed total marks (${exam.totalMarks})` };
    }

    const existingResult = await db.examResult.findFirst({
      where: { schoolId, examId: data.examId, studentId: data.studentId },
      select: { id: true },
    });

    const resultData = {
      marks: data.isAbsent ? 0 : data.marks,
      grade: data.grade,
      remarks: data.remarks,
      isAbsent: data.isAbsent,
    };

    const result = existingResult
      ? await db.examResult.update({ where: { schoolId, id: existingResult.id }, data: resultData })
      : await db.examResult.create({ data: { schoolId, examId: data.examId, studentId: data.studentId!, ...resultData } });

    revalidatePath(`/admin/assessment/exams/${data.examId}`);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to save exam result" };
  }
});

// ---------------------------------------------------------------------------
// Delete exam result
// ---------------------------------------------------------------------------
export const deleteExamResult = withSchoolAuthAction(async (schoolId: string, _userId: string, _role: string, id: string) => {
  try {
    const result = await db.examResult.delete({ where: { schoolId, id } });
    revalidatePath(`/admin/assessment/exams/${result.examId}`);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to delete result" };
  }
});

// ---------------------------------------------------------------------------
// CBSE Auto-Generate Exams
// ---------------------------------------------------------------------------

import type { AutoGenerateExamsInput } from "@/lib/constants/cbse-exam-schedules";
import {
  CBSE_PRIMARY_SCHEDULE,
  CBSE_SECONDARY_SCHEDULE,
  CBSE_SENIOR_SCHEDULE,
} from "@/lib/constants/cbse-exam-schedules";

export async function autoGenerateCBSEExams(input: AutoGenerateExamsInput) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const term = await db.term.findFirst({
      where: { id: input.termId, schoolId },
      select: { startDate: true, endDate: true },
    });
    if (!term) return { success: false, error: `Term not found (id: ${input.termId})` };

    let schedule =
      input.cbseLevel === "CBSE_SENIOR"
        ? CBSE_SENIOR_SCHEDULE
        : input.cbseLevel === "CBSE_SECONDARY"
        ? CBSE_SECONDARY_SCHEDULE
        : CBSE_PRIMARY_SCHEDULE;

    if (input.termNumber === 2 && input.cbseLevel !== "CBSE_SENIOR") {
      schedule = schedule.map((s) =>
        s.cbseComponent === "HALF_YEARLY"
          ? { ...s, examTypeName: "Annual Exam", cbseComponent: "ANNUAL" }
          : s
      );
    }

    const examTypeNames = [...new Set(schedule.map((s) => s.examTypeName))];
    const examTypes = await db.examType.findMany({
      where: { schoolId, name: { in: examTypeNames } },
      select: { id: true, name: true },
    });
    const examTypeMap = new Map(examTypes.map((et) => [et.name, et]));

    const missingTypes = examTypeNames.filter((n) => !examTypeMap.has(n));
    if (missingTypes.length > 0) {
      return {
        success: false,
        error: `Missing exam types: ${missingTypes.join(", ")}. Run "Auto Generate Exam Types" first.`,
      };
    }

    // Pre-fetch all subject-class mappings for selected classes in one query
    const subjectClasses = await db.subjectClass.findMany({
      where: { classId: { in: input.classIds }, schoolId },
      select: { classId: true, subjectId: true },
    });
    const classSubjectMap = new Map<string, string[]>();
    for (const sc of subjectClasses) {
      const arr = classSubjectMap.get(sc.classId) ?? [];
      arr.push(sc.subjectId);
      classSubjectMap.set(sc.classId, arr);
    }

    // Pre-fetch existing exams to avoid per-combination queries
    const examTypeIds = examTypes.map((et) => et.id);
    const existingExams = await db.exam.findMany({
      where: {
        schoolId,
        classId: { in: input.classIds },
        termId: input.termId,
        examTypeId: { in: examTypeIds },
      },
      select: { classId: true, subjectId: true, examTypeId: true },
    });
    const existingSet = new Set(
      existingExams.map((e) => `${e.classId}|${e.subjectId}|${e.examTypeId}`)
    );

    let created = 0;
    let skipped = 0;
    const toCreate: any[] = [];

    for (const classId of input.classIds) {
      const classSubjectIds = input.subjectIds?.length
        ? input.subjectIds
        : classSubjectMap.get(classId) ?? [];

      if (classSubjectIds.length === 0) continue;

      for (const entry of schedule) {
        const examType = examTypeMap.get(entry.examTypeName)!;

        for (const subjectId of classSubjectIds) {
          const key = `${classId}|${subjectId}|${examType.id}`;
          if (existingSet.has(key)) { skipped++; continue; }

          const examDate = new Date(term.startDate);
          examDate.setDate(examDate.getDate() + entry.dayOffset);
          if (examDate > term.endDate) examDate.setTime(term.endDate.getTime());

          const startTime = new Date(examDate);
          startTime.setHours(9, 0, 0, 0);
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + entry.durationMinutes);

          toCreate.push({
            schoolId,
            classId,
            subjectId,
            termId: input.termId,
            examTypeId: examType.id,
            title: entry.examTypeName,
            totalMarks: entry.totalMarks,
            passingMarks: entry.passingMarks,
            examDate,
            startTime,
            endTime,
          });
          existingSet.add(key); // prevent duplicates within this batch
          created++;
        }
      }
    }

    // Bulk insert all at once
    if (toCreate.length > 0) {
      await db.exam.createMany({ data: toCreate });
    }

    revalidatePath("/admin/assessment/exams");
    return {
      success: true,
      created,
      skipped,
      message: `Created ${created} exam${created !== 1 ? "s" : ""}${skipped > 0 ? `, skipped ${skipped} existing` : ""}`,
    };
  } catch (error) {
    console.error("Error auto-generating CBSE exams:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to auto-generate exams" };
  }
}
