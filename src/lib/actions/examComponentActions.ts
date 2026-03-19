"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSchoolAccess } from "@/lib/auth/tenant";

export interface ExamComponentInput {
  name: string;
  shortName: string;
  maxMarks: number;
  order: number;
}

export interface ComponentMarkEntry {
  studentId: string;
  marks: number;
  isAbsent: boolean;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get exam components for an exam
 */
export async function getExamComponents(examId: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const components = await db.examComponent.findMany({
      where: { examId, schoolId },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { marks: true } },
      },
    });

    return { success: true, data: components };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch components" };
  }
}

/**
 * Create exam components for an exam (replaces existing)
 */
export async function saveExamComponents(examId: string, components: ExamComponentInput[]): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const exam = await db.exam.findFirst({ where: { id: examId, schoolId } });
    if (!exam) return { success: false, error: "Exam not found" };

    // Delete existing components (cascades to marks)
    await db.examComponent.deleteMany({ where: { examId, schoolId } });

    // Create new components
    const created = await db.examComponent.createMany({
      data: components.map((c) => ({
        examId,
        schoolId,
        name: c.name,
        shortName: c.shortName,
        maxMarks: c.maxMarks,
        order: c.order,
      })),
    });

    revalidatePath(`/admin/assessment/exams/${examId}`);
    return { success: true, data: created };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save components" };
  }
}

/**
 * Save component marks for a batch of students
 */
export async function saveComponentMarks(
  componentId: string,
  entries: ComponentMarkEntry[],
): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const component = await db.examComponent.findFirst({ where: { id: componentId, schoolId } });
    if (!component) return { success: false, error: "Component not found" };

    // Upsert marks for each student
    await Promise.all(
      entries.map((entry) =>
        db.examComponentMark.upsert({
          where: { componentId_studentId: { componentId, studentId: entry.studentId } },
          create: {
            componentId,
            studentId: entry.studentId,
            marks: entry.marks,
            isAbsent: entry.isAbsent,
            schoolId,
          },
          update: {
            marks: entry.marks,
            isAbsent: entry.isAbsent,
          },
        }),
      ),
    );

    revalidatePath("/admin/assessment/marks-entry");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save component marks" };
  }
}

/**
 * Get component marks for all students in an exam
 */
export async function getComponentMarksForExam(examId: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const components = await db.examComponent.findMany({
      where: { examId, schoolId },
      orderBy: { order: "asc" },
      include: {
        marks: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return { success: true, data: components };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch component marks" };
  }
}

/**
 * Auto-create CBSE default components for an exam based on exam type's cbseComponent
 */
export async function autoCreateCBSEComponents(examId: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: { examType: true },
    });
    if (!exam) return { success: false, error: "Exam not found" };

    const cbseComp = (exam.examType as any).cbseComponent;
    if (!cbseComp) return { success: false, error: "Exam type has no CBSE component mapping" };

    // Check if components already exist
    const existing = await db.examComponent.count({ where: { examId, schoolId } });
    if (existing > 0) return { success: false, error: "Components already exist for this exam" };

    // Create a single component matching the CBSE column
    await db.examComponent.create({
      data: {
        examId,
        schoolId,
        name: cbseComp,
        shortName: cbseComp,
        maxMarks: exam.totalMarks,
        order: 0,
      },
    });

    revalidatePath(`/admin/assessment/exams/${examId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to auto-create components" };
  }
}
