/**
 * Fee Structure Service
 * 
 * Provides business logic for managing fee structures with multi-class support.
 * Handles CRUD operations, class associations, templates, and duplication.
 * 
 * @module fee-structure-service
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CreateFeeStructureInput {
  name: string;
  academicYearId: string;
  classIds: string[];
  description?: string | null;
  validFrom: Date;
  validTo?: Date | null;
  isActive: boolean;
  isTemplate: boolean;
  items: FeeStructureItemInput[];
}

export interface FeeStructureItemInput {
  feeTypeId: string;
  amount: number;
  dueDate?: Date | null;
}

export interface UpdateFeeStructureInput extends Partial<CreateFeeStructureInput> {
  // All fields optional for updates
}

export interface FeeStructureFilters {
  academicYearId?: string;
  classId?: string;
  isActive?: boolean;
  isTemplate?: boolean;
  searchTerm?: string;
}

export interface DuplicateFeeStructureInput {
  name?: string;
  academicYearId?: string;
  classIds?: string[];
  validFrom?: Date;
  validTo?: Date | null;
}

export interface CreateFromTemplateInput {
  name: string;
  academicYearId: string;
  classIds: string[];
  validFrom: Date;
  validTo?: Date | null;
  isActive: boolean;
}

// ============================================================================
// Fee Structure Service
// ============================================================================

export class FeeStructureService {
  /**
   * Create a new fee structure with class associations
   * 
   * @param data - Fee structure creation data
   * @returns Created fee structure with all relationships
   */
  async createFeeStructure(data: CreateFeeStructureInput) {
    // Validate that at least one class is selected
    if (!data.classIds || data.classIds.length === 0) {
      throw new Error("At least one class must be selected");
    }

    // Validate that all classes exist
    const classCount = await db.class.count({
      where: {
        id: { in: data.classIds },
      },
    });

    if (classCount !== data.classIds.length) {
      throw new Error("One or more selected classes do not exist");
    }

    // Create fee structure with class associations
    const feeStructure = await db.feeStructure.create({
      data: {
        name: data.name,
        academicYearId: data.academicYearId,
        description: data.description,
        validFrom: data.validFrom,
        validTo: data.validTo,
        isActive: data.isActive,
        isTemplate: data.isTemplate,
        // Create class associations
        classes: {
          create: data.classIds.map((classId) => ({
            classId,
          })),
        },
        // Create fee items
        items: {
          create: data.items.map((item) => ({
            feeTypeId: item.feeTypeId,
            amount: item.amount,
            dueDate: item.dueDate,
          })),
        },
      },
      include: {
        academicYear: true,
        classes: {
          include: {
            class: true,
          },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    return feeStructure;
  }

  /**
   * Update an existing fee structure and its class associations
   * 
   * @param id - Fee structure ID
   * @param data - Update data
   * @returns Updated fee structure
   */
  async updateFeeStructure(id: string, data: UpdateFeeStructureInput) {
    // Validate that fee structure exists
    const existing = await db.feeStructure.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Fee structure not found");
    }

    // Validate classes if provided
    if (data.classIds) {
      if (data.classIds.length === 0) {
        throw new Error("At least one class must be selected");
      }

      const classCount = await db.class.count({
        where: {
          id: { in: data.classIds },
        },
      });

      if (classCount !== data.classIds.length) {
        throw new Error("One or more selected classes do not exist");
      }
    }

    // Prepare update data
    const updateData: Prisma.FeeStructureUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.academicYearId !== undefined && { academicYearId: data.academicYearId }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.validFrom !== undefined && { validFrom: data.validFrom }),
      ...(data.validTo !== undefined && { validTo: data.validTo }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isTemplate !== undefined && { isTemplate: data.isTemplate }),
    };

    // Handle class associations update
    if (data.classIds) {
      // Delete existing associations
      await db.feeStructureClass.deleteMany({
        where: { feeStructureId: id },
      });

      // Create new associations
      updateData.classes = {
        create: data.classIds.map((classId) => ({
          classId,
        })),
      };
    }

    // Handle items update
    if (data.items) {
      // Delete existing items
      await db.feeStructureItem.deleteMany({
        where: { feeStructureId: id },
      });

      // Create new items
      updateData.items = {
        create: data.items.map((item) => ({
          feeTypeId: item.feeTypeId,
          amount: item.amount,
          dueDate: item.dueDate,
        })),
      };
    }

    // Update fee structure
    const feeStructure = await db.feeStructure.update({
      where: { id },
      data: updateData,
      include: {
        academicYear: true,
        classes: {
          include: {
            class: true,
          },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    return feeStructure;
  }

  /**
   * Get fee structures with optional filtering
   * 
   * @param filters - Filter criteria
   * @returns Array of fee structures matching filters
   */
  async getFeeStructures(filters: FeeStructureFilters = {}) {
    const where: Prisma.FeeStructureWhereInput = {};

    // Apply filters
    if (filters.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isTemplate !== undefined) {
      where.isTemplate = filters.isTemplate;
    }

    // Filter by class
    if (filters.classId) {
      where.classes = {
        some: {
          classId: filters.classId,
        },
      };
    }

    // Search by name or description
    if (filters.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm, mode: "insensitive" } },
        { description: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    const feeStructures = await db.feeStructure.findMany({
      where,
      include: {
        academicYear: true,
        classes: {
          include: {
            class: true,
          },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return feeStructures;
  }

  /**
   * Get fee structures for a specific class
   * 
   * @param classId - Class ID
   * @param academicYearId - Optional academic year filter
   * @returns Fee structures associated with the class
   */
  async getFeeStructuresForClass(classId: string, academicYearId?: string) {
    const where: Prisma.FeeStructureWhereInput = {
      classes: {
        some: {
          classId,
        },
      },
      isTemplate: false, // Exclude templates
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const feeStructures = await db.feeStructure.findMany({
      where,
      include: {
        academicYear: true,
        classes: {
          include: {
            class: true,
          },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return feeStructures;
  }

  /**
   * Duplicate an existing fee structure
   * 
   * @param id - Fee structure ID to duplicate
   * @param newData - Optional data to override in the duplicate
   * @returns Newly created duplicate fee structure
   */
  async duplicateFeeStructure(id: string, newData: DuplicateFeeStructureInput = {}) {
    // Get original fee structure
    const original = await db.feeStructure.findUnique({
      where: { id },
      include: {
        classes: true,
        items: true,
      },
    });

    if (!original) {
      throw new Error("Fee structure not found");
    }

    // Prepare duplicate data
    const duplicateData: CreateFeeStructureInput = {
      name: newData.name || `${original.name} (Copy)`,
      academicYearId: newData.academicYearId || original.academicYearId,
      classIds: newData.classIds || original.classes.map((c) => c.classId),
      description: original.description,
      validFrom: newData.validFrom || original.validFrom,
      validTo: newData.validTo !== undefined ? newData.validTo : original.validTo,
      isActive: original.isActive,
      isTemplate: original.isTemplate,
      items: original.items.map((item) => ({
        feeTypeId: item.feeTypeId,
        amount: item.amount,
        dueDate: item.dueDate,
      })),
    };

    // Create duplicate
    const duplicate = await this.createFeeStructure(duplicateData);

    return duplicate;
  }

  /**
   * Get all fee structure templates
   * 
   * @returns Array of template fee structures
   */
  async getTemplates() {
    const templates = await db.feeStructure.findMany({
      where: {
        isTemplate: true,
      },
      include: {
        academicYear: true,
        classes: {
          include: {
            class: true,
          },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return templates;
  }

  /**
   * Create a new fee structure from a template
   * 
   * @param templateId - Template fee structure ID
   * @param data - Data for the new fee structure
   * @returns Newly created fee structure
   */
  async createFromTemplate(templateId: string, data: CreateFromTemplateInput) {
    // Get template
    const template = await db.feeStructure.findUnique({
      where: { id: templateId },
      include: {
        items: true,
      },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    if (!template.isTemplate) {
      throw new Error("Specified fee structure is not a template");
    }

    // Create new fee structure from template
    const createData: CreateFeeStructureInput = {
      name: data.name,
      academicYearId: data.academicYearId,
      classIds: data.classIds,
      description: template.description,
      validFrom: data.validFrom,
      validTo: data.validTo,
      isActive: data.isActive,
      isTemplate: false, // New structure is not a template
      items: template.items.map((item) => ({
        feeTypeId: item.feeTypeId,
        amount: item.amount,
        dueDate: item.dueDate,
      })),
    };

    const feeStructure = await this.createFeeStructure(createData);

    return feeStructure;
  }

  /**
   * Get a single fee structure by ID
   * 
   * @param id - Fee structure ID
   * @returns Fee structure with all relationships
   */
  async getFeeStructureById(id: string) {
    const feeStructure = await db.feeStructure.findUnique({
      where: { id },
      include: {
        academicYear: true,
        classes: {
          include: {
            class: true,
          },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    if (!feeStructure) {
      throw new Error("Fee structure not found");
    }

    return feeStructure;
  }

  /**
   * Delete a fee structure
   * 
   * @param id - Fee structure ID
   */
  async deleteFeeStructure(id: string) {
    // Check if fee structure has any payments
    const paymentsCount = await db.feePayment.count({
      where: { feeStructureId: id },
    });

    if (paymentsCount > 0) {
      throw new Error("Cannot delete fee structure with existing payments");
    }

    // Delete fee structure (cascade will handle class associations and items)
    await db.feeStructure.delete({
      where: { id },
    });
  }

  /**
   * Bulk assign fee structures to a class
   * 
   * @param classId - Class ID to assign fee structures to
   * @param feeStructureIds - Array of fee structure IDs to assign
   * @param academicYearId - Academic year ID for validation
   * @returns Summary of bulk assignment operation
   */
  async bulkAssignToClass(
    classId: string,
    feeStructureIds: string[],
    academicYearId: string
  ): Promise<BulkAssignmentResult> {
    // Validate class exists
    const classExists = await db.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw new Error("Class not found");
    }

    // Validate all fee structures exist and belong to the academic year
    const feeStructures = await db.feeStructure.findMany({
      where: {
        id: { in: feeStructureIds },
        academicYearId,
        isTemplate: false, // Don't allow assigning templates
      },
      include: {
        classes: {
          where: { classId },
        },
      },
    });

    if (feeStructures.length !== feeStructureIds.length) {
      throw new Error("One or more fee structures not found or invalid");
    }

    // Detect conflicts (already assigned)
    const conflicts: string[] = [];
    const toAssign: string[] = [];

    feeStructures.forEach((structure) => {
      if (structure.classes.length > 0) {
        conflicts.push(structure.id);
      } else {
        toAssign.push(structure.id);
      }
    });

    // Create associations for non-conflicting structures
    const created = await Promise.all(
      toAssign.map((feeStructureId) =>
        db.feeStructureClass.create({
          data: {
            feeStructureId,
            classId,
          },
        })
      )
    );

    return {
      totalRequested: feeStructureIds.length,
      successfulAssignments: created.length,
      conflicts: conflicts.length,
      conflictingStructureIds: conflicts,
      assignedStructureIds: toAssign,
    };
  }

  /**
   * Bulk remove fee structure assignments from a class
   * 
   * @param classId - Class ID to remove assignments from
   * @param feeStructureIds - Array of fee structure IDs to remove
   * @returns Summary of bulk removal operation
   */
  async bulkRemoveFromClass(
    classId: string,
    feeStructureIds: string[]
  ): Promise<BulkRemovalResult> {
    // Delete associations
    const result = await db.feeStructureClass.deleteMany({
      where: {
        classId,
        feeStructureId: { in: feeStructureIds },
      },
    });

    return {
      totalRequested: feeStructureIds.length,
      successfulRemovals: result.count,
    };
  }

  /**
   * Get available fee structures for bulk assignment to a class
   * 
   * @param classId - Class ID
   * @param academicYearId - Academic year ID
   * @returns Fee structures that can be assigned to the class
   */
  async getAvailableForBulkAssignment(
    classId: string,
    academicYearId: string
  ) {
    // Get all fee structures for the academic year that are not templates
    const allStructures = await db.feeStructure.findMany({
      where: {
        academicYearId,
        isTemplate: false,
        isActive: true,
      },
      include: {
        classes: {
          where: { classId },
        },
        items: {
          include: {
            feeType: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Separate into assigned and unassigned
    const assigned = allStructures.filter((s) => s.classes.length > 0);
    const unassigned = allStructures.filter((s) => s.classes.length === 0);

    return {
      assigned,
      unassigned,
      total: allStructures.length,
    };
  }
}

// ============================================================================
// Additional Types for Bulk Operations
// ============================================================================

export interface BulkAssignmentResult {
  totalRequested: number;
  successfulAssignments: number;
  conflicts: number;
  conflictingStructureIds: string[];
  assignedStructureIds: string[];
}

export interface BulkRemovalResult {
  totalRequested: number;
  successfulRemovals: number;
}

// Export singleton instance
export const feeStructureService = new FeeStructureService();
