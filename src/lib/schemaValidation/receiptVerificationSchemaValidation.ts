import { z } from "zod";
import { sanitizeRejectionReason } from "@/lib/utils/input-sanitization";

// Verify Receipt Schema
export const verifyReceiptSchema = z.object({
  receiptId: z.string().min(1, "Receipt ID is required"),
});

export type VerifyReceiptValues = z.infer<typeof verifyReceiptSchema>;

// Reject Receipt Schema with sanitization
export const rejectReceiptSchema = z.object({
  receiptId: z.string().min(1, "Receipt ID is required"),
  rejectionReason: z
    .string()
    .min(1, "Rejection reason is required")
    .max(500, "Rejection reason must not exceed 500 characters")
    .transform((val) => sanitizeRejectionReason(val)),
});

export type RejectReceiptValues = z.infer<typeof rejectReceiptSchema>;
