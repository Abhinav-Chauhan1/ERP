export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReceiptUploadForm } from "@/components/fees/receipt-upload-form";
import { ReceiptUploadGuidelines } from "@/components/fees/receipt-upload-guidelines";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Upload Payment Receipt | Student Portal",
  description: "Upload your payment receipt for verification",
};

export default async function StudentUploadReceiptPage() {
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
    include: {
      enrollments: {
        where: {
          status: "ACTIVE",
        },
        include: {
          class: {
            include: {
              academicYear: true,
            },
          },
        },
      },
    },
  });

  if (!student || !student.enrollments[0]) {
    return (
      <div className="container p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Active Enrollment</CardTitle>
              <CardDescription>
                You need to be enrolled in a class to upload payment receipts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/student/fees">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Fees
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const enrollment = student.enrollments[0];

  // Get applicable fee structures for the student
  const feeStructures = await db.feeStructure.findMany({
    where: {
      academicYearId: enrollment.class.academicYearId,
      isActive: true,
      OR: [
        { applicableClasses: null },
        { applicableClasses: { contains: enrollment.class.name } },
      ],
    },
    include: {
      academicYear: true,
      items: {
        include: {
          feeType: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  if (feeStructures.length === 0) {
    return (
      <div className="container p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Fee Structures Available</CardTitle>
              <CardDescription>
                There are no fee structures available for your class at this time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/student/fees">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Fees
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Format fee structures for the form
  const formattedFeeStructures = feeStructures.map((structure) => ({
    id: structure.id,
    name: structure.name,
    amount: structure.items.reduce((sum, item) => sum + item.amount, 0),
  }));

  return (
    <div className="container p-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/student/fees" className="hover:text-gray-900">
            Fees & Payments
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Upload Receipt</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/student/fees">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Fees
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Upload Payment Receipt</h1>
          <p className="text-gray-500">
            Submit your payment receipt for verification by the administration
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 text-sm flex-1">
                <p className="font-medium text-blue-900">Before you upload:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Ensure the receipt image is clear and readable</li>
                  <li>All payment details should be visible</li>
                  <li>Accepted formats: JPEG, PNG, PDF (max 5MB)</li>
                  <li>You will receive a reference number after upload</li>
                  <li>You will be notified once your receipt is verified</li>
                </ul>
              </div>
              <div className="flex-shrink-0">
                <ReceiptUploadGuidelines />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Receipt Details</CardTitle>
            <CardDescription>
              Fill in the payment details and upload your receipt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReceiptUploadForm
              studentId={student.id}
              feeStructures={formattedFeeStructures}
              onSuccess={(referenceNumber) => {
                // Redirect to receipts page after success
                setTimeout(() => {
                  window.location.href = "/student/fees/receipts";
                }, 2500);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
