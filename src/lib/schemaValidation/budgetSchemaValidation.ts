import { z } from "zod";

// Budget Schema
export const budgetSchema = z.object({
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
  year: z.string().min(1, "Year is required").refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 2000 && num <= 2100;
  }, {
    message: "Year must be between 2000 and 2100",
  }),
  allocatedAmount: z.string().min(1, "Allocated amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Allocated amount must be a positive number",
  }),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

// Update Budget Schema
export const updateBudgetSchema = z.object({
  id: z.string(),
  allocatedAmount: z.string().min(1, "Allocated amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Allocated amount must be a positive number",
  }),
  spentAmount: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, {
    message: "Spent amount must be a non-negative number",
  }),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).optional(),
});

export type UpdateBudgetFormValues = z.infer<typeof updateBudgetSchema>;
