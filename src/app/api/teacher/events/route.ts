import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/teacher/events - List all events
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    // Fetch events with RSVP status for the current user
    const events = await db.event.findMany({
      where,
      orderBy: {
        startDate: 'asc',
      },
      include: {
        rsvps: {
          where: {
            userId: user.id,
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
