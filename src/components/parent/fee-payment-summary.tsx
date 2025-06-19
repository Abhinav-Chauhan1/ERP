import Link from "next/link";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeePaymentSummaryProps {
  payments: any[];
  children: any[];
}

export function FeePaymentSummary({ payments, children }: FeePaymentSummaryProps) {
  // Group payments by child
  const paymentsByChild = children.map(child => {
    const childPayments = payments.filter(payment => payment.studentId === child.id);
    
    // Calculate totals
    const totalFees = childPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaid = childPayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const balance = totalFees - totalPaid;
    
    // Find latest payment
    const latestPayment = childPayments.length > 0 
      ? childPayments.reduce((latest, payment) => 
          new Date(payment.paymentDate) > new Date(latest.paymentDate) ? payment : latest
        )
      : null;
    
    return {
      child,
      totalFees,
      totalPaid,
      balance,
      latestPayment,
      hasOverdue: childPayments.some(payment => 
        payment.status !== "COMPLETED" && payment.balance > 0
      )
    };
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fee Payment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {paymentsByChild.map(({ child, totalFees, totalPaid, balance, latestPayment, hasOverdue }) => (
          <div key={child.id} className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{child.user.firstName} {child.user.lastName}</h3>
              {hasOverdue ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Paid
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded-md">
                <p className="text-xs text-gray-500">Total Fees</p>
                <p className="font-semibold">${totalFees.toFixed(2)}</p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-md">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="font-semibold text-green-600">${totalPaid.toFixed(2)}</p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-md">
                <p className="text-xs text-gray-500">Balance</p>
                <p className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  ${balance.toFixed(2)}
                </p>
              </div>
            </div>
            
            {latestPayment && (
              <div className="text-xs text-gray-500">
                Last payment: {format(new Date(latestPayment.paymentDate), "MMMM d, yyyy")}
              </div>
            )}
            
            <Button variant={hasOverdue ? "default" : "outline"} size="sm" className="w-full" asChild>
              <Link href={`/parent/fees/overview?childId=${child.id}`}>
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                {hasOverdue ? "Make Payment" : "View Details"}
              </Link>
            </Button>
            
            {child.id !== children[children.length - 1].id && (
              <hr className="my-2" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
