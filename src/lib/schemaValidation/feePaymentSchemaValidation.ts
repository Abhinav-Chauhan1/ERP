import { z } from "zod";

// Base Payment Schema Object (used by the Edit Payment "correction" flow, which
// keeps full manual control over amount/paidAmount/status)
const paymentSchemaBase = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  amount: z.number().positive("Amount must be positive"),
  paidAmount: z.number().positive("Paid amount must be positive"),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
  paymentMethod: z.enum([
    "CASH",
    "CHEQUE",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "ONLINE_PAYMENT",
    "SCHOLARSHIP",
  ]),
  transactionId: z.string().optional().nullable(),
  receiptNumber: z.string().optional().nullable(),
  status: z.enum(["PENDING", "COMPLETED", "PARTIAL", "FAILED", "REFUNDED"]),
  remarks: z.string().optional().nullable(),
});

// Payment Update Schema (Edit Payment dialog)
export const paymentUpdateSchema = paymentSchemaBase.extend({
  id: z.string(),
}).refine(
  (data) => data.paidAmount <= data.amount,
  {
    message: "Paid amount cannot exceed total amount",
    path: ["paidAmount"],
  }
);

export type PaymentUpdateFormValues = z.infer<typeof paymentUpdateSchema>;

// Record Payment Schema (guided create flow). No `amount` or `status` fields —
// the server always derives amount := paidAmount and status := COMPLETED, since
// a recorded payment represents money actually collected in that transaction.
export const recordPaymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  paidAmount: z.number().positive("Amount must be positive"),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
  paymentMethod: z.enum([
    "CASH",
    "CHEQUE",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "ONLINE_PAYMENT",
    "SCHOLARSHIP",
  ]),
  transactionId: z.string().optional().nullable(),
  receiptNumber: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

// Payment Filter Schema
export const paymentFilterSchema = z.object({
  studentId: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED", "PARTIAL", "FAILED", "REFUNDED"]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type PaymentFilterValues = z.infer<typeof paymentFilterSchema>;
