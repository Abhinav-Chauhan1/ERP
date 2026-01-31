
/**
 * SikshaMitra Email Templates
 * 
 * Centralized email templates for consistent branding and structure.
 * Branding Colors:
 * - Red (SIKSHA): #FF3333
 * - Black (MITRA): #1A1A1A
 * - Gray (Tagline): #666666
 */

interface BaseTemplateOptions {
  title: string;
  children: string; // The HTML content
}

/**
 * Base email template with common header, footer, and styling
 */
function baseEmailTemplate({ title, children }: BaseTemplateOptions): string {
  // Use the app URL for linking to the logo if available, or just use text fallbacks
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  const logoUrl = `${appUrl}/logo.png`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          /* Reset and Base Styles */
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          
          /* Container */
          .email-wrapper {
            width: 100%;
            background-color: #f4f4f5;
            padding: 20px 0;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          
          /* Header */
          .email-header {
            background-color: #ffffff;
            padding: 30px 20px 20px;
            text-align: center;
            border-bottom: 3px solid #FF3333;
          }
          
          .logo-text {
            font-size: 28px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.5px;
            line-height: 1.2;
          }
          
          .logo-red {
            color: #FF3333;
          }
          
          .logo-black {
            color: #000000;
          }
          
          .tagline {
            font-size: 10px;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
            font-weight: 600;
          }
          
          /* Content */
          .email-body {
            padding: 40px 30px;
            color: #4b5563;
          }
          
          h1 {
            color: #111827;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 700;
          }
          
          p {
            margin-bottom: 16px;
            font-size: 16px;
          }
          
          /* Buttons */
          .btn-container {
            text-align: center;
            margin: 30px 0;
          }
          
          .btn {
            display: inline-block;
            background-color: #FF3333; /* Brand Red */
            color: #ffffff !important;
            font-weight: 600;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(255, 51, 51, 0.2);
            transition: background-color 0.2s;
          }
          
          .btn:hover {
            background-color: #e02e2e;
          }
          
          /* Info Box */
          .info-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .info-row {
            margin-bottom: 8px;
          }
          
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          
          .info-value {
            color: #6b7280;
          }
          
          .link-text {
            word-break: break-all;
            color: #FF3333;
            font-size: 14px;
          }
          
          /* Footer */
          .email-footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #9ca3af;
          }
          
          .footer-links {
            margin-bottom: 10px;
          }
          
          .footer-link {
            color: #6b7280;
            text-decoration: underline;
            margin: 0 5px;
          }
          
          /* Responsive */
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
              border-radius: 0 !important;
            }
            
            .email-body {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <table align="center" border="0" cellpadding="0" cellspacing="0" class="email-container" style="border-collapse: collapse;">
            <!-- Header -->
            <tr>
              <td class="email-header">
                <!-- Fallback to text logo if image fails or for simplicity -->
                <div class="logo-text">
                  <span class="logo-red">SIKSHA</span><span class="logo-black">MITRA</span>
                </div>
                <div class="tagline">The Digital Partner of Modern Schools</div>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td class="email-body">
                ${children}
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td class="email-footer">
                <p>&copy; ${new Date().getFullYear()} SikshaMitra. All rights reserved.</p>
                <div class="footer-links">
                  <a href="${appUrl}/privacy" class="footer-link">Privacy Policy</a>
                  <a href="${appUrl}/terms" class="footer-link">Terms of Service</a>
                </div>
                <p>This is an automated message, please do not reply directly to this email.</p>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for Email Verification
 */
export function getVerificationEmailHtml(params: {
  userName: string;
  verificationUrl: string;
}): string {
  const { userName, verificationUrl } = params;

  const content = `
    <h1>Verify Your Email Address</h1>
    <p>Hello ${userName},</p>
    <p>Thank you for joining SikshaMitra! We're excited to have you on board. Please verify your email address to complete your registration and access your account.</p>
    
    <div class="btn-container">
      <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    </div>
    
    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
    <p><a href="${verificationUrl}" class="link-text">${verificationUrl}</a></p>
    
    <p><strong>Note:</strong> This link will expire in 24 hours for security reasons.</p>
    
    <p>If you didn't create an account with SikshaMitra, please ignore this email.</p>
    
    <p>Best regards,<br>The SikshaMitra Team</p>
  `;

  return baseEmailTemplate({
    title: "Verify Your Email - SikshaMitra",
    children: content
  });
}

/**
 * Generate HTML for Admission Confirmation
 */
export function getAdmissionConfirmationEmailHtml(params: {
  parentName: string;
  studentName: string;
  applicationNumber: string;
  appliedClass: string;
}): string {
  const { parentName, studentName, applicationNumber, appliedClass } = params;

  const content = `
    <h1>Application Received</h1>
    <p>Dear ${parentName},</p>
    <p>Thank you for submitting an admission application for <strong>${studentName}</strong> at SikshaMitra. We have successfully received your application.</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Application Number:</span>
        <span class="info-value">${applicationNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Student Name:</span>
        <span class="info-value">${studentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Applied Class:</span>
        <span class="info-value">${appliedClass}</span>
      </div>
    </div>
    
    <p>We will review your application shortly. You will be notified about the status of your application via email.</p>
    <p>Please keep your application number safe for future reference.</p>
    
    <p>If you have any questions, please feel free to contact our administration office.</p>
    
    <p>Best regards,<br>School Administration</p>
  `;

  return baseEmailTemplate({
    title: "Admission Application Received - SikshaMitra",
    children: content
  });
}

/**
 * Generate HTML for Scheduled Reports
 */
export function getScheduledReportEmailHtml(params: {
  reportName: string;
  reportDescription?: string;
  generatedAt: Date;
}): string {
  const { reportName, reportDescription, generatedAt } = params;

  const content = `
    <h1>Your Scheduled Report is Ready</h1>
    <p>The scheduled report <strong>"${reportName}"</strong> has been successfully generated.</p>
    
    ${reportDescription ? `<p>${reportDescription}</p>` : ''}
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Report Name:</span>
        <span class="info-value">${reportName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Generated Date:</span>
        <span class="info-value">${generatedAt.toLocaleDateString()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Generated Time:</span>
        <span class="info-value">${generatedAt.toLocaleTimeString()}</span>
      </div>
    </div>
    
    <p>Please find the report attached to this email.</p>
    
    <p>If you wish to manage your scheduled reports, please login to your administrative dashboard.</p>
  `;

  return baseEmailTemplate({
    title: `Report: ${reportName} - SikshaMitra`,
    children: content
  });
}

/**
 * Generate HTML for Password Reset
 */
export function getPasswordResetEmailHtml(params: {
  userName: string;
  resetUrl: string;
}): string {
  const { userName, resetUrl } = params;

  const content = `
    <h1>Password Reset Request</h1>
    <p>Hello ${userName},</p>
    <p>We received a request to reset your password for your SikshaMitra account. Click the button below to reset your password:</p>
    
    <div class="btn-container">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <p><a href="${resetUrl}" class="link-text">${resetUrl}</a></p>
    
    <div class="info-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.</p>
    </div>
    
    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    
    <p>For security reasons, we recommend:</p>
    <ul>
      <li>Never share your password with anyone</li>
      <li>Use a strong, unique password</li>
      <li>Enable two-factor authentication</li>
    </ul>
    
    <p>Best regards,<br>The SikshaMitra Team</p>
  `;

  return baseEmailTemplate({
    title: "Password Reset Request - SikshaMitra",
    children: content
  });
}

export interface ReceiptVerificationData {
  schoolId: string;
  studentName: string;
  receiptReference: string;
  feeStructureName: string;
  amount: number;
  remainingBalance: number;
  paymentDate: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface ReceiptRejectionData {
  schoolId: string;
  studentName: string;
  receiptReference: string;
  feeStructureName: string;
  amount: number;
  rejectionReason: string;
  paymentDate: string;
  rejectedBy?: string;
  rejectedAt?: Date;
}

/**
 * Email template for receipt verification success
 */
export function getReceiptVerificationSuccessEmailHtml(
  data: ReceiptVerificationData
): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt Verified - ${data.receiptReference}`;

  const content = `
    <h1>Verified</h1>
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
        <span class="info-value" style="color: #10b981; font-weight: bold;">₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Remaining Balance:</span>
        <span class="info-value" style="font-weight: bold;">₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
    
    <p>Your payment has been recorded in our system and your fee balance has been updated accordingly.</p>
    
    ${data.remainingBalance > 0
      ? `<p><strong>Note:</strong> You still have a remaining balance of ₹${data.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Please make the payment at your earliest convenience.</p>`
      : `<p><strong>Congratulations!</strong> Your fee payment for ${data.feeStructureName} is now complete.</p>`
    }
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/fees/receipts" class="btn">View Receipt Details</a>
    </div>
    
    <p>Best regards,<br>The SikshaMitra Team</p>
  `;

  const html = baseEmailTemplate({
    title: "Payment Receipt Verified - SikshaMitra",
    children: content
  });

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
  `.trim();

  return { subject, html, text };
}

/**
 * Email template for receipt rejection
 */
export function getReceiptRejectionEmailHtml(
  data: ReceiptRejectionData
): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt Rejected - ${data.receiptReference}`;

  const content = `
    <h1 style="color: #ef4444;">Rejected</h1>
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
    
    <div class="info-box" style="background-color: #fef2f2; border-left-color: #ef4444;">
      <h3 style="margin-top: 0; color: #dc2626;">Rejection Reason:</h3>
      <p style="margin-bottom: 0;">${data.rejectionReason}</p>
    </div>
    
    <p><strong>Action Required:</strong> Please review the rejection reason above and upload a new receipt with the correct information.</p>
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/fees/upload-receipt" class="btn">Upload New Receipt</a>
    </div>
    
    <p>Best regards,<br>The SikshaMitra Team</p>
  `;

  const html = baseEmailTemplate({
    title: "Payment Receipt Rejected - SikshaMitra",
    children: content
  });

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
Please review the rejection reason above and upload a new receipt with the correct information.

Upload a new receipt at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/fees/upload-receipt

---
This is an automated notification from SikshaMitra.
  `.trim();

  return { subject, html, text };
}

/**
 * Generate HTML for Event Reminder
 */
export function getEventReminderEmailHtml(data: {
  eventTitle: string;
  eventDate: Date;
  eventTime: string;
  location?: string;
  description?: string;
}): string {
  const { eventTitle, eventDate, eventTime, location, description } = data;

  const content = `
    <h1>Event Reminder</h1>
    <p><strong>Event:</strong> ${eventTitle}</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${eventDate.toLocaleDateString()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time:</span>
        <span class="info-value">${eventTime}</span>
      </div>
      ${location ? `
      <div class="info-row">
        <span class="info-label">Location:</span>
        <span class="info-value">${location}</span>
      </div>` : ''}
    </div>
    
    ${description ? `<p>${description}</p>` : ''}
    
    <p>We look forward to seeing you there!</p>
    
    <p>Best regards,<br>The SikshaMitra Team</p>
  `;

  return baseEmailTemplate({
    title: `Reminder: ${eventTitle} - SikshaMitra`,
    children: content
  });
}

/**
 * Generate HTML for Admission Status Update
 */
export function getAdmissionStatusEmailHtml(params: {
  parentName: string;
  studentName: string;
  applicationNumber: string;
  appliedClass: string;
  status: "ACCEPTED" | "REJECTED" | "WAITLISTED";
  remarks?: string;
}): { subject: string; html: string } {
  const { parentName, studentName, applicationNumber, appliedClass, status, remarks } = params;

  let titleText = "";
  let subject = "";
  let statusColor = "";
  let messageText = "";

  switch (status) {
    case "ACCEPTED":
      titleText = "Congratulations!";
      subject = `Admission Application Accepted - ${studentName}`;
      statusColor = "#10b981"; // Green
      messageText = `We are pleased to inform you that the admission application for <strong>${studentName}</strong> for Class <strong>${appliedClass}</strong> has been <span style="color: ${statusColor}; font-weight: bold;">ACCEPTED</span>.`;
      break;
    case "REJECTED":
      titleText = "Application Update";
      subject = `Admission Application Update - ${studentName}`;
      statusColor = "#ef4444"; // Red
      messageText = `We regret to inform you that the admission application for <strong>${studentName}</strong> for Class <strong>${appliedClass}</strong> could not be accepted at this time.`;
      break;
    case "WAITLISTED":
      titleText = "Application Waitlisted";
      subject = `Admission Application Waitlisted - ${studentName}`;
      statusColor = "#f59e0b"; // Amber
      messageText = `The admission application for <strong>${studentName}</strong> for Class <strong>${appliedClass}</strong> has been <span style="color: ${statusColor}; font-weight: bold;">WAITLISTED</span>. This means your application is on hold and will be considered if seats become available.`;
      break;
  }

  const content = `
    <h1>${titleText}</h1>
    <p>Dear ${parentName},</p>
    <p>${messageText}</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Application Number:</span>
        <span class="info-value">${applicationNumber}</span>
      </div>
    </div>
    
    ${remarks ? `<p><strong>${status === "REJECTED" ? "Reason" : "Remarks"}:</strong> ${remarks}</p>` : ''}
    
    ${status === "ACCEPTED" ? `
    <h2>Next Steps</h2>
    <ul>
      <li>Please visit the school administration office to complete the enrollment process</li>
      <li>Bring all original documents for verification</li>
      <li>Complete the fee payment as per the schedule provided</li>
    </ul>
    
    <p>We look forward to welcoming ${studentName} to our school!</p>
    ` : ''}
    
    ${status === "WAITLISTED" ? `
    <p>We will notify you of any updates regarding your application status.</p>
    ` : ''}
    
    ${status === "REJECTED" ? `
    <p>We appreciate your interest in our school and wish ${studentName} all the best for the future.</p>
    ` : ''}
    
    <p>Best regards,<br>School Administration</p>
  `;

  const html = baseEmailTemplate({
    title: `${subject} - SikshaMitra`,
    children: content
  });

  return { subject, html };
}
