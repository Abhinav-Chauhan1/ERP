"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  logReceiptNoteAdd,
  logReceiptNoteDelete,
} from "@/lib/services/receipt-audit-service";

/**
 * Add a note to a payment receipt
 */
export async function addReceiptNote(receiptId: string, note: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(`${userId}:addReceiptNote`);
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: "Too many requests. Please try again later.",
      };
    }

    // Validate input
    if (!note || note.trim().length === 0) {
      return { success: false, error: "Note cannot be empty" };
    }

    if (note.length > 5000) {
      return { success: false, error: "Note is too long (max 5000 characters)" };
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return { success: false, error: "Only admins can add notes" };
    }

    // Verify receipt exists
    const receipt = await db.paymentReceipt.findUnique({
      where: { id: receiptId },
      select: { id: true },
    });

    if (!receipt) {
      return { success: false, error: "Receipt not found" };
    }

    // Create note
    const receiptNote = await db.receiptNote.create({
      data: {
        receiptId,
        note: note.trim(),
        authorId: user.id,
        authorName: `${user.firstName} ${user.lastName}`,
      },
    });

    revalidatePath("/admin/finance/receipt-verification");

    // Log audit trail
    try {
      await logReceiptNoteAdd(
        user.id,
        receiptId,
        receiptNote.id,
        note.trim()
      );
    } catch (auditError) {
      console.error("Failed to log receipt note addition:", auditError);
    }

    return {
      success: true,
      message: "Note added successfully",
      data: receiptNote,
    };
  } catch (error) {
    console.error("Error adding receipt note:", error);
    return {
      success: false,
      error: "Failed to add note. Please try again.",
    };
  }
}

/**
 * Get all notes for a receipt
 */
export async function getReceiptNotes(receiptId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return { success: false, error: "Only admins can view notes" };
    }

    // Get notes
    const notes = await db.receiptNote.findMany({
      where: { receiptId },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: notes,
    };
  } catch (error) {
    console.error("Error fetching receipt notes:", error);
    return {
      success: false,
      error: "Failed to fetch notes. Please try again.",
    };
  }
}

/**
 * Delete a note (only by the author or super admin)
 */
export async function deleteReceiptNote(noteId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return { success: false, error: "Only admins can delete notes" };
    }

    // Get note to verify ownership
    const note = await db.receiptNote.findUnique({
      where: { id: noteId },
      select: { authorId: true, receiptId: true },
    });

    if (!note) {
      return { success: false, error: "Note not found" };
    }

    // Only allow author to delete their own note
    if (note.authorId !== user.id) {
      return {
        success: false,
        error: "You can only delete your own notes",
      };
    }

    // Delete note
    await db.receiptNote.delete({
      where: { id: noteId },
    });

    revalidatePath("/admin/finance/receipt-verification");

    // Log audit trail
    try {
      await logReceiptNoteDelete(
        user.id,
        note.receiptId,
        noteId
      );
    } catch (auditError) {
      console.error("Failed to log receipt note deletion:", auditError);
    }

    return {
      success: true,
      message: "Note deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting receipt note:", error);
    return {
      success: false,
      error: "Failed to delete note. Please try again.",
    };
  }
}

