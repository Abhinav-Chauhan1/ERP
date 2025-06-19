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
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case PaymentStatus.PARTIAL:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Partial</Badge>;
      case PaymentStatus.PENDING:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending</Badge>;
      case PaymentStatus.FAILED:
        return <Badge variant="destructive">Failed</Badge>;
      case PaymentStatus.REFUNDED:
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Helper function to format payment method
  const formatPaymentMethod = (method: string) => {
    return method.replace('_', ' ');
  };

  return (
    <div className="container p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/fees">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Fees
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Payment History</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Payment Transactions</CardTitle>
          <CardDescription>
            View all your fee payment transactions and download receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.receiptNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${payment.paidAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPaymentMethod(payment.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {payment.status === PaymentStatus.COMPLETED ? (
                          <Button size="sm" variant="outline" className="gap-1">
                            <Download className="h-3 w-3" />
                            <span className="text-xs">Receipt</span>
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No Payment History</h3>
              <p className="text-gray-500 mb-6">
                You haven't made any fee payments yet.
              </p>
              <Button asChild>
                <Link href="/student/fees/due">
                  View Due Payments
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              All payment receipts are available for download once payment is confirmed.
              Receipts are official documents and can be used for reimbursement or tax purposes.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">Need Help with Payments?</h4>
              <p className="text-sm text-blue-700">
                For any payment-related queries or issues with receipts, please contact the finance office:
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Email:</strong> finance@schoolerp.edu<br />
                <strong>Phone:</strong> (123) 456-7890<br />
                <strong>Office Hours:</strong> Monday to Friday, 9:00 AM - 4:00 PM
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
