export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, DollarSign, CalendarClock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDuePayments } from "@/lib/actions/student-fee-actions";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Due Payments | Student Portal",
  description: "View and pay your pending fee payments",
};

export default async function DuePaymentsPage() {
  const { duePayments, totalDue, feeStructure } = await getDuePayments();
  
  // Get today's date for comparison
  const today = new Date();
  
  // Calculate total fees
  const totalFees = feeStructure?.items.reduce((sum, item) => sum + item.amount, 0) || 0;
  const duePercentage = totalFees > 0 ? (totalDue / totalFees) * 100 : 0;
  
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
          <h1 className="text-2xl font-bold tracking-tight">Due Payments</h1>
          <p className="text-muted-foreground mt-1">
            View and pay your pending fee payments
          </p>
        </div>
      </div>
      
      <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Payment Overview</CardTitle>
          <CardDescription>
            Summary of your due and upcoming payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="w-full lg:w-2/3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-amber-900">Fees Paid</span>
                <span className="text-sm font-semibold text-amber-900">{Math.round(100 - duePercentage)}%</span>
              </div>
              <Progress value={100 - duePercentage} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-amber-700">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg text-center shadow-sm border border-amber-200">
              <div className="text-sm text-amber-700 mb-1">Total Amount Due</div>
              <div className="text-4xl font-bold text-amber-900">${totalDue.toFixed(2)}</div>
              <div className="text-xs text-amber-600 mt-2">{duePayments.length} payments pending</div>
            </div>
          </div>
          
          {totalDue > 0 && (
            <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900">Payment Reminder</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Please ensure timely payment of your fees to avoid late fees and any disruption
                    to academic services.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Due & Upcoming Payments</CardTitle>
          <CardDescription>
            Pay your pending fees on time to avoid late payment penalties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duePayments.length > 0 ? (
            <div className="space-y-4">
              {duePayments.map((fee) => {
                const isOverdue = fee.dueDate && new Date(fee.dueDate) < today;
                
                return (
                  <Card key={fee.id} className={`overflow-hidden hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{fee.feeType.name}</h3>
                            {isOverdue ? (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Due</Badge>
                            )}
                          </div>
                          
                          {fee.dueDate && (
                            <div className={`flex items-center gap-1 text-sm mb-3 ${isOverdue ? 'text-red-700' : 'text-muted-foreground'}`}>
                              <CalendarClock className="h-4 w-4" />
                              <span>
                                Due Date: {format(new Date(fee.dueDate), "MMMM d, yyyy")}
                                {isOverdue && ` (${Math.ceil((today.getTime() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue)`}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">${fee.amount.toFixed(2)}</p>
                            <span className="text-sm text-muted-foreground">amount due</span>
                          </div>
                        </div>
                        
                        <div>
                          <Button 
                            className={`min-h-[44px] ${isOverdue ? "bg-red-600 hover:bg-red-700" : ""}`}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="rounded-full bg-green-100 p-6 mb-4 inline-block">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Due Payments</h3>
              <p className="text-muted-foreground">
                You don't have any due payments at the moment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
