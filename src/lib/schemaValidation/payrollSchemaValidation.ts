import { z } from "zod";

// Payroll Schema
export const payrollSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  month: z.string().min(1, "Month is required"),
  year: z.string().min(1, "Year is required"),
  basicSalary: z.string().min(1, "Basic salary is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Basic salary must be a positive number",
  }),
  allowances: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, {
    message: "Allowances must be a non-negative number",
  }),
  deductions: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, {
    message: "Deductions must be a non-negative number",
  }),
  bonus: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, {
    message: "Bonus must be a non-negative number",
  }),
  remarks: z.string().optional().nullable(),
});

export type PayrollFormValues = z.infer<typeof payrollSchema>;

// Update Payroll Schema
export const updatePayrollSchema = z.object({
  id: z.string(),
  basicSalary: z.string().min(1, "Basic salary is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Basic salary must be a positive number",
  }),
  allowances: z.string().optional().nullable(),
  deductions: z.string().optional().nullable(),
  bonus: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type UpdatePayrollFormValues = z.infer<typeof updatePayrollSchema>;

// Bulk Generate Payrolls Schema
export const bulkGeneratePayrollsSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  defaultSalary: z.number().min(0),
});

export type BulkGeneratePayrollsFormValues = z.infer<typeof bulkGeneratePayrollsSchema>;
