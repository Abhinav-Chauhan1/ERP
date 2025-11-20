import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser || dbUser.role !== UserRole.PARENT) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const parent = await db.parent.findUnique({
      where: { userId: dbUser.id },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent not found" },
        { status: 404 }
      );
    }

    // Get all children
    const parentChildren = await db.studentParent.findMany({
      where: { parentId: parent.id },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            enrollments: {
              where: { status: "ACTIVE" },
              orderBy: { enrollDate: 'desc' },
              take: 1,
              include: {
                class: {
                  select: {
                    name: true,
                  },
                },
                section: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const children = parentChildren.map((pc) => ({
      id: pc.student.id,
      user: {
        firstName: pc.student.user.firstName,
        lastName: pc.student.user.lastName,
        avatar: pc.student.user.avatar,
      },
      enrollments: pc.student.enrollments,
      isPrimary: pc.isPrimary,
    }));

    return NextResponse.json({
      success: true,
      children,
    });
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}
