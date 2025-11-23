import { describe, it, expect, beforeEach, vi } from "vitest";
import { 
  issueBook, 
  returnBook, 
  createBookReservation,
  cancelBookReservation,
  fulfillBookReservation,
  notifyReservedBookAvailable 
} from "./libraryActions";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    book: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
    bookIssue: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    bookReservation: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock notification utilities
vi.mock("@/lib/utils/notification-utils", () => ({
  createNotification: vi.fn(),
}));

describe("Library Actions - Book Issue and Return", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("issueBook", () => {
    it("should successfully issue a book when all conditions are met", async () => {
      const { db } = await import("@/lib/db");
      
      const mockBook = {
        id: "book-1",
        isbn: "1234567890",
        title: "Test Book",
        author: "Test Author",
        category: "Fiction",
        quantity: 10,
        available: 5,
      };

      const mockStudent = {
        id: "student-1",
        userId: "user-1",
        admissionId: "ADM001",
      };

      const mockIssue = {
        id: "issue-1",
        bookId: "book-1",
        studentId: "student-1",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "ISSUED",
        book: mockBook,
        student: mockStudent,
      };

      vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
      vi.mocked(db.student.findUnique).mockResolvedValue(mockStudent as any);
      vi.mocked(db.bookIssue.findFirst).mockResolvedValue(null);
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          bookIssue: {
            create: vi.fn().mockResolvedValue(mockIssue),
          },
          book: {
            update: vi.fn().mockResolvedValue(mockBook),
          },
        });
      });

      const result = await issueBook({
        bookId: "book-1",
        studentId: "student-1",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should fail when book is not found", async () => {
      const { db } = await import("@/lib/db");
      
      vi.mocked(db.book.findUnique).mockResolvedValue(null);

      const result = await issueBook({
        bookId: "non-existent",
        studentId: "student-1",
        dueDate: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Book not found");
    });

    it("should fail when no copies are available", async () => {
      const { db } = await import("@/lib/db");
      
      const mockBook = {
        id: "book-1",
        available: 0,
      };

      vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);

      const result = await issueBook({
        bookId: "book-1",
        studentId: "student-1",
        dueDate: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("No copies available for this book");
    });

    it("should fail when student is not found", async () => {
      const { db } = await import("@/lib/db");
      
      const mockBook = {
        id: "book-1",
        available: 5,
      };

      vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
      vi.mocked(db.student.findUnique).mockResolvedValue(null);

      const result = await issueBook({
        bookId: "book-1",
        studentId: "non-existent",
        dueDate: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Student not found");
    });

    it("should fail when student already has the book issued", async () => {
      const { db } = await import("@/lib/db");
      
      const mockBook = {
        id: "book-1",
        available: 5,
      };

      const mockStudent = {
        id: "student-1",
      };

      const existingIssue = {
        id: "issue-1",
        status: "ISSUED",
      };

      vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
      vi.mocked(db.student.findUnique).mockResolvedValue(mockStudent as any);
      vi.mocked(db.bookIssue.findFirst).mockResolvedValue(existingIssue as any);

      const result = await issueBook({
        bookId: "book-1",
        studentId: "student-1",
        dueDate: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Student already has this book issued");
    });
  });

  describe("returnBook", () => {
    it("should successfully return a book without fine when returned on time", async () => {
      const { db } = await import("@/lib/db");
      
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-15");
      const returnDate = new Date("2024-01-10");

      const mockIssue = {
        id: "issue-1",
        bookId: "book-1",
        studentId: "student-1",
        issueDate,
        dueDate,
        status: "ISSUED",
        book: {
          id: "book-1",
          title: "Test Book",
        },
      };

      const mockUpdatedIssue = {
        ...mockIssue,
        returnDate,
        fine: 0,
        status: "RETURNED",
      };

      vi.mocked(db.bookIssue.findUnique).mockResolvedValue(mockIssue as any);
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          bookIssue: {
            update: vi.fn().mockResolvedValue(mockUpdatedIssue),
          },
          book: {
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await returnBook({
        issueId: "issue-1",
        returnDate,
      });

      expect(result.success).toBe(true);
      expect(result.fine).toBe(0);
    });

    it("should calculate fine for overdue returns", async () => {
      const { db } = await import("@/lib/db");
      
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-01-15");

      const mockIssue = {
        id: "issue-1",
        bookId: "book-1",
        studentId: "student-1",
        issueDate,
        dueDate,
        status: "ISSUED",
        book: {
          id: "book-1",
          title: "Test Book",
        },
      };

      const mockUpdatedIssue = {
        ...mockIssue,
        returnDate,
        fine: 25, // 5 days * 5 rupees
        status: "RETURNED",
      };

      vi.mocked(db.bookIssue.findUnique).mockResolvedValue(mockIssue as any);
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          bookIssue: {
            update: vi.fn().mockResolvedValue(mockUpdatedIssue),
          },
          book: {
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await returnBook({
        issueId: "issue-1",
        returnDate,
        dailyFineRate: 5,
      });

      expect(result.success).toBe(true);
      expect(result.fine).toBe(25);
    });

    it("should fail when issue is not found", async () => {
      const { db } = await import("@/lib/db");
      
      vi.mocked(db.bookIssue.findUnique).mockResolvedValue(null);

      const result = await returnBook({
        issueId: "non-existent",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Book issue not found");
    });

    it("should fail when book is already returned", async () => {
      const { db } = await import("@/lib/db");
      
      const mockIssue = {
        id: "issue-1",
        status: "RETURNED",
        returnDate: new Date(),
      };

      vi.mocked(db.bookIssue.findUnique).mockResolvedValue(mockIssue as any);

      const result = await returnBook({
        issueId: "issue-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Book has already been returned");
    });

    it("should use custom daily fine rate", async () => {
      const { db } = await import("@/lib/db");
      
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-01-13");

      const mockIssue = {
        id: "issue-1",
        bookId: "book-1",
        studentId: "student-1",
        issueDate,
        dueDate,
        status: "ISSUED",
        book: {
          id: "book-1",
          title: "Test Book",
        },
      };

      const mockUpdatedIssue = {
        ...mockIssue,
        returnDate,
        fine: 30, // 3 days * 10 rupees
        status: "RETURNED",
      };

      vi.mocked(db.bookIssue.findUnique).mockResolvedValue(mockIssue as any);
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          bookIssue: {
            update: vi.fn().mockResolvedValue(mockUpdatedIssue),
          },
          book: {
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await returnBook({
        issueId: "issue-1",
        returnDate,
        dailyFineRate: 10,
      });

      expect(result.success).toBe(true);
      expect(result.fine).toBe(30);
    });
  });

  describe("Book Reservations", () => {
    describe("createBookReservation", () => {
      it("should successfully create a reservation when book is not available", async () => {
        const { db } = await import("@/lib/db");
        
        const mockBook = {
          id: "book-1",
          isbn: "1234567890",
          title: "Test Book",
          author: "Test Author",
          category: "Fiction",
          quantity: 10,
          available: 0, // No copies available
        };

        const mockStudent = {
          id: "student-1",
          userId: "user-1",
          admissionId: "ADM001",
          user: {
            id: "user-1",
            email: "student@test.com",
          },
        };

        const mockReservation = {
          id: "reservation-1",
          bookId: "book-1",
          studentId: "student-1",
          reservedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
          book: mockBook,
          student: mockStudent,
        };

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
        vi.mocked(db.student.findUnique).mockResolvedValue(mockStudent as any);
        vi.mocked(db.bookReservation.findFirst).mockResolvedValue(null);
        vi.mocked(db.bookIssue.findFirst).mockResolvedValue(null);
        vi.mocked(db.bookReservation.create).mockResolvedValue(mockReservation as any);

        const result = await createBookReservation({
          bookId: "book-1",
          studentId: "student-1",
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("should fail when book is available", async () => {
        const { db } = await import("@/lib/db");
        
        const mockBook = {
          id: "book-1",
          available: 5, // Copies available
        };

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);

        const result = await createBookReservation({
          bookId: "book-1",
          studentId: "student-1",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("currently available");
      });

      it("should fail when book is not found", async () => {
        const { db } = await import("@/lib/db");
        
        vi.mocked(db.book.findUnique).mockResolvedValue(null);

        const result = await createBookReservation({
          bookId: "non-existent",
          studentId: "student-1",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Book not found");
      });

      it("should fail when student is not found", async () => {
        const { db } = await import("@/lib/db");
        
        const mockBook = {
          id: "book-1",
          available: 0,
        };

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
        vi.mocked(db.student.findUnique).mockResolvedValue(null);

        const result = await createBookReservation({
          bookId: "book-1",
          studentId: "non-existent",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Student not found");
      });

      it("should fail when student already has an active reservation", async () => {
        const { db } = await import("@/lib/db");
        
        const mockBook = {
          id: "book-1",
          available: 0,
        };

        const mockStudent = {
          id: "student-1",
          user: { id: "user-1" },
        };

        const existingReservation = {
          id: "reservation-1",
          status: "ACTIVE",
        };

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
        vi.mocked(db.student.findUnique).mockResolvedValue(mockStudent as any);
        vi.mocked(db.bookReservation.findFirst).mockResolvedValueOnce(existingReservation as any);

        const result = await createBookReservation({
          bookId: "book-1",
          studentId: "student-1",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("already has an active reservation");
      });

      it("should fail when student already has the book issued", async () => {
        const { db } = await import("@/lib/db");
        
        const mockBook = {
          id: "book-1",
          available: 0,
        };

        const mockStudent = {
          id: "student-1",
          user: { id: "user-1" },
        };

        const existingIssue = {
          id: "issue-1",
          status: "ISSUED",
        };

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
        vi.mocked(db.student.findUnique).mockResolvedValue(mockStudent as any);
        vi.mocked(db.bookReservation.findFirst).mockResolvedValue(null);
        vi.mocked(db.bookIssue.findFirst).mockResolvedValue(existingIssue as any);

        const result = await createBookReservation({
          bookId: "book-1",
          studentId: "student-1",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("already has this book issued");
      });
    });

    describe("cancelBookReservation", () => {
      it("should successfully cancel an active reservation", async () => {
        const { db } = await import("@/lib/db");
        
        const mockReservation = {
          id: "reservation-1",
          bookId: "book-1",
          studentId: "student-1",
          status: "ACTIVE",
        };

        const mockUpdatedReservation = {
          ...mockReservation,
          status: "CANCELLED",
          book: { id: "book-1", title: "Test Book" },
          student: { id: "student-1", user: { id: "user-1" } },
        };

        vi.mocked(db.bookReservation.findUnique).mockResolvedValue(mockReservation as any);
        vi.mocked(db.bookReservation.update).mockResolvedValue(mockUpdatedReservation as any);

        const result = await cancelBookReservation("reservation-1");

        expect(result.success).toBe(true);
        expect(result.data?.status).toBe("CANCELLED");
      });

      it("should fail when reservation is not found", async () => {
        const { db } = await import("@/lib/db");
        
        vi.mocked(db.bookReservation.findUnique).mockResolvedValue(null);

        const result = await cancelBookReservation("non-existent");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Reservation not found");
      });

      it("should fail when reservation is not active", async () => {
        const { db } = await import("@/lib/db");
        
        const mockReservation = {
          id: "reservation-1",
          status: "FULFILLED",
        };

        vi.mocked(db.bookReservation.findUnique).mockResolvedValue(mockReservation as any);

        const result = await cancelBookReservation("reservation-1");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Only active reservations");
      });
    });

    describe("fulfillBookReservation", () => {
      it("should successfully fulfill a reservation and issue the book", async () => {
        const { db } = await import("@/lib/db");
        
        const mockReservation = {
          id: "reservation-1",
          bookId: "book-1",
          studentId: "student-1",
          status: "ACTIVE",
          book: {
            id: "book-1",
            title: "Test Book",
            available: 1,
          },
          student: {
            id: "student-1",
            user: { id: "user-1" },
          },
        };

        const mockIssue = {
          id: "issue-1",
          bookId: "book-1",
          studentId: "student-1",
          status: "ISSUED",
        };

        vi.mocked(db.bookReservation.findUnique).mockResolvedValue(mockReservation as any);
        vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
          return callback({
            bookIssue: {
              create: vi.fn().mockResolvedValue(mockIssue),
            },
            book: {
              update: vi.fn().mockResolvedValue({}),
            },
            bookReservation: {
              update: vi.fn().mockResolvedValue({ status: "FULFILLED" }),
            },
          });
        });

        const result = await fulfillBookReservation({
          reservationId: "reservation-1",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("should fail when reservation is not found", async () => {
        const { db } = await import("@/lib/db");
        
        vi.mocked(db.bookReservation.findUnique).mockResolvedValue(null);

        const result = await fulfillBookReservation({
          reservationId: "non-existent",
          dueDate: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Reservation not found");
      });

      it("should fail when reservation is not active", async () => {
        const { db } = await import("@/lib/db");
        
        const mockReservation = {
          id: "reservation-1",
          status: "EXPIRED",
          book: { available: 1 },
        };

        vi.mocked(db.bookReservation.findUnique).mockResolvedValue(mockReservation as any);

        const result = await fulfillBookReservation({
          reservationId: "reservation-1",
          dueDate: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Only active reservations");
      });

      it("should fail when book has no available copies", async () => {
        const { db } = await import("@/lib/db");
        
        const mockReservation = {
          id: "reservation-1",
          status: "ACTIVE",
          book: {
            id: "book-1",
            available: 0,
          },
        };

        vi.mocked(db.bookReservation.findUnique).mockResolvedValue(mockReservation as any);

        const result = await fulfillBookReservation({
          reservationId: "reservation-1",
          dueDate: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("No copies available");
      });
    });

    describe("notifyReservedBookAvailable", () => {
      it("should notify students when book becomes available", async () => {
        const { db } = await import("@/lib/db");
        const { createNotification } = await import("@/lib/utils/notification-utils");
        
        const mockBook = {
          id: "book-1",
          title: "Test Book",
          available: 2,
        };

        const mockReservations = [
          {
            id: "reservation-1",
            bookId: "book-1",
            studentId: "student-1",
            status: "ACTIVE",
            reservedAt: new Date("2024-01-01"),
            student: {
              id: "student-1",
              userId: "user-1",
              user: { id: "user-1" },
            },
            book: mockBook,
          },
          {
            id: "reservation-2",
            bookId: "book-1",
            studentId: "student-2",
            status: "ACTIVE",
            reservedAt: new Date("2024-01-02"),
            student: {
              id: "student-2",
              userId: "user-2",
              user: { id: "user-2" },
            },
            book: mockBook,
          },
        ];

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
        vi.mocked(db.bookReservation.findMany).mockResolvedValue(mockReservations as any);
        vi.mocked(createNotification).mockResolvedValue({} as any);

        const result = await notifyReservedBookAvailable("book-1");

        expect(result.success).toBe(true);
        expect(result.notifiedCount).toBe(2);
        expect(createNotification).toHaveBeenCalledTimes(2);
      });

      it("should fail when book is not found", async () => {
        const { db } = await import("@/lib/db");
        
        vi.mocked(db.book.findUnique).mockResolvedValue(null);

        const result = await notifyReservedBookAvailable("non-existent");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Book not found");
      });

      it("should fail when book has no available copies", async () => {
        const { db } = await import("@/lib/db");
        
        const mockBook = {
          id: "book-1",
          available: 0,
        };

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);

        const result = await notifyReservedBookAvailable("book-1");

        expect(result.success).toBe(false);
        expect(result.error).toContain("No copies available");
      });

      it("should handle case when no active reservations exist", async () => {
        const { db } = await import("@/lib/db");
        
        const mockBook = {
          id: "book-1",
          available: 2,
        };

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
        vi.mocked(db.bookReservation.findMany).mockResolvedValue([]);

        const result = await notifyReservedBookAvailable("book-1");

        expect(result.success).toBe(true);
        expect(result.notifiedCount).toBe(0);
      });

      it("should only notify as many students as there are available copies", async () => {
        const { db } = await import("@/lib/db");
        const { createNotification } = await import("@/lib/utils/notification-utils");
        
        const mockBook = {
          id: "book-1",
          title: "Test Book",
          available: 1, // Only 1 copy available
        };

        const mockReservations = [
          {
            id: "reservation-1",
            bookId: "book-1",
            studentId: "student-1",
            status: "ACTIVE",
            reservedAt: new Date("2024-01-01"),
            student: {
              id: "student-1",
              userId: "user-1",
              user: { id: "user-1" },
            },
            book: mockBook,
          },
        ];

        vi.mocked(db.book.findUnique).mockResolvedValue(mockBook as any);
        vi.mocked(db.bookReservation.findMany).mockResolvedValue(mockReservations as any);
        vi.mocked(createNotification).mockResolvedValue({} as any);

        const result = await notifyReservedBookAvailable("book-1");

        expect(result.success).toBe(true);
        expect(result.notifiedCount).toBe(1);
        expect(createNotification).toHaveBeenCalledTimes(1);
      });
    });
  });
});
