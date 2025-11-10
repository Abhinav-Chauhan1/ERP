"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// Get all budgets with filters
export async function getBudgets(filters?: {
  academicYearId?: string;
  category?: string;
  status?: string;
  limit?: number;
}) {
  try {
    const where: any = {};

    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const budgets = await db.budget.findMany({
      where,
      include: {
        academicYear: true,
        expenses: true,
      },
      orderBy: [
        { startDate: "desc" },
        { category: "asc" },
      ],
      take: filters?.limit,
    });

    return { success: true, data: budgets };
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return { success: false, error: "Failed to fetch budgets" };
  }
}

// Get single budget by ID
export async function getBudgetById(id: string) {
  try {
    const budget = await db.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    return { success: true, data: budget };
  } catch (error) {
    console.error("Error fetching budget:", error);
    return { success: false, error: "Failed to fetch budget" };
  }
}

// Create new budget
export async function createBudget(data: any) {
  try {
    const budget = await db.budget.create({
      data: {
        title: data.title,
        category: data.category,
        academicYearId: data.academicYearId,
        allocatedAmount: parseFloat(data.allocatedAmount),
        status: "Active",
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    revalidatePath("/admin/finance/budget");
    return { success: true, data: budget };
  } catch (error) {
    console.error("Error creating budget:", error);
    return { success: false, error: "Failed to create budget" };
  }
}

// Update budget
export async function updateBudget(id: string, data: any) {
  try {
    const budget = await db.budget.update({
      where: { id },
      data: {
        title: data.title,
        allocatedAmount: parseFloat(data.allocatedAmount),
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status,
      },
    });

    revalidatePath("/admin/finance/budget");
    return { success: true, data: budget };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: "Failed to update budget" };
  }
}

// Delete budget
export async function deleteBudget(id: string) {
  try {
    await db.budget.delete({
      where: { id },
    });

    revalidatePath("/admin/finance/budget");
    return { success: true };
  } catch (error) {
    console.error("Error deleting budget:", error);
    return { success: false, error: "Failed to delete budget" };
  }
}

// Get budget utilization
export async function getBudgetUtilization(budgetId: string) {
  try {
    const budget = await db.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    const utilizationPercentage = (budget.spentAmount / budget.allocatedAmount) * 100;
    const isOverBudget = budget.spentAmount > budget.allocatedAmount;

    return {
      success: true,
      data: {
        budget,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        isOverBudget,
        overBudgetAmount: isOverBudget ? budget.spentAmount - budget.allocatedAmount : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching budget utilization:", error);
    return { success: false, error: "Failed to fetch budget utilization" };
  }
}

// Get budget statistics
export async function getBudgetStats(academicYearId?: string) {
  try {
    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;

    const [
      totalBudgets,
      activeBudgets,
      totalAllocated,
      budgetsByCategory,
    ] = await Promise.all([
      db.budget.count({ where }),
      db.budget.count({
        where: { ...where, status: "Active" },
      }),
      db.budget.aggregate({
        where,
        _sum: {
          allocatedAmount: true,
        },
      }),
      db.budget.groupBy({
        by: ["category"],
        where,
        _sum: {
          allocatedAmount: true,
        },
      }),
    ]);

    // Calculate total spent from related expenses
    const budgets = await db.budget.findMany({
      where,
      include: {
        expenses: {
          where: {
            status: "COMPLETED",
          },
        },
      },
    });

    const totalSpent = budgets.reduce((sum, budget) => {
      const budgetSpent = budget.expenses.reduce((expSum, exp) => expSum + exp.amount, 0);
      return sum + budgetSpent;
    }, 0);

    const totalRemaining = (totalAllocated._sum.allocatedAmount || 0) - totalSpent;
    const utilizationRate = totalAllocated._sum.allocatedAmount 
      ? (totalSpent / totalAllocated._sum.allocatedAmount) * 100
      : 0;

    return {
      success: true,
      data: {
        totalBudgets,
        activeBudgets,
        totalAllocated: totalAllocated._sum.allocatedAmount || 0,
        totalSpent,
        totalRemaining,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        budgetsByCategory: budgetsByCategory.map((item) => ({
          category: item.category,
          allocated: item._sum.allocatedAmount || 0,
          spent: item._sum.spentAmount || 0,
          remaining: (item._sum.allocatedAmount || 0) - (item._sum.spentAmount || 0),
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching budget stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

// Update budget spent amount (called when expenses are added)
export async function updateBudgetSpentAmount(category: string, year: number, amount: number) {
  try {
    const budget = await db.budget.findFirst({
      where: {
        category,
        year,
        status: "ACTIVE",
      },
    });

    if (!budget) {
      // No budget found for this category/year, skip update
      return { success: true, message: "No active budget found for this category" };
    }

    const newSpentAmount = budget.spentAmount + amount;
    const newRemainingAmount = budget.allocatedAmount - newSpentAmount;

    await db.budget.update({
      where: { id: budget.id },
      data: {
        spentAmount: newSpentAmount,
        remainingAmount: newRemainingAmount,
      },
    });

    revalidatePath("/admin/finance/budget");
    return { success: true, data: { newSpentAmount, newRemainingAmount } };
  } catch (error) {
    console.error("Error updating budget spent amount:", error);
    return { success: false, error: "Failed to update budget spent amount" };
  }
}

// Get budget alerts (over budget or near limit)
export async function getBudgetAlerts(academicYearId?: string) {
  try {
    const where: any = { status: "Active" };
    if (academicYearId) where.academicYearId = academicYearId;

    const budgets = await db.budget.findMany({
      where,
      include: {
        expenses: {
          where: {
            status: "COMPLETED",
          },
        },
      },
    });

    const alerts = budgets
      .map((budget) => {
        const spentAmount = budget.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const utilizationPercentage = (spentAmount / budget.allocatedAmount) * 100;
        
        if (spentAmount > budget.allocatedAmount) {
          return {
            budgetId: budget.id,
            category: budget.category,
            title: budget.title,
            type: "OVER_BUDGET",
            severity: "HIGH",
            message: `Budget exceeded by ₹${((spentAmount - budget.allocatedAmount) / 1000).toFixed(1)}k`,
            utilizationPercentage,
          };
        } else if (utilizationPercentage >= 90) {
          return {
            budgetId: budget.id,
            category: budget.category,
            title: budget.title,
            type: "NEAR_LIMIT",
            severity: "MEDIUM",
            message: `${utilizationPercentage.toFixed(0)}% of budget used`,
            utilizationPercentage,
          };
        }
        return null;
      })
      .filter((alert) => alert !== null);

    return { success: true, data: alerts };
  } catch (error) {
    console.error("Error fetching budget alerts:", error);
    return { success: false, error: "Failed to fetch budget alerts" };
  }
}
