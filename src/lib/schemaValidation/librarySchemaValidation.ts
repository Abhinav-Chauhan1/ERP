import * as z from "zod";

// Schema for book creation
export const bookSchema = z.object({
  isbn: z.string().min(10, "ISBN must be at least 10 characters").max(13, "ISBN must be at most 13 characters"),
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  author: z.string().min(1, "Author is required").max(200, "Author must be at most 200 characters"),
  publisher: z.string().max(200, "Publisher must be at most 200 characters").optional(),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  available: z.number().int().min(0, "Available quantity cannot be negative"),
  location: z.string().max(100, "Location must be at most 100 characters").optional(),
  coverImage: z.string().url("Invalid cover image URL").optional(),
});

// Schema for book update
export const bookUpdateSchema = bookSchema.extend({
  id: z.string().min(1, "Book ID is required"),
});

// Schema for book issue
export const bookIssueSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
});

// Schema for book return
export const bookReturnSchema = z.object({
  issueId: z.string().min(1, "Issue ID is required"),
  returnDate: z.date({
    required_error: "Return date is required",
  }),
  fine: z.number().min(0, "Fine cannot be negative").optional(),
});

// Schema for book reservation
export const bookReservationSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  expiresAt: z.date({
    required_error: "Expiry date is required",
  }),
});

export type BookFormValues = z.infer<typeof bookSchema>;
export type BookUpdateFormValues = z.infer<typeof bookUpdateSchema>;
export type BookIssueFormValues = z.infer<typeof bookIssueSchema>;
export type BookReturnFormValues = z.infer<typeof bookReturnSchema>;
export type BookReservationFormValues = z.infer<typeof bookReservationSchema>;
