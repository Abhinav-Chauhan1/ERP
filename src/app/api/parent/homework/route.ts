import { NextRequest, NextResponse } from "next/server";
import { getHomework } from "@/lib/actions/parent-academic-actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get("childId");
    const status = searchParams.get("status") as any;
    const subjectId = searchParams.get("subjectId");

    if (!childId) {
      return NextResponse.json(
        { success: false, message: "Child ID is required" },
        { status: 400 }
      );
    }

    const filters: any = {};
    
    if (status && status !== "ALL") {
      filters.status = status;
    }
    
    if (subjectId) {
      filters.subjectId = subjectId;
    }

    const result = await getHomework(childId, filters);

    return NextResponse.json({
      success: true,
      homework: result.homework,
      enrollment: result.enrollment,
    });
  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch homework" },
      { status: 500 }
    );
  }
}
