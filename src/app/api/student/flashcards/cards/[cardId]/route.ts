import { NextRequest, NextResponse } from "next/server";
import { updateFlashcard, deleteFlashcard } from "@/lib/actions/flashcard-actions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const { front, back, difficulty, tags } = body;
    
    if (!cardId) {
      return NextResponse.json(
        { success: false, message: "Card ID is required" },
        { status: 400 }
      );
    }

    const result = await updateFlashcard(cardId, {
      front,
      back,
      difficulty,
      tags
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in update flashcard API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update flashcard"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    
    if (!cardId) {
      return NextResponse.json(
        { success: false, message: "Card ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteFlashcard(cardId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in delete flashcard API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete flashcard"
      },
      { status: 500 }
    );
  }
}