import * as z from "zod";

/**
 * Schema for creating a new sub-module
 */
export const subModuleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  order: z.coerce.number().min(1, "Order must be at least 1"),
  moduleId: z.string({
    required_error: "Module ID is required",
  }),
});

/**
 * Schema for updating an existing sub-module
 */
export const subModuleUpdateSchema = subModuleSchema.extend({
  id: z.string().min(1, "Sub-module ID is required"),
});

/**
 * Schema for moving a sub-module to a different module
 */
export const moveSubModuleSchema = z.object({
  subModuleId: z.string().min(1, "Sub-module ID is required"),
  targetModuleId: z.string().min(1, "Target module ID is required"),
  order: z.coerce.number().min(1, "Order must be at least 1"),
});

/**
 * Schema for reordering sub-modules within a module
 */
export const reorderSubModulesSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  subModuleOrders: z.array(
    z.object({
      id: z.string().min(1, "Sub-module ID is required"),
      order: z.number().min(1, "Order must be at least 1"),
    })
  ).min(1, "At least one sub-module order is required"),
});

// Type exports
export type SubModuleFormValues = z.infer<typeof subModuleSchema>;
export type SubModuleUpdateFormValues = z.infer<typeof subModuleUpdateSchema>;
export type MoveSubModuleFormValues = z.infer<typeof moveSubModuleSchema>;
export type ReorderSubModulesFormValues = z.infer<typeof reorderSubModulesSchema>;
