export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFeePaymentHistory } from "@/lib/actions/student-fee-actions";
import { PaymentStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Payment History | Student Portal",
  description: "View your fee payment history and download receipts",
};

export default async function PaymentHistoryPage() {
  const { payments } = await getFeePaymentHistory();
  
  // Helper function to get badge style based on payment status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case PaymentStatus.PARTIAL:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Partial</Badge>;
      case PaymentStatus.PENDING:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>;
      case PaymentStatus.FAILED:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      case PaymentStatus.REFUNDED:
        return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Helper function to format payment method
  const formatPaymentMethod = (method: string) => {
    return method.replace('_', ' ');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" asChild>
          <Link href="/student/fees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground mt-1">
            View all your fee payment transactions and download receipts
          </p>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Your Payment Transactions</CardTitle>
          <CardDescription>
            Complete history of all fee payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                        Payment Date
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                        Receipt No.
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                        Method
                      </th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
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
                          {formatPaymentMethod(payment.paymentMethod)}
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          {payment.status === PaymentStatus.COMPLETED ? (
                            <Button size="sm" variant="outline" className="gap-1 min-h-[36px]">
                              <Download className="h-3 w-3" />
                              <span className="text-xs">Receipt</span>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unavailable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="rounded-full bg-muted p-6 mb-4 inline-block">
                <Receipt className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Payment History</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any fee payments yet.
              </p>
              <Button className="min-h-[44px]" asChild>
                <Link href="/student/fees/due">
                  View Due Payments
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All payment receipts are available for download once payment is confirmed.
            Receipts are official documents and can be used for reimbursement or tax purposes.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Need Help with Payments?</h4>
                <p className="text-sm text-blue-700 mb-3">
                  For any payment-related queries or issues with receipts, please contact the finance office:
                </p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Email:</strong> finance@schoolerp.edu</p>
                  <p><strong>Phone:</strong> (123) 456-7890</p>
                  <p><strong>Office Hours:</strong> Monday to Friday, 9:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
