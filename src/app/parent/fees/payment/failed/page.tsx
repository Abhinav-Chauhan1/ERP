export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { XCircle, Home, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    error?: string;
    childId?: string;
  }>;
}

export default async function PaymentFailedPage({ searchParams: searchParamsPromise }: PageProps) {
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
  
  const errorMessage = searchParams.error || "Payment could not be completed";
  const childId = searchParams.childId;
  
  return (
    <div className="h-full p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-700">Payment Failed</CardTitle>
          <p className="text-gray-600 mt-2">
            We couldn't process your payment
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Message */}
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Transaction Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          
          {/* Common Reasons */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Common reasons for payment failure
            </h3>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Insufficient funds in your account</li>
              <li>Incorrect card details or expired card</li>
              <li>Payment gateway timeout or network issues</li>
              <li>Bank declined the transaction</li>
              <li>Daily transaction limit exceeded</li>
              <li>Payment was cancelled by user</li>
            </ul>
          </div>
          
          {/* What to do next */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">
              What should you do next?
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Check your bank account balance and card details</li>
              <li>Try using a different payment method</li>
              <li>Contact your bank if the issue persists</li>
              <li>Reach out to school support for assistance</li>
            </ul>
          </div>
          
          {/* Important Note */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> If any amount was deducted from your account, it will be automatically 
              refunded within 5-7 business days. Please check your payment history or contact support 
              if you don't receive the refund.
            </AlertDescription>
          </Alert>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href={childId ? `/parent/fees/payment?childId=${childId}` : "/parent/fees/payment"} 
              className="flex-1"
            >
              <Button variant="default" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Link>
            
            <Link href="/parent/fees/overview" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Back to Fee Overview
              </Button>
            </Link>
          </div>
          
          {/* Support Information */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Need immediate assistance?</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <a href="tel:+1234567890" className="text-blue-600 hover:underline">
                Call: +1 (234) 567-890
              </a>
              <span className="hidden sm:inline text-gray-400">|</span>
              <a href="mailto:support@school.com" className="text-blue-600 hover:underline">
                Email: support@school.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
