import { PaymentStatus, PaymentMethod } from "@prisma/client";
import { FeeItemStatus } from "@/lib/types/fees";

/**
 * Calculates fee item status based on payment information
 */
export function calculateFeeItemStatus(
  amount: number,
  paidAmount: number,
  dueDate: Date | null
): FeeItemStatus {
  if (paidAmount >= amount) {
    return "PAID";
  }
  
  if (paidAmount > 0 && paidAmount < amount) {
    return "PARTIAL";
  }
  
  if (dueDate && new Date() > dueDate) {
    return "OVERDUE";
  }
  
  return "PENDING";
}

/**
 * Checks if a fee is overdue
 */
export function isFeeOverdue(dueDate: Date | null, status: FeeItemStatus): boolean {
  if (!dueDate || status === "PAID") {
    return false;
  }
  
  return new Date() > dueDate;
}

/**
 * Formats payment method for display
 */
export function formatPaymentMethod(method: PaymentMethod): string {
  const methodLabels: Record<PaymentMethod, string> = {
    CASH: "Cash",
    CHEQUE: "Cheque",
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
    BANK_TRANSFER: "Bank Transfer",
    ONLINE_PAYMENT: "Online Payment",
    SCHOLARSHIP: "Scholarship",
  };
  
  return methodLabels[method] || method;
}

/**
 * Formats payment status for display
 */
export function formatPaymentStatus(status: PaymentStatus): string {
  const statusLabels: Record<PaymentStatus, string> = {
    PENDING: "Pending",
    COMPLETED: "Completed",
    PARTIAL: "Partial",
    FAILED: "Failed",
    REFUNDED: "Refunded",
  };
  
  return statusLabels[status] || status;
}

/**
 * Gets status color for UI display
 */
export function getStatusColor(status: FeeItemStatus | PaymentStatus): string {
  const colorMap: Record<string, string> = {
    PAID: "text-green-600 bg-green-50",
    COMPLETED: "text-green-600 bg-green-50",
    PENDING: "text-yellow-600 bg-yellow-50",
    PARTIAL: "text-blue-600 bg-blue-50",
    OVERDUE: "text-red-600 bg-red-50",
    FAILED: "text-red-600 bg-red-50",
    REFUNDED: "text-gray-600 bg-gray-50",
  };
  
  return colorMap[status] || "text-gray-600 bg-gray-50";
}

/**
 * Calculates total balance from fee items
 */
export function calculateTotalBalance(
  feeItems: Array<{ amount: number; paidAmount: number }>
): number {
  return feeItems.reduce((total, item) => {
    return total + (item.amount - item.paidAmount);
  }, 0);
}

/**
 * Calculates total paid amount from fee items
 */
export function calculateTotalPaid(
  feeItems: Array<{ paidAmount: number }>
): number {
  return feeItems.reduce((total, item) => total + item.paidAmount, 0);
}

/**
 * Calculates total fees from fee items
 */
export function calculateTotalFees(
  feeItems: Array<{ amount: number }>
): number {
  return feeItems.reduce((total, item) => total + item.amount, 0);
}

/**
 * Finds the next due date from fee items
 */
export function findNextDueDate(
  feeItems: Array<{ dueDate: Date | null; status: FeeItemStatus }>
): Date | null {
  const upcomingDueDates = feeItems
    .filter((item) => item.dueDate && item.status !== "PAID")
    .map((item) => item.dueDate!)
    .filter((date) => date >= new Date())
    .sort((a, b) => a.getTime() - b.getTime());
  
  return upcomingDueDates[0] || null;
}

/**
 * Checks if there are any overdue fees
 */
export function hasOverdueFees(
  feeItems: Array<{ status: FeeItemStatus }>
): boolean {
  return feeItems.some((item) => item.status === "OVERDUE");
}

/**
 * Calculates overdue amount
 */
export function calculateOverdueAmount(
  feeItems: Array<{ amount: number; paidAmount: number; status: FeeItemStatus }>
): number {
  return feeItems
    .filter((item) => item.status === "OVERDUE")
    .reduce((total, item) => total + (item.amount - item.paidAmount), 0);
}

/**
 * Generates a unique receipt number
 */
export function generateReceiptNumber(count: number): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const sequence = String(count + 1).padStart(4, "0");
  
  return `RCP${year}${month}${sequence}`;
}

/**
 * Validates payment amount against fee structure
 */
export function validatePaymentAmount(
  amount: number,
  totalFees: number,
  paidAmount: number
): { valid: boolean; message?: string } {
  if (amount <= 0) {
    return { valid: false, message: "Payment amount must be greater than zero" };
  }
  
  const balance = totalFees - paidAmount;
  
  if (amount > balance) {
    return {
      valid: false,
      message: `Payment amount cannot exceed balance of ₹${balance.toFixed(2)}`,
    };
  }
  
  return { valid: true };
}

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Formats date and time for display
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Calculates payment completion percentage
 */
export function calculatePaymentPercentage(
  totalFees: number,
  paidAmount: number
): number {
  if (totalFees === 0) return 0;
  return Math.round((paidAmount / totalFees) * 100);
}

/**
 * Groups payments by month
 */
export function groupPaymentsByMonth(
  payments: Array<{ paymentDate: Date; paidAmount: number }>
): Record<string, { month: string; total: number; count: number }> {
  const grouped: Record<string, { month: string; total: number; count: number }> = {};
  
  payments.forEach((payment) => {
    const monthKey = new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
    }).format(payment.paymentDate);
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = { month: monthKey, total: 0, count: 0 };
    }
    
    grouped[monthKey].total += payment.paidAmount;
    grouped[monthKey].count += 1;
  });
  
  return grouped;
}

/**
 * Sanitizes transaction ID for security
 */
export function sanitizeTransactionId(transactionId: string | null): string | null {
  if (!transactionId) return null;
  
  // Remove any potentially harmful characters
  return transactionId.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Validates receipt number format
 */
export function isValidReceiptNumber(receiptNumber: string): boolean {
  // Format: RCP + YYYY + MM + XXXX (e.g., RCP202411001)
  const pattern = /^RCP\d{4}(0[1-9]|1[0-2])\d{4}$/;
  return pattern.test(receiptNumber);
}
