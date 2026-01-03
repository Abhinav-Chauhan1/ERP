import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface ReceiptVerificationWidgetProps {
  pendingCount: number;
  verifiedToday: number;
  rejectedToday: number;
  oldestPendingDays: number;
  averageVerificationTime: number;
  rejectionRate: number;
  trend: "up" | "down" | "stable";
  className?: string;
}

export function ReceiptVerificationWidget({
  pendingCount,
  verifiedToday,
  rejectedToday,
  oldestPendingDays,
  averageVerificationTime,
  rejectionRate,
  trend,
  className,
}: ReceiptVerificationWidgetProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-medium">Receipt Verification</CardTitle>
          <CardDescription>Offline payment receipts status</CardDescription>
        </div>
        <Receipt className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Receipts Alert */}
        {pendingCount > 0 && (
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            oldestPendingDays > 5 
              ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900" 
              : oldestPendingDays > 2
              ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900"
              : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900"
          }`}>
            <AlertCircle className={`h-5 w-5 flex-shrink-0 ${
              oldestPendingDays > 5 
                ? "text-red-600" 
                : oldestPendingDays > 2
                ? "text-amber-600"
                : "text-blue-600"
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${
                oldestPendingDays > 5 
                  ? "text-red-900 dark:text-red-100" 
                  : oldestPendingDays > 2
                  ? "text-amber-900 dark:text-amber-100"
                  : "text-blue-900 dark:text-blue-100"
              }`}>
                {pendingCount} Pending Receipt{pendingCount !== 1 ? "s" : ""}
              </p>
              <p className={`text-xs ${
                oldestPendingDays > 5 
                  ? "text-red-700 dark:text-red-300" 
                  : oldestPendingDays > 2
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-blue-700 dark:text-blue-300"
              }`}>
                Oldest waiting: {oldestPendingDays} day{oldestPendingDays !== 1 ? "s" : ""}
              </p>
            </div>
            <Badge variant={oldestPendingDays > 5 ? "destructive" : "secondary"}>
              {pendingCount}
            </Badge>
          </div>
        )}

        {/* Today's Activity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Verified Today</p>
              <p className="text-lg font-bold text-green-600">{verifiedToday}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Rejected Today</p>
              <p className="text-lg font-bold text-red-600">{rejectedToday}</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Avg. Time</span>
            </div>
            <span className="font-medium">{averageVerificationTime.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4" />
              )}
              <span className="text-muted-foreground">Rejection Rate</span>
            </div>
            <span className={`font-medium ${
              rejectionRate > 30 ? "text-red-600" : 
              rejectionRate > 15 ? "text-amber-600" : 
              "text-green-600"
            }`}>
              {rejectionRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link href="/admin/finance/receipt-verification">
              <Receipt className="h-4 w-4 mr-1" />
              Verify
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/admin/finance/receipt-analytics">
              Analytics
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
