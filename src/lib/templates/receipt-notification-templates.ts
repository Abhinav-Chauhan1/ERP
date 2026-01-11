/**
 * Receipt Notification Templates
 * 
 * Templates for email and in-app notifications related to payment receipt verification.
 * Requirements: 9.1, 9.2, 9.5
 */

export interface ReceiptVerificationData {
  studentName: string;
  receiptReference: string;
  feeStructureName: string;
  amount: number;
  remainingBalance: number;
  paymentDate: string;
}

export interface ReceiptRejectionData {
  studentName: string;
  receiptReference: string;
  feeStructureName: string;
  amount: number;
  rejectionReason: string;
  paymentDate: string;
}

/**
 * Email template for receipt verification success
 * Requirement 9.1: Notify on verification
 * Requirement 9.5: Include receipt reference and balance
 */
export function getVerificationSuccessEmailTemplate(
  data: ReceiptVerificationData
): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt Verified - ${data.receiptReference}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt Verified</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .success-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
      font-weight: 500;
    }
    .amount {
      font-size: 20px;
      color: #10b981;
      font-weight: 700;
    }
    .balance {
      font-size: 18px;
      color: #667eea;
      font-weight: 600;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      border-radius: 0 0 10px 10px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✓ Payment Receipt Verified</h1>
  </div>
  
  <div class="content">
    <div class="success-badge">✓ Verified</div>
    
    <p>Dear ${data.studentName},</p>
    
    <p>Great news! Your payment receipt has been successfully verified by our administration team.</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Receipt Reference:</span>
        <span class="info-value">${data.receiptReference}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fee Structure:</span>
        <span class="info-value">${data.feeStructureName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Date:</span>
        <span class="info-value">${data.paymentDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Amount Paid:</span>
        <span class="amount">₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Remaining Balance:</span>
        <span class="balance">₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
    
    <p>Your payment has been recorded in our system and your fee balance has been updated accordingly.</p>
    
    ${data.remainingBalance > 0
      ? `<p><strong>Note:</strong> You still have a remaining balance of ₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Please make the payment at your earliest convenience.</p>`
      : `<p><strong>Congratulations!</strong> Your fee payment for ${data.feeStructureName} is now complete.</p>`
    }
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/fees/receipts" class="button">View Receipt Details</a>
    </center>
  </div>
  
  <div class="footer">
    <p>This is an automated notification from SikshaMitra.</p>
    <p>If you have any questions, please contact the administration office.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Payment Receipt Verified

Dear ${data.studentName},

Great news! Your payment receipt has been successfully verified by our administration team.

Receipt Details:
- Receipt Reference: ${data.receiptReference}
- Fee Structure: ${data.feeStructureName}
- Payment Date: ${data.paymentDate}
- Amount Paid: ₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Remaining Balance: ₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Your payment has been recorded in our system and your fee balance has been updated accordingly.

${data.remainingBalance > 0
      ? `Note: You still have a remaining balance of ₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Please make the payment at your earliest convenience.`
      : `Congratulations! Your fee payment for ${data.feeStructureName} is now complete.`
    }

View your receipt details at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/fees/receipts

---
This is an automated notification from SikshaMitra.
If you have any questions, please contact the administration office.
  `.trim();

  return { subject, html, text };
}

/**
 * Email template for receipt rejection
 * Requirement 9.2: Notify on rejection with reason
 * Requirement 9.5: Include receipt reference
 */
export function getRejectionEmailTemplate(
  data: ReceiptRejectionData
): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt Rejected - ${data.receiptReference}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt Rejected</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .warning-badge {
      display: inline-block;
      background: #ef4444;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f9fafb;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
      font-weight: 500;
    }
    .rejection-reason {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .rejection-reason h3 {
      margin: 0 0 10px 0;
      color: #dc2626;
      font-size: 16px;
    }
    .rejection-reason p {
      margin: 0;
      color: #991b1b;
      font-weight: 500;
    }
    .action-required {
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .action-required h3 {
      margin: 0 0 10px 0;
      color: #d97706;
      font-size: 16px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      border-radius: 0 0 10px 10px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #ef4444;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #dc2626;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✗ Payment Receipt Rejected</h1>
  </div>
  
  <div class="content">
    <div class="warning-badge">✗ Rejected</div>
    
    <p>Dear ${data.studentName},</p>
    
    <p>We regret to inform you that your payment receipt has been rejected by our administration team.</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Receipt Reference:</span>
        <span class="info-value">${data.receiptReference}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fee Structure:</span>
        <span class="info-value">${data.feeStructureName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Date:</span>
        <span class="info-value">${data.paymentDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Amount:</span>
        <span class="info-value">₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
    
    <div class="rejection-reason">
      <h3>Rejection Reason:</h3>
      <p>${data.rejectionReason}</p>
    </div>
    
    <div class="action-required">
      <h3>⚠️ Action Required:</h3>
      <p>Please review the rejection reason above and upload a new receipt with the correct information. Ensure that:</p>
      <ul>
        <li>The receipt image is clear and readable</li>
        <li>All payment details are visible</li>
        <li>The amount matches your payment</li>
        <li>The date is correct</li>
      </ul>
    </div>
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/fees/upload-receipt" class="button">Upload New Receipt</a>
    </center>
  </div>
  
  <div class="footer">
    <p>This is an automated notification from SikshaMitra.</p>
    <p>If you have any questions about the rejection, please contact the administration office.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Payment Receipt Rejected

Dear ${data.studentName},

We regret to inform you that your payment receipt has been rejected by our administration team.

Receipt Details:
- Receipt Reference: ${data.receiptReference}
- Fee Structure: ${data.feeStructureName}
- Payment Date: ${data.paymentDate}
- Amount: ₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Rejection Reason:
${data.rejectionReason}

ACTION REQUIRED:
Please review the rejection reason above and upload a new receipt with the correct information. Ensure that:
- The receipt image is clear and readable
- All payment details are visible
- The amount matches your payment
- The date is correct

Upload a new receipt at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/fees/upload-receipt

---
This is an automated notification from SikshaMitra.
If you have any questions about the rejection, please contact the administration office.
  `.trim();

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
