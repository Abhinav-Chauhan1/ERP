import { NextRequest, NextResponse } from "next/server";
import { updateStudentNote, deleteStudentNote } from "@/lib/actions/student-notes-actions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;
    const body = await request.json();
    const { title, content, subject, tags, folder, isPublic } = body;
    
    if (!noteId) {
      return NextResponse.json(
        { success: false, message: "Note ID is required" },
        { status: 400 }
      );
    }

    const result = await updateStudentNote(noteId, {
      title,
      content,
      subject,
      tags,
      folder,
      isPublic
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in update note API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update note"
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
    const { id: noteId } = await params;
    
    if (!noteId) {
      return NextResponse.json(
        { success: false, message: "Note ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteStudentNote(noteId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in delete note API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete note"
      },
      { status: 500 }
    );
  }
}