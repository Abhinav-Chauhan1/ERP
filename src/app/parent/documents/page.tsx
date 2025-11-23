export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { DocumentsPageClient } from "./documents-page-client";

// Enable caching with revalidation
export const revalidate = 1800; // Revalidate every 30 minutes

interface PageProps {
  searchParams: Promise<{
    childId?: string;
  }>;
}

export default async function DocumentsPage({ searchParams: searchParamsPromise }: PageProps) {
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
        <h1 className="text-2xl font-bold mb-4">Documents</h1>
        <p className="text-gray-700">No children found in your account.</p>
      </div>
    );
  }
  
  // Get selected child or default to first child
  const selectedChildId = searchParams.childId || children[0].id;
  
  return (
    <DocumentsPageClient 
      children={children}
      selectedChildId={selectedChildId}
    />
  );
}
