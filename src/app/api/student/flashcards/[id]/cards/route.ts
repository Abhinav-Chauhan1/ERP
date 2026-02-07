import { NextRequest, NextResponse } from "next/server";
import { createFlashcard } from "@/lib/actions/flashcard-actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    const body = await request.json();
    const { front, back, difficulty, tags } = body;
    
    if (!deckId) {
      return NextResponse.json(
        { success: false, message: "Deck ID is required" },
        { status: 400 }
      );
    }

    if (!front || !back) {
      return NextResponse.json(
        { success: false, message: "Front and back content are required" },
        { status: 400 }
      );
    }

    const result = await createFlashcard(deckId, {
      front,
      back,
      difficulty,
      tags
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in create flashcard API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create flashcard"
      },
      { status: 500 }
    );
  }
}