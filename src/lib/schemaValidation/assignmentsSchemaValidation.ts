import * as z from "zod";

// Schema for assignment creation/update
export const assignmentSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  classIds: z.array(z.string()).min(1, "Please select at least one class"),
  assignedDate: z.date().default(() => new Date()),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  totalMarks: z.coerce.number().min(1, "Total marks must be at least 1"),
  instructions: z.string().optional(),
  allowLateSubmissions: z.boolean().default(false),
  attachments: z.string().optional(),
});

// Schema for updating an assignment
export const assignmentUpdateSchema = assignmentSchema.extend({
  id: z.string({
    required_error: "Assignment ID is required",
  }),
});

// Schema for filtering assignments
export const assignmentFilterSchema = z.object({
  searchTerm: z.string().optional(),
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  status: z.enum(["all", "open", "closed", "graded"]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

// Schema for grading a submission
export const submissionGradeSchema = z.object({
  submissionId: z.string({
    required_error: "Submission ID is required",
  }),
  marks: z.coerce.number().min(0, "Marks cannot be negative"),
  feedback: z.string().optional(),
  status: z.enum(["PENDING", "SUBMITTED", "LATE", "GRADED", "RETURNED"]).default("GRADED"),
});

// Define types based on schemas
export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
export type AssignmentUpdateValues = z.infer<typeof assignmentUpdateSchema>;
export type AssignmentFilterValues = z.infer<typeof assignmentFilterSchema>;
export type SubmissionGradeValues = z.infer<typeof submissionGradeSchema>;
