import * as z from "zod";

export const syllabusSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  document: z.string().optional(),
});

export const syllabusUpdateSchema = syllabusSchema.extend({
  id: z.string().min(1, "Syllabus ID is required"),
});

export const syllabusUnitSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  order: z.coerce.number().min(1, "Order must be at least 1"),
  syllabusId: z.string({
    required_error: "Syllabus ID is required",
  }),
});

export const syllabusUnitUpdateSchema = syllabusUnitSchema.extend({
  id: z.string().min(1, "Unit ID is required"),
});

export const lessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  content: z.string().optional(),
  resources: z.string().optional(),
  duration: z.coerce.number().optional(),
  subjectId: z.string({
    required_error: "Subject ID is required",
  }),
  syllabusUnitId: z.string().optional(),
});

export const lessonUpdateSchema = lessonSchema.extend({
  id: z.string().min(1, "Lesson ID is required"),
});

export type SyllabusFormValues = z.infer<typeof syllabusSchema>;
export type SyllabusUpdateFormValues = z.infer<typeof syllabusUpdateSchema>;
export type SyllabusUnitFormValues = z.infer<typeof syllabusUnitSchema>;
export type SyllabusUnitUpdateFormValues = z.infer<typeof syllabusUnitUpdateSchema>;
export type LessonFormValues = z.infer<typeof lessonSchema>;
export type LessonUpdateFormValues = z.infer<typeof lessonUpdateSchema>;
