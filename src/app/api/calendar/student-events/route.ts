import { NextResponse } from "next/server";
import { getStudentCalendarEvents } from "@/lib/actions/calendar-widget-actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "5", 10) || 5, 1), 100);

  const result = await getStudentCalendarEvents(limit);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 401 }
    );
  }

  return NextResponse.json(result.data);
}
