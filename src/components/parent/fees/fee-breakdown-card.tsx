"use client";

import { format } from "date-fns";
import { AlertCircle, Calendar, CheckCircle, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  dueDate: Date | null;
  status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  paidAmount: number;
  balance: number;
}

interface FeeBreakdownCardProps {
  student: {
    id: string;
    name: string;
    class: string;
  };
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  feeItems: FeeItem[];
  nextDueDate: Date | null;
  hasOverdue: boolean;
  academicYear: string;
}

export function FeeBreakdownCard({
  student,
  totalFees,
  paidAmount,
  pendingAmount,
  overdueAmount,
  feeItems,
  nextDueDate,
  hasOverdue,
  academicYear,
}: FeeBreakdownCardProps) {
  const paymentPercentage = totalFees > 0 ? (paidAmount / totalFees) * 100 : 0;

  const getStatusBadge = (status: FeeItem["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Fee Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {student.name} • {student.class} • {academicYear}
            </p>
          </div>
          {hasOverdue && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overdue Alert */}
        {hasOverdue && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Overdue</AlertTitle>
            <AlertDescription>
              You have ₹{overdueAmount.toFixed(2)} in overdue fees. Please make a payment as soon as possible.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total Fees</p>
            <p className="text-lg font-bold">₹{totalFees.toFixed(2)}</p>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-600 mb-1">Paid Amount</p>
            <p className="text-lg font-bold text-green-700">₹{paidAmount.toFixed(2)}</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Pending</p>
            <p className="text-lg font-bold text-blue-700">₹{pendingAmount.toFixed(2)}</p>
          </div>

          {overdueAmount > 0 && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-600 mb-1">Overdue</p>
              <p className="text-lg font-bold text-red-700">₹{overdueAmount.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Payment Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Progress</span>
            <span className="font-medium">{paymentPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={paymentPercentage} className="h-2" />
        </div>

        {/* Next Due Date */}
        {nextDueDate && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600">Next Payment Due</p>
              <p className="text-sm font-medium text-blue-700">
                {format(nextDueDate, "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        )}

        {/* Fee Items Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Fee Categories</h4>
          <div className="space-y-2">
            {feeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Amount: ₹{item.amount.toFixed(2)}</span>
                    {item.paidAmount > 0 && (
                      <span className="text-green-600">Paid: ₹{item.paidAmount.toFixed(2)}</span>
                    )}
                    {item.balance > 0 && (
                      <span className="text-red-600">Balance: ₹{item.balance.toFixed(2)}</span>
                    )}
                    {item.dueDate && (
                      <span>Due: {format(item.dueDate, "MMM d, yyyy")}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {feeItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No fee items found for this academic year</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
