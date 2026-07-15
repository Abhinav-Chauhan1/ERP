import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, DollarSign, CreditCard, Receipt, Wallet, BadgeDollarSign, BadgePercent, Building, TrendingUp, TrendingDown } from "lucide-react";
import { FinanceOverviewClient } from "@/components/admin/finance/finance-overview-client";

// ---------------------------------------------------------------------------
// Section 1 — Category cards (6 count queries only — fast)
// ---------------------------------------------------------------------------

async function FinanceCategorySection({ schoolId }: { schoolId: string }) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [
    totalPaymentCount,
    pendingReceiptCount,
    activeScholarshipCount,
    totalPayrollCount,
    totalExpenseCount,
    activeBudgetCount,
  ] = await Promise.all([
    db.feePayment.count({ where: { schoolId } }),
    db.paymentReceipt.count({ where: { schoolId, status: "PENDING_VERIFICATION" } }),
    db.scholarshipRecipient.count({ where: { schoolId, status: "Active" } }),
    db.payroll.count({ where: { schoolId, month: currentMonth, year: currentYear } }),
    db.expense.count({ where: { schoolId } }),
    db.budget.count({ where: { schoolId, status: "Active" } }),
  ]);

  const financeCategories = [
    {
      title: "Fee Structure",
      icon: <DollarSign className="h-5 w-5" />,
      description: "Configure fee types and amounts",
      href: "/admin/finance/fee-structure",
      count: "—" as number | string,
      badge: null as string | null,
    },
    {
      title: "Analytics",
      icon: <TrendingUp className="h-5 w-5" />,
      description: "Fee structure analytics and insights",
      href: "/admin/finance/analytics",
      count: "—",
      badge: null,
    },
    {
      title: "Payments",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Student fee payments",
      href: "/admin/finance/payments",
      count: totalPaymentCount,
      badge: null,
    },
    {
      title: "Receipt Verification",
      icon: <Receipt className="h-5 w-5" />,
      description: "Verify offline payment receipts",
      href: "/admin/finance/receipt-verification",
      count: pendingReceiptCount,
      badge: pendingReceiptCount > 0 ? "pending" : null,
    },
    {
      title: "Class Discounts",
      icon: <BadgePercent className="h-5 w-5" />,
      description: "Bulk-set Normal, Books & Transport fee discounts by class",
      href: "/admin/finance/discounts",
      count: "—",
      badge: null,
    },
    {
      title: "Scholarships",
      icon: <BadgeDollarSign className="h-5 w-5" />,
      description: "Manage student scholarships",
      href: "/admin/finance/scholarships",
      count: activeScholarshipCount,
      badge: null,
    },
    {
      title: "Payroll",
      icon: <Wallet className="h-5 w-5" />,
      description: "Staff salary management",
      href: "/admin/finance/payroll",
      count: totalPayrollCount,
      badge: null,
    },
    {
      title: "Expenses",
      icon: <Receipt className="h-5 w-5" />,
      description: "Track school expenses",
      href: "/admin/finance/expenses",
      count: totalExpenseCount,
      badge: null,
    },
    {
      title: "Budget",
      icon: <Building className="h-5 w-5" />,
      description: "Financial planning",
      href: "/admin/finance/budget",
      count: activeBudgetCount,
      badge: null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {financeCategories.map((category) => (
        <Card key={category.title} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md text-primary">{category.icon}</div>
              <CardTitle className="text-lg">{category.title}</CardTitle>
            </div>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{category.count}</div>
                {category.badge === "pending" && (category.count as number) > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>
                )}
              </div>
              <Link href={category.href}>
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — Summary stats + charts + tables (all aggregation + findMany)
//             Merged into ONE section so aggregates are never duplicated.
// ---------------------------------------------------------------------------

async function FinanceDataSection({ schoolId }: { schoolId: string }) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // All queries run in one Promise.all — no duplicates, no sequential waits
  const [
    feePaymentStats,
    pendingFeeStats,
    expenseStats,
    payrollStats,
    scholarshipStats,
    totalFeeAmountAgg,
    budgetStats,
    budgetExpensesAgg,
    recentPayments,
    pendingInvoices,
    monthlyPayments,
    monthlyExpenses,
    monthlyPayroll,
  ] = await Promise.all([
    // Aggregations — used for summary cards + rates
    db.feePayment.aggregate({ where: { schoolId, status: "COMPLETED" }, _sum: { paidAmount: true } }),
    // FeeInvoiceSummary.dueAmount reflects what students currently owe (kept in
    // sync by fee-invoice-service.ts) — FeePayment rows alone only exist once
    // someone has paid, so they can't be aggregated to find what's outstanding.
    db.feeInvoiceSummary.aggregate({
      where: { schoolId, dueAmount: { gt: 0 } },
      _sum: { dueAmount: true },
    }),
    db.expense.aggregate({ where: { schoolId }, _sum: { amount: true } }),
    db.payroll.aggregate({
      where: { schoolId, status: "COMPLETED", month: currentMonth, year: currentYear },
      _sum: { netSalary: true },
    }),
    db.scholarshipRecipient.aggregate({
      where: { schoolId, status: "Active" },
      _sum: { amount: true },
      _count: true,
    }),
    db.feeInvoiceSummary.aggregate({ where: { schoolId }, _sum: { netTotal: true } }),
    db.budget.aggregate({ where: { schoolId }, _sum: { allocatedAmount: true } }),
    db.expense.aggregate({ where: { schoolId }, _sum: { amount: true } }),
    // Lists — used for tables and charts
    db.feePayment.findMany({
      where: { schoolId, status: "COMPLETED" },
      orderBy: { paymentDate: "desc" },
      take: 10,
      select: {
        id: true,
        paidAmount: true,
        status: true,
        paymentDate: true,
        student: {
          select: {
            user: { select: { firstName: true, lastName: true } },
            enrollments: {
              where: { status: "ACTIVE" },
              take: 1,
              select: { class: { select: { name: true } } },
            },
          },
        },
      },
    }),
    db.feeInvoiceSummary.findMany({
      where: { schoolId, dueAmount: { gt: 0 } },
      orderBy: { dueAmount: "desc" },
      take: 10,
      select: {
        id: true,
        dueAmount: true,
        status: true,
        lastCalculatedAt: true,
        student: {
          select: {
            user: { select: { firstName: true, lastName: true } },
            enrollments: {
              where: { status: "ACTIVE" },
              take: 1,
              select: { class: { select: { name: true } } },
            },
          },
        },
      },
    }),
    db.feePayment.findMany({
      where: { schoolId, status: "COMPLETED", paymentDate: { gte: sixMonthsAgo } },
      select: { paidAmount: true, paymentDate: true },
      orderBy: { paymentDate: "asc" },
    }),
    db.expense.findMany({
      where: { schoolId, date: { gte: sixMonthsAgo } },
      select: { amount: true, date: true },
      orderBy: { date: "asc" },
    }),
    db.payroll.findMany({
      where: { schoolId, status: "COMPLETED", createdAt: { gte: sixMonthsAgo } },
      select: { netSalary: true, month: true, year: true },
    }),
  ]);

  // Compute summary values
  const totalIncome = feePaymentStats._sum.paidAmount ?? 0;
  const totalExpenses = (expenseStats._sum.amount ?? 0) + (payrollStats._sum.netSalary ?? 0);
  const netBalance = totalIncome - totalExpenses;
  const pendingAmount = pendingFeeStats._sum.dueAmount ?? 0;
  const collectionRate = totalFeeAmountAgg._sum.netTotal
    ? (totalIncome / totalFeeAmountAgg._sum.netTotal) * 100
    : 0;
  const pendingPayments = pendingInvoices.map((invoice) => ({
    id: invoice.id,
    balance: invoice.dueAmount,
    status: invoice.status,
    paymentDate: invoice.lastCalculatedAt,
    student: invoice.student,
  }));
  const totalAllocated = budgetStats._sum.allocatedAmount ?? 0;
  const utilizationRate = totalAllocated > 0
    ? ((budgetExpensesAgg._sum.amount ?? 0) / totalAllocated) * 100
    : 0;

  // Build monthly chart data
  const now = new Date();
  const monthlyMap: Record<string, { income: number; expenses: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap[d.toISOString().slice(0, 7)] = { income: 0, expenses: 0 };
  }
  for (const p of monthlyPayments) {
    const key = new Date(p.paymentDate).toISOString().slice(0, 7);
    if (monthlyMap[key]) monthlyMap[key].income += p.paidAmount;
  }
  for (const e of monthlyExpenses) {
    const key = new Date(e.date).toISOString().slice(0, 7);
    if (monthlyMap[key]) monthlyMap[key].expenses += e.amount;
  }
  for (const pr of monthlyPayroll) {
    const key = `${pr.year}-${String(pr.month).padStart(2, "0")}`;
    if (monthlyMap[key]) monthlyMap[key].expenses += pr.netSalary;
  }
  const chartData = Object.entries(monthlyMap).map(([key, val]) => ({
    month: new Date(key + "-01").toLocaleString("default", { month: "short" }),
    income: val.income,
    expenses: val.expenses,
  }));

  return (
    <>
      {/* Summary stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-3xl text-green-600">₹{(totalIncome / 1000).toFixed(1)}k</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" /> Fee collections
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl text-red-600">₹{(totalExpenses / 1000).toFixed(1)}k</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" /> Payroll + Expenses
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Balance</CardDescription>
            <CardTitle className={`text-3xl ${netBalance >= 0 ? "text-primary" : "text-red-600"}`}>
              ₹{(netBalance / 1000).toFixed(1)}k
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">Income - Expenses</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Fees</CardDescription>
            <CardTitle className="text-3xl text-amber-600">₹{(pendingAmount / 1000).toFixed(1)}k</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-amber-600">Outstanding payments</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and recent payments */}
      <FinanceOverviewClient
        chartData={chartData}
        recentPayments={recentPayments}
        pendingPayments={pendingPayments}
        collectionRate={collectionRate}
        utilizationRate={utilizationRate}
        activeScholarshipCount={scholarshipStats._count}
        totalScholarshipAwarded={scholarshipStats._sum.amount ?? 0}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/admin");

  const schoolId = session.user.schoolId;
  if (!schoolId) redirect("/admin");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/admin/finance/payments" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </Link>
          <Link href="/admin/finance/expenses" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Category cards — fast count queries, streams in first */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <FinanceCategorySection schoolId={schoolId} />
      </Suspense>

      {/* Stats + charts — aggregates + findMany, streams in after counts */}
      <Suspense
        fallback={
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-28 mt-1" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </>
        }
      >
        <FinanceDataSection schoolId={schoolId} />
      </Suspense>
    </div>
  );
}
