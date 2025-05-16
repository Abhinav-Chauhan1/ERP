import * as z from "zod";

export const departmentSchema = z.object({
  name: z.string().min(3, "Department name must be at least 3 characters"),
  description: z.string().optional(),
});

export const departmentUpdateSchema = departmentSchema.extend({
  id: z.string().min(1, "Department ID is required"),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
export type DepartmentUpdateFormValues = z.infer<typeof departmentUpdateSchema>;
