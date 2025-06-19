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
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-2">Fee Details</h1>
      <p className="text-gray-500 mb-6">
        Academic Year: {academicYear}
      </p>
      
      <FeeSummaryStats
        totalFees={totalFees}
        paidAmount={paidAmount}
        balance={balance}
        paymentPercentage={paymentPercentage}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure Details</CardTitle>
              <CardDescription>
                Breakdown of fees applicable for this academic year
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feeStructure ? (
                <FeeDetailsTable feeItems={feeStructure.items} payments={feePayments} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No fee structure found for your class.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Upcoming Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingFees.length > 0 ? (
                <div className="space-y-4">
                  {upcomingFees.map((fee) => (
                    <div key={fee.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{fee.feeType.name}</p>
                        <p className="text-sm text-gray-500">
                          Due: {fee.dueDate ? format(new Date(fee.dueDate), "MMM dd, yyyy") : "Not set"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${fee.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No upcoming payments due</p>
              )}
              
              {upcomingFees.length > 0 && (
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/student/fees/due">
                    View All Upcoming
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueFees.length > 0 ? (
                <div className="space-y-4">
                  {overdueFees.map((fee) => (
                    <div key={fee.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{fee.feeType.name}</p>
                        <p className="text-sm text-red-500">
                          Due: {fee.dueDate ? format(new Date(fee.dueDate), "MMM dd, yyyy") : "Not set"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${fee.amount.toFixed(2)}</p>
                        <Badge variant="destructive" className="mt-1">Overdue</Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Button className="w-full mt-2 bg-red-600 hover:bg-red-700" asChild>
                    <Link href="/student/fees/due">
                      Pay Now
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
                  <p className="text-gray-500">No overdue payments!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Recent fee payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feePayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feePayments
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .slice(0, 5) // Only show the 5 most recent payments
                    .map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {payment.receiptNumber || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          ${payment.paidAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {payment.paymentMethod.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Badge 
                            className={
                              payment.status === "COMPLETED" 
                                ? "bg-green-100 text-green-800" 
                                : payment.status === "PARTIAL" 
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
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
          ) : (
            <p className="text-center text-gray-500 py-8">No payment history found</p>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="outline" asChild>
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
