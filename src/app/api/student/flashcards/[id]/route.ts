import { NextRequest, NextResponse } from "next/server";
import { getFlashcardDeck, updateFlashcardDeck, deleteFlashcardDeck, getFlashcardStats } from "@/lib/actions/flashcard-actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("stats") === "true";
    
    if (!deckId) {
      return NextResponse.json(
        { success: false, message: "Deck ID is required" },
        { status: 400 }
      );
    }

    const deck = await getFlashcardDeck(deckId);
    let stats = null;

    if (includeStats) {
      stats = await getFlashcardStats(deckId);
    }
    
    return NextResponse.json({
      success: true,
      data: { deck, stats }
    });
  } catch (error) {
    console.error("Error in get flashcard deck API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get flashcard deck"
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    const body = await request.json();
    const { name, description, subject, isPublic } = body;
    
    if (!deckId) {
      return NextResponse.json(
        { success: false, message: "Deck ID is required" },
        { status: 400 }
      );
    }

    const result = await updateFlashcardDeck(deckId, {
      name,
      description,
      subject,
      isPublic
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in update flashcard deck API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update flashcard deck"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    
    if (!deckId) {
      return NextResponse.json(
        { success: false, message: "Deck ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteFlashcardDeck(deckId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in delete flashcard deck API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete flashcard deck"
      },
      { status: 500 }
    );
  }
}