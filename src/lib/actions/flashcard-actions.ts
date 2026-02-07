"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { revalidatePath } from "next/cache";

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  subject: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  cards: Flashcard[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all flashcard decks for a student
 */
export async function getFlashcardDecks(studentId?: string) {
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

    // Verify access - students can only view their own decks
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    const decks = await db.flashcardDeck.findMany({
      where: {
        studentId: targetStudentId,
        schoolId
      },
      include: {
        cards: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return decks;
  } catch (error) {
    console.error("Error getting flashcard decks:", error);
    throw error;
  }
}

/**
 * Get a specific flashcard deck with cards
 */
export async function getFlashcardDeck(deckId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    const deck = await db.flashcardDeck.findFirst({
      where: {
        id: deckId,
        schoolId
      },
      include: {
        cards: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        student: true
      }
    });

    if (!deck) {
      throw new Error("Deck not found");
    }

    // Verify access - students can only view their own decks
    if (session.user.role === "STUDENT" && deck.student.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    return deck;
  } catch (error) {
    console.error("Error getting flashcard deck:", error);
    throw error;
  }
}

/**
 * Create a new flashcard deck
 */
export async function createFlashcardDeck(data: {
  name: string;
  description?: string;
  subject: string;
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

    const deck = await db.flashcardDeck.create({
      data: {
        studentId: student.id,
        schoolId,
        name: data.name,
        description: data.description,
        subject: data.subject,
        isPublic: data.isPublic || false
      },
      include: {
        cards: true
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, deck };
  } catch (error) {
    console.error("Error creating flashcard deck:", error);
    return { success: false, message: "Failed to create deck" };
  }
}

/**
 * Update a flashcard deck
 */
export async function updateFlashcardDeck(
  deckId: string,
  data: {
    name?: string;
    description?: string;
    subject?: string;
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

    // Get the deck and verify ownership
    const deck = await db.flashcardDeck.findFirst({
      where: {
        id: deckId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!deck) {
      return { success: false, message: "Deck not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && deck.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const updatedDeck = await db.flashcardDeck.update({
      where: { id: deckId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.subject && { subject: data.subject }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic })
      },
      include: {
        cards: true
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, deck: updatedDeck };
  } catch (error) {
    console.error("Error updating flashcard deck:", error);
    return { success: false, message: "Failed to update deck" };
  }
}

/**
 * Delete a flashcard deck
 */
export async function deleteFlashcardDeck(deckId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the deck and verify ownership
    const deck = await db.flashcardDeck.findFirst({
      where: {
        id: deckId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!deck) {
      return { success: false, message: "Deck not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && deck.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    await db.flashcardDeck.delete({
      where: { id: deckId }
    });

    revalidatePath('/student/study-tools');
    return { success: true, message: "Deck deleted successfully" };
  } catch (error) {
    console.error("Error deleting flashcard deck:", error);
    return { success: false, message: "Failed to delete deck" };
  }
}

/**
 * Create a new flashcard in a deck
 */
export async function createFlashcard(
  deckId: string,
  data: {
    front: string;
    back: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    tags?: string[];
  }
) {
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

    // Verify deck ownership
    const deck = await db.flashcardDeck.findFirst({
      where: {
        id: deckId,
        studentId: student.id,
        schoolId
      }
    });

    if (!deck) {
      return { success: false, message: "Deck not found or unauthorized" };
    }

    const card = await db.flashcard.create({
      data: {
        deckId,
        studentId: student.id,
        schoolId,
        front: data.front,
        back: data.back,
        difficulty: data.difficulty || 'MEDIUM',
        tags: data.tags || []
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, card };
  } catch (error) {
    console.error("Error creating flashcard:", error);
    return { success: false, message: "Failed to create flashcard" };
  }
}

/**
 * Update a flashcard
 */
export async function updateFlashcard(
  cardId: string,
  data: {
    front?: string;
    back?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    tags?: string[];
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the card and verify ownership
    const card = await db.flashcard.findFirst({
      where: {
        id: cardId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!card) {
      return { success: false, message: "Card not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && card.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const updatedCard = await db.flashcard.update({
      where: { id: cardId },
      data: {
        ...(data.front && { front: data.front }),
        ...(data.back && { back: data.back }),
        ...(data.difficulty && { difficulty: data.difficulty }),
        ...(data.tags && { tags: data.tags })
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, card: updatedCard };
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return { success: false, message: "Failed to update flashcard" };
  }
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(cardId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the card and verify ownership
    const card = await db.flashcard.findFirst({
      where: {
        id: cardId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!card) {
      return { success: false, message: "Card not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && card.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    await db.flashcard.delete({
      where: { id: cardId }
    });

    revalidatePath('/student/study-tools');
    return { success: true, message: "Card deleted successfully" };
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return { success: false, message: "Failed to delete flashcard" };
  }
}

/**
 * Record flashcard review result
 */
export async function recordFlashcardReview(cardId: string, correct: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the card and verify ownership
    const card = await db.flashcard.findFirst({
      where: {
        id: cardId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!card) {
      return { success: false, message: "Card not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && card.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const updatedCard = await db.flashcard.update({
      where: { id: cardId },
      data: {
        correctCount: correct ? card.correctCount + 1 : card.correctCount,
        incorrectCount: correct ? card.incorrectCount : card.incorrectCount + 1,
        lastReviewed: new Date()
      }
    });

    return { success: true, card: updatedCard };
  } catch (error) {
    console.error("Error recording flashcard review:", error);
    return { success: false, message: "Failed to record review" };
  }
}

/**
 * Get flashcard study statistics
 */
export async function getFlashcardStats(deckId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    const deck = await db.flashcardDeck.findFirst({
      where: {
        id: deckId,
        schoolId
      },
      include: {
        cards: true,
        student: true
      }
    });

    if (!deck) {
      throw new Error("Deck not found");
    }

    // Verify access
    if (session.user.role === "STUDENT" && deck.student.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    const totalCards = deck.cards.length;
    const reviewedCards = deck.cards.filter(card => card.lastReviewed).length;
    const totalCorrect = deck.cards.reduce((sum, card) => sum + card.correctCount, 0);
    const totalIncorrect = deck.cards.reduce((sum, card) => sum + card.incorrectCount, 0);
    const totalReviews = totalCorrect + totalIncorrect;
    const accuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;

    const difficultyBreakdown = {
      EASY: deck.cards.filter(card => card.difficulty === 'EASY').length,
      MEDIUM: deck.cards.filter(card => card.difficulty === 'MEDIUM').length,
      HARD: deck.cards.filter(card => card.difficulty === 'HARD').length
    };

    return {
      totalCards,
      reviewedCards,
      totalReviews,
      accuracy: Math.round(accuracy * 100) / 100,
      difficultyBreakdown
    };
  } catch (error) {
    console.error("Error getting flashcard stats:", error);
    throw error;
  }
}