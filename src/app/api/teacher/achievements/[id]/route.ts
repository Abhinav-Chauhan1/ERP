import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { achievementUpdateSchema } from "@/lib/schemas/teacher-schemas";

// GET /api/teacher/achievements/[id] - Get a specific achievement
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

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user from database - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: userId,
        schoolId, // CRITICAL: Filter by school
      },
      include: {
        teacher: true,
      },
    });

    if (!user || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Fetch achievement - CRITICAL: Filter by school
    const achievement = await db.achievement.findFirst({
      where: {
        id,
        schoolId, // CRITICAL: Ensure achievement belongs to current school
      },
    });

    if (!achievement) {
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (achievement.teacherId !== user.teacher.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error('Error fetching achievement:', error);
    return NextResponse.json(
      { error: "Failed to fetch achievement" },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/achievements/[id] - Update an achievement
export async function PUT(
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

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user from database - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: userId,
        schoolId, // CRITICAL: Filter by school
      },
      include: {
        teacher: true,
      },
    });

    if (!user || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Check if achievement exists and belongs to teacher - CRITICAL: Filter by school
    const existingAchievement = await db.achievement.findFirst({
      where: {
        id,
        schoolId, // CRITICAL: Ensure achievement belongs to current school
      },
    });

    if (!existingAchievement) {
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 }
      );
    }

    if (existingAchievement.teacherId !== user.teacher.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate using centralized schema
    const validation = achievementUpdateSchema.safeParse(body);

    if (!validation.success) {
      // Format validation errors for client
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Validate date is not in the future if provided
    if (validatedData.date) {
      const achievementDate = new Date(validatedData.date);
      const now = new Date();
      if (achievementDate > now) {
        return NextResponse.json(
          {
            message: "Validation failed",
            errors: [{ field: "date", message: "Date cannot be in the future" }],
          },
          { status: 400 }
        );
      }
    }

    // Update achievement
    const achievement = await db.achievement.update({
      where: {
        id,
      },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.category && { category: validatedData.category }),
        ...(validatedData.date && { date: new Date(validatedData.date) }),
        ...(validatedData.documents && { documents: validatedData.documents }),
      },
    });

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error('Error updating achievement:', error);

    // Handle database constraint violations
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { message: "An achievement with this title and date already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to update achievement. Please try again." },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/achievements/[id] - Delete an achievement
export async function DELETE(
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

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user from database - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: userId,
        schoolId, // CRITICAL: Filter by school
      },
      include: {
        teacher: true,
      },
    });

    if (!user || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Check if achievement exists and belongs to teacher - CRITICAL: Filter by school
    const existingAchievement = await db.achievement.findFirst({
      where: {
        id,
        schoolId, // CRITICAL: Ensure achievement belongs to current school
      },
    });

    if (!existingAchievement) {
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 }
      );
    }

    if (existingAchievement.teacherId !== user.teacher.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete achievement
    await db.achievement.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json(
      { error: "Failed to delete achievement" },
      { status: 500 }
    );
  }
}
