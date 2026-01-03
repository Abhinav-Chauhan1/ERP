/**
 * Cascade Deletion Service
 * 
 * Handles logging and tracking of cascade deletions for fee-related entities.
 * This service ensures that when classes are deleted, all associated fee structure
 * and fee type records are properly logged before being automatically removed by
 * database cascade constraints.
 * 
 * Requirements: 1.5, 3.4
 */

import { db } from "@/lib/db";

export interface CascadeDeletionLog {
  entityType: string;
  entityId: string;
  entityName: string;
  relatedData?: Record<string, any>;
}

export interface ClassDeletionCascadeInfo {
  classId: string;
  className: string;
  feeStructureAssociations: CascadeDeletionLog[];
  feeTypeClassAmounts: CascadeDeletionLog[];
  totalRecordsAffected: number;
}

/**
 * Get information about all records that will be cascade deleted when a class is removed
 * 
 * @param classId - The ID of the class to be deleted
 * @returns Information about all records that will be cascade deleted
 */
export async function getClassDeletionCascadeInfo(
  classId: string
): Promise<ClassDeletionCascadeInfo> {
  // Get class information
  const classInfo = await db.class.findUnique({
    where: { id: classId },
    select: { name: true }
  });

  if (!classInfo) {
    throw new Error(`Class with ID ${classId} not found`);
  }

  // Get FeeStructureClass associations that will be deleted
  const feeStructureAssociations = await db.feeStructureClass.findMany({
    where: { classId },
    include: {
      feeStructure: {
        select: {
          id: true,
          name: true,
          academicYearId: true,
          isActive: true
        }
      }
    }
  });

  // Get FeeTypeClassAmount records that will be deleted
  const feeTypeClassAmounts = await db.feeTypeClassAmount.findMany({
    where: { classId },
    include: {
      feeType: {
        select: {
          id: true,
          name: true,
          amount: true
        }
      }
    }
  });

  // Format the cascade deletion logs
  const feeStructureLogs: CascadeDeletionLog[] = feeStructureAssociations.map(fsc => ({
    entityType: "FeeStructureClass",
    entityId: fsc.id,
    entityName: fsc.feeStructure.name,
    relatedData: {
      feeStructureId: fsc.feeStructureId,
      academicYearId: fsc.feeStructure.academicYearId,
      isActive: fsc.feeStructure.isActive
    }
  }));

  const feeTypeLogs: CascadeDeletionLog[] = feeTypeClassAmounts.map(ftca => ({
    entityType: "FeeTypeClassAmount",
    entityId: ftca.id,
    entityName: ftca.feeType.name,
    relatedData: {
      feeTypeId: ftca.feeTypeId,
      classSpecificAmount: ftca.amount,
      defaultAmount: ftca.feeType.amount
    }
  }));

  return {
    classId,
    className: classInfo.name,
    feeStructureAssociations: feeStructureLogs,
    feeTypeClassAmounts: feeTypeLogs,
    totalRecordsAffected: feeStructureLogs.length + feeTypeLogs.length
  };
}

/**
 * Log cascade deletion information to console and optionally to audit log
 * 
 * @param cascadeInfo - Information about records being cascade deleted
 * @param userId - Optional user ID performing the deletion (for audit logging)
 */
export function logCascadeDeletion(
  cascadeInfo: ClassDeletionCascadeInfo,
  userId?: string
): void {
  if (cascadeInfo.totalRecordsAffected === 0) {
    console.log(`[CASCADE DELETE] No fee-related records to cascade delete for class ${cascadeInfo.className} (${cascadeInfo.classId})`);
    return;
  }

  console.log(`[CASCADE DELETE] Class deletion will cascade delete ${cascadeInfo.totalRecordsAffected} fee-related records:`);
  console.log(`  Class: ${cascadeInfo.className} (${cascadeInfo.classId})`);
  
  if (cascadeInfo.feeStructureAssociations.length > 0) {
    console.log(`  - ${cascadeInfo.feeStructureAssociations.length} FeeStructureClass associations:`);
    cascadeInfo.feeStructureAssociations.forEach(log => {
      console.log(`    • ${log.entityName} (${log.entityId})`);
      if (log.relatedData) {
        console.log(`      Fee Structure ID: ${log.relatedData.feeStructureId}`);
        console.log(`      Academic Year ID: ${log.relatedData.academicYearId}`);
        console.log(`      Active: ${log.relatedData.isActive}`);
      }
    });
  }

  if (cascadeInfo.feeTypeClassAmounts.length > 0) {
    console.log(`  - ${cascadeInfo.feeTypeClassAmounts.length} FeeTypeClassAmount records:`);
    cascadeInfo.feeTypeClassAmounts.forEach(log => {
      console.log(`    • ${log.entityName} (${log.entityId})`);
      if (log.relatedData) {
        console.log(`      Fee Type ID: ${log.relatedData.feeTypeId}`);
        console.log(`      Class-Specific Amount: ${log.relatedData.classSpecificAmount}`);
        console.log(`      Default Amount: ${log.relatedData.defaultAmount}`);
      }
    });
  }

  // Optional: Log to audit log if userId is provided
  if (userId) {
    // This could be extended to write to an audit log table
    console.log(`  Deletion performed by user: ${userId}`);
  }
}

/**
 * Validate that cascade deletion is safe to proceed
 * Checks if any active fee structures would be affected
 * 
 * @param classId - The ID of the class to be deleted
 * @returns Object indicating if deletion is safe and any warnings
 */
export async function validateClassDeletionSafety(
  classId: string
): Promise<{
  isSafe: boolean;
  warnings: string[];
  affectedActiveFeeStructures: number;
}> {
  const cascadeInfo = await getClassDeletionCascadeInfo(classId);
  const warnings: string[] = [];

  // Check for active fee structures
  const activeFeeStructures = cascadeInfo.feeStructureAssociations.filter(
    log => log.relatedData?.isActive === true
  );

  if (activeFeeStructures.length > 0) {
    warnings.push(
      `This class is associated with ${activeFeeStructures.length} active fee structure(s). ` +
      `Deleting this class will remove these associations.`
    );
  }

  // Check for class-specific amounts
  if (cascadeInfo.feeTypeClassAmounts.length > 0) {
    warnings.push(
      `This class has ${cascadeInfo.feeTypeClassAmounts.length} class-specific fee amount(s). ` +
      `These custom amounts will be permanently deleted.`
    );
  }

  return {
    isSafe: true, // Cascade deletion is always safe from a data integrity perspective
    warnings,
    affectedActiveFeeStructures: activeFeeStructures.length
  };
}
