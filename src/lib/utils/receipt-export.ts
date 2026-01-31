/**
 * Receipt Export Utilities
 * Provides functions to export receipt data to CSV/Excel formats
 */

import { format } from "date-fns";
import { ReceiptStatus, PaymentMethod } from "@prisma/client";

interface ReceiptExportData {
  referenceNumber: string;
  status: ReceiptStatus;
  studentName: string;
  studentEmail: string | null;
  admissionNumber?: string | null;
  class: string;
  section: string;
  feeStructure: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  submittedDate: Date;
  verifiedDate?: Date | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  transactionRef?: string | null;
  remarks?: string | null;
}

/**
 * Convert receipt data to CSV format
 */
export function exportReceiptsToCSV(receipts: ReceiptExportData[]): string {
  // CSV Headers
  const headers = [
    "Reference Number",
    "Status",
    "Student Name",
    "Student Email",
    "Admission Number",
    "Class",
    "Section",
    "Fee Structure",
    "Amount (₹)",
    "Payment Method",
    "Payment Date",
    "Submitted Date",
    "Verified/Rejected Date",
    "Verified By",
    "Rejection Reason",
    "Transaction Reference",
    "Remarks",
  ];

  // Convert data to CSV rows
  const rows = receipts.map((receipt) => [
    receipt.referenceNumber,
    formatStatus(receipt.status),
    receipt.studentName,
    receipt.studentEmail || "N/A",
    receipt.admissionNumber || "N/A",
    receipt.class,
    receipt.section,
    receipt.feeStructure,
    receipt.amount.toFixed(2),
    formatPaymentMethod(receipt.paymentMethod),
    format(new Date(receipt.paymentDate), "yyyy-MM-dd"),
    format(new Date(receipt.submittedDate), "yyyy-MM-dd HH:mm"),
    receipt.verifiedDate ? format(new Date(receipt.verifiedDate), "yyyy-MM-dd HH:mm") : "N/A",
    receipt.verifiedBy || "N/A",
    receipt.rejectionReason || "N/A",
    receipt.transactionRef || "N/A",
    receipt.remarks || "N/A",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export receipts with automatic filename
 */
export function exportReceipts(
  receipts: ReceiptExportData[],
  type: "pending" | "verified" | "rejected" | "all"
) {
  const csvContent = exportReceiptsToCSV(receipts);
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
  const filename = `receipts-${type}-${timestamp}.csv`;

  downloadCSV(csvContent, filename);
}

/**
 * Format receipt status for display
 */
function formatStatus(status: ReceiptStatus): string {
  switch (status) {
    case ReceiptStatus.PENDING_VERIFICATION:
      return "Pending";
    case ReceiptStatus.VERIFIED:
      return "Verified";
    case ReceiptStatus.REJECTED:
      return "Rejected";
    default:
      return status;
  }
}

/**
 * Format payment method for display
 */
function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case "CASH":
      return "Cash";
    case "CHEQUE":
      return "Cheque";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    default:
      return method;
  }
}

/**
 * Generate summary statistics for export
 */
export function generateReceiptSummary(receipts: ReceiptExportData[]): string {
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const statusCounts = receipts.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const summary = [
    "Receipt Export Summary",
    `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
    "",
    `Total Receipts: ${receipts.length}`,
    `Total Amount: ₹${totalAmount.toFixed(2)}`,
    "",
    "Status Breakdown:",
    ...Object.entries(statusCounts).map(
      ([status, count]) => `  ${formatStatus(status as ReceiptStatus)}: ${count}`
    ),
    "",
    "---",
    "",
  ].join("\n");

  return summary;
}

/**
 * Export receipts with summary
 */
export function exportReceiptsWithSummary(
  receipts: ReceiptExportData[],
  type: "pending" | "verified" | "rejected" | "all"
) {
  const summary = generateReceiptSummary(receipts);
  const csvContent = exportReceiptsToCSV(receipts);
  const fullContent = summary + csvContent;

  const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
  const filename = `receipts-${type}-${timestamp}.csv`;

  downloadCSV(fullContent, filename);
}
