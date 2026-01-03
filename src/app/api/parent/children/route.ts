import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * GET /api/parent/children
 * 
 * Fetch all children for the authenticated parent
 * Used by parent calendar and other parent features
 * 
 * Requirements: 4.2 - Provide child selector for multi-child filtering
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || user.role !== UserRole.PARENT) {
      return NextResponse.json(
        { error: "Unauthorized - Parent access required" },
        { status: 403 }
      );
    }

    // Get parent record
    const parent = await db.parent.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent record not found" },
        { status: 404 }
      );
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
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
            enrollments: {
              orderBy: {
                enrollDate: "desc",
              },
              take: 1,
              include: {
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                section: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        isPrimary: "desc", // Primary child first
      },
    });

    // Transform data
    const children = parentChildren.map((pc) => ({
      id: pc.student.id,
      user: pc.student.user,
      enrollments: pc.student.enrollments,
      isPrimary: pc.isPrimary,
    }));

    return NextResponse.json({
      success: true,
      children,
    });
  } catch (error) {
    console.error("Error fetching parent children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}
