import { NextRequest, NextResponse } from "next/server";
import { getStudentNotes, createStudentNote, searchStudentNotes } from "@/lib/actions/student-notes-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const query = searchParams.get("q");
    const subject = searchParams.get("subject");
    const folder = searchParams.get("folder");

    let result;
    
    if (query) {
      result = await searchStudentNotes(query, studentId || undefined);
    } else if (subject) {
      const { getNotesBySubject } = await import("@/lib/actions/student-notes-actions");
      result = await getNotesBySubject(subject, studentId || undefined);
    } else if (folder) {
      const { getNotesByFolder } = await import("@/lib/actions/student-notes-actions");
      result = await getNotesByFolder(folder, studentId || undefined);
    } else {
      result = await getStudentNotes(studentId || undefined);
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in notes API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get notes"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, subject, tags, folder, isPublic } = body;

    if (!title || !content || !subject) {
      return NextResponse.json(
        { success: false, message: "Title, content, and subject are required" },
        { status: 400 }
      );
    }

    const result = await createStudentNote({
      title,
      content,
      subject,
      tags,
      folder,
      isPublic
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in create note API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create note"
      },
      { status: 500 }
    );
  }
}