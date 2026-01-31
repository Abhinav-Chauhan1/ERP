"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import {
  moduleSchema,
  moduleUpdateSchema,
  reorderModulesSchema,
  type ModuleFormValues,
  type ModuleUpdateFormValues,
  type ReorderModulesFormValues,
} from "@/lib/schemaValidation/moduleSchemaValidations";
import {
  validateUniqueChapterNumbers,
  validateOrderSequence,
  type ModuleReorderItem,
} from "@/lib/utils/reordering";
import {
  requireModifyAccess,
  requireViewAccess,
  formatAuthError,
} from "@/lib/utils/syllabus-authorization";
import { invalidateModuleCache, invalidateSyllabusCache } from "@/lib/utils/cache-invalidation";

// Types for module operations (exported for use in components)
export type CreateModuleInput = ModuleFormValues;
export type UpdateModuleInput = ModuleUpdateFormValues;
export type ReorderModulesInput = ReorderModulesFormValues;

// Response type
interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new module with validation
 * Requirements: 1.1, 1.2
 * Authorization: Admin only
 */
export async function createModule(
  input: CreateModuleInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can create modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();

    // Validate input with Zod schema
    const validationResult = moduleSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Check if syllabus exists
    const syllabus = await db.syllabus.findUnique({
      where: { id: validatedData.syllabusId },
    });

    if (!syllabus) {
      return {
        success: false,
        error: "Syllabus not found",
      };
    }

    // Check for duplicate chapter number within the syllabus (Requirement 1.2)
    const existingModule = await db.module.findUnique({
      where: {
        syllabusId_chapterNumber: {
          syllabusId: validatedData.syllabusId,
          chapterNumber: validatedData.chapterNumber,
        },
      },
    });

    if (existingModule) {
      return {
        success: false,
        error: `Chapter number ${validatedData.chapterNumber} already exists in this syllabus`,
      };
    }

    // Create the module
    const newModule = await db.module.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        chapterNumber: validatedData.chapterNumber,
        order: validatedData.order,
        syllabusId: validatedData.syllabusId,
        term: validatedData.term,
        weightage: validatedData.weightage,
        schoolId: schoolId || "",
      },
      include: {
        subModules: true,
        documents: true,

      },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache
    await invalidateModuleCache(newModule.id, validatedData.syllabusId);

    return {
      success: true,
      data: newModule,
    };
  } catch (error) {
    console.error("Error creating module:", error);

    // Handle Prisma unique constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: `Chapter number already exists in this syllabus`,
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create module",
    };
  }
}

/**
 * Update an existing module while preserving relationships
 * Requirements: 1.5
 * Authorization: Admin only
 */
export async function updateModule(
  input: UpdateModuleInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can update modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = moduleUpdateSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Check if module exists
    const existingModule = await db.module.findUnique({
      where: { id: validatedData.id },
      include: {
        subModules: true,
        documents: true,
      },
    });

    if (!existingModule) {
      return {
        success: false,
        error: "Module not found",
      };
    }

    // Check for duplicate chapter number (only if chapter number is changing)
    if (existingModule.chapterNumber !== validatedData.chapterNumber) {
      const duplicateModule = await db.module.findUnique({
        where: {
          syllabusId_chapterNumber: {
            syllabusId: validatedData.syllabusId,
            chapterNumber: validatedData.chapterNumber,
          },
        },
      });

      if (duplicateModule && duplicateModule.id !== validatedData.id) {
        return {
          success: false,
          error: `Chapter number ${validatedData.chapterNumber} already exists in this syllabus`,
        };
      }
    }

    // Update the module (relationships are preserved automatically)
    const updatedModule = await db.module.update({
      where: { id: validatedData.id },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        chapterNumber: validatedData.chapterNumber,
        order: validatedData.order,
        syllabusId: validatedData.syllabusId,
        term: validatedData.term,
        weightage: validatedData.weightage,
      },
      include: {
        subModules: true,
        documents: true,
      },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache
    await invalidateModuleCache(updatedModule.id, validatedData.syllabusId);

    return {
      success: true,
      data: updatedModule,
    };
  } catch (error) {
    console.error("Error updating module:", error);

    // Handle Prisma unique constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: `Chapter number already exists in this syllabus`,
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update module",
    };
  }
}

/**
 * Delete a module with cascade delete of sub-modules and documents
 * Requirements: 2.3, 3.5
 * Authorization: Admin only
 */
export async function deleteModule(id: string): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can delete modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    if (!id) {
      return {
        success: false,
        error: "Module ID is required",
      };
    }

    // Check if module exists
    const moduleToDelete = await db.module.findUnique({
      where: { id },
      include: {
        subModules: true,
        documents: true,
      },
    });

    if (!moduleToDelete) {
      return {
        success: false,
        error: "Module not found",
      };
    }

    // Delete the module (cascade delete will handle sub-modules and documents)
    await db.module.delete({
      where: { id },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache
    await invalidateModuleCache(id, moduleToDelete.syllabusId);

    return {
      success: true,
      data: { deletedCount: 1 + moduleToDelete.subModules.length + moduleToDelete.documents.length },
    };
  } catch (error) {
    console.error("Error deleting module:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete module",
    };
  }
}

/**
 * Get all modules for a syllabus ordered by chapter number
 * Requirements: 1.4, 5.1, 6.1
 * Authorization: All authenticated users (admin, teacher, student)
 */
export async function getModulesBySyllabus(
  syllabusId: string
): Promise<ActionResponse> {
  try {
    // Check authorization - all authenticated users can view
    const authResult = await requireViewAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    if (!syllabusId) {
      return {
        success: false,
        error: "Syllabus ID is required",
      };
    }

    // Fetch modules ordered by chapter number
    const modules = await db.module.findMany({
      where: { syllabusId },
      include: {
        subModules: {
          orderBy: { order: "asc" },
          include: {
            documents: {
              orderBy: { order: "asc" },
            },
            progress: true,
          },
        },
        documents: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { chapterNumber: "asc" },
    });

    return {
      success: true,
      data: modules,
    };
  } catch (error) {
    console.error("Error fetching modules:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch modules",
    };
  }
}

/**
 * Reorder modules for drag-and-drop functionality
 * Uses reordering utilities for validation and transaction support
 * Requirements: 8.1
 * Authorization: Admin only
 */
export async function reorderModules(
  input: ReorderModulesInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can reorder modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = reorderModulesSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Validate that all modules belong to the syllabus
    const moduleIds = validatedData.moduleOrders.map((m) => m.id);
    const modules = await db.module.findMany({
      where: {
        id: { in: moduleIds },
        syllabusId: validatedData.syllabusId,
      },
    });

    if (modules.length !== moduleIds.length) {
      return {
        success: false,
        error: "Some modules do not belong to this syllabus",
      };
    }

    // Convert to ModuleReorderItem format for validation
    const moduleReorderItems: ModuleReorderItem[] = validatedData.moduleOrders.map(
      (m) => ({
        id: m.id,
        order: m.order,
        chapterNumber: m.chapterNumber,
      })
    );

    // Validate unique chapter numbers using utility function
    if (!validateUniqueChapterNumbers(moduleReorderItems)) {
      return {
        success: false,
        error: "Duplicate chapter numbers detected",
      };
    }

    // Validate order sequence using utility function
    if (!validateOrderSequence(moduleReorderItems)) {
      return {
        success: false,
        error: "Invalid order sequence. Orders must be sequential starting from 1",
      };
    }

    // Update all modules in a transaction for atomic updates
    await db.$transaction(
      validatedData.moduleOrders.map((moduleOrder) =>
        db.module.update({
          where: { id: moduleOrder.id },
          data: {
            order: moduleOrder.order,
            chapterNumber: moduleOrder.chapterNumber,
          },
        })
      )
    );

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache
    await invalidateSyllabusCache(validatedData.syllabusId);

    return {
      success: true,
      data: { updatedCount: validatedData.moduleOrders.length },
    };
  } catch (error) {
    console.error("Error reordering modules:", error);

    // Handle Prisma unique constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "Duplicate chapter numbers detected",
        };
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reorder modules",
    };
  }
}
