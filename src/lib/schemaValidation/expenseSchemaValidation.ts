import { z } from "zod";

// Expense Schema
export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional().nullable(),
  category: z.enum([
    "SALARIES",
    "UTILITIES",
    "MAINTENANCE",
    "SUPPLIES",
    "EQUIPMENT",
    "TRANSPORTATION",
    "FOOD",
    "EVENTS",
    "MARKETING",
    "INSURANCE",
    "RENT",
    "OTHER",
  ], {
    required_error: "Category is required",
  }),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Amount must be a positive number",
  }),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"]).optional().nullable(),
  vendor: z.string().max(200, "Vendor name must be less than 200 characters").optional().nullable(),
  receiptNumber: z.string().max(100, "Receipt number must be less than 100 characters").optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

// Update Expense Schema
export const updateExpenseSchema = expenseSchema.extend({
  id: z.string(),
});

export type UpdateExpenseFormValues = z.infer<typeof updateExpenseSchema>;
