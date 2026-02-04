"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  markSubModuleCompleteSchema,
  getModuleProgressSchema,
  getSyllabusProgressSchema,
  getBatchModuleProgressSchema,
} from "@/lib/schemaValidation/progressSchemaValidations";
import {
  requireProgressTrackingAccess,
  requireViewAccess,
  verifyTeacherOwnership,
  formatAuthError,
} from "@/lib/utils/syllabus-authorization";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Response type
interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types for progress tracking
export interface MarkSubModuleCompleteInput {
  subModuleId: string;
  teacherId: string;
  completed: boolean;
}

export interface ModuleProgress {
  moduleId: string;
  totalSubModules: number;
  completedSubModules: number;
  completionPercentage: number;
}

export interface SyllabusProgress {
  syllabusId: string;
  totalModules: number;
  completedModules: number;
  completionPercentage: number;
  modules: ModuleProgress[];
}

/**
 * Mark a sub-module as completed or uncompleted by a teacher
 * Requirements: 10.1, 10.5
 * Authorization: Teacher only (can only mark their own progress)
 */
export async function markSubModuleComplete(
  input: MarkSubModuleCompleteInput
): Promise<ActionResponse> {
  try {
    // Validate input with Zod schema
    const validationResult = markSubModuleCompleteSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => e.message)
        .join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const { subModuleId, teacherId, completed } = validationResult.data;

    // Check authorization - only teachers can mark progress
    // and they can only mark their own progress
    const authResult = await verifyTeacherOwnership(teacherId);
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Get school context
    const context = await requireSchoolAccess();
    const schoolId = context.schoolId;
    
    if (!schoolId) {
      return { success: false, error: "School context required" };
    }

    // Check if sub-module exists
    const subModule = await db.subModule.findUnique({
      where: { id: subModuleId },
    });

    if (!subModule) {
      return {
        success: false,
        error: "Sub-module not found",
      };
    }

    // Upsert the progress record
    const progress = await db.subModuleProgress.upsert({
      where: {
        subModuleId_teacherId: {
          subModuleId,
          teacherId,
        },
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        schoolId,
        subModuleId,
        teacherId,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    revalidatePath("/teacher");
    revalidatePath("/admin/academic/syllabus");

    return {
      success: true,
      data: progress,
    };
  } catch (error) {
    console.error("Error marking sub-module complete:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update sub-module completion status",
    };
  }
}

/**
 * Get progress for a specific module including completion percentage
 * Requirements: 10.2, 10.3
 * Authorization: All authenticated users (admin, teacher, student)
 */
export async function getModuleProgress(
  moduleId: string,
  teacherId: string
): Promise<ActionResponse<ModuleProgress>> {
  try {
    // Check authorization - all authenticated users can view progress
    const authResult = await requireViewAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = getModuleProgressSchema.safeParse({
      moduleId,
      teacherId,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => e.message)
        .join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Check if module exists
    const courseModule = await db.module.findUnique({
      where: { id: validatedData.moduleId },
      include: {
        subModules: {
          include: {
            progress: {
              where: {
                teacherId: validatedData.teacherId,
              },
            },
          },
        },
      },
    });

    if (!courseModule) {
      return {
        success: false,
        error: "Module not found",
      };
    }

    // Calculate progress
    const totalSubModules = courseModule.subModules.length;
    const completedSubModules = courseModule.subModules.filter(
      (subModule) =>
        subModule.progress.length > 0 && subModule.progress[0].completed
    ).length;

    const completionPercentage =
      totalSubModules > 0
        ? Math.round((completedSubModules / totalSubModules) * 100)
        : 0;

    const progressData: ModuleProgress = {
      moduleId: validatedData.moduleId,
      totalSubModules,
      completedSubModules,
      completionPercentage,
    };

    return {
      success: true,
      data: progressData,
    };
  } catch (error) {
    console.error("Error getting module progress:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get module progress",
    };
  }
}

/**
 * Get progress for an entire syllabus with aggregated module progress
 * Requirements: 10.4
 * Authorization: All authenticated users (admin, teacher, student)
 */
export async function getSyllabusProgress(
  syllabusId: string,
  teacherId: string
): Promise<ActionResponse<SyllabusProgress>> {
  try {
    // Check authorization - all authenticated users can view progress
    const authResult = await requireViewAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = getSyllabusProgressSchema.safeParse({
      syllabusId,
      teacherId,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => e.message)
        .join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Check if syllabus exists and fetch all modules with sub-modules and progress
    const syllabus = await db.syllabus.findUnique({
      where: { id: validatedData.syllabusId },
      include: {
        modules: {
          include: {
            subModules: {
              include: {
                progress: {
                  where: {
                    teacherId: validatedData.teacherId,
                  },
                },
              },
            },
          },
          orderBy: {
            chapterNumber: "asc",
          },
        },
      },
    });

    if (!syllabus) {
      return {
        success: false,
        error: "Syllabus not found",
      };
    }

    // Calculate progress for each module
    const moduleProgressList: ModuleProgress[] = syllabus.modules.map(
      (courseModule) => {
        const totalSubModules = courseModule.subModules.length;
        const completedSubModules = courseModule.subModules.filter(
          (subModule) =>
            subModule.progress.length > 0 && subModule.progress[0].completed
        ).length;

        const completionPercentage =
          totalSubModules > 0
            ? Math.round((completedSubModules / totalSubModules) * 100)
            : 0;

        return {
          moduleId: courseModule.id,
          totalSubModules,
          completedSubModules,
          completionPercentage,
        };
      }
    );

    // Calculate overall syllabus progress
    const totalModules = syllabus.modules.length;
    const sumOfModulePercentages = moduleProgressList.reduce(
      (sum, module) => sum + module.completionPercentage,
      0
    );
    const completionPercentage =
      totalModules > 0
        ? Math.round(sumOfModulePercentages / totalModules)
        : 0;

    // Count completed modules (100% completion)
    const completedModules = moduleProgressList.filter(
      (module) => module.completionPercentage === 100
    ).length;

    const progressData: SyllabusProgress = {
      syllabusId: validatedData.syllabusId,
      totalModules,
      completedModules,
      completionPercentage,
      modules: moduleProgressList,
    };

    return {
      success: true,
      data: progressData,
    };
  } catch (error) {
    console.error("Error getting syllabus progress:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get syllabus progress",
    };
  }
}

/**
 * Utility function to calculate completion percentage
 * Requirements: 10.3, 10.4
 */
function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

/**
 * Utility function to check if a module is fully completed
 * Requirements: 10.2
 */
function isModuleCompleted(moduleProgress: ModuleProgress): boolean {
  return (
    moduleProgress.totalSubModules > 0 &&
    moduleProgress.completedSubModules === moduleProgress.totalSubModules
  );
}

/**
 * Get progress for multiple modules at once (batch operation)
 * Useful for displaying progress in lists
 * Authorization: All authenticated users (admin, teacher, student)
 */
export async function getBatchModuleProgress(
  moduleIds: string[],
  teacherId: string
): Promise<ActionResponse<ModuleProgress[]>> {
  try {
    // Check authorization - all authenticated users can view progress
    const authResult = await requireViewAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = getBatchModuleProgressSchema.safeParse({
      moduleIds,
      teacherId,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => e.message)
        .join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Fetch all modules with their sub-modules and progress
    const modules = await db.module.findMany({
      where: {
        id: {
          in: validatedData.moduleIds,
        },
      },
      include: {
        subModules: {
          include: {
            progress: {
              where: {
                teacherId: validatedData.teacherId,
              },
            },
          },
        },
      },
    });

    // Calculate progress for each module
    const progressList: ModuleProgress[] = modules.map((courseModule) => {
      const totalSubModules = courseModule.subModules.length;
      const completedSubModules = courseModule.subModules.filter(
        (subModule) =>
          subModule.progress.length > 0 && subModule.progress[0].completed
      ).length;

      const completionPercentage =
        totalSubModules > 0
          ? Math.round((completedSubModules / totalSubModules) * 100)
          : 0;

      return {
        moduleId: courseModule.id,
        totalSubModules,
        completedSubModules,
        completionPercentage,
      };
    });

    return {
      success: true,
      data: progressList,
    };
  } catch (error) {
    console.error("Error getting batch module progress:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get batch module progress",
    };
  }
}
