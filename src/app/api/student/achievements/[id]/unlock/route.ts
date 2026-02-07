import { NextRequest, NextResponse } from "next/server";
import { unlockAchievement } from "@/lib/actions/student-achievements-actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: achievementId } = await params;
    
    if (!achievementId) {
      return NextResponse.json(
        { success: false, message: "Achievement ID is required" },
        { status: 400 }
      );
    }

    const result = await unlockAchievement(achievementId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in unlock achievement API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to unlock achievement"
      },
      { status: 500 }
    );
  }
}