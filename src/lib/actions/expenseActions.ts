"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { hasPermissionCached } from "@/lib/utils/permissions";
import { PermissionAction } from "@prisma/client";
import { auth } from "@/auth";
import { expenseSchema } from "@/lib/schemaValidation/expenseSchemaValidation";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expense-categories";

// Helper to check permission
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');
  const allowed = await hasPermissionCached(userId, resource, action);
  if (!allowed) throw new Error(errorMessage || 'Permission denied');
  return userId;
}

// Get all expenses with filters
export const getExpenses = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, filters?: {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) => {
  try {
    const PAGE_SIZE = filters?.limit ?? 20;
    const where: any = { schoolId };

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

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        orderBy: { date: "desc" },
        take: PAGE_SIZE,
        skip: filters?.offset ?? 0,
      }),
      db.expense.count({ where }),
    ]);

    return { success: true, data: expenses, total };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, error: "Failed to fetch expenses" };
  }
});

// Get single expense by ID
export const getExpenseById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const expense = await db.expense.findFirst({
      where: { id, schoolId },
    });

    if (!expense) {
      return { success: false, error: "Expense not found" };
    }

    return { success: true, data: expense };
  } catch (error) {
    console.error("Error fetching expense:", error);
    return { success: false, error: "Failed to fetch expense" };
  }
});

// Create new expense
export const createExpense = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: any) => {
  try {
    await checkPermission('EXPENSE', 'CREATE');

    const parsed = expenseSchema.parse(data);

    const expense = await db.expense.create({
      data: {
        schoolId,
        title: parsed.title,
        description: parsed.description || null,
        category: parsed.category,
        amount: parsed.amount,
        date: new Date(parsed.date),
        paymentMethod: parsed.paymentMethod || undefined,
        paymentStatus: parsed.paymentStatus || undefined,
        paidTo: parsed.paidTo || null,
        receiptNumber: parsed.receiptNumber || null,
        attachments: parsed.attachments || null,
      },
    });

    revalidatePath("/admin/finance/expenses");
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error creating expense:", error);
    const message = error instanceof Error ? error.message : "Failed to create expense";
    return { success: false, error: message };
  }
});

// Update expense
export const updateExpense = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, data: any) => {
  try {
    await checkPermission('EXPENSE', 'UPDATE');

    const existing = await db.expense.findFirst({ where: { id, schoolId } });
    if (!existing) return { success: false, error: "Expense not found" };

    const parsed = expenseSchema.parse(data);

    const expense = await db.expense.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description || null,
        category: parsed.category,
        amount: parsed.amount,
        date: new Date(parsed.date),
        paymentMethod: parsed.paymentMethod || undefined,
        paymentStatus: parsed.paymentStatus || undefined,
        paidTo: parsed.paidTo || null,
        receiptNumber: parsed.receiptNumber || null,
        attachments: parsed.attachments || null,
      },
    });

    revalidatePath("/admin/finance/expenses");
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error updating expense:", error);
    const message = error instanceof Error ? error.message : "Failed to update expense";
    return { success: false, error: message };
  }
});

// Delete expense
export const deleteExpense = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    await checkPermission('EXPENSE', 'DELETE');

    const existing = await db.expense.findFirst({ where: { id, schoolId } });
    if (!existing) return { success: false, error: "Expense not found" };

    await db.expense.delete({
      where: { id },
    });

    revalidatePath("/admin/finance/expenses");
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    return { success: false, error: message };
  }
});

// Bulk delete expenses
export const deleteExpenses = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, ids: string[]) => {
  try {
    await checkPermission('EXPENSE', 'DELETE');

    const result = await db.expense.deleteMany({
      where: { id: { in: ids }, schoolId },
    });

    revalidatePath("/admin/finance/expenses");
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error("Error deleting expenses:", error);
    const message = error instanceof Error ? error.message : "Failed to delete expenses";
    return { success: false, error: message };
  }
});

// Get expense statistics — shape consumed directly by the expenses dashboard page
export const getExpenseStats = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, dateFrom?: Date, dateTo?: Date) => {
  try {
    const where: any = { schoolId };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [totalAgg, pendingAgg, completedAgg, byCategoryGroup, trendExpenses] = await Promise.all([
      db.expense.aggregate({ where, _sum: { amount: true }, _count: { id: true } }),
      db.expense.aggregate({ where: { ...where, paymentStatus: "PENDING" }, _sum: { amount: true }, _count: { id: true } }),
      db.expense.aggregate({ where: { ...where, paymentStatus: "COMPLETED" }, _sum: { amount: true }, _count: { id: true } }),
      db.expense.groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      db.expense.findMany({
        where: { schoolId, date: { gte: sixMonthsAgo } },
        select: { date: true, amount: true },
      }),
    ]);

    const byCategory = byCategoryGroup
      .map((item) => ({
        category: EXPENSE_CATEGORIES.find((c) => c.id === item.category)?.name || item.category,
        amount: item._sum.amount || 0,
        count: item._count.id,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Build the last 6 months (oldest -> newest) and bucket trend expenses into them
    const monthBuckets: { key: string; month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      monthBuckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString("default", { month: "short" }),
        amount: 0,
      });
    }
    const bucketByKey = new Map(monthBuckets.map((b) => [b.key, b]));
    for (const expense of trendExpenses) {
      const key = `${expense.date.getFullYear()}-${expense.date.getMonth()}`;
      const bucket = bucketByKey.get(key);
      if (bucket) bucket.amount += expense.amount;
    }

    return {
      success: true,
      data: {
        totalAmount: totalAgg._sum.amount || 0,
        totalExpenses: totalAgg._count.id,
        pendingAmount: pendingAgg._sum.amount || 0,
        pendingExpenses: pendingAgg._count.id,
        completedAmount: completedAgg._sum.amount || 0,
        completedExpenses: completedAgg._count.id,
        byCategory,
        monthlyTrend: monthBuckets.map(({ month, amount }) => ({ month, amount })),
      },
    };
  } catch (error) {
    console.error("Error fetching expense stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
});

// Get expenses by category
export const getExpensesByCategory = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, category: string, dateFrom?: Date, dateTo?: Date) => {
  try {
    const where: any = { category, schoolId };

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
});

// Get monthly expense summary
export const getMonthlyExpenseSummary = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, year: number) => {
  try {
    const expenses = await db.expense.findMany({
      where: {
        schoolId,
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
});
