export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, DollarSign, CalendarClock } from "lucide-react";
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
    <div className="container p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/fees">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Fees
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Due Payments</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Overview</CardTitle>
          <CardDescription>
            Summary of your due and upcoming payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="w-full lg:w-2/3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Fees Paid</span>
                <span className="text-sm font-medium">{Math.round(100 - duePercentage)}%</span>
              </div>
              <Progress value={100 - duePercentage} className="h-3" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">0%</span>
                <span className="text-xs text-gray-500">50%</span>
                <span className="text-xs text-gray-500">100%</span>
              </div>
            </div>
            <div className="w-full lg:w-1/3 bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-sm text-blue-700">Total Amount Due</div>
              <div className="text-3xl font-bold text-blue-800">${totalDue.toFixed(2)}</div>
              <div className="text-xs text-blue-600 mt-1">{duePayments.length} payments pending</div>
            </div>
          </div>
          
          {totalDue > 0 && (
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">Payment Reminder</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Please ensure timely payment of your fees to avoid late fees and any disruption
                    to academic services.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Due & Upcoming Payments</CardTitle>
          <CardDescription>
            Pay your pending fees on time to avoid late payment penalties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duePayments.length > 0 ? (
            <div className="space-y-6">
              {duePayments.map((fee) => {
                const isOverdue = fee.dueDate && new Date(fee.dueDate) < today;
                
                return (
                  <div key={fee.id} className={`border rounded-lg p-4 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{fee.feeType.name}</h3>
                          {isOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="outline">Due</Badge>
                          )}
                        </div>
                        
                        {fee.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>
                              Due Date: {format(new Date(fee.dueDate), "MMMM d, yyyy")}
                              {isOverdue && ` (${Math.ceil((today.getTime() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue)`}
                            </span>
                          </div>
                        )}
                        
                        <div className="mt-4 md:mt-2">
                          <p className="text-2xl font-bold">${fee.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Button className={isOverdue ? "bg-red-600 hover:bg-red-700" : ""}>
                          <DollarSign className="h-4 w-4 mr-1" />
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-green-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No Due Payments</h3>
              <p className="text-gray-500">
                You don't have any due payments at the moment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
