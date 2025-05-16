import * as z from "zod";

export const academicYearSchema = z.object({
  name: z.string().min(5, "Academic year name must be at least 5 characters"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }).refine(date => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid end date",
  }),
  isCurrent: z.boolean().default(false),
});

export const academicYearUpdateSchema = academicYearSchema.extend({
  id: z.string().min(1, "Academic year ID is required"),
});

export type AcademicYearFormValues = z.infer<typeof academicYearSchema>;
export type AcademicYearUpdateFormValues = z.infer<typeof academicYearUpdateSchema>;
