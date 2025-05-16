import * as z from "zod";

export const lessonSchema = z.object({
  title: z.string().min(3, "Lesson title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  syllabusUnitId: z.string().optional(),
  content: z.string().optional(),
  resources: z.string().optional(),
  duration: z.coerce.number().min(15, "Duration must be at least 15 minutes").optional(),
});

export const lessonUpdateSchema = lessonSchema.extend({
  id: z.string().min(1, "Lesson ID is required"),
});

export type LessonFormValues = z.infer<typeof lessonSchema>;
export type LessonUpdateFormValues = z.infer<typeof lessonUpdateSchema>;
