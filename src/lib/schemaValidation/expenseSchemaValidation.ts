import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expense-categories";

const CATEGORY_IDS = EXPENSE_CATEGORIES.map((c) => c.id) as [string, ...string[]];

// Expense Schema
export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional().nullable(),
  category: z.enum(CATEGORY_IDS, {
    required_error: "Category is required",
  }),
  amount: z.number({
    required_error: "Amount is required",
  }).positive("Amount must be a positive number"),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(["CASH", "CHEQUE", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "ONLINE_PAYMENT"]).optional().nullable(),
  paymentStatus: z.enum(["PENDING", "COMPLETED", "PARTIAL", "FAILED", "REFUNDED"]).optional(),
  paidTo: z.string().max(200, "Paid to must be less than 200 characters").optional().nullable(),
  receiptNumber: z.string().max(100, "Receipt number must be less than 100 characters").optional().nullable(),
  attachments: z.string().optional().nullable(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

// Update Expense Schema
export const updateExpenseSchema = expenseSchema.extend({
  id: z.string(),
});

export type UpdateExpenseFormValues = z.infer<typeof updateExpenseSchema>;
