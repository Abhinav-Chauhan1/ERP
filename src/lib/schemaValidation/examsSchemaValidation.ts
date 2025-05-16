import * as z from "zod";

// Base exam schema
const baseExamSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  examTypeId: z.string({
    required_error: "Please select an exam type",
  }),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  termId: z.string({
    required_error: "Please select a term",
  }),
  examDate: z.date({
    required_error: "Exam date is required",
  }),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  endTime: z.date({
    required_error: "End time is required",
  }),
  totalMarks: z.coerce.number().positive("Total marks must be positive"),
  passingMarks: z.coerce.number().positive("Passing marks must be positive"),
  instructions: z.string().optional(),
}).refine(data => data.passingMarks <= data.totalMarks, {
  message: "Passing marks cannot be greater than total marks",
  path: ["passingMarks"]
}).refine(data => {
  if (!(data.startTime instanceof Date) || !(data.endTime instanceof Date)) {
    return true; // Skip validation if dates are not valid
  }
  return data.endTime > data.startTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

// Export schemas
export const examSchema = baseExamSchema;

// Schema for updating an exam
export const examUpdateSchema = z.object({
  ...baseExamSchema.innerType().innerType().shape,
  id: z.string().min(1, "Exam ID is required"),
});

// Schema for exam result
export const examResultSchema = z.object({
  examId: z.string({
    required_error: "Exam ID is required",
  }),
  studentId: z.string({
    required_error: "Student ID is required",
  }),
  marks: z.coerce.number().min(0, "Marks cannot be negative"),
  grade: z.string().optional(),
  remarks: z.string().optional(),
  isAbsent: z.boolean().default(false),
});

// Types based on the schemas
export type ExamFormValues = z.infer<typeof examSchema>;
export type ExamUpdateFormValues = z.infer<typeof examUpdateSchema>;
export type ExamResultFormValues = z.infer<typeof examResultSchema>;
