"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
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

// Get all fee structures with related data
export async function getFeeStructures(filters?: FeeStructureFilters) {
  try {
    const feeStructures = await feeStructureService.getFeeStructures(filters || {});
    return { success: true, data: feeStructures };
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return { success: false, error: "Failed to fetch fee structures" };
  }
}

// Get single fee structure by ID
export async function getFeeStructureById(id: string) {
  try {
    const feeStructure = await feeStructureService.getFeeStructureById(id);
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch fee structure" };
  }
}

// Get fee structures for a specific class
export async function getFeeStructuresForClass(classId: string, academicYearId?: string) {
  try {
    const feeStructures = await feeStructureService.getFeeStructuresForClass(classId, academicYearId);
    return { success: true, data: feeStructures };
  } catch (error) {
    console.error("Error fetching fee structures for class:", error);
    return { success: false, error: "Failed to fetch fee structures for class" };
  }
}


// Create new fee structure
export async function createFeeStructure(data: CreateFeeStructureInput) {
  try {
    const feeStructure = await feeStructureService.createFeeStructure(data);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error creating fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create fee structure" };
  }
}

// Update existing fee structure
export async function updateFeeStructure(id: string, data: UpdateFeeStructureInput) {
  try {
    const feeStructure = await feeStructureService.updateFeeStructure(id, data);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update fee structure" };
  }
}

// Delete fee structure
export async function deleteFeeStructure(id: string) {
  try {
    await feeStructureService.deleteFeeStructure(id);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete fee structure" };
  }
}

// Duplicate fee structure
export async function duplicateFeeStructure(id: string, newData?: DuplicateFeeStructureInput) {
  try {
    const duplicate = await feeStructureService.duplicateFeeStructure(id, newData);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: duplicate };
  } catch (error) {
    console.error("Error duplicating fee structure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to duplicate fee structure" };
  }
}

// Get fee structure templates
export async function getFeeStructureTemplates() {
  try {
    const templates = await feeStructureService.getTemplates();
    return { success: true, data: templates };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: "Failed to fetch templates" };
  }
}

// Create fee structure from template
export async function createFeeStructureFromTemplate(templateId: string, data: CreateFromTemplateInput) {
  try {
    const feeStructure = await feeStructureService.createFromTemplate(templateId, data);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error creating fee structure from template:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create from template" };
  }
}

// Get all fee types
export async function getFeeTypes(includeClassAmounts: boolean = false) {
  try {
    const feeTypes = await feeTypeService.getFeeTypes(includeClassAmounts);
    return { success: true, data: feeTypes };
  } catch (error) {
    console.error("Error fetching fee types:", error);
    return { success: false, error: "Failed to fetch fee types" };
  }
}

// Get single fee type by ID
export async function getFeeTypeById(id: string, includeClassAmounts: boolean = true) {
  try {
    const feeType = await feeTypeService.getFeeTypeById(id, includeClassAmounts);
    return { success: true, data: feeType };
  } catch (error) {
    console.error("Error fetching fee type:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch fee type" };
  }
}

// Get fee types with class amount info
export async function getFeeTypesWithClassAmountInfo() {
  try {
    const feeTypes = await feeTypeService.getFeeTypesWithClassAmountInfo();
    return { success: true, data: feeTypes };
  } catch (error) {
    console.error("Error fetching fee types with class amount info:", error);
    return { success: false, error: "Failed to fetch fee types" };
  }
}

// Create new fee type
export async function createFeeType(data: any) {
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
}

// Update fee type
export async function updateFeeType(id: string, data: any) {
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
}

// Delete fee type
export async function deleteFeeType(id: string) {
  try {
    await feeTypeService.deleteFeeType(id);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fee type:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete fee type" };
  }
}

// Get amount for specific class
export async function getAmountForClass(feeTypeId: string, classId: string) {
  try {
    const amount = await feeTypeService.getAmountForClass(feeTypeId, classId);
    return { success: true, data: amount };
  } catch (error) {
    console.error("Error getting amount for class:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get amount" };
  }
}

// Set class-specific amount
export async function setClassAmount(feeTypeId: string, classId: string, amount: number) {
  try {
    const classAmount = await feeTypeService.setClassAmount(feeTypeId, classId, amount);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: classAmount };
  } catch (error) {
    console.error("Error setting class amount:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to set class amount" };
  }
}

// Remove class-specific amount
export async function removeClassAmount(feeTypeId: string, classId: string) {
  try {
    await feeTypeService.removeClassAmount(feeTypeId, classId);
    revalidatePath("/admin/finance/fee-structure");
    return { success: true };
  } catch (error) {
    console.error("Error removing class amount:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove class amount" };
  }
}

// Get fee structure statistics
export async function getFeeStructureStats() {
  try {
    const totalStructures = await db.feeStructure.count();
    const activeStructures = await db.feeStructure.count({
      where: { isActive: true },
    });
    const totalFeeTypes = await db.feeType.count();

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
}

// ============================================================================
// Analytics Actions
// ============================================================================

/**
 * Get comprehensive fee structure analytics
 * 
 * Requirements: 10.1, 10.2, 10.3
 */
export async function getFeeStructureAnalytics(filters?: AnalyticsFilters) {
  try {
    const analytics = await feeStructureAnalyticsService.getFeeStructureAnalytics(filters || {});
    return { success: true, data: analytics };
  } catch (error) {
    console.error("Error fetching fee structure analytics:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch analytics" };
  }
}

/**
 * Get students affected by a specific fee structure
 * 
 * Requirements: 10.2
 */
export async function getStudentsAffectedByStructure(feeStructureId: string) {
  try {
    const result = await feeStructureAnalyticsService.getStudentsAffectedByStructure(feeStructureId);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching students affected:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch students" };
  }
}

/**
 * Calculate revenue projection for a fee structure
 * 
 * Requirements: 10.3
 */
export async function calculateRevenueProjection(feeStructureId: string) {
  try {
    const projection = await feeStructureAnalyticsService.calculateRevenueProjection(feeStructureId);
    return { success: true, data: projection };
  } catch (error) {
    console.error("Error calculating revenue projection:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to calculate projection" };
  }
}

/**
 * Get usage trends over time
 * 
 * Requirements: 10.4
 */
export async function getFeeStructureUsageTrends(academicYearId?: string) {
  try {
    const trends = await feeStructureAnalyticsService.getUsageTrends(academicYearId);
    return { success: true, data: trends };
  } catch (error) {
    console.error("Error fetching usage trends:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch trends" };
  }
}

// ============================================================================
// Bulk Operations Actions
// ============================================================================

/**
 * Bulk assign fee structures to a class
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export async function bulkAssignFeeStructuresToClass(
  classId: string,
  feeStructureIds: string[],
  academicYearId: string
) {
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
}

/**
 * Bulk remove fee structure assignments from a class
 * 
 * Requirements: 9.1, 9.4
 */
export async function bulkRemoveFeeStructuresFromClass(
  classId: string,
  feeStructureIds: string[]
) {
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
}

/**
 * Get available fee structures for bulk assignment
 * 
 * Requirements: 9.2
 */
export async function getAvailableFeeStructuresForBulkAssignment(
  classId: string,
  academicYearId: string
) {
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
}
