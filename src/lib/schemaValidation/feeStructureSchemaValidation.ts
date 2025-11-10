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
  applicableClasses: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  validFrom: z.date({
    required_error: "Valid from date is required",
  }),
  validTo: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
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
