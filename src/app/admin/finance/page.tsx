"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, DollarSign, CreditCard, Receipt, Wallet, BadgeDollarSign, Building } from "lucide-react";
import { Chart } from "@/components/dashboard/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPaymentStats } from "@/lib/actions/feePaymentActions";
import { getScholarshipStats } from "@/lib/actions/scholarshipActions";
import { getPayrollStats } from "@/lib/actions/payrollActions";
import { getExpenseStats } from "@/lib/actions/expenseActions";
import { getBudgetStats } from "@/lib/actions/budgetActions";

const financeCategories = [
  {
    title: "Fee Structure",
    icon: <DollarSign className="h-5 w-5" />,
    description: "Configure fee types and amounts",
    href: "/admin/finance/fee-structure",
    count: 12
  },
  {
    title: "Payments",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Student fee payments",
    href: "/admin/finance/payments",
    count: 1245
  },
  {
    title: "Scholarships",
    icon: <BadgeDollarSign className="h-5 w-5" />,
    description: "Manage student scholarships",
    href: "/admin/finance/scholarships",
    count: 85
  },
  {
    title: "Payroll",
    icon: <Wallet className="h-5 w-5" />,
    description: "Staff salary management",
    href: "/admin/finance/payroll",
    count: 85
  },
  {
    title: "Expenses",
    icon: <Receipt className="h-5 w-5" />,
    description: "Track school expenses",
    href: "/admin/finance/expenses",
    count: 342
  },
  {
    title: "Budget",
    icon: <Building className="h-5 w-5" />,
    description: "Financial planning",
    href: "/admin/finance/budget",
    count: 6
  }
];

const monthlyFinanceData = [
  { month: 'Jul', income: 285000, expenses: 215000 },
  { month: 'Aug', income: 312000, expenses: 204000 },
  { month: 'Sep', income: 298000, expenses: 210000 },
  { month: 'Oct', income: 306000, expenses: 212000 },
  { month: 'Nov', income: 318000, expenses: 218000 },
  { month: 'Dec', income: 329000, expenses: 225000 },
];

const recentPayments = [
  {
    id: "1",
    studentName: "Michael Brown",
    grade: "Grade 10-A",
    amount: "$1,250.00",
    date: "Nov 28, 2023",
    method: "Online",
    status: "Completed"
  },
  {
    id: "2",
    studentName: "Sophia Garcia",
    grade: "Grade 9-B",
    amount: "$985.00",
    date: "Nov 28, 2023",
    method: "Bank Transfer",
    status: "Completed"
  },
  {
    id: "3",
    studentName: "Alexander Johnson",
    grade: "Grade 11-C",
    amount: "$1,500.00",
    date: "Nov 27, 2023",
    method: "Cash",
    status: "Completed"
  },
  {
    id: "4",
    studentName: "Olivia Martinez",
    grade: "Grade 8-A",
    amount: "$785.00",
    date: "Nov 27, 2023",
    method: "Check",
    status: "Pending"
  },
];

const pendingFees = [
  {
    id: "1",
    studentName: "William Davis",
    grade: "Grade 10-B",
    amount: "$1,250.00",
    dueDate: "Dec 5, 2023",
    status: "Overdue",
    daysPast: 3
  },
  {
    id: "2",
    studentName: "Emma Taylor",
    grade: "Grade 9-A",
    amount: "$985.00",
    dueDate: "Dec 10, 2023",
    status: "Upcoming",
    daysPast: 0
  },
  {
    id: "3",
    studentName: "James Wilson",
    grade: "Grade 11-A",
    amount: "$1,500.00",
    dueDate: "Dec 10, 2023",
    status: "Upcoming",
    daysPast: 0
  },
  {
    id: "4",
    studentName: "Ava Anderson",
    grade: "Grade 8-C",
    amount: "$785.00",
    dueDate: "Nov 30, 2023",
    status: "Overdue",
    daysPast: 8
  },
];

export default function FinancePage() {
  const [recordPaymentDialog, setRecordPaymentDialog] = useState(false);
  const [addExpenseDialog, setAddExpenseDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    payments: null,
    scholarships: null,
    payroll: null,
    expenses: null,
    budget: null,
  });

  // Load all statistics on mount
  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [paymentStats, scholarshipStats, payrollStats, expenseStats, budgetStats] = 
        await Promise.all([
          getPaymentStats(),
          getScholarshipStats(),
          getPayrollStats(currentMonth, currentYear),
          getExpenseStats(),
          getBudgetStats(currentYear),
        ]);

      setStats({
        payments: paymentStats.success ? paymentStats.data : null,
        scholarships: scholarshipStats.success ? scholarshipStats.data : null,
        payroll: payrollStats.success ? payrollStats.data : null,
        expenses: expenseStats.success ? expenseStats.data : null,
        budget: budgetStats.success ? budgetStats.data : null,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load finance statistics");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalIncome = (stats.payments?.totalCollected || 0);
  const totalExpenses = (stats.expenses?.totalAmount || 0) + (stats.payroll?.totalPaid || 0);
  const netBalance = totalIncome - totalExpenses;
  const pendingPayments = stats.payments?.totalPending || 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <div className="flex gap-2">
          <Dialog open={recordPaymentDialog} onOpenChange={setRecordPaymentDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  Record a new student fee payment
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student</label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s1">John Smith (Grade 10-A)</SelectItem>
                      <SelectItem value="s2">Emily Johnson (Grade 9-B)</SelectItem>
                      <SelectItem value="s3">Michael Brown (Grade 11-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedStudent && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fee Type</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuition">Tuition Fee</SelectItem>
                        <SelectItem value="exam">Examination Fee</SelectItem>
                        <SelectItem value="transport">Transport Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedStudent && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <Input type="number" placeholder="Enter amount" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRecordPaymentDialog(false)}>
                  Cancel
                </Button>
                <Link href="/admin/finance/payments">
                  <Button onClick={() => setRecordPaymentDialog(false)}>
                    Continue
                  </Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={addExpenseDialog} onOpenChange={setAddExpenseDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
                <DialogDescription>
                  Record a new expense
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input placeholder="Expense title" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="salary">Staff Salary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input type="number" placeholder="Enter amount" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Additional details about this expense" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddExpenseDialog(false)}>
                  Cancel
                </Button>
                <Link href="/admin/finance/expenses">
                  <Button onClick={() => setAddExpenseDialog(false)}>
                    Continue
                  </Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {financeCategories.map((category) => {
          let count = category.count;
          
          // Update counts with real data
          if (category.title === "Payments" && stats.payments) {
            count = stats.payments.totalPayments;
          } else if (category.title === "Scholarships" && stats.scholarships) {
            count = stats.scholarships.activeRecipients;
          } else if (category.title === "Payroll" && stats.payroll) {
            count = stats.payroll.totalPayrolls;
          } else if (category.title === "Expenses" && stats.expenses) {
            count = stats.expenses.totalExpenses;
          } else if (category.title === "Budget" && stats.budget) {
            count = stats.budget.activeBudgets;
          }
          
          return (
            <Card key={category.title} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                    {category.icon}
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold">{loading ? "..." : count}</div>
                  <Link href={category.href}>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
              <Button variant="outline" size="sm">
                See Reports
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Chart
              title=""
              data={monthlyFinanceData}
              type="bar"
              xKey="month"
              yKey="income"
              categories={["income", "expenses"]}
              colors={["#10b981", "#ef4444"]}
            />
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
                <div className="text-center py-8 text-gray-500">Loading statistics...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-700 font-medium mb-1">Total Income</div>
                      <div className="text-2xl font-bold text-green-800">
                        ${(totalIncome / 1000).toFixed(1)}k
                      </div>
                      <div className="text-xs text-green-700 mt-1">Fee collections</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-700 font-medium mb-1">Total Expenses</div>
                      <div className="text-2xl font-bold text-red-800">
                        ${(totalExpenses / 1000).toFixed(1)}k
                      </div>
                      <div className="text-xs text-red-700 mt-1">Payroll + Expenses</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Fee Collection Rate</span>
                        <span className="text-sm font-medium">
                          {stats.payments ? 
                            Math.round((stats.payments.totalCollected / (stats.payments.totalCollected + stats.payments.totalPending)) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${stats.payments ? 
                              Math.round((stats.payments.totalCollected / (stats.payments.totalCollected + stats.payments.totalPending)) * 100) 
                              : 0}%` 
                          }}
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
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ width: `${stats.budget?.utilizationRate?.toFixed(0) || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Scholarship Funds</span>
                    <span className="text-sm font-medium">48%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "48%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Fee Payments</CardTitle>
            <CardDescription>
              Last 10 fee payments received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{payment.studentName}</td>
                        <td className="py-3 px-4 align-middle">{payment.grade}</td>
                        <td className="py-3 px-4 align-middle">{payment.amount}</td>
                        <td className="py-3 px-4 align-middle">{payment.date}</td>
                        <td className="py-3 px-4 align-middle">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            payment.status === "Completed" ? "bg-green-100 text-green-800" : 
                            payment.status === "Pending" ? "bg-amber-100 text-amber-800" : 
                            "bg-red-100 text-red-800"
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm">Receipt</Button>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pending Fees</CardTitle>
            <CardDescription>
              Outstanding and upcoming fee payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Due Date</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFees.map((fee) => (
                      <tr key={fee.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{fee.studentName}</td>
                        <td className="py-3 px-4 align-middle">{fee.grade}</td>
                        <td className="py-3 px-4 align-middle">{fee.amount}</td>
                        <td className="py-3 px-4 align-middle">{fee.dueDate}</td>
                        <td className="py-3 px-4 align-middle">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            fee.status === "Upcoming" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">Remind</Button>
                          <Button variant="ghost" size="sm">Collect</Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
