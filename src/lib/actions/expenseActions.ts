"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth-helpers";

// Get all expenses with filters
export async function getExpenses(filters?: {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}) {
  try {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.date.lte = filters.dateTo;
      }
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      take: filters?.limit,
    });

    return { success: true, data: expenses };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, error: "Failed to fetch expenses" };
  }
}

// Get single expense by ID
export async function getExpenseById(id: string) {
  try {
    const expense = await db.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return { success: false, error: "Expense not found" };
    }

    return { success: true, data: expense };
  } catch (error) {
    console.error("Error fetching expense:", error);
    return { success: false, error: "Failed to fetch expense" };
  }
}

// Create new expense
export async function createExpense(data: any) {
  try {
    const expense = await db.expense.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        paymentMethod: data.paymentMethod || null,
        paidTo: data.vendor || null,
        receiptNumber: data.receiptNumber || null,
        
      },
    });

    revalidatePath("/admin/finance/expenses");
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense" };
  }
}

// Update expense
export async function updateExpense(id: string, data: any) {
  try {
    const expense = await db.expense.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        paymentMethod: data.paymentMethod || null,
        paidTo: data.vendor || null,
        receiptNumber: data.receiptNumber || null,
        
      },
    });

    revalidatePath("/admin/finance/expenses");
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, error: "Failed to update expense" };
  }
}

// Delete expense
export async function deleteExpense(id: string) {
  try {
    await db.expense.delete({
      where: { id },
    });

    revalidatePath("/admin/finance/expenses");
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

// Get expense statistics
export async function getExpenseStats(dateFrom?: Date, dateTo?: Date) {
  try {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const [totalExpenses, totalAmount, expensesByCategory] = await Promise.all([
      db.expense.count({ where }),
      db.expense.aggregate({
        where,
        _sum: {
          amount: true,
        },
      }),
      db.expense.groupBy({
        by: ["category"],
        where,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalExpenses,
        totalAmount: totalAmount._sum.amount || 0,
        expensesByCategory: expensesByCategory.map((item) => ({
          category: item.category,
          amount: item._sum.amount || 0,
          count: item._count.id,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching expense stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

// Get expenses by category
export async function getExpensesByCategory(category: string, dateFrom?: Date, dateTo?: Date) {
  try {
    const where: any = { category };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    const total = await db.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return {
      success: true,
      data: {
        expenses,
        total: total._sum.amount || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching expenses by category:", error);
    return { success: false, error: "Failed to fetch expenses by category" };
  }
}

// Get monthly expense summary
export async function getMonthlyExpenseSummary(year: number) {
  try {
    const expenses = await db.expense.findMany({
      where: {
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
    });

    // Group by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amount: 0,
      count: 0,
    }));

    expenses.forEach((expense) => {
      const month = expense.date.getMonth();
      monthlyData[month].amount += expense.amount;
      monthlyData[month].count += 1;
    });

    return { success: true, data: monthlyData };
  } catch (error) {
    console.error("Error fetching monthly expense summary:", error);
    return { success: false, error: "Failed to fetch monthly summary" };
  }
}


