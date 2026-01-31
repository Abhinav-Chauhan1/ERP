export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
// Note: Replace currentUser() calls with auth() and access session.user
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { EventsPageClient } from "./events-page-client";
import { auth } from "@/auth";

// Enable caching with revalidation
export const revalidate = 600; // Revalidate every 10 minutes

export default async function EventsPage() {
  // Get current user
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      id: session.user.id
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
              id: true,
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

  const children = parentChildren.map(pc => {
    const firstName = pc.student.user.firstName || '';
    const lastName = pc.student.user.lastName || '';
    
    return {
      id: pc.student.id,
      userId: pc.student.user.id,
      user: {
        firstName,
        lastName,
      },
      name: `${firstName} ${lastName}`.trim() || 'Unnamed Student',
      class: pc.student.enrollments[0]?.class.name || "N/A",
      section: pc.student.enrollments[0]?.section.name || "N/A",
      isPrimary: pc.isPrimary
    };
  });

  if (children.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">No children found in your account.</p>
      </div>
    );
  }

  return (
    <EventsPageClient children={children} />
  );
}
