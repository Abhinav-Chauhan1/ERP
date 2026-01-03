import * as z from "zod";

/**
 * Schema for individual student mark entry
 * Validates marks entry with comprehensive rules
 */
export const studentMarkEntrySchema = z.object({
  studentId: z.string({
    required_error: "Student ID is required",
  }).min(1, "Student ID cannot be empty"),
  
  theoryMarks: z.coerce
    .number({
      invalid_type_error: "Theory marks must be a number",
    })
    .nonnegative("Theory marks cannot be negative")
    .nullable()
    .optional(),
  
  practicalMarks: z.coerce
    .number({
      invalid_type_error: "Practical marks must be a number",
    })
    .nonnegative("Practical marks cannot be negative")
    .nullable()
    .optional(),
  
  internalMarks: z.coerce
    .number({
      invalid_type_error: "Internal marks must be a number",
    })
    .nonnegative("Internal marks cannot be negative")
    .nullable()
    .optional(),
  
  isAbsent: z.boolean().default(false),
  
  remarks: z.string()
    .max(500, "Remarks cannot exceed 500 characters")
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // If student is absent, marks should not be required
    if (data.isAbsent) {
      return true;
    }
    // If not absent, at least one mark component should be provided
    return (
      data.theoryMarks !== null && data.theoryMarks !== undefined ||
      data.practicalMarks !== null && data.practicalMarks !== undefined ||
      data.internalMarks !== null && data.internalMarks !== undefined
    );
  },
  {
    message: "At least one mark component is required for non-absent students",
    path: ["theoryMarks"],
  }
);

/**
 * Schema for bulk marks entry
 */
export const saveMarksInputSchema = z.object({
  examId: z.string({
    required_error: "Exam ID is required",
  }).min(1, "Exam ID cannot be empty"),
  
  subjectId: z.string({
    required_error: "Subject ID is required",
  }).min(1, "Subject ID cannot be empty"),
  
  marks: z.array(studentMarkEntrySchema)
    .min(1, "At least one student mark entry is required"),
  
  isDraft: z.boolean().optional().default(false),
});

/**
 * Schema for import mark entry
 */
export const importMarkEntrySchema = z.object({
  studentId: z.string().optional(),
  rollNumber: z.string().optional(),
  name: z.string().optional(),
  
  theoryMarks: z.coerce
    .number({
      invalid_type_error: "Theory marks must be a number",
    })
    .nonnegative("Theory marks cannot be negative")
    .nullable()
    .optional(),
  
  practicalMarks: z.coerce
    .number({
      invalid_type_error: "Practical marks must be a number",
    })
    .nonnegative("Practical marks cannot be negative")
    .nullable()
    .optional(),
  
  internalMarks: z.coerce
    .number({
      invalid_type_error: "Internal marks must be a number",
    })
    .nonnegative("Internal marks cannot be negative")
    .nullable()
    .optional(),
  
  isAbsent: z.boolean().optional().default(false),
  
  remarks: z.string()
    .max(500, "Remarks cannot exceed 500 characters")
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // Must have at least one identifier
    return data.studentId || data.rollNumber || data.name;
  },
  {
    message: "At least one student identifier (ID, roll number, or name) is required",
    path: ["studentId"],
  }
);

/**
 * Schema for import marks input
 */
export const importMarksInputSchema = z.object({
  examId: z.string({
    required_error: "Exam ID is required",
  }).min(1, "Exam ID cannot be empty"),
  
  subjectId: z.string({
    required_error: "Subject ID is required",
  }).min(1, "Subject ID cannot be empty"),
  
  data: z.array(importMarkEntrySchema)
    .min(1, "Import data cannot be empty"),
});

/**
 * Schema for subject mark configuration
 */
export const subjectMarkConfigSchema = z.object({
  examId: z.string({
    required_error: "Exam ID is required",
  }),
  
  subjectId: z.string({
    required_error: "Subject ID is required",
  }),
  
  theoryMaxMarks: z.coerce
    .number({
      invalid_type_error: "Theory max marks must be a number",
    })
    .nonnegative("Theory max marks cannot be negative")
    .nullable()
    .optional(),
  
  practicalMaxMarks: z.coerce
    .number({
      invalid_type_error: "Practical max marks must be a number",
    })
    .nonnegative("Practical max marks cannot be negative")
    .nullable()
    .optional(),
  
  internalMaxMarks: z.coerce
    .number({
      invalid_type_error: "Internal max marks must be a number",
    })
    .nonnegative("Internal max marks cannot be negative")
    .nullable()
    .optional(),
  
  totalMarks: z.coerce
    .number({
      required_error: "Total marks is required",
      invalid_type_error: "Total marks must be a number",
    })
    .positive("Total marks must be positive"),
}).refine(
  (data) => {
    // Sum of components should equal total marks
    const sum = (data.theoryMaxMarks || 0) + 
                (data.practicalMaxMarks || 0) + 
                (data.internalMaxMarks || 0);
    return Math.abs(sum - data.totalMarks) < 0.01; // Allow for floating point precision
  },
  {
    message: "Sum of theory, practical, and internal max marks must equal total marks",
    path: ["totalMarks"],
  }
);

// Export types
export type StudentMarkEntryValues = z.infer<typeof studentMarkEntrySchema>;
export type SaveMarksInputValues = z.infer<typeof saveMarksInputSchema>;
export type ImportMarkEntryValues = z.infer<typeof importMarkEntrySchema>;
export type ImportMarksInputValues = z.infer<typeof importMarksInputSchema>;
export type SubjectMarkConfigValues = z.infer<typeof subjectMarkConfigSchema>;
