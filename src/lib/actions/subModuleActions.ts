"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getRequiredSchoolId } from '@/lib/utils/school-context-helper';
import {
  subModuleSchema,
  subModuleUpdateSchema,
  moveSubModuleSchema,
  reorderSubModulesSchema,
  type SubModuleFormValues,
  type SubModuleUpdateFormValues,
  type MoveSubModuleFormValues,
  type ReorderSubModulesFormValues,
} from "@/lib/schemaValidation/subModuleSchemaValidations";
import {
  validateOrderSequence,
  type ReorderItem,
} from "@/lib/utils/reordering";
import {
  requireModifyAccess,
  requireViewAccess,
  formatAuthError,
} from "@/lib/utils/syllabus-authorization";
import { invalidateSubModuleCache } from "@/lib/utils/cache-invalidation";

// Types for sub-module operations (exported for use in components)
export type CreateSubModuleInput = SubModuleFormValues;
export type UpdateSubModuleInput = SubModuleUpdateFormValues;
export type MoveSubModuleInput = MoveSubModuleFormValues;
export type ReorderSubModulesInput = ReorderSubModulesFormValues;

// Response type
interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new sub-module with validation
 * Requirements: 2.1
 * Authorization: Admin only
 */
export async function createSubModule(
  input: CreateSubModuleInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can create sub-modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = subModuleSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Check if module exists
    const parentModule = await db.module.findUnique({
      where: { id: validatedData.moduleId },
    });

    if (!parentModule) {
      return {
        success: false,
        error: "Module not found",
      };
    }

    // Get school context
    const schoolId = await getRequiredSchoolId();

    // Create the sub-module
    const subModule = await db.subModule.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        order: validatedData.order,
        moduleId: validatedData.moduleId,
        schoolId, // Add required schoolId
      },
      include: {
        documents: true,
        progress: true,
      },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache
    await invalidateSubModuleCache(subModule.id, validatedData.moduleId);

    return {
      success: true,
      data: subModule,
    };
  } catch (error) {
    console.error("Error creating sub-module:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create sub-module",
    };
  }
}

/**
 * Update an existing sub-module
 * Requirements: 2.1
 * Authorization: Admin only
 */
export async function updateSubModule(
  input: UpdateSubModuleInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can update sub-modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = subModuleUpdateSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Check if sub-module exists
    const existingSubModule = await db.subModule.findUnique({
      where: { id: validatedData.id },
      include: {
        documents: true,
        progress: true,
      },
    });

    if (!existingSubModule) {
      return {
        success: false,
        error: "Sub-module not found",
      };
    }

    // Check if module exists (if moduleId is changing)
    if (existingSubModule.moduleId !== validatedData.moduleId) {
      const parentModule = await db.module.findUnique({
        where: { id: validatedData.moduleId },
      });

      if (!parentModule) {
        return {
          success: false,
          error: "Module not found",
        };
      }
    }

    // Update the sub-module
    const updatedSubModule = await db.subModule.update({
      where: { id: validatedData.id },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        order: validatedData.order,
        moduleId: validatedData.moduleId,
      },
      include: {
        documents: true,
        progress: true,
      },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache
    await invalidateSubModuleCache(updatedSubModule.id, validatedData.moduleId);

    return {
      success: true,
      data: updatedSubModule,
    };
  } catch (error) {
    console.error("Error updating sub-module:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update sub-module",
    };
  }
}

/**
 * Delete a sub-module with cascade delete of documents
 * Requirements: 2.3
 * Authorization: Admin only
 */
export async function deleteSubModule(id: string): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can delete sub-modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    if (!id) {
      return {
        success: false,
        error: "Sub-module ID is required",
      };
    }

    // Check if sub-module exists
    const subModule = await db.subModule.findUnique({
      where: { id },
      include: {
        documents: true,
        progress: true,
      },
    });

    if (!subModule) {
      return {
        success: false,
        error: "Sub-module not found",
      };
    }

    // Delete the sub-module (cascade delete will handle documents and progress)
    await db.subModule.delete({
      where: { id },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache
    await invalidateSubModuleCache(id, subModule.moduleId);

    return {
      success: true,
      data: {
        deletedCount: 1 + subModule.documents.length + subModule.progress.length
      },
    };
  } catch (error) {
    console.error("Error deleting sub-module:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete sub-module",
    };
  }
}

/**
 * Move a sub-module to a different module
 * Requirements: 2.4, 8.3
 * Authorization: Admin only
 */
export async function moveSubModule(
  input: MoveSubModuleInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can move sub-modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = moveSubModuleSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Check if sub-module exists
    const subModule = await db.subModule.findUnique({
      where: { id: validatedData.subModuleId },
    });

    if (!subModule) {
      return {
        success: false,
        error: "Sub-module not found",
      };
    }

    // Check if target module exists
    const targetModule = await db.module.findUnique({
      where: { id: validatedData.targetModuleId },
    });

    if (!targetModule) {
      return {
        success: false,
        error: "Target module not found",
      };
    }

    // Update the sub-module's parent and order
    const updatedSubModule = await db.subModule.update({
      where: { id: validatedData.subModuleId },
      data: {
        moduleId: validatedData.targetModuleId,
        order: validatedData.order,
      },
      include: {
        documents: true,
        progress: true,
      },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache for both old and new modules
    await invalidateSubModuleCache(updatedSubModule.id, subModule.moduleId);
    await invalidateSubModuleCache(updatedSubModule.id, validatedData.targetModuleId);

    return {
      success: true,
      data: updatedSubModule,
    };
  } catch (error) {
    console.error("Error moving sub-module:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move sub-module",
    };
  }
}

/**
 * Reorder sub-modules within a module for drag-and-drop functionality
 * Uses reordering utilities for validation and transaction support
 * Requirements: 2.5, 8.2
 * Authorization: Admin only
 */
export async function reorderSubModules(
  input: ReorderSubModulesInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can reorder sub-modules
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = reorderSubModulesSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const validatedData = validationResult.data;

    // Validate that all sub-modules belong to the module
    const subModuleIds = validatedData.subModuleOrders.map((sm) => sm.id);
    const subModules = await db.subModule.findMany({
      where: {
        id: { in: subModuleIds },
        moduleId: validatedData.moduleId,
      },
    });

    if (subModules.length !== subModuleIds.length) {
      return {
        success: false,
        error: "Some sub-modules do not belong to this module",
      };
    }

    // Convert to ReorderItem format for validation
    const reorderItems: ReorderItem[] = validatedData.subModuleOrders.map(
      (sm) => ({
        id: sm.id,
        order: sm.order,
      })
    );

    // Validate order sequence using utility function
    if (!validateOrderSequence(reorderItems)) {
      return {
        success: false,
        error: "Invalid order sequence. Orders must be sequential starting from 1",
      };
    }

    // Update all sub-modules in a transaction for atomic updates
    await db.$transaction(
      validatedData.subModuleOrders.map((subModuleOrder) =>
        db.subModule.update({
          where: { id: subModuleOrder.id },
          data: {
            order: subModuleOrder.order,
          },
        })
      )
    );

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    // Invalidate cache
    await invalidateSubModuleCache(undefined, validatedData.moduleId);

    return {
      success: true,
      data: { updatedCount: validatedData.subModuleOrders.length },
    };
  } catch (error) {
    console.error("Error reordering sub-modules:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reorder sub-modules",
    };
  }
}

/**
 * Get all sub-modules for a module ordered by order field
 * Requirements: 2.2, 2.5, 5.2, 6.2
 * Authorization: All authenticated users (admin, teacher, student)
 */
export async function getSubModulesByModule(
  moduleId: string
): Promise<ActionResponse> {
  try {
    // Check authorization - all authenticated users can view
    const authResult = await requireViewAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    if (!moduleId) {
      return {
        success: false,
        error: "Module ID is required",
      };
    }

    // Fetch sub-modules ordered by order field
    const subModules = await db.subModule.findMany({
      where: { moduleId },
      include: {
        documents: {
          orderBy: { order: "asc" },
        },
        progress: true,
      },
      orderBy: { order: "asc" },
    });

    return {
      success: true,
      data: subModules,
    };
  } catch (error) {
    console.error("Error fetching sub-modules:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch sub-modules",
    };
  }
}
