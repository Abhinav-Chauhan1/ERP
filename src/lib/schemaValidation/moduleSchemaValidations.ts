import * as z from "zod";

/**
 * Schema for creating a new module
 */
export const moduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  chapterNumber: z.coerce.number().min(1, "Chapter number must be at least 1"),
  order: z.coerce.number().min(1, "Order must be at least 1"),
  syllabusId: z.string({
    required_error: "Syllabus ID is required",
  }),
});

/**
 * Schema for updating an existing module
 */
export const moduleUpdateSchema = moduleSchema.extend({
  id: z.string().min(1, "Module ID is required"),
});

/**
 * Schema for reordering modules
 */
export const reorderModulesSchema = z.object({
  syllabusId: z.string().min(1, "Syllabus ID is required"),
  moduleOrders: z.array(
    z.object({
      id: z.string().min(1, "Module ID is required"),
      order: z.number().min(1, "Order must be at least 1"),
      chapterNumber: z.number().min(1, "Chapter number must be at least 1"),
    })
  ).min(1, "At least one module order is required"),
});

// Type exports
export type ModuleFormValues = z.infer<typeof moduleSchema>;
export type ModuleUpdateFormValues = z.infer<typeof moduleUpdateSchema>;
export type ReorderModulesFormValues = z.infer<typeof reorderModulesSchema>;
