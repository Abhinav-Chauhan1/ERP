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
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured in process.env");
      return { success: false, error: "Email service not configured" };
    }

    console.log("Attempting to send email with Resend. Key prefix:", apiKey.substring(0, 5));
    console.log("Email options:", { to: options.to, subject: options.subject, from: process.env.EMAIL_FROM });

    const from = process.env.EMAIL_FROM || "SikshaMitra <noreply@sikshamitra.com>";

    const result = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log("Resend API response:", result);

    if (result.error) {
      console.error("Resend returned error:", result.error);
    }

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

import {
  getAdmissionConfirmationEmailHtml,
  getScheduledReportEmailHtml
} from "./email-templates";

export async function sendAdmissionConfirmationEmail(
  parentEmail: string,
  parentName: string,
  studentName: string,
  applicationNumber: string,
  appliedClass: string
) {
  try {
    const html = getAdmissionConfirmationEmailHtml({
      parentName,
      studentName,
      applicationNumber,
      appliedClass
    });

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
  return getScheduledReportEmailHtml({
    reportName,
    reportDescription,
    generatedAt
  });
}
