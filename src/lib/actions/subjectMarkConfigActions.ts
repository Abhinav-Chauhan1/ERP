"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getRequiredSchoolId } from '@/lib/utils/school-context-helper';

export interface SubjectMarkConfigInput {
  examId: string;
  subjectId: string;
  theoryMaxMarks?: number;
  practicalMaxMarks?: number;
  internalMaxMarks?: number;
  totalMarks: number;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all subject mark configurations for an exam
 */
export async function getSubjectMarkConfigs(examId: string): Promise<ActionResult> {
  try {
    const configs = await db.subjectMarkConfig.findMany({
      where: {
        examId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
          },
        },
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    });

    return { success: true, data: configs };
  } catch (error) {
    console.error("Error fetching subject mark configs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subject mark configurations",
    };
  }
}

/**
 * Get a single subject mark configuration
 */
export async function getSubjectMarkConfig(id: string): Promise<ActionResult> {
  try {
    const config = await db.subjectMarkConfig.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
          },
        },
      },
    });

    if (!config) {
      return { success: false, error: "Configuration not found" };
    }

    return { success: true, data: config };
  } catch (error) {
    console.error("Error fetching subject mark config:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subject mark configuration",
    };
  }
}

/**
 * Create or update subject mark configuration
 */
export async function saveSubjectMarkConfig(input: SubjectMarkConfigInput): Promise<ActionResult> {
  try {
    // Validate that component sum equals total marks
    const componentSum = 
      (input.theoryMaxMarks || 0) + 
      (input.practicalMaxMarks || 0) + 
      (input.internalMaxMarks || 0);

    if (componentSum !== input.totalMarks) {
      return {
        success: false,
        error: `Component sum (${componentSum}) must equal total marks (${input.totalMarks})`,
      };
    }

    // Validate that at least one component is specified
    if (!input.theoryMaxMarks && !input.practicalMaxMarks && !input.internalMaxMarks) {
      return {
        success: false,
        error: "At least one mark component (theory, practical, or internal) must be specified",
      };
    }

    // Check if configuration already exists
    const existing = await db.subjectMarkConfig.findUnique({
      where: {
        examId_subjectId: {
          examId: input.examId,
          subjectId: input.subjectId,
        },
      },
    });

    let config;
    if (existing) {
      // Update existing configuration
      config = await db.subjectMarkConfig.update({
        where: { id: existing.id },
        data: {
          theoryMaxMarks: input.theoryMaxMarks || null,
          practicalMaxMarks: input.practicalMaxMarks || null,
          internalMaxMarks: input.internalMaxMarks || null,
          totalMarks: input.totalMarks,
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    } else {
      // Get school context
      const schoolId = await getRequiredSchoolId();

      // Create new configuration
      config = await db.subjectMarkConfig.create({
        data: {
          examId: input.examId,
          subjectId: input.subjectId,
          theoryMaxMarks: input.theoryMaxMarks || null,
          practicalMaxMarks: input.practicalMaxMarks || null,
          internalMaxMarks: input.internalMaxMarks || null,
          totalMarks: input.totalMarks,
          schoolId, // Add required schoolId
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    }

    revalidatePath("/admin/assessment/subject-mark-config");
    revalidatePath(`/admin/assessment/subject-mark-config/${input.examId}`);

    return { success: true, data: config };
  } catch (error) {
    console.error("Error saving subject mark config:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save subject mark configuration",
    };
  }
}

/**
 * Delete subject mark configuration
 */
export async function deleteSubjectMarkConfig(id: string): Promise<ActionResult> {
  try {
    await db.subjectMarkConfig.delete({
      where: { id },
    });

    revalidatePath("/admin/assessment/subject-mark-config");

    return { success: true };
  } catch (error) {
    console.error("Error deleting subject mark config:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete subject mark configuration",
    };
  }
}

/**
 * Get all exams for dropdown selection
 */
export async function getExamsForConfig(): Promise<ActionResult> {
  try {
    const exams = await db.exam.findMany({
      select: {
        id: true,
        title: true,
        totalMarks: true,
        examDate: true,
        subject: {
          select: {
            name: true,
          },
        },
        examType: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            name: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        examDate: 'desc',
      },
    });

    return { success: true, data: exams };
  } catch (error) {
    console.error("Error fetching exams:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exams",
    };
  }
}

/**
 * Get subjects for an exam (based on exam's subject or all subjects)
 */
export async function getSubjectsForExam(examId: string): Promise<ActionResult> {
  try {
    const exam = await db.exam.findUnique({
      where: { id: examId },
      select: {
        subjectId: true,
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // For now, return all subjects
    // In a real scenario, you might want to filter based on class/section
    const subjects = await db.subject.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { success: true, data: subjects };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subjects",
    };
  }
}
