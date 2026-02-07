import { NextRequest, NextResponse } from "next/server";
import { updateContentProgress, completeContent } from "@/lib/actions/lesson-content-actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const body = await request.json();
    const { progress, timeSpent, status, complete } = body;
    
    if (!contentId) {
      return NextResponse.json(
        { success: false, message: "Content ID is required" },
        { status: 400 }
      );
    }

    let result;
    
    if (complete) {
      result = await completeContent(contentId);
    } else {
      result = await updateContentProgress(contentId, {
        progress,
        timeSpent,
        status
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in update content progress API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update progress"
      },
      { status: 500 }
    );
  }
}