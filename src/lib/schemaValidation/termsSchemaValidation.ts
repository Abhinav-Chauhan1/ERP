import * as z from "zod";

export const termSchema = z.object({
  name: z.string().min(5, "Term name must be at least 5 characters"),
  academicYearId: z.string({
    required_error: "Please select an academic year",
  }),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
}).refine(data => {
  if (!data.startDate || !data.endDate || !(data.startDate instanceof Date) || !(data.endDate instanceof Date)) {
    return true; // Skip validation if dates are not valid
  }
  return data.endDate > data.startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const termUpdateSchema = termSchema.transform((data) => ({
  ...data,
  id: z.string().min(1, "Term ID is required").parse(""),
}));

export type TermFormValues = z.infer<typeof termSchema>;
export type TermUpdateFormValues = z.infer<typeof termUpdateSchema>;
