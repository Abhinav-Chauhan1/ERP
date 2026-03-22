import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, DollarSign, CreditCard, Receipt, Wallet, BadgeDollarSign, Building, TrendingUp, TrendingDown } from "lucide-react";
import { FinanceOverviewClient } from "@/components/admin/finance/finance-overview-client";

async function getFinanceDashboardData(schoolId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [
    feePaymentStats,
    pendingFeeStats,
    expenseStats,
    payrollStats,
    scholarshipStats,
    budgetStats,
    pendingReceiptCount,
    activeScholarshipCount,
    activeBudgetCount,
    totalPaymentCount,
    totalPayrollCount,
    totalExpenseCount,
    recentPayments,
    pendingPayments,
    monthlyPayments,
    monthlyExpenses,
    monthlyPayroll,
    totalFeeAmountAgg,
    budgetExpensesAgg,
  ] = await Promise.all([
    // Total income (completed fee payments)
    db.feePayment.aggregate({
      where: { schoolId, status: "COMPLETED" },
      _sum: { paidAmount: true },
    }),
    // Pending fees
    db.feePayment.aggregate({
      where: { schoolId, status: { in: ["PENDING", "PARTIAL"] } },
      _sum: { balance: true },
      _count: true,
    }),
    // Total expenses
    db.expense.aggregate({
      where: { schoolId },
      _sum: { amount: true },
    }),
    // Payroll paid this month
    db.payroll.aggregate({
      where: { schoolId, status: "COMPLETED", month: currentMonth, year: currentYear },
      _sum: { netSalary: true },
    }),
    // Scholarship stats
    db.scholarshipRecipient.aggregate({
      where: { schoolId, status: "Active" },
      _sum: { amount: true },
      _count: true,
    }),
    // Budget stats
    db.budget.aggregate({
      where: { schoolId },
      _sum: { allocatedAmount: true },
    }),
    // Pending receipt count
    db.paymentReceipt.count({
      where: { schoolId, status: "PENDING_VERIFICATION" },
    }),
    // Active scholarship recipients
    db.scholarshipRecipient.count({
      where: { schoolId, status: "Active" },
    }),
    // Active budgets
    db.budget.count({ where: { schoolId, status: "Active" } }),
    // Total payments count
    db.feePayment.count({ where: { schoolId } }),
    // Total payroll count this month
    db.payroll.count({ where: { schoolId, month: currentMonth, year: currentYear } }),
    // Total expenses count
    db.expense.count({ where: { schoolId } }),
    // Recent completed payments (minimal fields)
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
    // Pending payments (minimal fields)
    db.feePayment.findMany({
      where: { schoolId, status: { in: ["PENDING", "PARTIAL"] } },
      orderBy: { paymentDate: "desc" },
      take: 10,
      select: {
        id: true,
        balance: true,
        status: true,
        dueDate: true,
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
    // Monthly payments for chart (last 6 months)
    db.feePayment.findMany({
      where: {
        schoolId,
        status: "COMPLETED",
        paymentDate: { gte: sixMonthsAgo },
      },
      select: { paidAmount: true, paymentDate: true },
      orderBy: { paymentDate: "asc" },
    }),
    // Monthly expenses for chart (last 6 months)
    db.expense.findMany({
      where: { schoolId, date: { gte: sixMonthsAgo } },
      select: { amount: true, date: true },
      orderBy: { date: "asc" },
    }),
    // Monthly payroll for chart (last 6 months)
    db.payroll.findMany({
      where: {
        schoolId,
        status: "COMPLETED",
        createdAt: { gte: sixMonthsAgo },
      },
      select: { netSalary: true, month: true, year: true },
    }),
    // Total fee amount for collection rate
    db.feePayment.aggregate({
      where: { schoolId },
      _sum: { amount: true },
    }),
    // Total expense amount for budget utilization
    db.expense.aggregate({
      where: { schoolId },
      _sum: { amount: true },
    }),
  ]);

  // Build monthly chart data server-side
  const monthlyMap: Record<string, { income: number; expenses: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    monthlyMap[key] = { income: 0, expenses: 0 };
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

  // Compute totals
  const totalIncome = feePaymentStats._sum.paidAmount ?? 0;
  const totalExpensesAmount = (expenseStats._sum.amount ?? 0) + (payrollStats._sum.netSalary ?? 0);
  const netBalance = totalIncome - totalExpensesAmount;
  const pendingAmount = pendingFeeStats._sum.balance ?? 0;

  // Fee collection rate
  const collectionRate = totalFeeAmountAgg._sum.amount
    ? (totalIncome / totalFeeAmountAgg._sum.amount) * 100
    : 0;

  // Budget utilization
  const totalAllocated = budgetStats._sum.allocatedAmount ?? 0;
  const utilizationRate = totalAllocated > 0
    ? ((budgetExpensesAgg._sum.amount ?? 0) / totalAllocated) * 100
    : 0;

  return {
    totalIncome,
    totalExpenses: totalExpensesAmount,
    netBalance,
    pendingAmount,
    collectionRate,
    utilizationRate,
    activeScholarshipCount,
    totalScholarshipAwarded: scholarshipStats._sum.amount ?? 0,
    pendingReceiptCount,
    activeBudgetCount,
    totalPaymentCount,
    totalPayrollCount,
    totalExpenseCount,
    recentPayments,
    pendingPayments,
    chartData,
  };
}

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/admin");

  const schoolId = session.user.schoolId;
  if (!schoolId) redirect("/admin");

  const data = await getFinanceDashboardData(schoolId);

  const financeCategories = [
    {
      title: "Fee Structure",
      icon: <DollarSign className="h-5 w-5" />,
      description: "Configure fee types and amounts",
      href: "/admin/finance/fee-structure",
      count: "—",
    },
    {
      title: "Analytics",
      icon: <TrendingUp className="h-5 w-5" />,
      description: "Fee structure analytics and insights",
      href: "/admin/finance/analytics",
      count: "—",
    },
    {
      title: "Payments",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Student fee payments",
      href: "/admin/finance/payments",
      count: data.totalPaymentCount,
    },
    {
      title: "Receipt Verification",
      icon: <Receipt className="h-5 w-5" />,
      description: "Verify offline payment receipts",
      href: "/admin/finance/receipt-verification",
      count: data.pendingReceiptCount,
      badge: data.pendingReceiptCount > 0 ? "pending" : null,
    },
    {
      title: "Scholarships",
      icon: <BadgeDollarSign className="h-5 w-5" />,
      description: "Manage student scholarships",
      href: "/admin/finance/scholarships",
      count: data.activeScholarshipCount,
    },
    {
      title: "Payroll",
      icon: <Wallet className="h-5 w-5" />,
      description: "Staff salary management",
      href: "/admin/finance/payroll",
      count: data.totalPayrollCount,
    },
    {
      title: "Expenses",
      icon: <Receipt className="h-5 w-5" />,
      description: "Track school expenses",
      href: "/admin/finance/expenses",
      count: data.totalExpenseCount,
    },
    {
      title: "Budget",
      icon: <Building className="h-5 w-5" />,
      description: "Financial planning",
      href: "/admin/finance/budget",
      count: data.activeBudgetCount,
    },
  ];

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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ₹{(data.totalIncome / 1000).toFixed(1)}k
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Fee collections
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              ₹{(data.totalExpenses / 1000).toFixed(1)}k
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              Payroll + Expenses
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Balance</CardDescription>
            <CardTitle className={`text-3xl ${data.netBalance >= 0 ? "text-primary" : "text-red-600"}`}>
              ₹{(data.netBalance / 1000).toFixed(1)}k
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              Income - Expenses
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Fees</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              ₹{(data.pendingAmount / 1000).toFixed(1)}k
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-amber-600">
              Outstanding payments
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {financeCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  {category.icon}
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{category.count}</div>
                  {category.badge === "pending" && (category.count as number) > 0 && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Pending
                    </Badge>
                  )}
                </div>
                <Link href={category.href}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and tables — client component for interactivity */}
      <FinanceOverviewClient
        chartData={data.chartData}
        recentPayments={data.recentPayments}
        pendingPayments={data.pendingPayments}
        collectionRate={data.collectionRate}
        utilizationRate={data.utilizationRate}
        activeScholarshipCount={data.activeScholarshipCount}
        totalScholarshipAwarded={data.totalScholarshipAwarded}
        totalIncome={data.totalIncome}
        totalExpenses={data.totalExpenses}
      />
    </div>
  );
}
