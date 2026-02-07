import { NextRequest, NextResponse } from "next/server";
import { getLessonContent } from "@/lib/actions/lesson-content-actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    
    if (!contentId) {
      return NextResponse.json(
        { success: false, message: "Content ID is required" },
        { status: 400 }
      );
    }

    const result = await getLessonContent(contentId);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in get lesson content API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get lesson content"
      },
      { status: 500 }
    );
  }
}