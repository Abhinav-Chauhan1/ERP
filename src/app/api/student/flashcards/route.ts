import { NextRequest, NextResponse } from "next/server";
import { getFlashcardDecks, createFlashcardDeck } from "@/lib/actions/flashcard-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    const result = await getFlashcardDecks(studentId || undefined);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in flashcards API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get flashcard decks"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, subject, isPublic } = body;

    if (!name || !subject) {
      return NextResponse.json(
        { success: false, message: "Name and subject are required" },
        { status: 400 }
      );
    }

    const result = await createFlashcardDeck({
      name,
      description,
      subject,
      isPublic
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in create flashcard deck API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create flashcard deck"
      },
      { status: 500 }
    );
  }
}