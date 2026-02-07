import { NextRequest, NextResponse } from "next/server";
import { getLessonContents, getRecommendedContent, getStudentLearningProgress, getLearningStreak } from "@/lib/actions/lesson-content-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");
    const courseId = searchParams.get("courseId");
    const recommended = searchParams.get("recommended") === "true";
    const progress = searchParams.get("progress") === "true";
    const streak = searchParams.get("streak") === "true";
    const studentId = searchParams.get("studentId");
    const limit = searchParams.get("limit");

    if (recommended) {
      const result = await getRecommendedContent(limit ? parseInt(limit) : 5);
      return NextResponse.json({
        success: true,
        data: result
      });
    }

    if (progress) {
      const result = await getStudentLearningProgress(studentId || undefined);
      return NextResponse.json({
        success: true,
        data: result
      });
    }

    if (streak) {
      const result = await getLearningStreak(studentId || undefined);
      return NextResponse.json({
        success: true,
        data: result
      });
    }

    const result = await getLessonContents(
      lessonId || undefined,
      courseId || undefined
    );
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in lessons API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get lesson content"
      },
      { status: 500 }
    );
  }
}