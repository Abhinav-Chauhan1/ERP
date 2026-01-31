export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Upload, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptHistoryList } from "@/components/fees/receipt-history-list";
import { getStudentReceipts } from "@/lib/actions/paymentReceiptActions";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Payment Receipts | Student Portal",
  description: "View your uploaded payment receipts",
};

export default async function StudentReceiptsPage() {
  // Get authenticated user
  const session = await auth();
    const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  // Find user in database
  const user = await db.user.findFirst({
    where: { id: userId },
  });

  if (!user || user.role !== "STUDENT") {
    redirect("/");
  }

  // Get student record
  const student = await db.student.findUnique({
    where: { userId: user.id },
  });

  if (!student) {
    redirect("/");
  }

  // Fetch student's receipts
  const result = await getStudentReceipts(student.id);

  const rawReceipts = result.success ? result.data || [] : [];
  
  // Transform receipts to ensure firstName and lastName are strings
  const receipts = rawReceipts.map(receipt => ({
    ...receipt,
    student: {
      ...receipt.student,
      user: {
        ...receipt.student.user,
        firstName: receipt.student.user.firstName || '',
        lastName: receipt.student.user.lastName || '',
        email: receipt.student.user.email || '',
      }
    }
  }));

  return (
    <div className="container p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/student/fees" className="hover:text-gray-900">
            Fees & Payments
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Receipt History</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/student/fees">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Fees
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Payment Receipts</h1>
              <p className="text-gray-500">
                View and track your uploaded payment receipts
              </p>
            </div>
            <Button asChild>
              <Link href="/student/fees/upload-receipt">
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt
              </Link>
            </Button>
          </div>
        </div>

        {/* Receipt History List */}
        <ReceiptHistoryList 
          receipts={receipts} 
          uploadUrl="/student/fees/upload-receipt"
        />
      </div>
    </div>
  );
}
