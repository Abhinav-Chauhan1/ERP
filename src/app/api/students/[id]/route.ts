import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSchoolAuth } from "@/lib/auth/security-wrapper";

export const GET = withSchoolAuth(async (
  request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    // CRITICAL: Filter by both id AND schoolId for security
    const student = await db.student.findFirst({
      where: { 
        id,
        schoolId: context.schoolId, // CRITICAL: Ensure student belongs to current school
      },
      include: {
        user: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true
              }
            }
          }
        },
        enrollments: {
          include: {
            class: true,
            section: true,
          },
          where: {
            status: "ACTIVE",
            schoolId: context.schoolId, // CRITICAL: Filter enrollments by school
          },
          take: 1
        },
        examResults: {
          include: {
            exam: {
              include: {
                subject: true
              }
            }
          },
          where: {
            schoolId: context.schoolId, // CRITICAL: Filter exam results by school
          },
          orderBy: {
            exam: {
              examDate: 'desc'
            }
          },
          take: 5
        },
        attendance: {
          where: {
            schoolId: context.schoolId, // CRITICAL: Filter attendance by school
          },
          orderBy: {
            date: 'desc'
          },
          take: 10
        }
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
