import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { achievementSchema } from "@/lib/schemas/teacher-schemas";

// GET /api/teacher/achievements - List teacher's achievements
export async function GET(request: NextRequest) {
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
      where: { id: userId },
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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // Build where clause
    const where: any = {
      teacherId: user.teacher.id,
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    // Fetch achievements
    const achievements = await db.achievement.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/achievements - Create a new achievement
export async function POST(request: NextRequest) {
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
      where: { id: userId },
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

    // Parse and validate request body
    const body = await request.json();

    // Validate using centralized schema
    const validation = achievementSchema.safeParse(body);

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

    // Ensure the teacherId matches the authenticated teacher
    if (validatedData.teacherId !== user.teacher.id) {
      return NextResponse.json(
        { message: "You can only create achievements for yourself" },
        { status: 403 }
      );
    }

    // Validate date is not in the future
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

    // Create achievement
    const achievement = await db.achievement.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        date: achievementDate,
        documents: validatedData.documents || [],
        teacherId: validatedData.teacherId,
        schoolId: user.teacher.schoolId,
      },
    });

    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement:', error);

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
      { message: "Failed to create achievement. Please try again." },
      { status: 500 }
    );
  }
}
