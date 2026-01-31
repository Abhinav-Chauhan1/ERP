/**
 * Receipt Notification Templates
 * 
 * Templates for email and in-app notifications related to payment receipt verification.
 * Requirements: 9.1, 9.2, 9.5
 */

export interface ReceiptVerificationData {
  receiptReference: string;
  feeStructureName: string;
  amount: number;
  remainingBalance: number;
  studentName: string;
  parentEmail?: string;
  verifiedBy: string;
  verifiedAt: Date;
}

export interface ReceiptRejectionData {
  receiptReference: string;
  feeStructureName: string;
  rejectionReason: string;
  studentName: string;
  parentEmail?: string;
  rejectedBy: string;
  rejectedAt: Date;
}

/**
 * Email template for receipt verification success
 */
export function getVerificationSuccessEmailTemplate(
  data: ReceiptVerificationData
): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt Verified - ${data.receiptReference}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Payment Receipt Verified</h2>
      <p>Dear Parent/Guardian,</p>
      <p>We are pleased to inform you that the payment receipt for <strong>${data.studentName}</strong> has been successfully verified.</p>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0369a1;">Receipt Details</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Receipt Reference:</strong> ${data.receiptReference}</li>
          <li><strong>Fee Structure:</strong> ${data.feeStructureName}</li>
          <li><strong>Amount Paid:</strong> ₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          <li><strong>Remaining Balance:</strong> ₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          <li><strong>Verified By:</strong> ${data.verifiedBy}</li>
          <li><strong>Verified On:</strong> ${data.verifiedAt.toLocaleDateString('en-IN')}</li>
        </ul>
      </div>
      
      <p>The payment has been recorded in our system and will be reflected in your fee statement.</p>
      <p>Thank you for your prompt payment.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
  
  const text = `
Payment Receipt Verified - ${data.receiptReference}

Dear Parent/Guardian,

We are pleased to inform you that the payment receipt for ${data.studentName} has been successfully verified.

Receipt Details:
- Receipt Reference: ${data.receiptReference}
- Fee Structure: ${data.feeStructureName}
- Amount Paid: ₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Remaining Balance: ₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Verified By: ${data.verifiedBy}
- Verified On: ${data.verifiedAt.toLocaleDateString('en-IN')}

The payment has been recorded in our system and will be reflected in your fee statement.

Thank you for your prompt payment.

This is an automated message. Please do not reply to this email.
  `;
  
  return { subject, html, text };
}

/**
 * Email template for receipt rejection
 */
export function getRejectionEmailTemplate(
  data: ReceiptRejectionData
): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt Rejected - ${data.receiptReference}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Payment Receipt Rejected</h2>
      <p>Dear Parent/Guardian,</p>
      <p>We regret to inform you that the payment receipt submitted for <strong>${data.studentName}</strong> has been rejected.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <h3 style="margin-top: 0; color: #dc2626;">Rejection Details</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Receipt Reference:</strong> ${data.receiptReference}</li>
          <li><strong>Fee Structure:</strong> ${data.feeStructureName}</li>
          <li><strong>Rejection Reason:</strong> ${data.rejectionReason}</li>
          <li><strong>Rejected By:</strong> ${data.rejectedBy}</li>
          <li><strong>Rejected On:</strong> ${data.rejectedAt.toLocaleDateString('en-IN')}</li>
        </ul>
      </div>
      
      <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #d97706;">Next Steps</h3>
        <p>Please review the rejection reason and upload a new receipt with the correct information. Ensure that:</p>
        <ul>
          <li>The receipt is clear and legible</li>
          <li>All payment details are visible</li>
          <li>The amount matches the fee structure</li>
          <li>The receipt is from an authorized payment method</li>
        </ul>
      </div>
      
      <p>If you have any questions or need assistance, please contact the school office.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
  
  const text = `
Payment Receipt Rejected - ${data.receiptReference}

Dear Parent/Guardian,

We regret to inform you that the payment receipt submitted for ${data.studentName} has been rejected.

Rejection Details:
- Receipt Reference: ${data.receiptReference}
- Fee Structure: ${data.feeStructureName}
- Rejection Reason: ${data.rejectionReason}
- Rejected By: ${data.rejectedBy}
- Rejected On: ${data.rejectedAt.toLocaleDateString('en-IN')}

Next Steps:
Please review the rejection reason and upload a new receipt with the correct information. Ensure that:
- The receipt is clear and legible
- All payment details are visible
- The amount matches the fee structure
- The receipt is from an authorized payment method

If you have any questions or need assistance, please contact the school office.

This is an automated message. Please do not reply to this email.
  `;
  
  return { subject, html, text };
}



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
