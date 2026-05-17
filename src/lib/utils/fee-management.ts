/**
 * Fee Management Utilities
 * 
 * This module exports all fee management related utilities, error handlers,
 * and helper functions for the parent dashboard fee management system.
 */

// Export payment helper functions
export {
  calculateFeeItemStatus,
  isFeeOverdue,
  formatPaymentMethod,
  formatPaymentStatus,
  getStatusColor,
  calculateTotalBalance,
  calculateTotalPaid,
  calculateTotalFees,
  findNextDueDate,
  hasOverdueFees,
  calculateOverdueAmount,
  generateReceiptNumber,
  validatePaymentAmount,
  formatDate,
  formatDateTime,
  calculatePaymentPercentage,
  groupPaymentsByMonth,
  sanitizeTransactionId,
  isValidReceiptNumber,
} from "./payment-helpers";

export { formatCurrency } from "./export-utils";

// Export validation schemas
export {
  feeOverviewSchema,
  paymentHistoryFilterSchema,
  createPaymentSchema,
  paymentGatewayOrderSchema,
  verifyPaymentSchema,
  downloadReceiptSchema,
  feeBreakdownSchema,
  paymentRecordSchema,
} from "../schemaValidation/parent-fee-schemas";

// Export types
export type {
  FeeOverview,
  FeeBreakdownItem,
  FeeItemStatus,
  PaymentHistoryItem,
  PaymentHistoryResponse,
  CreatePaymentData,
  PaymentCreationResult,
  PaymentGatewayOrder,
  PaymentVerificationData,
  PaymentVerificationResult,
  ReceiptData,
  FeeStatistics,
  FeeError,
  FeeApiResponse,
} from "../types/fees";

export { FeeErrorCode } from "../types/fees";

// Export schema input types
export type {
  FeeOverviewInput,
  PaymentHistoryFilter,
  CreatePaymentInput,
  PaymentGatewayOrderInput,
  VerifyPaymentInput,
  DownloadReceiptInput,
  FeeBreakdown,
  PaymentRecord,
} from "../schemaValidation/parent-fee-schemas";
