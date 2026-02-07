"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { revalidatePath } from "next/cache";

export interface StudentNote {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  folder?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all notes for a student
 */
export async function getStudentNotes(studentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // If no studentId provided, get current user's student record
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await db.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId
        }
      });
      if (!student) throw new Error("Student not found");
      targetStudentId = student.id;
    }

    // Verify access - students can only view their own notes
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    const notes = await db.studentNote.findMany({
      where: {
        studentId: targetStudentId,
        schoolId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return notes;
  } catch (error) {
    console.error("Error getting student notes:", error);
    throw error;
  }
}

/**
 * Create a new note
 */
export async function createStudentNote(data: {
  title: string;
  content: string;
  subject: string;
  tags?: string[];
  folder?: string;
  isPublic?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get current user's student record
    const student = await db.student.findFirst({
      where: {
        userId: session.user.id,
        schoolId
      }
    });
    if (!student) throw new Error("Student not found");

    const note = await db.studentNote.create({
      data: {
        studentId: student.id,
        schoolId,
        title: data.title,
        content: data.content,
        subject: data.subject,
        tags: data.tags || [],
        folder: data.folder,
        isPublic: data.isPublic || false
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, note };
  } catch (error) {
    console.error("Error creating student note:", error);
    return { success: false, message: "Failed to create note" };
  }
}

/**
 * Update an existing note
 */
export async function updateStudentNote(
  noteId: string,
  data: {
    title?: string;
    content?: string;
    subject?: string;
    tags?: string[];
    folder?: string;
    isPublic?: boolean;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the note and verify ownership
    const note = await db.studentNote.findFirst({
      where: {
        id: noteId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!note) {
      return { success: false, message: "Note not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && note.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const updatedNote = await db.studentNote.update({
      where: { id: noteId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.subject && { subject: data.subject }),
        ...(data.tags && { tags: data.tags }),
        ...(data.folder !== undefined && { folder: data.folder }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic })
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, note: updatedNote };
  } catch (error) {
    console.error("Error updating student note:", error);
    return { success: false, message: "Failed to update note" };
  }
}

/**
 * Delete a note
 */
export async function deleteStudentNote(noteId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the note and verify ownership
    const note = await db.studentNote.findFirst({
      where: {
        id: noteId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!note) {
      return { success: false, message: "Note not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && note.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    await db.studentNote.delete({
      where: { id: noteId }
    });

    revalidatePath('/student/study-tools');
    return { success: true, message: "Note deleted successfully" };
  } catch (error) {
    console.error("Error deleting student note:", error);
    return { success: false, message: "Failed to delete note" };
  }
}

/**
 * Search notes by title, content, or tags
 */
export async function searchStudentNotes(query: string, studentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // If no studentId provided, get current user's student record
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await db.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId
        }
      });
      if (!student) throw new Error("Student not found");
      targetStudentId = student.id;
    }

    // Verify access - students can only search their own notes
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    const notes = await db.studentNote.findMany({
      where: {
        studentId: targetStudentId,
        schoolId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return notes;
  } catch (error) {
    console.error("Error searching student notes:", error);
    throw error;
  }
}

/**
 * Get notes by subject
 */
export async function getNotesBySubject(subject: string, studentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // If no studentId provided, get current user's student record
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await db.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId
        }
      });
      if (!student) throw new Error("Student not found");
      targetStudentId = student.id;
    }

    // Verify access - students can only view their own notes
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    const notes = await db.studentNote.findMany({
      where: {
        studentId: targetStudentId,
        schoolId,
        subject
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return notes;
  } catch (error) {
    console.error("Error getting notes by subject:", error);
    throw error;
  }
}

/**
 * Get notes by folder
 */
export async function getNotesByFolder(folder: string, studentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // If no studentId provided, get current user's student record
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await db.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId
        }
      });
      if (!student) throw new Error("Student not found");
      targetStudentId = student.id;
    }

    // Verify access - students can only view their own notes
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    const notes = await db.studentNote.findMany({
      where: {
        studentId: targetStudentId,
        schoolId,
        folder
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return notes;
  } catch (error) {
    console.error("Error getting notes by folder:", error);
    throw error;
  }
}