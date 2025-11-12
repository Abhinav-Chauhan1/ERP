import { NextRequest, NextResponse } from "next/server";
import { getFullTimetable } from "@/lib/actions/parent-academic-actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get("childId");
    const weekParam = searchParams.get("week");

    if (!childId) {
      return NextResponse.json(
        { success: false, message: "Child ID is required" },
        { status: 400 }
      );
    }

    const week = weekParam ? new Date(weekParam) : undefined;

    const result = await getFullTimetable(childId, week);

    return NextResponse.json({
      success: true,
      timetable: result.timetable,
      enrollment: result.enrollment,
      weekStart: result.weekStart,
      weekEnd: result.weekEnd,
    });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}
