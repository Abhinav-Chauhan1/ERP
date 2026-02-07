import { NextRequest, NextResponse } from "next/server";
import { recordFlashcardReview } from "@/lib/actions/flashcard-actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const { correct } = body;
    
    if (!cardId) {
      return NextResponse.json(
        { success: false, message: "Card ID is required" },
        { status: 400 }
      );
    }

    if (typeof correct !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Correct must be a boolean value" },
        { status: 400 }
      );
    }

    const result = await recordFlashcardReview(cardId, correct);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in record flashcard review API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to record review"
      },
      { status: 500 }
    );
  }
}