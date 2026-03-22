"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Get all budgets with filters
export async function getBudgets(filters?: {
  academicYearId?: string;
  category?: string;
  status?: string;
  limit?: number;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const where: any = { schoolId };

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
        _count: { select: { expenses: true } },
      },
      orderBy: [{ startDate: "desc" }, { category: "asc" }],
      take: filters?.limit ?? 20,
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
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const budget = await db.budget.findUnique({
      where: { id, schoolId },
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
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const budget = await db.budget.create({
      data: {
        schoolId,
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
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const budget = await db.budget.update({
      where: { id, schoolId },
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
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    await db.budget.delete({
      where: { id, schoolId },
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
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const budget = await db.budget.findUnique({
      where: { id: budgetId, schoolId },
      include: {
        expenses: true,
      },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    // Calculate spent amount from expenses
    const spentAmount = budget.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const utilizationPercentage = (spentAmount / budget.allocatedAmount) * 100;
    const isOverBudget = spentAmount > budget.allocatedAmount;

    return {
      success: true,
      data: {
        budget: { ...budget, spentAmount },
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        isOverBudget,
        overBudgetAmount: isOverBudget ? spentAmount - budget.allocatedAmount : 0,
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
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const where: any = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;

    const [
      totalBudgets,
      activeBudgets,
      totalAllocated,
      budgetsByCategory,
    ] = await Promise.all([
      db.budget.count({ where }),
      db.budget.count({ where: { ...where, status: "Active" } }),
      db.budget.aggregate({ where, _sum: { allocatedAmount: true } }),
      db.budget.groupBy({
        by: ["category"],
        where,
        _sum: { allocatedAmount: true },
      }),
    ]);

    // Sum expenses linked to budgets in this school via a single aggregate
    const expenseAggregate = await db.expense.aggregate({
      where: { schoolId },
      _sum: { amount: true },
    });
    const totalSpent = expenseAggregate._sum.amount ?? 0;

    const totalAllocatedAmount = totalAllocated._sum.allocatedAmount ?? 0;
    const totalRemaining = totalAllocatedAmount - totalSpent;
    const utilizationRate = totalAllocatedAmount > 0
      ? (totalSpent / totalAllocatedAmount) * 100
      : 0;

    const categoryStats = budgetsByCategory.map((item) => ({
      category: item.category,
      allocated: item._sum.allocatedAmount ?? 0,
      spent: 0, // category-level spend requires a join; omit for stats overview
      remaining: item._sum.allocatedAmount ?? 0,
    }));

    return {
      success: true,
      data: {
        totalBudgets,
        activeBudgets,
        totalAllocated: totalAllocatedAmount,
        totalSpent,
        totalRemaining,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        budgetsByCategory: categoryStats,
      },
    };
  } catch (error) {
    console.error("Error fetching budget stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

// Update budget spent amount (called when expenses are added)
// Note: Spent amounts are now calculated from expenses, so this function just revalidates
export async function updateBudgetSpentAmount(category: string, year: number, amount: number) {
  try {
    const { schoolId } = await requireSchoolAccess(); // Ensure context check even if logic empty
    if (!schoolId) return { success: false, error: "School context required" };
    // Spent amounts are calculated from expenses relation, no need to update
    revalidatePath("/admin/finance/budget");
    return { success: true, message: "Budget updated" };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: "Failed to update budget" };
  }
}

// Get budget alerts (over budget or near limit)
export async function getBudgetAlerts(academicYearId?: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const where: any = { status: "Active", schoolId };
    if (academicYearId) where.academicYearId = academicYearId;

    const budgets = await db.budget.findMany({
      where,
      include: {
        expenses: true,
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

