import { PaymentMethod, PaymentStatus } from "@prisma/client";

// Fee Overview Types
export interface FeeOverview {
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  feeBreakdown: FeeBreakdownItem[];
  nextDueDate: Date | null;
  hasOverdue: boolean;
  studentInfo: {
    id: string;
    name: string;
    admissionId: string;
    class: string;
    section: string;
  };
  academicYear: {
    id: string;
    name: string;
  };
}

export interface FeeBreakdownItem {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  paidAmount: number;
  balance: number;
  dueDate: Date | null;
  status: FeeItemStatus;
  frequency: string;
  isOptional: boolean;
}

export type FeeItemStatus = "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";

// Payment History Types
export interface PaymentHistoryItem {
  id: string;
  amount: number;
  paidAmount: number;
  balance: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  receiptNumber: string | null;
  status: PaymentStatus;
  remarks: string | null;
  feeStructure: {
    id: string;
    name: string;
  };
  academicYear: {
    id: string;
    name: string;
  };
  feeItems: {
    id: string;
    name: string;
    amount: number;
  }[];
}

export interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Payment Creation Types
export interface CreatePaymentData {
  childId: string;
  feeStructureId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  feeTypeIds: string[];
  transactionId?: string;
  remarks?: string;
}

export interface PaymentCreationResult {
  success: boolean;
  paymentId?: string;
  receiptNumber?: string;
  message?: string;
  error?: string;
}

// Payment Gateway Types
export interface PaymentGatewayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  studentName: string;
  studentEmail: string;
  contactNumber: string;
  description: string;
}

export interface PaymentVerificationData {
  orderId: string;
  paymentId: string;
  signature: string;
  childId: string;
  feeStructureId: string;
  amount: number;
  feeTypeIds: string[];
}

export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  paymentId?: string;
  receiptNumber?: string;
  message?: string;
  error?: string;
}

// Receipt Types
export interface ReceiptData {
  receiptNumber: string;
  paymentDate: Date;
  studentInfo: {
    name: string;
    admissionId: string;
    class: string;
    section: string;
  };
  parentInfo: {
    name: string;
    email: string;
    phone: string | null;
  };
  paymentDetails: {
    amount: number;
    paidAmount: number;
    balance: number;
    paymentMethod: PaymentMethod;
    transactionId: string | null;
    status: PaymentStatus;
  };
  feeItems: {
    name: string;
    amount: number;
  }[];
  academicYear: string;
  schoolInfo: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
}

// Fee Statistics Types
export interface FeeStatistics {
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paymentCount: number;
  lastPaymentDate: Date | null;
  nextDueDate: Date | null;
}

// Error Types
export interface FeeError {
  code: FeeErrorCode;
  message: string;
  details?: any;
}

export enum FeeErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CHILD = "INVALID_CHILD",
  INVALID_FEE_STRUCTURE = "INVALID_FEE_STRUCTURE",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_VERIFICATION_FAILED = "PAYMENT_VERIFICATION_FAILED",
  RECEIPT_NOT_FOUND = "RECEIPT_NOT_FOUND",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  DATABASE_ERROR = "DATABASE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PAYMENT_GATEWAY_ERROR = "PAYMENT_GATEWAY_ERROR",
}

// API Response Types
export interface FeeApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: FeeError;
  message?: string;
}
