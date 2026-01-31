"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { PermissionAction } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import {
  feeStructureService,
  type CreateFeeStructureInput,
  type UpdateFeeStructureInput,
  type FeeStructureFilters,
  type DuplicateFeeStructureInput,
  type CreateFromTemplateInput,
} from "@/lib/services/fee-structure-service";
import { feeTypeService } from "@/lib/services/fee-type-service";
import {
  feeStructureAnalyticsService,
  type AnalyticsFilters,
} from "@/lib/services/fee-structure-analytics-service";
import { STANDARD_FEE_TYPES } from "@/lib/constants/fee-standards";

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

// Get all fee structures with related data
export const getFeeStructures = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, filters?: FeeStructureFilters) => {
  try {
    const feeStructures = await feeStructureService.getFeeStructures(filters ? { ...filters, schoolId } : { schoolId });
    return { success: true, data: feeStructures };
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return { success: false, error: "Failed to fetch fee structures" };
  }
});

// Get single fee structure by ID
export const getFeeStructureById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const feeStructure = await feeStructureService.getFeeStructureById(id, schoolId);
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch fee structure" };
  }
});

// Get fee structures for a specific class
export const getFeeStructuresForClass = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, classId: string, academicYearId?: string) => {
  try {
    const feeStructures = await feeStructureService.getFeeStructuresForClass(classId, academicYearId);
    return { success: true, data: feeStructures };
  } catch (error) {
    console.error("Error fetching fee structures for class:", error);
    return { success: false, error: "Failed to fetch fee structures for class" };
  }
});


// Create new fee structure
export const createFeeStructure = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: CreateFeeStructureInput) => {
  try {
    // Permission check: require FEE:CREATE
    await checkPermission('FEE', 'CREATE', 'You do not have permission to create fee structures');

    const feeStructure = await feeStructureService.createFeeStructure(data, schoolId);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error creating fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create fee structure" };
  }
});

// Update existing fee structure
export const updateFeeStructure = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, data: UpdateFeeStructureInput) => {
  try {
    // Permission check: require FEE:UPDATE
    await checkPermission('FEE', 'UPDATE', 'You do not have permission to update fee structures');

    const feeStructure = await feeStructureService.updateFeeStructure(id, data, schoolId);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update fee structure" };
  }
});

// Delete fee structure
export const deleteFeeStructure = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    // Permission check: require FEE:DELETE
    await checkPermission('FEE', 'DELETE', 'You do not have permission to delete fee structures');

    await feeStructureService.deleteFeeStructure(id, schoolId);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete fee structure" };
  }
});

// Duplicate fee structure
export const duplicateFeeStructure = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, newData?: DuplicateFeeStructureInput) => {
  try {
    const duplicate = await feeStructureService.duplicateFeeStructure(id, newData);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: duplicate };
  } catch (error) {
    console.error("Error duplicating fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to duplicate fee structure" };
  }
});

// Get fee structure templates
export const getFeeStructureTemplates = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,) => {
  try {
    const templates = await feeStructureService.getTemplates();
    return { success: true, data: templates };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: "Failed to fetch templates" };
  }
});

// Create fee structure from template
export const createFeeStructureFromTemplate = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, templateId: string, data: CreateFromTemplateInput) => {
  try {
    const feeStructure = await feeStructureService.createFromTemplate(templateId, data);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error creating fee structure from template:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create from template" };
  }
});

// Get all fee types
export const getFeeTypes = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, includeClassAmounts: boolean = false) => {
  try {
    const feeTypes = await feeTypeService.getFeeTypes(includeClassAmounts);
    return { success: true, data: feeTypes };
  } catch (error) {
    console.error("Error fetching fee types:", error);
    return { success: false, error: "Failed to fetch fee types" };
  }
});

// Get single fee type by ID
export const getFeeTypeById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, includeClassAmounts: boolean = true) => {
  try {
    const feeType = await feeTypeService.getFeeTypeById(id, includeClassAmounts);
    return { success: true, data: feeType };
  } catch (error) {
    console.error("Error fetching fee type:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch fee type" };
  }
});

// Get fee types with class amount info
export const getFeeTypesWithClassAmountInfo = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,) => {
  try {
    const feeTypes = await feeTypeService.getFeeTypesWithClassAmountInfo();
    return { success: true, data: feeTypes };
  } catch (error) {
    console.error("Error fetching fee types with class amount info:", error);
    return { success: false, error: "Failed to fetch fee types" };
  }
});

// Create new fee type
export const createFeeType = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: any) => {
  try {
    const feeType = await feeTypeService.createFeeType({
      name: data.name,
      description: data.description || null,
      amount: parseFloat(data.amount),
      frequency: data.frequency,
      isOptional: data.isOptional ?? false,
      classAmounts: data.classAmounts || [],
    });

    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeType };
  } catch (error) {
    console.error("Error creating fee type:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create fee type" };
  }
});

// Update fee type
export const updateFeeType = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, data: any) => {
  try {
    const feeType = await feeTypeService.updateFeeType(id, {
      name: data.name,
      description: data.description || null,
      amount: data.amount !== undefined ? parseFloat(data.amount) : undefined,
      frequency: data.frequency,
      isOptional: data.isOptional,
      classAmounts: data.classAmounts,
    });

    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeType };
  } catch (error) {
    console.error("Error updating fee type:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update fee type" };
  }
});

// Delete fee type
export const deleteFeeType = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    await feeTypeService.deleteFeeType(id);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fee type:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete fee type" };
  }
});

// Get amount for specific class
export const getAmountForClass = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, feeTypeId: string, classId: string) => {
  try {
    const amount = await feeTypeService.getAmountForClass(feeTypeId, classId);
    return { success: true, data: amount };
  } catch (error) {
    console.error("Error getting amount for class:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get amount" };
  }
});

// Set class-specific amount
export const setClassAmount = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, feeTypeId: string, classId: string, amount: number) => {
  try {
    const classAmount = await feeTypeService.setClassAmount(feeTypeId, classId, amount);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: classAmount };
  } catch (error) {
    console.error("Error setting class amount:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to set class amount" };
  }
});

// Remove class-specific amount
export const removeClassAmount = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, feeTypeId: string, classId: string) => {
  try {
    await feeTypeService.removeClassAmount(feeTypeId, classId);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true };
  } catch (error) {
    console.error("Error removing class amount:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove class amount" };
  }
});

// Get fee structure statistics
export const getFeeStructureStats = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,) => {
  try {
    const totalStructures = await db.feeStructure.count({ where: { schoolId } });
    const activeStructures = await db.feeStructure.count({
      where: {
        academicYear: { schoolId },
        isActive: true
      },
    });
    const totalFeeTypes = await db.feeType.count({ where: { schoolId } });

    return {
      success: true,
      data: {
        totalStructures,
        activeStructures,
        totalFeeTypes,
      },
    };
  } catch (error) {
    console.error("Error fetching fee structure stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
});

// ============================================================================
// Analytics Actions
// ============================================================================

/**
 * Get comprehensive fee structure analytics
 * 
 * Requirements: 10.1, 10.2, 10.3
 */
export const getFeeStructureAnalytics = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, filters?: AnalyticsFilters) => {
  try {
    const analytics = await feeStructureAnalyticsService.getFeeStructureAnalytics(filters || {});
    return { success: true, data: analytics };
  } catch (error) {
    console.error("Error fetching fee structure analytics:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch analytics" };
  }
});

/**
 * Get students affected by a specific fee structure
 * 
 * Requirements: 10.2
 */
export const getStudentsAffectedByStructure = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, feeStructureId: string) => {
  try {
    const result = await feeStructureAnalyticsService.getStudentsAffectedByStructure(feeStructureId);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching students affected:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch students" };
  }
});

/**
 * Calculate revenue projection for a fee structure
 * 
 * Requirements: 10.3
 */
export const calculateRevenueProjection = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, feeStructureId: string) => {
  try {
    const projection = await feeStructureAnalyticsService.calculateRevenueProjection(feeStructureId);
    return { success: true, data: projection };
  } catch (error) {
    console.error("Error calculating revenue projection:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to calculate projection" };
  }
});

/**
 * Get usage trends over time
 * 
 * Requirements: 10.4
 */
export const getFeeStructureUsageTrends = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, academicYearId?: string) => {
  try {
    const trends = await feeStructureAnalyticsService.getUsageTrends(academicYearId);
    return { success: true, data: trends };
  } catch (error) {
    console.error("Error fetching usage trends:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch trends" };
  }
});

// ============================================================================
// Bulk Operations Actions
// ============================================================================

/**
 * Bulk assign fee structures to a class
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export const bulkAssignFeeStructuresToClass = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,
  classId: string,
  feeStructureIds: string[],
  academicYearId: string
) => {
  try {
    const result = await feeStructureService.bulkAssignToClass(
      classId,
      feeStructureIds,
      academicYearId
    );
    revalidatePath("/admin/finance/fee-structure");
    revalidatePath("/admin/finance/bulk-operations");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error bulk assigning fee structures:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk assign fee structures"
    };
  }
});

/**
 * Bulk remove fee structure assignments from a class
 * 
 * Requirements: 9.1, 9.4
 */
export const bulkRemoveFeeStructuresFromClass = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,
  classId: string,
  feeStructureIds: string[]
) => {
  try {
    const result = await feeStructureService.bulkRemoveFromClass(classId, feeStructureIds);
    revalidatePath("/admin/finance/fee-structure");
    revalidatePath("/admin/finance/bulk-operations");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error bulk removing fee structures:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk remove fee structures"
    };
  }
});

/**
 * Get available fee structures for bulk assignment
 * 
 * Requirements: 9.2
 */
export const getAvailableFeeStructuresForBulkAssignment = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,
  classId: string,
  academicYearId: string
) => {
  try {
    const result = await feeStructureService.getAvailableForBulkAssignment(
      classId,
      academicYearId
    );
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching available fee structures:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available fee structures"
    };
  }
});

// ============================================================================
// Auto-Generate Fee Types
// ============================================================================

/**
 * Auto-generate standard fee types for Indian schools
 * Similar to auto-generate for departments and grades
 */
export const autoGenerateFeeTypes = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, selectedNames?: string[]) => {
  try {
    // Get existing fee types
    const existingFeeTypes = await db.feeType.findMany({
      select: { name: true }
    });
    const existingNames = new Set(existingFeeTypes.map(ft => ft.name.toLowerCase()));

    // Filter fee types to create
    let feeTypesToCreate = STANDARD_FEE_TYPES.filter(
      ft => !existingNames.has(ft.name.toLowerCase())
    );

    // If specific names were provided, filter to only those
    if (selectedNames && selectedNames.length > 0) {
      const selectedSet = new Set(selectedNames.map(n => n.toLowerCase()));
      feeTypesToCreate = feeTypesToCreate.filter(
        ft => selectedSet.has(ft.name.toLowerCase())
      );
    }

    if (feeTypesToCreate.length === 0) {
      return {
        success: false,
        error: "No new fee types to create. All selected fee types already exist."
      };
    }

    // Create the new fee types
    const result = await db.feeType.createMany({
      data: feeTypesToCreate.map(ft => ({ ...ft, schoolId })),
      skipDuplicates: true,
    });

    revalidatePath("/admin/finance/fee-structure");
    return {
      success: true,
      count: result.count,
      message: `Created ${result.count} fee type${result.count === 1 ? '' : 's'} successfully`
    };
  } catch (error) {
    console.error("Error auto-generating fee types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to auto-generate fee types"
    };
  }
});

/**
 * Get list of standard fee types that can be auto-generated
 */
export const getAvailableStandardFeeTypes = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,) => {
  try {
    // Get existing fee types
    const existingFeeTypes = await db.feeType.findMany({
      select: { name: true }
    });
    const existingNames = new Set(existingFeeTypes.map(ft => ft.name.toLowerCase()));

    // Filter to show only fee types that don't exist yet
    const availableFeeTypes = STANDARD_FEE_TYPES.filter(
      ft => !existingNames.has(ft.name.toLowerCase())
    ).map(ft => ({
      name: ft.name,
      description: ft.description,
      amount: ft.amount,
      frequency: ft.frequency,
      isOptional: ft.isOptional,
    }));

    return {
      success: true,
      data: availableFeeTypes,
      total: availableFeeTypes.length
    };
  } catch (error) {
    console.error("Error fetching available standard fee types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available fee types"
    };
  }
});

// ============================================================================
// Quick Create Fee Structures by Class
// ============================================================================

interface BulkCreateStructureInput {
  name: string;
  classIds: string[];
  items: Array<{ feeTypeId: string; amount: number }>;
}

/**
 * Bulk create fee structures for multiple classes
 * Creates one fee structure per class with class-specific amounts
 */
export const bulkCreateFeeStructuresByClass = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,
  academicYearId: string,
  structures: BulkCreateStructureInput[]
) => {
  try {
    // Validate academic year exists
    const academicYear = await db.academicYear.findUnique({
      where: {
        schoolId,
        id: academicYearId
      },
    });

    if (!academicYear) {
      return { success: false, error: "Academic year not found" };
    }

    // Create all fee structures
    const createdStructures = [];
    const errors: string[] = [];

    for (const structure of structures) {
      try {
        // Validate all classes exist
        const classIds = structure.classIds;
        const classCount = await db.class.count({
          where: {
            schoolId,
            id: {
              in: classIds
            }
          },
        });

        if (classCount !== classIds.length) {
          errors.push(`${structure.name}: One or more classes not found`);
          continue;
        }

        // Validate all fee types exist
        const feeTypeIds = structure.items.map((item) => item.feeTypeId);
        const feeTypeCount = await db.feeType.count({
          where: {
            id: {
              in: feeTypeIds
            }
          },
        });

        if (feeTypeCount !== feeTypeIds.length) {
          errors.push(`${structure.name}: One or more fee types not found`);
          continue;
        }

        // Create the fee structure
        const created = await db.feeStructure.create({
          data: {
            name: structure.name,
            academicYearId,
            schoolId,
            validFrom: new Date(),
            isActive: true,
            isTemplate: false,
            classes: {
              create: classIds.map((classId) => ({
                class: {
                  connect: { id: classId }
                },
                school: {
                  connect: { id: schoolId }
                }
              })),
            },
            items: {
              create: structure.items.map((item) => ({
                feeType: {
                  connect: { id: item.feeTypeId }
                },
                amount: item.amount,
                school: {
                  connect: { id: schoolId }
                }
              })),
            },
          },
          include: {
            classes: {
              include: { class: true },
            },
            items: {
              include: { feeType: true },
            },
          },
        });

        createdStructures.push(created);
      } catch (err) {
        console.error(`Error creating structure ${structure.name}:`, err);
        errors.push(`${structure.name}: ${err instanceof Error ? err.message : "Creation failed"}`);
      }
    }

    revalidatePath("/admin/finance/fee-structure");

    if (createdStructures.length === 0 && errors.length > 0) {
      return {
        success: false,
        error: `Failed to create fee structures: ${errors.join(", ")}`,
      };
    }

    return {
      success: true,
      count: createdStructures.length,
      data: createdStructures,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully created ${createdStructures.length} fee structure${createdStructures.length !== 1 ? "s" : ""}${errors.length > 0 ? ` (${errors.length} failed)` : ""}`,
    };
  } catch (error) {
    console.error("Error bulk creating fee structures:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk create fee structures",
    };
  }
});

