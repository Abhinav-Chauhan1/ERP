import Link from "next/link";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, DollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <Card className="premium-card hover-lift overflow-hidden">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold tracking-tight">Finances & Fees</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pt-4 space-y-8">
        {paymentsByChild.map(({ child, totalFees, totalPaid, balance, latestPayment, hasOverdue }) => (
          <div key={child.id} className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-muted transition-all hover:bg-muted/30">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{child.user.firstName} {child.user.lastName}</h3>
              {hasOverdue ? (
                <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-none px-3 py-1 animate-pulse">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  Due
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Paid
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card/50 p-3 rounded-xl border border-border shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total</p>
                <p className="text-sm font-black">₹{totalFees.toLocaleString()}</p>
              </div>

              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-1">Paid</p>
                <p className="text-sm font-black text-emerald-600">₹{totalPaid.toLocaleString()}</p>
              </div>

              <div className={cn(
                "p-3 rounded-xl border shadow-sm",
                balance > 0 ? "bg-rose-500/5 border-rose-500/10" : "bg-card/50 border-border"
              )}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Balance</p>
                <p className={cn(
                  "text-sm font-black",
                  balance > 0 ? "text-rose-600" : "text-muted-foreground"
                )}>
                  ₹{balance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {latestPayment ? (
                <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last: {format(new Date(latestPayment.paymentDate), "MMM d, yyyy")}
                </div>
              ) : (
                <div />
              )}

              <Link href={`/parent/fees/overview?childId=${child.id}`}>
                <Button variant={hasOverdue ? "default" : "secondary"} size="sm" className="h-9 px-4 font-bold rounded-xl hover-lift">
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  {hasOverdue ? "Pay Now" : "Details"}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
