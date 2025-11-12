import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser || dbUser.role !== UserRole.PARENT) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const parent = await db.parent.findUnique({
      where: { userId: dbUser.id },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, message: "Parent record not found" },
        { status: 404 }
      );
    }

    const parentChildren = await db.studentParent.findMany({
      where: { parentId: parent.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
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
              orderBy: { enrollDate: "desc" },
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
      firstName: pc.student.user.firstName,
      lastName: pc.student.user.lastName,
      avatar: pc.student.user.avatar,
      class: pc.student.enrollments[0]?.class.name || "N/A",
      section: pc.student.enrollments[0]?.section.name || "N/A",
      isPrimary: pc.isPrimary,
    }));

    return NextResponse.json({
      success: true,
      children,
    });
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch children" },
      { status: 500 }
    );
  }
}
