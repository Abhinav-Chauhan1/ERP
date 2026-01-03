import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle2, XCircle } from "lucide-react";

interface FeeSummaryStatsProps {
  totalFees: number;
  paidAmount: number;
  balance: number;
  paymentPercentage: number;
}

export function FeeSummaryStats({
  totalFees,
  paidAmount,
  balance,
  paymentPercentage
}: FeeSummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Total Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalFees.toFixed(2)}</div>
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
          <div className="text-2xl font-bold">₹{paidAmount.toFixed(2)}</div>
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
          <div className="text-2xl font-bold">₹{balance.toFixed(2)}</div>
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
  );
}
