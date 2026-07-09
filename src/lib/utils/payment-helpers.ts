import { PaymentStatus, PaymentMethod, UserRole, FeeFrequency } from "@prisma/client";
import { differenceInCalendarMonths } from "date-fns";
import { FeeItemStatus } from "@/lib/types/fees";
import { currentUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

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

export interface DiscountInput {
  discountType: "FLAT_AMOUNT" | "PERCENTAGE";
  value: number;
}

/**
 * Calculates the rupee value of a discount for a given gross total, clamped to [0, grossTotal].
 */
export function calculateDiscountAmount(
  grossTotal: number,
  discount: DiscountInput | null
): number {
  if (!discount || grossTotal <= 0) return 0;
  const raw =
    discount.discountType === "PERCENTAGE"
      ? (grossTotal * discount.value) / 100
      : discount.value;
  return Math.min(Math.max(raw, 0), grossTotal);
}

/**
 * Returns grossTotal minus the applicable discount, floored at 0.
 */
export function calculateNetPayable(
  grossTotal: number,
  discount: DiscountInput | null
): number {
  return grossTotal - calculateDiscountAmount(grossTotal, discount);
}

/**
 * Fetches the active FeeDiscount for a student+feeStructure, scoped by schoolId, or null.
 */
export async function getActiveFeeDiscount(
  studentId: string,
  feeStructureId: string,
  schoolId: string
): Promise<DiscountInput | null> {
  const row = await db.feeDiscount.findUnique({
    where: { studentId_feeStructureId: { studentId, feeStructureId } },
  });
  if (!row || !row.isActive || row.schoolId !== schoolId) return null;
  return { discountType: row.discountType, value: row.value };
}

/**
 * Number of billing occurrences per academic year for a fee type's frequency,
 * used to expand a per-occurrence amount (e.g. Monthly tuition) into its annual total.
 */
export function getFeeFrequencyMultiplier(frequency: FeeFrequency): number {
  switch (frequency) {
    case "MONTHLY":
      return 12;
    case "QUARTERLY":
      return 4;
    case "SEMI_ANNUAL":
      return 2;
    case "ANNUAL":
    case "ONE_TIME":
    default:
      return 1;
  }
}

/**
 * Resolves the annualized amount owed for each fee type against a class: the
 * class-specific override (FeeTypeClassAmount) or the fee type's own default
 * amount, expanded by its billing frequency (e.g. Monthly x12).
 */
export async function getFeeAmountsForClass(
  feeTypeIds: string[],
  classId: string | undefined,
  schoolId: string
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const uniqueFeeTypeIds = Array.from(new Set(feeTypeIds));
  if (uniqueFeeTypeIds.length === 0) return result;

  const [feeTypes, classAmounts] = await Promise.all([
    db.feeType.findMany({ where: { id: { in: uniqueFeeTypeIds }, schoolId } }),
    classId
      ? db.feeTypeClassAmount.findMany({
          where: { feeTypeId: { in: uniqueFeeTypeIds }, classId, schoolId },
        })
      : Promise.resolve([]),
  ]);

  const classAmountMap = new Map(classAmounts.map((ca) => [ca.feeTypeId, ca.amount]));

  feeTypes.forEach((ft) => {
    const baseAmount = classAmountMap.get(ft.id) ?? ft.amount;
    result.set(ft.id, baseAmount * getFeeFrequencyMultiplier(ft.frequency));
  });

  return result;
}

/**
 * Single-fee-type convenience wrapper around getFeeAmountsForClass.
 */
export async function getFeeAmountForClass(
  feeTypeId: string,
  classId: string | undefined,
  schoolId: string
): Promise<number> {
  const amounts = await getFeeAmountsForClass([feeTypeId], classId, schoolId);
  return amounts.get(feeTypeId) ?? 0;
}

/**
 * How much of a recurring fee item should have accrued by now, given when it
 * effectively started for this student. ONE_TIME/ANNUAL items are due in full
 * as soon as they've started (no accrual); MONTHLY/QUARTERLY/SEMI_ANNUAL items
 * accrue one occurrence per elapsed billing period, capped at the frequency's
 * annual occurrence count so it never exceeds the already-annualized total.
 */
export function calculateAccruedAmount(
  perOccurrenceAmount: number,
  frequency: FeeFrequency,
  effectiveStartDate: Date,
  asOfDate: Date = new Date()
): number {
  if (asOfDate < effectiveStartDate) return 0;

  if (frequency === "ONE_TIME" || frequency === "ANNUAL") {
    return perOccurrenceAmount;
  }

  const periodMonths = frequency === "MONTHLY" ? 1 : frequency === "QUARTERLY" ? 3 : 6; // SEMI_ANNUAL
  const monthsElapsed = differenceInCalendarMonths(asOfDate, effectiveStartDate) + 1; // the current period counts as started
  const periodsElapsed = Math.ceil(monthsElapsed / periodMonths);
  const maxOccurrences = getFeeFrequencyMultiplier(frequency);

  return perOccurrenceAmount * Math.min(Math.max(periodsElapsed, 0), maxOccurrences);
}

/**
 * Sums how much of a fee structure should have been paid by now across all of
 * its items: items with an explicit dueDate contribute their full (annualized)
 * amount once that date has passed (unchanged due-date behavior), and items
 * without one accrue over elapsed billing periods per calculateAccruedAmount.
 */
export function calculateAccruedFeeTotal(
  items: Array<{ annualizedAmount: number; frequency: FeeFrequency; dueDate: Date | null }>,
  effectiveStartDate: Date,
  asOfDate: Date = new Date()
): number {
  return items.reduce((sum, item) => {
    if (item.dueDate) {
      return sum + (item.dueDate <= asOfDate ? item.annualizedAmount : 0);
    }
    const perOccurrenceAmount = item.annualizedAmount / getFeeFrequencyMultiplier(item.frequency);
    return sum + calculateAccruedAmount(perOccurrenceAmount, item.frequency, effectiveStartDate, asOfDate);
  }, 0);
}

export async function getCurrentParent() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();

  const dbUser = await db.user.findFirst({
    where: { id: clerkUser.id }
  });
  if (!dbUser || dbUser.role !== UserRole.PARENT) return null;

  return db.parent.findFirst({ where: { userId: dbUser.id, schoolId } });
}
