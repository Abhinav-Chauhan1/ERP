import { PaymentMethod, PaymentStatus } from "@prisma/client";

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  dueDate: Date | null;
  status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  paidAmount: number;
  balance: number;
}

export interface FeeOverviewData {
  student: {
    id: string;
    name: string;
    class: string;
  };
  feeStructureId?: string;
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  feeItems: FeeItem[];
  nextDueDate: Date | null;
  hasOverdue: boolean;
  academicYear: string;
}

export interface PaymentRecord {
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
  feeStructureName: string;
  academicYear: string;
}

export interface PaymentHistoryData {
  payments: PaymentRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface PaymentResponse {
  paymentId: string;
  receiptNumber: string | null;
  status: PaymentStatus;
}

export interface ReceiptData {
  receiptNumber: string | null;
  paymentDate: Date;
  student: {
    name: string;
    email: string;
    class: string;
    section: string;
    admissionId: string;
  };
  payment: {
    amount: number;
    paidAmount: number;
    balance: number;
    paymentMethod: PaymentMethod;
    transactionId: string | null;
    status: PaymentStatus;
  };
  feeStructure: {
    name: string;
    academicYear: string;
  };
  feeItems: Array<{
    name: string;
    amount: number;
  }>;
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
