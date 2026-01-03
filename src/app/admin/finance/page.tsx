"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, DollarSign, CreditCard, Receipt, Wallet, BadgeDollarSign, Building, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Chart } from "@/components/dashboard/chart";
import { getPaymentStats, getFeePayments } from "@/lib/actions/feePaymentActions";
import { getScholarshipStats } from "@/lib/actions/scholarshipActions";
import { getPayrollStats } from "@/lib/actions/payrollActions";
import { getExpenseStats } from "@/lib/actions/expenseActions";
import { getBudgetStats } from "@/lib/actions/budgetActions";
import { getVerificationStats } from "@/lib/actions/receiptVerificationActions";

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    payments: null,
    scholarships: null,
    payroll: null,
    expenses: null,
    budget: null,
    receiptVerification: null,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const loadMonthlyData = useCallback(async () => {
    try {
      const monthlyStats = [];
      const currentDate = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const monthName = date.toLocaleString('default', { month: 'short' });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const [paymentResult, expenseResult, payrollResult] = await Promise.all([
          getPaymentStats({ dateFrom: startDate, dateTo: endDate }),
          getExpenseStats(startDate, endDate),
          getPayrollStats(month, year),
        ]);

        const income = paymentResult.success && paymentResult.data ? (paymentResult.data.totalPaid || 0) : 0;
        const expenses = (expenseResult.success && expenseResult.data ? (expenseResult.data.totalAmount || 0) : 0) +
          (payrollResult.success && payrollResult.data ? (payrollResult.data.totalPaid || 0) : 0);

        monthlyStats.push({
          month: monthName,
          income,
          expenses,
        });
      }

      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error("Error loading monthly data:", error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Load stats
      const [paymentStats, scholarshipStats, payrollStats, expenseStats, budgetStats, receiptStats] =
        await Promise.all([
          getPaymentStats(),
          getScholarshipStats(),
          getPayrollStats(currentMonth, currentYear),
          getExpenseStats(),
          getBudgetStats(),
          getVerificationStats(),
        ]);

      setStats({
        payments: paymentStats.success ? paymentStats.data : null,
        scholarships: scholarshipStats.success ? scholarshipStats.data : null,
        payroll: payrollStats.success ? payrollStats.data : null,
        expenses: expenseStats.success ? expenseStats.data : null,
        budget: budgetStats.success ? budgetStats.data : null,
        receiptVerification: receiptStats.success ? receiptStats.data : null,
      });

      // Load recent payments
      const recentResult = await getFeePayments({
        status: "COMPLETED",
        limit: 10,
      });

      if (recentResult.success && recentResult.data) {
        setRecentPayments(recentResult.data);
      }

      // Load pending payments
      const pendingResult = await getFeePayments({
        status: "PENDING",
        limit: 10,
      });

      if (pendingResult.success && pendingResult.data) {
        setPendingPayments(pendingResult.data);
      }

      // Generate monthly data for last 6 months
      await loadMonthlyData();

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [loadMonthlyData]);

  // Load all statistics on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Calculate totals
  const totalIncome = stats.payments?.totalPaid || 0;
  const totalExpenses = (stats.expenses?.totalAmount || 0) + (stats.payroll?.totalPaid || 0);
  const netBalance = totalIncome - totalExpenses;
  const pendingAmount = stats.payments?.totalBalance || 0;

  const financeCategories = [
    {
      title: "Fee Structure",
      icon: <DollarSign className="h-5 w-5" />,
      description: "Configure fee types and amounts",
      href: "/admin/finance/fee-structure",
      count: "—"
    },
    {
      title: "Analytics",
      icon: <TrendingUp className="h-5 w-5" />,
      description: "Fee structure analytics and insights",
      href: "/admin/finance/analytics",
      count: "—"
    },
    {
      title: "Payments",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Student fee payments",
      href: "/admin/finance/payments",
      count: stats.payments?.totalPayments || 0
    },
    {
      title: "Receipt Verification",
      icon: <Receipt className="h-5 w-5" />,
      description: "Verify offline payment receipts",
      href: "/admin/finance/receipt-verification",
      count: stats.receiptVerification?.pendingCount || 0,
      badge: stats.receiptVerification?.pendingCount > 0 ? "pending" : null
    },
    {
      title: "Scholarships",
      icon: <BadgeDollarSign className="h-5 w-5" />,
      description: "Manage student scholarships",
      href: "/admin/finance/scholarships",
      count: stats.scholarships?.activeRecipients || 0
    },
    {
      title: "Payroll",
      icon: <Wallet className="h-5 w-5" />,
      description: "Staff salary management",
      href: "/admin/finance/payroll",
      count: stats.payroll?.totalPayrolls || 0
    },
    {
      title: "Expenses",
      icon: <Receipt className="h-5 w-5" />,
      description: "Track school expenses",
      href: "/admin/finance/expenses",
      count: stats.expenses?.totalExpenses || 0
    },
    {
      title: "Budget",
      icon: <Building className="h-5 w-5" />,
      description: "Financial planning",
      href: "/admin/finance/budget",
      count: stats.budget?.activeBudgets || 0
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <div className="flex gap-2">
          <Link href="/admin/finance/payments">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </Link>
          <Link href="/admin/finance/expenses">
            <Button>
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
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `₹${(totalIncome / 1000).toFixed(1)}k`}
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
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `₹${(totalExpenses / 1000).toFixed(1)}k`}
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
            <CardTitle className={`text-3xl ${netBalance >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `₹${(netBalance / 1000).toFixed(1)}k`}
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
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `₹${(pendingAmount / 1000).toFixed(1)}k`}
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
                  <div className="text-3xl font-bold">{loading ? "..." : category.count}</div>
                  {category.badge === "pending" && category.count > 0 && (
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

      {/* Charts and Summary */}
      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Monthly Financial Overview</CardTitle>
                <CardDescription>
                  Income vs. expenses for the last 6 months
                </CardDescription>
              </div>
              <Link href="/admin/finance/reports">
                <Button variant="outline" size="sm">
                  See Reports
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading || monthlyData.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Chart
                title=""
                data={monthlyData}
                type="bar"
                xKey="month"
                yKey="income"
                categories={["income", "expenses"]}
                colors={["#10b981", "#ef4444"]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Financial Summary</CardTitle>
            <CardDescription>
              Current academic year statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-700 font-medium mb-1">Total Income</div>
                      <div className="text-2xl font-bold text-green-800">
                        ₹{(totalIncome / 1000).toFixed(1)}k
                      </div>
                      <div className="text-xs text-green-700 mt-1">Fee collections</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-700 font-medium mb-1">Total Expenses</div>
                      <div className="text-2xl font-bold text-red-800">
                        ₹{(totalExpenses / 1000).toFixed(1)}k
                      </div>
                      <div className="text-xs text-red-700 mt-1">Payroll + Expenses</div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Fee Collection Rate</span>
                        <span className="text-sm font-medium">
                          {stats.payments?.collectionRate?.toFixed(0) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${stats.payments?.collectionRate?.toFixed(0) || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Budget Utilization</span>
                        <span className="text-sm font-medium">
                          {stats.budget?.utilizationRate?.toFixed(0) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${Math.min(stats.budget?.utilizationRate?.toFixed(0) || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Active Scholarships</span>
                        <span className="text-sm font-medium">
                          {stats.scholarships?.activeRecipients || 0} students
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total awarded: ₹{((stats.scholarships?.totalAmountAwarded || 0) / 1000).toFixed(1)}k
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments and Pending Fees */}
      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Fee Payments</CardTitle>
            <CardDescription>
              Last 10 fee payments received
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No recent payments found
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Amount</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-accent/50">
                          <td className="py-3 px-4 align-middle font-medium">
                            {payment.student.user.firstName} {payment.student.user.lastName}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {payment.student.enrollments[0]?.class.name || "N/A"}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            ₹{payment.paidAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              {payment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center p-4 border-t">
                  <Link href="/admin/finance/payments">
                    <Button variant="outline" size="sm">View All Payments</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pending Fees</CardTitle>
            <CardDescription>
              Outstanding fee payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No pending payments found
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Amount</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Due Date</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-accent/50">
                          <td className="py-3 px-4 align-middle font-medium">
                            {payment.student.user.firstName} {payment.student.user.lastName}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {payment.student.enrollments[0]?.class.name || "N/A"}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            ₹{payment.balance.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              {payment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center p-4 border-t">
                  <Link href="/admin/finance/payments">
                    <Button variant="outline" size="sm">View All Pending Fees</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

