export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReceiptHistoryList } from "@/components/fees/receipt-history-list";
import { getStudentReceipts } from "@/lib/actions/paymentReceiptActions";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Payment Receipts | Parent Portal",
  description: "View your children's uploaded payment receipts",
};

interface PageProps {
  searchParams: Promise<{
    childId?: string;
  }>;
}

export default async function ParentReceiptsPage({ searchParams: searchParamsPromise }: PageProps) {
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
              class: true,
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
  }));

  if (children.length === 0) {
    return (
      <div className="container p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  No Children Found
                </h3>
                <p className="text-sm text-gray-500">
                  No children are associated with your account.
                </p>
                <Button asChild>
                  <Link href="/parent/fees">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Fees
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get selected child or default to first child
  const selectedChildId = searchParams.childId || children[0].id;
  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  // Fetch receipts for selected child
  const result = await getStudentReceipts(selectedChild.id);
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
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/parent/fees">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Fees
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Payment Receipts</h1>
              <p className="text-gray-500">
                View and track uploaded payment receipts
              </p>
            </div>
            <Button asChild>
              <Link href={`/parent/fees/upload-receipt?childId=${selectedChild.id}`}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt
              </Link>
            </Button>
          </div>
        </div >

        {/* Child Selection */}
        {
          children.length > 1 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Child
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/parent/fees/receipts?childId=${child.id}`}
                      >
                        <Button
                          variant={child.id === selectedChild.id ? "default" : "outline"}
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
                </div>
              </CardContent>
            </Card>
          )
        }

        {/* Selected Child Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Viewing receipts for:</p>
          <p className="text-lg font-semibold text-blue-900">{selectedChild.name}</p>
          <p className="text-sm text-blue-700">
            Class: {selectedChild.class} - {selectedChild.section}
          </p>
        </div>

        {/* Receipt History List */}
        <ReceiptHistoryList
          receipts={receipts}
          uploadUrl={`/parent/fees/upload-receipt?childId=${selectedChild.id}`}
        />
      </div >
    </div >
  );
}
