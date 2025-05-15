import { redirect } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import { CalendarClock, CheckCircle2, XCircle, AlertTriangle, DollarSign } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FeeDetailsTable } from "@/components/student/fee-details-table";

export const metadata: Metadata = {
  title: "Fee Details | Student Portal",
  description: "View your fee details and payment history",
};

export default async function StudentFeeDetailsPage() {
  const userDetails = await getCurrentUserDetails();
  
  if (!userDetails?.dbUser || userDetails.dbUser.role !== "STUDENT") {
    redirect("/login");
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: userDetails.dbUser.id
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1,
        include: {
          class: {
            include: {
              academicYear: true
            }
          }
        }
      }
    }
  });

  if (!student) {
    redirect("/student");
  }

  // Get current enrollment and academic year
  const currentEnrollment = student.enrollments[0];
  const academicYearId = currentEnrollment?.class?.academicYear?.id;

  // Get fee structure for this student's class
  const feeStructure = await db.feeStructure.findFirst({
    where: {
      academicYearId,
      applicableClasses: {
        contains: currentEnrollment?.class?.name
      },
      isActive: true
    },
    include: {
      items: {
        include: {
          feeType: true
        }
      }
    }
  });

  // Get all fee payments for this student
  const feePayments = await db.feePayment.findMany({
    where: {
      studentId: student.id,
      feeStructureId: feeStructure?.id
    }
  });

  // Calculate total fees, paid amount, and balance
interface FeeItem {
    id: string;
    amount: number;
    dueDate?: Date | string | null;
    feeType: {
        id: string;
        name: string;
    };
}

interface FeeStructure {
    id: string;
    items: FeeItem[];
}

const totalFees: number = (feeStructure as FeeStructure | null | undefined)?.items.reduce((sum: number, item: FeeItem) => sum + item.amount, 0) || 0;
interface FeePayment {
    id: string;
    studentId: string;
    feeStructureId?: string;
    amount?: number;
    paidAmount: number;
    paymentDate: Date | string;
    receiptNumber?: string | null;
    paymentMethod: string;
    status: string;
}

const paidAmount: number = feePayments.reduce((sum: number, payment) => sum + payment.paidAmount, 0);
  const balance = totalFees - paidAmount;
  const paymentPercentage = totalFees > 0 ? (paidAmount / totalFees) * 100 : 0;
  
  // Get upcoming fees
  const now = new Date();
const upcomingFees: FeeItem[] = feeStructure?.items
    .filter((item: FeeItem) => item.dueDate && new Date(item.dueDate) > now)
    .sort((a: FeeItem, b: FeeItem) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3) || [];
  
  // Get overdue fees
interface FeeItem {
    id: string;
    amount: number;
    dueDate?: Date | string | null;
    feeType: {
        id: string;
        name: string;
    };
}

interface FeePayment {
    id: string;
    studentId: string;
    feeStructureId?: string;
    amount?: number;
    paidAmount: number;
    paymentDate: Date | string;
    receiptNumber?: string | null;
    paymentMethod: string;
    status: string;
}

const overdueFees: FeeItem[] = feeStructure?.items
    .filter((item: FeeItem) => item.dueDate && new Date(item.dueDate) < now)
    .filter((item: FeeItem) => {
        const paymentForItem = feePayments.find((payment) => 
            payment.amount === item.amount && payment.status === "COMPLETED"
        );
        return !paymentForItem;
    }) || [];

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-2">Fee Details</h1>
      <p className="text-gray-500 mb-6">
        Academic Year: {currentEnrollment?.class?.academicYear?.name || "Current"}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Total Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toFixed(2)}</div>
            <p className="text-sm text-gray-500">Academic year fee structure</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Paid Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paidAmount.toFixed(2)}</div>
            <div className="mt-2">
              <Progress value={paymentPercentage} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {paymentPercentage.toFixed(0)}% of total fees paid
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {balance > 0 ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              Balance Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
            <div className="mt-2">
              {balance > 0 ? (
                <Badge variant="destructive" className="mt-1">Payment Required</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mt-1">Fully Paid</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
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
                <Button variant="outline" className="w-full mt-4">
                  View All Upcoming
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
                  
                  <Button className="w-full mt-2 bg-red-600 hover:bg-red-700">
                    Pay Now
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
                    .sort((a: FeePayment, b: FeePayment) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .map((payment: FeePayment) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
