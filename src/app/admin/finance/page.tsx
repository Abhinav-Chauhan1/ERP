import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, DollarSign, CreditCard, Receipt, Wallet, BadgeDollarSign, Building } from "lucide-react";
import { Chart } from "@/components/dashboard/chart";

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Record Payment
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {financeCategories.map((category) => (
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
                <div className="text-3xl font-bold">{category.count}</div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-700 font-medium mb-1">Total Income</div>
                  <div className="text-2xl font-bold text-green-800">$1,848,000</div>
                  <div className="text-xs text-green-700 mt-1">+12% from last year</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-red-700 font-medium mb-1">Total Expenses</div>
                  <div className="text-2xl font-bold text-red-800">$1,284,000</div>
                  <div className="text-xs text-red-700 mt-1">+8% from last year</div>
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Fee Collection Rate</span>
                    <span className="text-sm font-medium">86%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "86%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Budget Utilization</span>
                    <span className="text-sm font-medium">72%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: "72%" }}></div>
                  </div>
                </div>

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
