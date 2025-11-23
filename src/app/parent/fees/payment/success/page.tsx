export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { CheckCircle, Download, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";

interface PageProps {
  searchParams: Promise<{
    receiptNumber?: string;
  }>;
}

export default async function PaymentSuccessPage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;
  // Get current user
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  // Get parent record
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });
  
  if (!parent) {
    redirect("/login");
  }
  
  // Get payment details if receipt number is provided
  let paymentDetails = null;
  if (searchParams.receiptNumber) {
    const payment = await db.feePayment.findFirst({
      where: {
        receiptNumber: searchParams.receiptNumber,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            },
            enrollments: {
              where: { status: "ACTIVE" },
              orderBy: {
                enrollDate: 'desc'
              },
              take: 1,
              include: {
                class: true,
              }
            }
          }
        },
        feeStructure: {
          include: {
            academicYear: true,
          }
        }
      }
    });
    
    // Verify parent-child relationship
    if (payment) {
      const relationship = await db.studentParent.findFirst({
        where: {
          parentId: parent.id,
          studentId: payment.studentId
        }
      });
      
      if (relationship) {
        paymentDetails = {
          receiptNumber: payment.receiptNumber,
          transactionId: payment.transactionId,
          amount: payment.paidAmount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          studentName: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
          studentClass: payment.student.enrollments[0]?.class.name || "N/A",
          academicYear: payment.feeStructure.academicYear.name,
        };
      }
    }
  }
  
  return (
    <div className="h-full p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
          <p className="text-gray-600 mt-2">
            Your payment has been processed successfully
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Payment Details */}
          {paymentDetails && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium text-sm text-gray-700 mb-3">Transaction Details</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Receipt Number</p>
                  <p className="font-medium">{paymentDetails.receiptNumber}</p>
                </div>
                
                {paymentDetails.transactionId && (
                  <div>
                    <p className="text-gray-500">Transaction ID</p>
                    <p className="font-mono text-xs">{paymentDetails.transactionId}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-gray-500">Amount Paid</p>
                  <p className="font-bold text-green-700">${paymentDetails.amount.toFixed(2)}</p>
                </div>
                
                <div>
                  <p className="text-gray-500">Payment Date</p>
                  <p className="font-medium">{format(new Date(paymentDetails.paymentDate), "MMM d, yyyy")}</p>
                </div>
                
                <div>
                  <p className="text-gray-500">Student</p>
                  <p className="font-medium">{paymentDetails.studentName}</p>
                </div>
                
                <div>
                  <p className="text-gray-500">Class</p>
                  <p className="font-medium">{paymentDetails.studentClass}</p>
                </div>
                
                <div>
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-medium">
                    {paymentDetails.paymentMethod.split("_").map(word => 
                      word.charAt(0) + word.slice(1).toLowerCase()
                    ).join(" ")}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-500">Academic Year</p>
                  <p className="font-medium">{paymentDetails.academicYear}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirmation Message */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>What's next?</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>A confirmation email has been sent to your registered email address</li>
              <li>You can download your receipt from the payment history page</li>
              <li>The payment will be reflected in your fee overview shortly</li>
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/parent/fees/overview" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Back to Fee Overview
              </Button>
            </Link>
            
            <Link href="/parent/fees/history" className="flex-1">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                View Payment History
              </Button>
            </Link>
            
            {paymentDetails && (
              <Button variant="default" className="flex-1" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            )}
          </div>
          
          {/* Support Information */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>Need help? Contact the school office or email support@school.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
