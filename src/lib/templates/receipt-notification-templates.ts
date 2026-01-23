/**
 * Receipt Notification Templates
 * 
 * Templates for email and in-app notifications related to payment receipt verification.
 * Requirements: 9.1, 9.2, 9.5
 */



/**
 * In-app notification message for receipt verification
 * Requirement 9.1: Notify on verification
 * Requirement 9.5: Include receipt reference and balance
 */
export function getVerificationSuccessNotification(
  data: ReceiptVerificationData
): { title: string; message: string; type: string; link: string } {
  return {
    title: "Payment Receipt Verified",
    message: `Your payment receipt (${data.receiptReference}) for ${data.feeStructureName} has been verified. Amount: ₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Remaining balance: ₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
    type: "RECEIPT_VERIFIED",
    link: "/student/fees/receipts",
  };
}

/**
 * In-app notification message for receipt rejection
 * Requirement 9.2: Notify on rejection with reason
 * Requirement 9.5: Include receipt reference
 */
export function getRejectionNotification(
  data: ReceiptRejectionData
): { title: string; message: string; type: string; link: string } {
  return {
    title: "Payment Receipt Rejected",
    message: `Your payment receipt (${data.receiptReference}) for ${data.feeStructureName} has been rejected. Reason: ${data.rejectionReason}. Please upload a new receipt with the correct information.`,
    type: "RECEIPT_REJECTED",
    link: "/student/fees/upload-receipt",
  };
}
