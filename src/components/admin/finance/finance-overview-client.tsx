"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart } from "@/components/dashboard/chart";

interface RecentPayment {
  id: string;
  paidAmount: number;
  status: string;
  paymentDate: Date;
  student: {
    user: { firstName: string | null; lastName: string | null };
    enrollments: { class: { name: string } }[];
  };
}

interface PendingPayment {
  id: string;
  balance: number;
  status: string;
  dueDate: Date | null;
  student: {
    user: { firstName: string | null; lastName: string | null };
    enrollments: { class: { name: string } }[];
  };
}

interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
}

interface Props {
  chartData: ChartDataPoint[];
  recentPayments: RecentPayment[];
  pendingPayments: PendingPayment[];
  collectionRate: number;
  utilizationRate: number;
  activeScholarshipCount: number;
  totalScholarshipAwarded: number;
  totalIncome: number;
  totalExpenses: number;
}

export function FinanceOverviewClient({
  chartData,
  recentPayments,
  pendingPayments,
  collectionRate,
  utilizationRate,
  activeScholarshipCount,
  totalScholarshipAwarded,
  totalIncome,
  totalExpenses,
}: Props) {
  return (
    <>
      {/* Charts and Summary */}
      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Monthly Financial Overview</CardTitle>
                <CardDescription>Income vs. expenses for the last 6 months</CardDescription>
              </div>
              <Link href="/admin/finance/reports">
                <Button variant="outline" size="sm">See Reports</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Chart
              title=""
              data={chartData}
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
            <CardDescription>Current academic year statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                    <span className="text-sm font-medium">{collectionRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min(collectionRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Budget Utilization</span>
                    <span className="text-sm font-medium">{utilizationRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Active Scholarships</span>
                    <span className="text-sm font-medium">{activeScholarshipCount} students</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total awarded: ₹{(totalScholarshipAwarded / 1000).toFixed(1)}k
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments and Pending Fees */}
      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Fee Payments</CardTitle>
            <CardDescription>Last 10 fee payments received</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No recent payments found</div>
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
                          <td className="py-3 px-4 align-middle">₹{payment.paidAmount.toFixed(2)}</td>
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
            <CardDescription>Outstanding fee payments</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No pending payments found</div>
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
                          <td className="py-3 px-4 align-middle">₹{payment.balance.toFixed(2)}</td>
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
    </>
  );
}
