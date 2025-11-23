export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getFeeOverview } from "@/lib/actions/parent-fee-actions";
import { FeeBreakdownCard } from "@/components/parent/fees/fee-breakdown-card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// Enable caching with revalidation
export const revalidate = 300; // Revalidate every 5 minutes

interface PageProps {
  searchParams: Promise<{
    childId?: string;
  }>;
}

export default async function FeeOverviewPage({ searchParams: searchParamsPromise }: PageProps) {
  // Await searchParams as required by Next.js 15
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
  
  // Get all children of this parent
  const parentChildren = await db.studentParent.findMany({
    where: {
      parentId: parent.id
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
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
              section: true
            }
          }
        }
      }
    }
  });
  
  const children = parentChildren.map(pc => ({
    id: pc.student.id,
    name: `${pc.student.user.firstName} ${pc.student.user.lastName}`,
    class: pc.student.enrollments[0]?.class.name || "N/A",
    section: pc.student.enrollments[0]?.section.name || "N/A",
    isPrimary: pc.isPrimary
  }));
  
  if (children.length === 0) {
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Fee Overview</h1>
        <p className="text-gray-700">No children found in your account.</p>
      </div>
    );
  }
  
  // Get selected child or default to first child
  const selectedChildId = searchParams.childId || children[0].id;
  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];
  
  // Get fee overview for selected child
  const feeOverviewResult = await getFeeOverview({ childId: selectedChild.id });
  
  if (!feeOverviewResult.success || !feeOverviewResult.data) {
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Fee Overview</h1>
        <p className="text-red-600">{feeOverviewResult.message || "Failed to load fee overview"}</p>
      </div>
    );
  }
  
  const feeData = feeOverviewResult.data;
  
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fee Overview</h1>
          <p className="text-gray-600 mt-1">View and manage fee payments</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Child Selector */}
          {children.length > 1 && (
            <div className="flex gap-2">
              {children.map((child) => (
                <Link key={child.id} href={`/parent/fees/overview?childId=${child.id}`}>
                  <Button
                    variant={child.id === selectedChildId ? "default" : "outline"}
                    size="sm"
                  >
                    {child.name}
                  </Button>
                </Link>
              ))}
            </div>
          )}
          
          {/* Export to PDF Button */}
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export to PDF
          </Button>
          
          {/* Make Payment Button */}
          <Link href={`/parent/fees/payment?childId=${selectedChild.id}`}>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Fee Breakdown Card */}
      <FeeBreakdownCard
        student={{
          id: feeData.student.id,
          name: feeData.student.name,
          class: feeData.student.class
        }}
        totalFees={feeData.totalFees}
        paidAmount={feeData.paidAmount}
        pendingAmount={feeData.pendingAmount}
        overdueAmount={feeData.overdueAmount}
        feeItems={feeData.feeItems}
        nextDueDate={feeData.nextDueDate}
        hasOverdue={feeData.hasOverdue}
        academicYear={feeData.academicYear}
      />
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={`/parent/fees/history?childId=${selectedChild.id}`}>
          <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <h3 className="font-medium mb-1">Payment History</h3>
            <p className="text-sm text-gray-600">View all past payments and receipts</p>
          </div>
        </Link>
        
        <Link href={`/parent/fees/payment?childId=${selectedChild.id}`}>
          <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <h3 className="font-medium mb-1">Make Payment</h3>
            <p className="text-sm text-gray-600">Pay pending fees online</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
