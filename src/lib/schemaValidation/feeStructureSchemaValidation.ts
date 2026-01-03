import { z } from "zod";

// Fee Structure Item Schema
export const feeStructureItemSchema = z.object({
  feeTypeId: z.string().min(1, "Fee type is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.date().optional().nullable(),
});

// Fee Structure Schema
export const feeStructureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  classIds: z
    .array(z.string().min(1, "Class ID is required"))
    .min(1, "At least one class must be selected"),
  applicableClasses: z.string().optional().nullable(), // Deprecated - kept for backward compatibility
  description: z.string().optional().nullable(),
  validFrom: z.date({
    required_error: "Valid from date is required",
  }),
  validTo: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
  isTemplate: z.boolean().default(false),
  items: z
    .array(feeStructureItemSchema)
    .min(1, "At least one fee item is required"),
});

export type FeeStructureFormValues = z.infer<typeof feeStructureSchema>;
export type FeeStructureItemFormValues = z.infer<typeof feeStructureItemSchema>;

// Fee Type Schema
export const feeTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  amount: z.number().positive("Amount must be positive"),
  frequency: z.enum([
    "ONE_TIME",
    "MONTHLY",
    "QUARTERLY",
    "SEMI_ANNUAL",
    "ANNUAL",
  ]),
  isOptional: z.boolean().default(false),
  classAmounts: z
    .array(
      z.object({
        classId: z.string().min(1, "Class ID is required"),
        amount: z.number().positive("Amount must be positive"),
      })
    )
    .optional()
    .refine(
      (classAmounts) => {
        if (!classAmounts || classAmounts.length === 0) return true;
        const classIds = classAmounts.map((ca) => ca.classId);
        const uniqueClassIds = new Set(classIds);
        return classIds.length === uniqueClassIds.size;
      },
      {
        message: "Each class can only have one custom amount",
      }
    ),
});

export type FeeTypeFormValues = z.infer<typeof feeTypeSchema>;

// Update schemas (for editing)
export const feeStructureUpdateSchema = feeStructureSchema.extend({
  id: z.string(),
});

export const feeTypeUpdateSchema = feeTypeSchema.extend({
  id: z.string(),
});

export type FeeStructureUpdateFormValues = z.infer<typeof feeStructureUpdateSchema>;
export type FeeTypeUpdateFormValues = z.infer<typeof feeTypeUpdateSchema>;
