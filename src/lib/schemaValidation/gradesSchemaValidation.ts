import * as z from "zod";

const gradeBaseSchema = z.object({
  grade: z.string().min(1, "Grade must not be empty"),
  minMarks: z.coerce.number().min(0, "Minimum marks must be at least 0").max(100, "Minimum marks must be at most 100"),
  maxMarks: z.coerce.number().min(0, "Maximum marks must be at least 0").max(100, "Maximum marks must be at most 100"),
  gpa: z.coerce.number().min(0, "GPA must be at least 0").max(4, "GPA must be at most 4"),
  description: z.string().optional(),
});

export const gradeSchema = gradeBaseSchema.refine((data) => data.minMarks < data.maxMarks, {
  message: "Minimum marks must be less than maximum marks",
  path: ["minMarks"],
});

export const gradeUpdateSchema = gradeBaseSchema.extend({
  id: z.string().min(1, "Grade ID is required"),
});

export type GradeFormValues = z.infer<typeof gradeSchema>;
export type GradeUpdateFormValues = z.infer<typeof gradeUpdateSchema>;
