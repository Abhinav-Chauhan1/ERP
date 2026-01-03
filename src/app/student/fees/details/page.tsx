export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { format } from "date-fns";
import Link from "next/link";
import { CalendarClock, CheckCircle2, XCircle, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FeeDetailsTable } from "@/components/student/fee-details-table";
import { FeeSummaryStats } from "@/components/student/fee-summary-stats";
import { getStudentFeeDetails } from "@/lib/actions/student-fee-actions";
import { PaymentDialog } from "@/components/student/payment-dialog";

export const metadata: Metadata = {
  title: "Fee Details | Student Portal",
  description: "View your fee details and payment history",
};

export default async function StudentFeeDetailsPage() {
  const { 
    student, 
    feeStructure, 
    feePayments, 
    totalFees, 
    paidAmount, 
    balance, 
    paymentPercentage,
    upcomingFees,
    overdueFees,
    className,
    academicYear
  } = await getStudentFeeDetails();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Details</h1>
        <p className="text-muted-foreground mt-1">
          Academic Year: {academicYear}
        </p>
      </div>
      
      {/* Fee Summary Card with Gradient */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-blue-900 mb-1">Total Fees</p>
              <div className="text-3xl font-bold text-blue-900">₹{totalFees.toFixed(2)}</div>
            </div>
            <div>
              <p className="text-sm text-green-900 mb-1">Paid Amount</p>
              <div className="text-3xl font-bold text-green-900">₹{paidAmount.toFixed(2)}</div>
            </div>
            <div>
              <p className="text-sm text-amber-900 mb-1">Balance</p>
              <div className="text-3xl font-bold text-amber-900">₹{balance.toFixed(2)}</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-blue-900">Payment Progress</span>
              <span className="font-medium text-blue-900">{paymentPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={paymentPercentage} className="h-3" />
          </div>
          {balance > 0 && feeStructure && (
            <div className="mt-6 flex gap-3">
              <PaymentDialog
                feeItems={feeStructure.items.filter((item: any) => {
                  // Filter unpaid items
                  const paymentForItem = feePayments.find(
                    (payment) => payment.amount === item.amount && payment.status === "COMPLETED"
                  );
                  return !paymentForItem;
                })}
                totalAmount={balance}
                isPayAll={true}
                trigger={
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pay Balance (₹{balance.toFixed(2)})
                  </Button>
                }
              />
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/student/fees/due">
                  View Due Payments
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Fee Structure Details</CardTitle>
              <CardDescription>
                Breakdown of fees applicable for this academic year
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feeStructure ? (
                <FeeDetailsTable feeItems={feeStructure.items} payments={feePayments} />
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No fee structure found for your class.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-primary" />
                Upcoming Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingFees.length > 0 ? (
                <div className="space-y-4">
                  {upcomingFees.map((fee) => (
                    <div key={fee.id} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                      <div>
                        <p className="font-medium">{fee.feeType.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {fee.dueDate ? format(new Date(fee.dueDate), "MMM dd, yyyy") : "Not set"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{fee.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No upcoming payments due</p>
              )}
              
              {upcomingFees.length > 0 && (
                <div className="mt-4 space-y-2">
                  <PaymentDialog
                    feeItems={upcomingFees}
                    totalAmount={upcomingFees.reduce((sum, fee) => sum + fee.amount, 0)}
                    isPayAll={true}
                    trigger={
                      <Button className="w-full min-h-[44px]">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pay All Upcoming (₹{upcomingFees.reduce((sum, fee) => sum + fee.amount, 0).toFixed(2)})
                      </Button>
                    }
                  />
                  <Button variant="outline" className="w-full min-h-[44px]" asChild>
                    <Link href="/student/fees/due">
                      View All Upcoming
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-red-200 bg-red-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueFees.length > 0 ? (
                <div className="space-y-4">
                  {overdueFees.map((fee) => (
                    <div key={fee.id} className="flex justify-between items-center border-b border-red-200 pb-3 last:border-b-0">
                      <div>
                        <p className="font-medium text-red-900">{fee.feeType.name}</p>
                        <p className="text-sm text-red-600">
                          Due: {fee.dueDate ? format(new Date(fee.dueDate), "MMM dd, yyyy") : "Not set"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-900">₹{fee.amount.toFixed(2)}</p>
                        <Badge className="mt-1 bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 space-y-2">
                    <PaymentDialog
                      feeItems={overdueFees}
                      totalAmount={overdueFees.reduce((sum, fee) => sum + fee.amount, 0)}
                      isPayAll={true}
                      trigger={
                        <Button className="w-full min-h-[44px] bg-red-600 hover:bg-red-700">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pay All Overdue (₹{overdueFees.reduce((sum, fee) => sum + fee.amount, 0).toFixed(2)})
                        </Button>
                      }
                    />
                    <Button variant="outline" className="w-full min-h-[44px]" asChild>
                      <Link href="/student/fees/due">
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-green-600 mb-2" />
                  <p className="text-muted-foreground">No overdue payments!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Payment History</CardTitle>
          <CardDescription>
            Recent fee payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feePayments.length > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Receipt No.</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Method</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feePayments
                      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                      .slice(0, 5) // Only show the 5 most recent payments
                      .map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-accent/50 last:border-b-0">
                          <td className="py-3 px-4 align-middle">
                            {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {payment.receiptNumber || "-"}
                          </td>
                          <td className="py-3 px-4 align-middle font-semibold">
                            ₹{payment.paidAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {payment.paymentMethod.replace("_", " ")}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge 
                              className={
                                payment.status === "COMPLETED" 
                                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                  : payment.status === "PARTIAL" 
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                  : "bg-muted text-gray-800 hover:bg-muted"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No payment history found</p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="outline" className="min-h-[44px]" asChild>
              <Link href="/student/fees/payments">
                View All Payments
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
