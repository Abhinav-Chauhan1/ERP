import * as z from "zod";

export const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  classId: z.string({
    required_error: "Please select a class",
  }),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(100, "Capacity must not exceed 100").optional(),
  roomId: z.string().optional(),
  teacherId: z.string().optional(),
  isClassHead: z.boolean().default(false)
});

export const sectionUpdateSchema = sectionSchema.extend({
  id: z.string().min(1, "Section ID is required"),
});

export type SectionFormValues = z.infer<typeof sectionSchema>;
export type SectionUpdateFormValues = z.infer<typeof sectionUpdateSchema>;
