import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
  }[];
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return { success: false, error: "Email service not configured" };
    }

    const from = process.env.EMAIL_FROM || "School ERP <noreply@schoolerp.com>";

    const result = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    return { 
      success: true, 
      data: result,
      messageId: result.data?.id 
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Send admission confirmation email
 */
export async function sendAdmissionConfirmationEmail(
  parentEmail: string,
  parentName: string,
  studentName: string,
  applicationNumber: string,
  appliedClass: string
) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .info-box {
              background-color: white;
              padding: 15px;
              border-left: 4px solid #3b82f6;
              margin: 15px 0;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Application Received</h1>
          </div>
          <div class="content">
            <p>Dear ${parentName},</p>
            <p>Thank you for submitting an admission application for <strong>${studentName}</strong>.</p>
            
            <div class="info-box">
              <p><strong>Application Number:</strong> ${applicationNumber}</p>
              <p><strong>Student Name:</strong> ${studentName}</p>
              <p><strong>Applied Class:</strong> ${appliedClass}</p>
            </div>
            
            <p>We have received your application and will review it shortly. You will be notified about the status of your application via email.</p>
            
            <p>Please keep your application number for future reference.</p>
            
            <p>If you have any questions, please feel free to contact us.</p>
            
            <p>Best regards,<br>School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School ERP System.</p>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to: [parentEmail],
      subject: 'Admission Application Received',
      html,
    });

    return result;
  } catch (error) {
    console.error("Error sending admission confirmation email:", error);
    return { success: false, error: "Failed to send confirmation email" };
  }
}

/**
 * Generate HTML email template for scheduled report
 */
export function generateReportEmailTemplate(
  reportName: string,
  reportDescription: string | undefined,
  generatedAt: Date
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Scheduled Report</h1>
        </div>
        <div class="content">
          <h2>${reportName}</h2>
          ${reportDescription ? `<p>${reportDescription}</p>` : ""}
          <p><strong>Generated at:</strong> ${generatedAt.toLocaleString()}</p>
          <p>Please find the attached report file.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from School ERP System.</p>
          <p>If you wish to stop receiving these reports, please contact your administrator.</p>
        </div>
      </body>
    </html>
  `;
}
