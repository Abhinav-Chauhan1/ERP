import { NextRequest, NextResponse } from "next/server";
import { getStudentAchievements } from "@/lib/actions/student-achievements-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    const result = await getStudentAchievements(studentId || undefined);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in achievements API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get achievements"
      },
      { status: 500 }
    );
  }
}