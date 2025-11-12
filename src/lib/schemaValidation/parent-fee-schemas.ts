import { z } from "zod";

// Fee Overview Schema
export const feeOverviewSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
});

export type FeeOverviewInput = z.infer<typeof feeOverviewSchema>;

// Payment History Filter Schema
export const paymentHistoryFilterSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  status: z.enum(["PENDING", "COMPLETED", "PARTIAL", "FAILED", "REFUNDED"]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  paymentMethod: z.enum([
    "CASH",
    "CHEQUE",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "ONLINE_PAYMENT",
    "SCHOLARSHIP",
  ]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type PaymentHistoryFilter = z.infer<typeof paymentHistoryFilterSchema>;

// Create Payment Schema
export const createPaymentSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum([
    "CASH",
    "CHEQUE",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "ONLINE_PAYMENT",
    "SCHOLARSHIP",
  ]),
  feeTypeIds: z.array(z.string()).min(1, "At least one fee type must be selected"),
  transactionId: z.string().optional(),
  remarks: z.string().max(500, "Remarks must be less than 500 characters").optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// Payment Gateway Order Schema
export const paymentGatewayOrderSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("INR"),
  feeTypeIds: z.array(z.string()).min(1, "At least one fee type must be selected"),
});

export type PaymentGatewayOrderInput = z.infer<typeof paymentGatewayOrderSchema>;

// Verify Payment Schema
export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  signature: z.string().min(1, "Signature is required"),
  childId: z.string().min(1, "Child ID is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  amount: z.number().positive("Amount must be positive"),
  feeTypeIds: z.array(z.string()).min(1, "At least one fee type must be selected"),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// Download Receipt Schema
export const downloadReceiptSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  childId: z.string().min(1, "Child ID is required"),
});

export type DownloadReceiptInput = z.infer<typeof downloadReceiptSchema>;

// Fee Breakdown Response Schema (for type inference)
export const feeBreakdownSchema = z.object({
  totalFees: z.number(),
  paidAmount: z.number(),
  pendingAmount: z.number(),
  overdueAmount: z.number(),
  feeItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      dueDate: z.date().nullable(),
      status: z.enum(["PAID", "PENDING", "OVERDUE", "PARTIAL"]),
      paidAmount: z.number(),
      balance: z.number(),
    })
  ),
  nextDueDate: z.date().nullable(),
  hasOverdue: z.boolean(),
});

export type FeeBreakdown = z.infer<typeof feeBreakdownSchema>;

// Payment Record Response Schema
export const paymentRecordSchema = z.object({
  id: z.string(),
  amount: z.number(),
  paidAmount: z.number(),
  balance: z.number(),
  paymentDate: z.date(),
  paymentMethod: z.enum([
    "CASH",
    "CHEQUE",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "ONLINE_PAYMENT",
    "SCHOLARSHIP",
  ]),
  transactionId: z.string().nullable(),
  receiptNumber: z.string().nullable(),
  status: z.enum(["PENDING", "COMPLETED", "PARTIAL", "FAILED", "REFUNDED"]),
  remarks: z.string().nullable(),
  feeStructureName: z.string(),
  academicYear: z.string(),
});

export type PaymentRecord = z.infer<typeof paymentRecordSchema>;
