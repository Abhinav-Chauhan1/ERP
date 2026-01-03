import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
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
            status: "ACTIVE"
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
          orderBy: {
            exam: {
              examDate: 'desc'
            }
          },
          take: 5
        },
        attendance: {
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
}
