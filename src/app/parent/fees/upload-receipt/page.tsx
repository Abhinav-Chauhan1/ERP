export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReceiptUploadForm } from "@/components/fees/receipt-upload-form";
import { ReceiptUploadGuidelines } from "@/components/fees/receipt-upload-guidelines";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Upload Payment Receipt | Parent Portal",
  description: "Upload payment receipt for your child's fees",
};

interface PageProps {
  searchParams: Promise<{
    childId?: string;
  }>;
}

export default async function ParentUploadReceiptPage({ searchParams: searchParamsPromise }: PageProps) {
  // Await searchParams as required by Next.js 15
  const searchParams = await searchParamsPromise;

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

  if (!user || user.role !== "PARENT") {
    redirect("/");
  }

  // Get parent record
  const parent = await db.parent.findUnique({
    where: { userId: user.id },
  });

  if (!parent) {
    redirect("/");
  }

  // Get all children of this parent
  const parentChildren = await db.studentParent.findMany({
    where: {
      parentId: parent.id,
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          enrollments: {
            where: {
              status: "ACTIVE",
            },
            orderBy: {
              enrollDate: "desc",
            },
            take: 1,
            include: {
              class: {
                include: {
                  academicYear: true,
                },
              },
              section: true,
            },
          },
        },
      },
    },
  });

  const children = parentChildren.map((pc) => ({
    id: pc.student.id,
    name: `${pc.student.user.firstName} ${pc.student.user.lastName}`,
    class: pc.student.enrollments[0]?.class.name || "N/A",
    section: pc.student.enrollments[0]?.section.name || "N/A",
    enrollment: pc.student.enrollments[0],
  }));

  if (children.length === 0) {
    return (
      <div className="container p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Children Found</CardTitle>
              <CardDescription>
                No children are associated with your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/parent/fees">
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

  // Get selected child or default to first child
  const selectedChildId = searchParams.childId || children[0].id;
  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  if (!selectedChild.enrollment) {
    return (
      <div className="container p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Active Enrollment</CardTitle>
              <CardDescription>
                {selectedChild.name} is not currently enrolled in any class.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/parent/fees">
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

  // Get applicable fee structures for the selected child
  const feeStructures = await db.feeStructure.findMany({
    where: {
      academicYearId: selectedChild.enrollment.class.academicYearId,
      isActive: true,
      OR: [
        { applicableClasses: null },
        { applicableClasses: { contains: selectedChild.enrollment.class.name } },
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
                There are no fee structures available for {selectedChild.name}'s class at this time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/parent/fees">
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
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/parent/fees">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Fees
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Upload Payment Receipt</h1>
          <p className="text-gray-500">
            Submit payment receipt for verification by the administration
          </p>
        </div>

        {/* Child Selection */}
        {children.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Child</CardTitle>
              <CardDescription>
                Choose which child this payment is for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/parent/fees/upload-receipt?childId=${child.id}`}
                  >
                    <Button
                      variant={child.id === selectedChildId ? "default" : "outline"}
                      size="sm"
                    >
                      {child.name}
                      <span className="ml-2 text-xs opacity-75">
                        ({child.class} - {child.section})
                      </span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Child Info */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-blue-600 font-medium">Uploading receipt for:</p>
                <p className="text-lg font-semibold text-blue-900">{selectedChild.name}</p>
                <p className="text-sm text-blue-700">
                  Class: {selectedChild.class} - {selectedChild.section}
                </p>
              </div>
              <div className="space-y-2 text-sm border-t border-blue-200 pt-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
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
              studentId={selectedChild.id}
              feeStructures={formattedFeeStructures}
              onSuccess={(referenceNumber) => {
                // Redirect to receipts page after success
                setTimeout(() => {
                  window.location.href = `/parent/fees/receipts?childId=${selectedChild.id}`;
                }, 2500);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
