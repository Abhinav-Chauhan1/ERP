import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { rsvpStatusEnum } from "@/lib/schemas/teacher-schemas";
import { retryOperation } from "@/lib/utils/database-helpers";

// Schema for RSVP submission
const rsvpSchema = z.object({
  status: rsvpStatusEnum,
});

// POST /api/teacher/events/[id]/rsvp - Submit or update RSVP
export async function POST(
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
        id: userId,      },
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

    // Verify event exists - CRITICAL: Filter by school
    const event = await db.event.findFirst({
      where: { 
        id,
        schoolId, // CRITICAL: Ensure event belongs to current school
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate using schema
    const validation = rsvpSchema.safeParse(body);

    if (!validation.success) {
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

    // Create or update RSVP with retry logic for transient errors
    const rsvp = await retryOperation(
      async () => {
        return await db.eventRSVP.upsert({
          where: {
            eventId_userId: {
              eventId: id,
              userId: user.id,
            },
          },
          update: {
            status: validatedData.status,
          },
          create: {
            eventId: id,
            userId: user.id,
            status: validatedData.status,
            schoolId: user.teacher?.schoolId || '',
          },
        });
      },
      {
        maxRetries: 2,
        initialDelay: 100,
      }
    );

    return NextResponse.json({ rsvp }, { status: 200 });
  } catch (error) {
    console.error('Error submitting RSVP:', error);

    // Handle database constraint violations
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { message: "Event or user not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to submit RSVP. Please try again." },
      { status: 500 }
    );
  }
}
