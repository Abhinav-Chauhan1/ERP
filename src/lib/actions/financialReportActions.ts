"use server";

import { db } from "@/lib/db";

// Get fee collection report
export async function getFeeCollectionReport(filters?: {
  academicYearId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {};
      if (filters.startDate) where.dueDate.gte = filters.startDate;
      if (filters.endDate) where.dueDate.lte = filters.endDate;
    }

    const payments = await db.feePayment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            enrollments: {
              include: {
                class: true,
              },
              take: 1,
              orderBy: {
                enrollDate: 'desc'
              }
            },
          },
        },
        feeStructure: true,
      },
    });

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = payments
      .filter(p => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.paidAmount, 0);
    const pendingAmount = payments
      .filter(p => p.status === "PENDING")
      .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    return {
      success: true,
      data: {
        payments,
        summary: {
          totalAmount,
          paidAmount,
          pendingAmount,
          collectionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
          totalPayments: payments.length,
          completedPayments: payments.filter(p => p.status === "COMPLETED").length,
          pendingPayments: payments.filter(p => p.status === "PENDING").length,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching fee collection report:", error);
    return { success: false, error: "Failed to fetch fee collection report" };
  }
}

// Get expense analysis
export async function getExpenseAnalysis(filters?: {
  startDate?: Date;
  endDate?: Date;
  category?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.category) where.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        budgetCategory: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Group by category
    const categoryExpenses = expenses.reduce((acc: any, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          totalAmount: 0,
          count: 0,
        };
      }
      acc[category].totalAmount += expense.amount;
      acc[category].count++;
      return acc;
    }, {});

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      success: true,
      data: {
        expenses,
        byCategory: Object.values(categoryExpenses),
        summary: {
          totalExpenses,
          totalCount: expenses.length,
          averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching expense analysis:", error);
    return { success: false, error: "Failed to fetch expense analysis" };
  }
}

// Get outstanding payments
export async function getOutstandingPayments(filters?: {
  academicYearId?: string;
  classId?: string;
}) {
  try {
    const where: any = {
      status: "PENDING",
    };
    
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;

    const outstandingPayments = await db.feePayment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            enrollments: { include: { class: true }, take: 1, orderBy: { enrollDate: 'desc' } },
          },
        },
        feeStructure: true,
      },
      orderBy: {
        paymentDate: "asc",
      },
    });

    const totalOutstanding = outstandingPayments.reduce(
      (sum, p) => sum + (p.amount - p.paidAmount),
      0
    );

    // Calculate overdue
    const now = new Date();
    const overduePayments = outstandingPayments.filter(
      p => p.paymentDate && new Date(p.paymentDate) < now
    );

    return {
      success: true,
      data: {
        payments: outstandingPayments,
        summary: {
          totalOutstanding,
          totalCount: outstandingPayments.length,
          overdueCount: overduePayments.length,
          overdueAmount: overduePayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching outstanding payments:", error);
    return { success: false, error: "Failed to fetch outstanding payments" };
  }
}

// Get budget vs actual report
export async function getBudgetVsActualReport(filters?: {
  academicYearId?: string;
}) {
  try {
    const where: any = {};
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;

    const budgets = await db.budget.findMany({
      where,
      include: {
        expenses: true,
      },
    });

    const comparison = budgets.map(budget => {
      const actualSpent = budget.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const variance = budget.allocatedAmount - actualSpent;
      const variancePercentage = budget.allocatedAmount > 0
        ? (variance / budget.allocatedAmount) * 100
        : 0;

      return {
        category: budget.category,
        budgeted: budget.allocatedAmount,
        actual: actualSpent,
        variance,
        variancePercentage: Math.round(variancePercentage * 100) / 100,
        status: variance >= 0 ? "Under Budget" : "Over Budget",
      };
    });

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalActual = comparison.reduce((sum, c) => sum + c.actual, 0);

    return {
      success: true,
      data: {
        comparison,
        summary: {
          totalBudgeted,
          totalActual,
          totalVariance: totalBudgeted - totalActual,
          utilizationRate: totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching budget vs actual report:", error);
    return { success: false, error: "Failed to fetch budget vs actual report" };
  }
}

// Get income statement
export async function getIncomeStatement(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const where: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    // Get income (fee payments)
    const feePayments = await db.feePayment.findMany({
      where: {
        status: "COMPLETED",
        paymentDate: where.date,
      },
    });

    // Get expenses
    const expenses = await db.expense.findMany({
      where: {
        ...where,
        status: "COMPLETED",
      },
    });

    const totalIncome = feePayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
      success: true,
      data: {
        income: {
          feeCollection: totalIncome,
          total: totalIncome,
        },
        expenses: {
          total: totalExpenses,
          byCategory: expenses.reduce((acc: any, exp) => {
            if (!acc[exp.category]) acc[exp.category] = 0;
            acc[exp.category] += exp.amount;
            return acc;
          }, {}),
        },
        netIncome,
        profitMargin: totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching income statement:", error);
    return { success: false, error: "Failed to fetch income statement" };
  }
}


