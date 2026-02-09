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

    // CRITICAL: Add school isolation - verify class belongs to user's school
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // First verify the class belongs to the school
    const classExists = await db.class.findFirst({
      where: {
        id,
        schoolId, // CRITICAL: Verify class belongs to school
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const sections = await db.classSection.findMany({
      where: {
        classId: id,
        schoolId, // CRITICAL: Filter by current school
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
