/**
 * Fee Type Service
 * 
 * Provides business logic for managing fee types with class-specific amount support.
 * Handles CRUD operations, class amount configurations, and amount retrieval with fallback logic.
 * 
 * @module fee-type-service
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ClassAmountInput {
  classId: string;
  amount: number;
}

export interface CreateFeeTypeInput {
  name: string;
  description?: string | null;
  amount: number; // Default amount
  frequency: "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";
  isOptional: boolean;
  classAmounts?: ClassAmountInput[]; // Optional class-specific amounts
}

export interface UpdateFeeTypeInput extends Partial<CreateFeeTypeInput> {
  // All fields optional for updates
}

// ============================================================================
// Fee Type Service
// ============================================================================

export class FeeTypeService {
  /**
   * Create a new fee type with optional class-specific amounts
   * 
   * @param data - Fee type creation data
   * @returns Created fee type with all relationships
   */
  async createFeeType(data: CreateFeeTypeInput, schoolId?: string) {
    // Validate that default amount is positive
    if (data.amount <= 0) {
      throw new Error("Default amount must be positive");
    }

    // Validate class amounts if provided
    if (data.classAmounts && data.classAmounts.length > 0) {
      // Check for duplicate class IDs
      const classIds = data.classAmounts.map((ca) => ca.classId);
      const uniqueClassIds = new Set(classIds);
      if (classIds.length !== uniqueClassIds.size) {
        throw new Error("Duplicate class IDs in class amounts");
      }

      // Validate all amounts are positive
      const invalidAmounts = data.classAmounts.filter((ca) => ca.amount <= 0);
      if (invalidAmounts.length > 0) {
        throw new Error("All class-specific amounts must be positive");
      }

      // Validate that all classes exist
      const classCount = await db.class.count({
        where: {
          id: { in: classIds },
        },
      });

      if (classCount !== classIds.length) {
        throw new Error("One or more selected classes do not exist");
      }
    }

    // Create fee type with class amounts
    const feeType = await db.feeType.create({
      data: {
        name: data.name,
        description: data.description,
        amount: data.amount,
        frequency: data.frequency,
        isOptional: data.isOptional,
        school: { connect: { id: schoolId } }, // schoolId is required
        // Create class-specific amounts if provided
        ...(data.classAmounts &&
          data.classAmounts.length > 0 && {
            classAmounts: {
              create: data.classAmounts.map((ca) => ({
                classId: ca.classId,
                amount: ca.amount,
                class: { connect: { id: ca.classId } },
                school: { connect: { id: schoolId } }, // Add required school connection
              })),
            },
          }),
      },
      include: {
        classAmounts: {
          include: {
            class: true,
          },
        },
      },
    });

    return feeType;
  }

  /**
   * Update an existing fee type and its class amounts
   * 
   * @param id - Fee type ID
   * @param data - Update data
   * @returns Updated fee type
   */
  async updateFeeType(id: string, data: UpdateFeeTypeInput, schoolId: string) {
    // Validate that fee type exists
    const existing = await db.feeType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Fee type not found");
    }

    // Validate amount if provided
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error("Default amount must be positive");
    }

    // Validate class amounts if provided
    if (data.classAmounts) {
      // Check for duplicate class IDs
      const classIds = data.classAmounts.map((ca) => ca.classId);
      const uniqueClassIds = new Set(classIds);
      if (classIds.length !== uniqueClassIds.size) {
        throw new Error("Duplicate class IDs in class amounts");
      }

      // Validate all amounts are positive
      const invalidAmounts = data.classAmounts.filter((ca) => ca.amount <= 0);
      if (invalidAmounts.length > 0) {
        throw new Error("All class-specific amounts must be positive");
      }

      // Validate that all classes exist
      if (classIds.length > 0) {
        const classCount = await db.class.count({
          where: {
            id: { in: classIds },
          },
        });

        if (classCount !== classIds.length) {
          throw new Error("One or more selected classes do not exist");
        }
      }
    }

    // Prepare update data
    const updateData: Prisma.FeeTypeUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.isOptional !== undefined && { isOptional: data.isOptional }),
    };

    // Handle class amounts update
    if (data.classAmounts !== undefined) {
      // Delete existing class amounts
      await db.feeTypeClassAmount.deleteMany({
        where: { feeTypeId: id },
      });

      // Create new class amounts if provided
      if (data.classAmounts.length > 0) {
        updateData.classAmounts = {
          create: data.classAmounts.map((ca) => ({
            classId: ca.classId,
            amount: ca.amount,
            class: { connect: { id: ca.classId } },
            school: { connect: { id: schoolId } }, // Add required school connection
          })),
        };
      }
    }

    // Update fee type
    const feeType = await db.feeType.update({
      where: { id },
      data: updateData,
      include: {
        classAmounts: {
          include: {
            class: true,
          },
        },
      },
    });

    return feeType;
  }

  /**
   * Get all fee types with optional class amounts
   * 
   * @param includeClassAmounts - Whether to include class-specific amounts
   * @returns Array of fee types
   */
  async getFeeTypes(includeClassAmounts: boolean = false) {
    const feeTypes = await db.feeType.findMany({
      include: includeClassAmounts
        ? {
            classAmounts: {
              include: {
                class: true,
              },
            },
          }
        : undefined,
      orderBy: {
        name: "asc",
      },
    });

    return feeTypes;
  }

  /**
   * Get a single fee type by ID
   * 
   * @param id - Fee type ID
   * @param includeClassAmounts - Whether to include class-specific amounts
   * @returns Fee type with optional class amounts
   */
  async getFeeTypeById(id: string, includeClassAmounts: boolean = true) {
    const feeType = await db.feeType.findUnique({
      where: { id },
      include: includeClassAmounts
        ? {
            classAmounts: {
              include: {
                class: true,
              },
            },
          }
        : undefined,
    });

    if (!feeType) {
      throw new Error("Fee type not found");
    }

    return feeType;
  }

  /**
   * Get amount for a specific class (returns class-specific or default amount)
   * 
   * @param feeTypeId - Fee type ID
   * @param classId - Class ID
   * @returns Amount for the class (class-specific if exists, otherwise default)
   */
  async getAmountForClass(feeTypeId: string, classId: string): Promise<number> {
    // Get fee type with class amounts
    const feeType = await db.feeType.findUnique({
      where: { id: feeTypeId },
      include: {
        classAmounts: {
          where: {
            classId,
          },
        },
      },
    });

    if (!feeType) {
      throw new Error("Fee type not found");
    }

    // Return class-specific amount if exists, otherwise default amount
    if (feeType.classAmounts.length > 0) {
      return feeType.classAmounts[0].amount;
    }

    return feeType.amount;
  }

  /**
   * Set or update class-specific amount for a fee type
   * 
   * @param feeTypeId - Fee type ID
   * @param classId - Class ID
   * @param amount - Amount to set
   * @returns Created or updated class amount record
   */
  async setClassAmount(feeTypeId: string, classId: string, amount: number, schoolId?: string) {
    // Validate amount
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Validate fee type exists
    const feeType = await db.feeType.findUnique({
      where: { id: feeTypeId },
    });

    if (!feeType) {
      throw new Error("Fee type not found");
    }

    // Validate class exists
    const classExists = await db.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw new Error("Class not found");
    }

    // Upsert class amount (create if doesn't exist, update if exists)
    const classAmount = await db.feeTypeClassAmount.upsert({
      where: {
        feeTypeId_classId: {
          feeTypeId,
          classId,
        },
      },
      create: {
        feeTypeId,
        classId,
        amount,
        schoolId: schoolId || '',
      },
      update: {
        amount,
      },
      include: {
        class: true,
        feeType: true,
      },
    });

    return classAmount;
  }

  /**
   * Remove class-specific amount (revert to default amount)
   * 
   * @param feeTypeId - Fee type ID
   * @param classId - Class ID
   */
  async removeClassAmount(feeTypeId: string, classId: string): Promise<void> {
    // Check if class amount exists
    const classAmount = await db.feeTypeClassAmount.findUnique({
      where: {
        feeTypeId_classId: {
          feeTypeId,
          classId,
        },
      },
    });

    if (!classAmount) {
      // Already doesn't exist, nothing to do
      return;
    }

    // Delete class amount
    await db.feeTypeClassAmount.delete({
      where: {
        feeTypeId_classId: {
          feeTypeId,
          classId,
        },
      },
    });
  }

  /**
   * Delete a fee type
   * 
   * @param id - Fee type ID
   */
  async deleteFeeType(id: string) {
    // Check if fee type is used in any fee structure items
    const itemsCount = await db.feeStructureItem.count({
      where: { feeTypeId: id },
    });

    if (itemsCount > 0) {
      throw new Error("Cannot delete fee type that is used in fee structures");
    }

    // Delete fee type (cascade will handle class amounts)
    await db.feeType.delete({
      where: { id },
    });
  }

  /**
   * Get fee types with class-specific amount indicators
   * 
   * @returns Fee types with count of class-specific amounts
   */
  async getFeeTypesWithClassAmountInfo() {
    const feeTypes = await db.feeType.findMany({
      include: {
        _count: {
          select: {
            classAmounts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return feeTypes;
  }
}

// Export singleton instance
export const feeTypeService = new FeeTypeService();
