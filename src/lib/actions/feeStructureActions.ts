"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Get all fee structures with related data
export async function getFeeStructures() {
  try {
    const feeStructures = await db.feeStructure.findMany({
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
        items: {
          include: {
            feeType: {
              select: {
                id: true,
                name: true,
                description: true,
                amount: true,
                frequency: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: feeStructures };
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return { success: false, error: "Failed to fetch fee structures" };
  }
}

// Get single fee structure by ID
export async function getFeeStructureById(id: string) {
  try {
    const feeStructure = await db.feeStructure.findUnique({
      where: { id },
      include: {
        academicYear: true,
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    if (!feeStructure) {
      return { success: false, error: "Fee structure not found" };
    }

    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return { success: false, error: "Failed to fetch fee structure" };
  }
}


// Create new fee structure
export async function createFeeStructure(data: any) {
  try {
    const feeStructure = await db.feeStructure.create({
      data: {
        name: data.name,
        academicYearId: data.academicYearId,
        applicableClasses: data.applicableClasses || null,
        description: data.description || null,
        validFrom: new Date(data.validFrom),
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive ?? true,
        items: {
          create: data.items.map((item: any) => ({
            feeTypeId: item.feeTypeId,
            amount: parseFloat(item.amount),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
          })),
        },
      },
      include: {
        academicYear: true,
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error creating fee structure:", error);
    return { success: false, error: "Failed to create fee structure" };
  }
}

// Update existing fee structure
export async function updateFeeStructure(id: string, data: any) {
  try {
    // Delete existing items
    await db.feeStructureItem.deleteMany({
      where: { feeStructureId: id },
    });

    // Update fee structure with new items
    const feeStructure = await db.feeStructure.update({
      where: { id },
      data: {
        name: data.name,
        academicYearId: data.academicYearId,
        applicableClasses: data.applicableClasses || null,
        description: data.description || null,
        validFrom: new Date(data.validFrom),
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive ?? true,
        items: {
          create: data.items.map((item: any) => ({
            feeTypeId: item.feeTypeId,
            amount: parseFloat(item.amount),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
          })),
        },
      },
      include: {
        academicYear: true,
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return { success: false, error: "Failed to update fee structure" };
  }
}

// Delete fee structure
export async function deleteFeeStructure(id: string) {
  try {
    // Check if fee structure has any payments
    const paymentsCount = await db.feePayment.count({
      where: { feeStructureId: id },
    });

    if (paymentsCount > 0) {
      return {
        success: false,
        error: "Cannot delete fee structure with existing payments",
      };
    }

    await db.feeStructure.delete({
      where: { id },
    });

    revalidatePath("/admin/finance/fee-structure");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return { success: false, error: "Failed to delete fee structure" };
  }
}

// Get all fee types
export async function getFeeTypes() {
  try {
    const feeTypes = await db.feeType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: feeTypes };
  } catch (error) {
    console.error("Error fetching fee types:", error);
    return { success: false, error: "Failed to fetch fee types" };
  }
}

// Create new fee type
export async function createFeeType(data: any) {
  try {
    const feeType = await db.feeType.create({
      data: {
        name: data.name,
        description: data.description || null,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
        isOptional: data.isOptional ?? false,
      },
    });

    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeType };
  } catch (error) {
    console.error("Error creating fee type:", error);
    return { success: false, error: "Failed to create fee type" };
  }
}

// Update fee type
export async function updateFeeType(id: string, data: any) {
  try {
    const feeType = await db.feeType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
        isOptional: data.isOptional ?? false,
      },
    });

    revalidatePath("/admin/finance/fee-structure");
    return { success: true, data: feeType };
  } catch (error) {
    console.error("Error updating fee type:", error);
    return { success: false, error: "Failed to update fee type" };
  }
}

// Delete fee type
export async function deleteFeeType(id: string) {
  try {
    // Check if fee type is used in any fee structure items
    const itemsCount = await db.feeStructureItem.count({
      where: { feeTypeId: id },
    });

    if (itemsCount > 0) {
      return {
        success: false,
        error: "Cannot delete fee type that is used in fee structures",
      };
    }

    await db.feeType.delete({
      where: { id },
    });

    revalidatePath("/admin/finance/fee-structure");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fee type:", error);
    return { success: false, error: "Failed to delete fee type" };
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
