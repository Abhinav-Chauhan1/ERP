import { z } from "zod";

// Fee Discount Schema
export const feeDiscountSchema = z
  .object({
    studentId: z.string().min(1, "Student is required"),
    feeStructureId: z.string().min(1, "Fee structure is required"),
    discountType: z.enum(["FLAT_AMOUNT", "PERCENTAGE"], {
      required_error: "Discount type is required",
    }),
    value: z.number().positive("Value must be greater than 0"),
    reason: z.string().max(500, "Reason must be less than 500 characters").optional().nullable(),
  })
  .refine((data) => data.discountType !== "PERCENTAGE" || data.value <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["value"],
  });

export type FeeDiscountFormValues = z.infer<typeof feeDiscountSchema>;

// Update Fee Discount Schema
export const updateFeeDiscountSchema = z
  .object({
    id: z.string().min(1),
    discountType: z.enum(["FLAT_AMOUNT", "PERCENTAGE"], {
      required_error: "Discount type is required",
    }),
    value: z.number().positive("Value must be greater than 0"),
    reason: z.string().max(500, "Reason must be less than 500 characters").optional().nullable(),
  })
  .refine((data) => data.discountType !== "PERCENTAGE" || data.value <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["value"],
  });

export type UpdateFeeDiscountFormValues = z.infer<typeof updateFeeDiscountSchema>;
