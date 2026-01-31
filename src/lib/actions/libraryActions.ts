"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  bookSchema,
  bookUpdateSchema,
  type BookFormValues,
  type BookUpdateFormValues,
} from "@/lib/schemaValidation/librarySchemaValidation";
import { calculateOverdueFine } from "@/lib/utils/library";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Get all books with pagination and filters
export async function getBooks(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    // Search filter
    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { author: { contains: params.search, mode: "insensitive" } },
        { isbn: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (params?.category) {
      where.category = params.category;
    }

    const [books, total] = await Promise.all([
      db.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              issues: true,
              reservations: true,
            },
          },
        },
      }),
      db.book.count({ where }),
    ]);

    return {
      books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    throw new Error("Failed to fetch books");
  }
}

// Get a single book by ID
export async function getBookById(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const book = await db.book.findUnique({
      where: { id, schoolId },
      include: {
        issues: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { issueDate: "desc" },
          take: 10,
        },
        reservations: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
          where: { status: "ACTIVE" },
          orderBy: { reservedAt: "desc" },
        },
        _count: {
          select: {
            issues: true,
            reservations: true,
          },
        },
      },
    });

    return book;
  } catch (error) {
    console.error("Error fetching book:", error);
    throw new Error("Failed to fetch book");
  }
}

// Get all unique categories
export async function getBookCategories() {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) throw new Error("School context required");
      const books = await db.book.findMany({
        where: { schoolId },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      });

      return books.map((book) => book.category);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Failed to fetch categories");
    }
  }

  // Create a new book
  export async function createBook(data: BookFormValues) {
    try {
      // Validate input
      const validated = bookSchema.parse(data);
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };

      // Check if ISBN already exists
      const existingBook = await db.book.findFirst({
        where: { isbn: validated.isbn, schoolId },
      });

      if (existingBook) {
        return {
          success: false,
          error: "A book with this ISBN already exists",
        };
      }

      // Create book
      const book = await db.book.create({
        data: { ...validated, schoolId },
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/books");

      return {
        success: true,
        data: book,
      };
    } catch (error) {
      console.error("Error creating book:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to create book",
      };
    }
  }

  // Update a book
  export async function updateBook(data: BookUpdateFormValues) {
    try {
      // Validate input
      const validated = bookUpdateSchema.parse(data);
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };

      // Check if book exists
      const existingBook = await db.book.findUnique({
        where: { id: validated.id, schoolId },
      });

      if (!existingBook) {
        return {
          success: false,
          error: "Book not found",
        };
      }

      // Check if ISBN is being changed and if it already exists
      if (validated.isbn !== existingBook.isbn) {
        const isbnExists = await db.book.findFirst({
          where: { isbn: validated.isbn, schoolId },
        });

        if (isbnExists) {
          return {
            success: false,
            error: "A book with this ISBN already exists",
          };
        }
      }

      // Update book
      const { id, ...updateData } = validated;
      const book = await db.book.update({
        where: { id },
        data: updateData,
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/books");
      revalidatePath(`/admin/library/books/${id}`);

      return {
        success: true,
        data: book,
      };
    } catch (error) {
      console.error("Error updating book:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to update book",
      };
    }
  }

  // Delete a book
  export async function deleteBook(id: string) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };
      // Check if book exists
      const book = await db.book.findUnique({
        where: { id, schoolId },
        include: {
          _count: {
            select: {
              issues: true,
              reservations: true,
            },
          },
        },
      });

      if (!book) {
        return {
          success: false,
          error: "Book not found",
        };
      }

      // Check if book has active issues
      const activeIssues = await db.bookIssue.count({
        where: {
          bookId: id,
          status: { in: ["ISSUED", "OVERDUE"] },
        },
      });

      if (activeIssues > 0) {
        return {
          success: false,
          error: "Cannot delete book with active issues",
        };
      }

      // Delete book
      await db.book.delete({
        where: { id, schoolId },
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/books");

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting book:", error);
      return {
        success: false,
        error: "Failed to delete book",
      };
    }
  }

  // Issue a book to a student
  export async function issueBook(data: {
    bookId: string;
    studentId: string;
    dueDate: Date;
  }) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };
      // Validate that book exists and has available copies
      const book = await db.book.findUnique({
        where: { id: data.bookId, schoolId },
      });

      if (!book) {
        return {
          success: false,
          error: "Book not found",
        };
      }

      if (book.available <= 0) {
        return {
          success: false,
          error: "No copies available for this book",
        };
      }

      // Validate that student exists
      const student = await db.student.findUnique({
        where: { id: data.studentId, schoolId },
      });

      if (!student) {
        return {
          success: false,
          error: "Student not found",
        };
      }

      // Check if student already has this book issued
      const existingIssue = await db.bookIssue.findFirst({
        where: {
          bookId: data.bookId,
          studentId: data.studentId,
          status: { in: ["ISSUED", "OVERDUE"] },
          // No direct schoolId on bookIssue, reliable via bookId relation which is already checked
        },
      });

      if (existingIssue) {
        return {
          success: false,
          error: "Student already has this book issued",
        };
      }

      // Create book issue and update available quantity in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create book issue
        const issue = await tx.bookIssue.create({
          data: {
            bookId: data.bookId,
            studentId: data.studentId,
            issueDate: new Date(),
            dueDate: data.dueDate,
            status: "ISSUED",
            schoolId,
          },
          include: {
            book: true,
            student: {
              include: {
                user: true,
              },
            },
          },
        });

        // Update available quantity
        await tx.book.update({
          where: { id: data.bookId },
          data: {
            available: {
              decrement: 1,
            },
          },
        });

        return issue;
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/books");
      revalidatePath(`/admin/library/books/${data.bookId}`);
      revalidatePath("/admin/library/issues");

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error issuing book:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to issue book",
      };
    }
  }

  // Return a book
  export async function returnBook(data: {
    issueId: string;
    returnDate?: Date;
    dailyFineRate?: number;
  }) {
    try {
      const returnDate = data.returnDate || new Date();
      const dailyFineRate = data.dailyFineRate || 5; // Default fine rate: 5 per day

      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };

      // Get the book issue
      const issue = await db.bookIssue.findUnique({
        where: { id: data.issueId },
        include: {
          book: true,
        },
      });

      if (!issue) {
        return {
          success: false,
          error: "Book issue not found",
        };
      }

      // Verify school access
      if (issue.book.schoolId !== schoolId) {
        return {
          success: false,
          error: "Unauthorized access to book issue",
        };
      }

      if (issue.status === "RETURNED") {
        return {
          success: false,
          error: "Book has already been returned",
        };
      }

      // Calculate fine if overdue
      const fine = calculateOverdueFine(
        issue.issueDate,
        issue.dueDate,
        returnDate,
        dailyFineRate
      );

      // Update book issue and increment available quantity in a transaction
      const result = await db.$transaction(async (tx) => {
        // Update book issue
        const updatedIssue = await tx.bookIssue.update({
          where: { id: data.issueId },
          data: {
            returnDate: returnDate,
            fine,
            status: "RETURNED",
          },
          include: {
            book: true,
            student: {
              include: {
                user: true,
              },
            },
          },
        });

        // Increment available quantity
        await tx.book.update({
          where: { id: issue.bookId },
          data: {
            available: {
              increment: 1,
            },
          },
        });

        return updatedIssue;
      });

      // After book is returned, notify students with active reservations
      // This is done outside the transaction to avoid blocking
      try {
        await notifyReservedBookAvailable(issue.bookId);
      } catch (error) {
        console.error("Error notifying reserved book availability:", error);
        // Don't fail the return operation if notification fails
      }

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/books");
      revalidatePath(`/admin/library/books/${issue.bookId}`);
      revalidatePath("/admin/library/issues");

      return {
        success: true,
        data: result,
        fine,
      };
    } catch (error) {
      console.error("Error returning book:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to return book",
      };
    }
  }

  // Get all book issues with pagination and filters
  export async function getBookIssues(params?: {
    page?: number;
    limit?: number;
    status?: string;
    studentId?: string;
    bookId?: string;
  }) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) throw new Error("School context required");
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {
        book: { schoolId },
      };

      // Status filter
      if (params?.status) {
        where.status = params.status;
      }

      // Student filter
      if (params?.studentId) {
        where.studentId = params.studentId;
      }

      // Book filter
      if (params?.bookId) {
        where.bookId = params.bookId;
      }

      const [issues, total] = await Promise.all([
        db.bookIssue.findMany({
          where,
          skip,
          take: limit,
          orderBy: { issueDate: "desc" },
          include: {
            book: true,
            student: {
              include: {
                user: true,
              },
            },
          },
        }),
        db.bookIssue.count({ where }),
      ]);

      return {
        issues,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error fetching book issues:", error);
      throw new Error("Failed to fetch book issues");
    }
  }

  // Get a single book issue by ID
  export async function getBookIssueById(id: string) {
    try {
      const issue = await db.bookIssue.findUnique({
        where: { id },
        include: {
          book: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      return issue;
    } catch (error) {
      console.error("Error fetching book issue:", error);
      throw new Error("Failed to fetch book issue");
    }
  }

  // Update overdue book issues
  export async function updateOverdueIssues() {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all issued books that are past due date
      const overdueIssues = await db.bookIssue.updateMany({
        where: {
          book: { schoolId },
          status: "ISSUED",
          dueDate: {
            lt: today,
          },
        },
        data: {
          status: "OVERDUE",
        },
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/issues");

      return {
        success: true,
        count: overdueIssues.count,
      };
    } catch (error) {
      console.error("Error updating overdue issues:", error);
      return {
        success: false,
        error: "Failed to update overdue issues",
      };
    }
  }



  // Get library statistics
  export async function getLibraryStats() {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) throw new Error("School context required");
      const [
        totalBooks,
        totalQuantity,
        availableBooks,
        issuedBooks,
        overdueBooks,
        activeReservations,
        totalFines,
      ] = await Promise.all([
        db.book.count({ where: { schoolId } }),
        db.book.aggregate({
          _sum: { quantity: true },
          where: { schoolId },
        }),
        db.book.aggregate({
          _sum: { available: true },
          where: { schoolId },
        }),
        db.bookIssue.count({
          where: { status: "ISSUED", book: { schoolId } },
        }),
        db.bookIssue.count({
          where: { status: "OVERDUE", book: { schoolId } },
        }),
        db.bookReservation.count({
          where: { status: "ACTIVE", book: { schoolId } },
        }),
        db.bookIssue.aggregate({
          _sum: { fine: true },
          where: {
            fine: { gt: 0 },
            book: { schoolId },
          },
        }),
      ]);

      return {
        totalBooks,
        totalQuantity: totalQuantity._sum.quantity || 0,
        availableBooks: availableBooks._sum.available || 0,
        issuedBooks,
        overdueBooks,
        activeReservations,
        totalFines: totalFines._sum.fine || 0,
      };
    } catch (error) {
      console.error("Error fetching library stats:", error);
      throw new Error("Failed to fetch library statistics");
    }
  }

  // Get recent book issues and returns
  export async function getRecentLibraryActivity(limit: number = 10) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) throw new Error("School context required");

      const recentIssues = await db.bookIssue.findMany({
        where: { book: { schoolId } },
        take: limit,
        orderBy: { issueDate: "desc" },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      const recentReturns = await db.bookIssue.findMany({
        where: {
          book: { schoolId },
          status: "RETURNED",
          returnDate: { not: null },
        },
        take: limit,
        orderBy: { returnDate: "desc" },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return {
        recentIssues,
        recentReturns,
      };
    } catch (error) {
      console.error("Error fetching recent library activity:", error);
      throw new Error("Failed to fetch recent library activity");
    }
  }

  // ============================================================================
  // BOOK RESERVATION FUNCTIONS
  // ============================================================================

  // Create a book reservation
  export async function createBookReservation(data: {
    bookId: string;
    studentId: string;
    expiresAt?: Date;
  }) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };

      // Validate that book exists
      const book = await db.book.findUnique({
        where: { id: data.bookId },
      });

      if (!book) {
        return {
          success: false,
          error: "Book not found",
        };
      }

      // Check if book has available copies - reservations are only allowed when no copies are available
      if (book.available > 0) {
        return {
          success: false,
          error: "Book is currently available. Please issue the book directly instead of reserving.",
        };
      }

      // Validate that student exists
      const student = await db.student.findUnique({
        where: { id: data.studentId },
        include: {
          user: true,
        },
      });

      if (!student) {
        return {
          success: false,
          error: "Student not found",
        };
      }

      // Check if student already has an active reservation for this book
      const existingReservation = await db.bookReservation.findFirst({
        where: {
          bookId: data.bookId,
          studentId: data.studentId,
          status: "ACTIVE",
        },
      });

      if (existingReservation) {
        return {
          success: false,
          error: "Student already has an active reservation for this book",
        };
      }

      // Check if student already has this book issued
      const existingIssue = await db.bookIssue.findFirst({
        where: {
          bookId: data.bookId,
          studentId: data.studentId,
          status: { in: ["ISSUED", "OVERDUE"] },
        },
      });

      if (existingIssue) {
        return {
          success: false,
          error: "Student already has this book issued",
        };
      }

      // Set expiration date (default: 7 days from now)
      const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create reservation
      const reservation = await db.bookReservation.create({
        data: {
          bookId: data.bookId,
          studentId: data.studentId,
          reservedAt: new Date(),
          expiresAt,
          status: "ACTIVE",
          schoolId,
        },
        include: {
          book: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/books");
      revalidatePath(`/admin/library/books/${data.bookId}`);
      revalidatePath("/admin/library/reservations");

      return {
        success: true,
        data: reservation,
      };
    } catch (error) {
      console.error("Error creating book reservation:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to create book reservation",
      };
    }
  }

  // Get all book reservations with pagination and filters
  export async function getBookReservations(params?: {
    page?: number;
    limit?: number;
    status?: string;
    studentId?: string;
    bookId?: string;
  }) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) throw new Error("School context required");

      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {
        book: { schoolId }
      };

      // Status filter
      if (params?.status) {
        where.status = params.status;
      }

      // Student filter
      if (params?.studentId) {
        where.studentId = params.studentId;
      }

      // Book filter
      if (params?.bookId) {
        where.bookId = params.bookId;
      }

      const [reservations, total] = await Promise.all([
        db.bookReservation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { reservedAt: "desc" },
          include: {
            book: true,
            student: {
              include: {
                user: true,
              },
            },
          },
        }),
        db.bookReservation.count({ where }),
      ]);

      return {
        reservations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error fetching book reservations:", error);
      throw new Error("Failed to fetch book reservations");
    }
  }

  // Get a single book reservation by ID
  export async function getBookReservationById(id: string) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) throw new Error("School context required");

      const reservation = await db.bookReservation.findUnique({
        where: { id },
        include: {
          book: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      return reservation;
    } catch (error) {
      console.error("Error fetching book reservation:", error);
      throw new Error("Failed to fetch book reservation");
    }
  }

  // Cancel a book reservation
  export async function cancelBookReservation(id: string) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };

      // Check if reservation exists
      const reservation = await db.bookReservation.findUnique({
        where: { id },
        include: { book: true }
      });

      if (!reservation) {
        return { success: false, error: "Reservation not found" };
      }

      if (reservation.book.schoolId !== schoolId) {
        return { success: false, error: "Unauthorized access" };
      }

      if (!reservation) {
        return {
          success: false,
          error: "Reservation not found",
        };
      }

      if (reservation.status !== "ACTIVE") {
        return {
          success: false,
          error: "Only active reservations can be cancelled",
        };
      }

      // Update reservation status
      const updatedReservation = await db.bookReservation.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
        include: {
          book: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/books");
      revalidatePath(`/admin/library/books/${reservation.bookId}`);
      revalidatePath("/admin/library/reservations");

      return {
        success: true,
        data: updatedReservation,
      };
    } catch (error) {
      console.error("Error cancelling book reservation:", error);
      return {
        success: false,
        error: "Failed to cancel book reservation",
      };
    }
  }

  // Fulfill a book reservation (when book becomes available and is issued to the student)
  export async function fulfillBookReservation(data: {
    reservationId: string;
    dueDate: Date;
  }) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };

      // Get the reservation
      const reservation = await db.bookReservation.findUnique({
        where: { id: data.reservationId },
        include: {
          book: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!reservation) {
        return {
          success: false,
          error: "Reservation not found",
        };
      }

      if (reservation.status !== "ACTIVE") {
        return {
          success: false,
          error: "Only active reservations can be fulfilled",
        };
      }

      // Check if book has available copies
      if (reservation.book.available <= 0) {
        return {
          success: false,
          error: "No copies available for this book",
        };
      }

      // Create book issue and update reservation status in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create book issue
        const issue = await tx.bookIssue.create({
          data: {
            bookId: reservation.bookId,
            studentId: reservation.studentId,
            issueDate: new Date(),
            dueDate: data.dueDate,
            status: "ISSUED",
            schoolId,
          },
          include: {
            book: true,
            student: {
              include: {
                user: true,
              },
            },
          },
        });

        // Update available quantity
        await tx.book.update({
          where: { id: reservation.bookId },
          data: {
            available: {
              decrement: 1,
            },
          },
        });

        // Update reservation status
        const updatedReservation = await tx.bookReservation.update({
          where: { id: data.reservationId },
          data: {
            status: "FULFILLED",
          },
        });

        return { issue, reservation: updatedReservation };
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/books");
      revalidatePath(`/admin/library/books/${reservation.bookId}`);
      revalidatePath("/admin/library/issues");
      revalidatePath("/admin/library/reservations");

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error fulfilling book reservation:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to fulfill book reservation",
      };
    }
  }

  // Update expired reservations
  export async function updateExpiredReservations() {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };

      const now = new Date();

      // Find all active reservations that have expired
      const expiredReservations = await db.bookReservation.updateMany({
        where: {
          book: { schoolId },
          status: "ACTIVE",
          expiresAt: {
            lt: now,
          },
        },
        data: {
          status: "EXPIRED",
        },
      });

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/reservations");

      return {
        success: true,
        count: expiredReservations.count,
      };
    } catch (error) {
      console.error("Error updating expired reservations:", error);
      return {
        success: false,
        error: "Failed to update expired reservations",
      };
    }
  }

  // Notify students when reserved books become available
  export async function notifyReservedBookAvailable(bookId: string) {
    try {
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId) return { success: false, error: "School context required" };
      
      // Get the book
      const book = await db.book.findUnique({
        where: { id: bookId, schoolId },
      });

      if (!book) {
        return {
          success: false,
          error: "Book not found",
        };
      }

      // Check if book has available copies
      if (book.available <= 0) {
        return {
          success: false,
          error: "No copies available for this book",
        };
      }

      // Get all active reservations for this book, ordered by reservation date (FIFO)
      const activeReservations = await db.bookReservation.findMany({
        where: {
          bookId,
          status: "ACTIVE",
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          book: true,
        },
        orderBy: {
          reservedAt: "asc",
        },
        take: book.available, // Only notify as many students as there are available copies
      });

      if (activeReservations.length === 0) {
        return {
          success: true,
          message: "No active reservations to notify",
          notifiedCount: 0,
        };
      }

      // Create notifications for students
      const { createNotification } = await import("@/lib/utils/notification-utils");

      const notificationPromises = activeReservations.map(async (reservation) => {
        try {
          await createNotification({
            userId: reservation.student.userId,
            schoolId,
            title: "Reserved Book Available",
            message: `The book "${reservation.book.title}" you reserved is now available. Please collect it from the library within 2 days.`,
            type: "GENERAL" as any,
            link: `/student/library/reservations`,
          });

          return { success: true, studentId: reservation.studentId };
        } catch (error) {
          console.error(`Error creating notification for student ${reservation.studentId}:`, error);
          return { success: false, studentId: reservation.studentId };
        }
      });

      const results = await Promise.all(notificationPromises);
      const successCount = results.filter((r) => r.success).length;

      revalidatePath("/admin/library");
      revalidatePath("/admin/library/reservations");

      return {
        success: true,
        message: `Notified ${successCount} out of ${activeReservations.length} students`,
        notifiedCount: successCount,
        totalReservations: activeReservations.length,
      };
    } catch (error) {
      console.error("Error notifying students about available book:", error);
      return {
        success: false,
        error: "Failed to notify students",
      };
    }
  }
