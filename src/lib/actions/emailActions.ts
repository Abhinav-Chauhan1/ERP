"use server";

/**
 * Email Actions
 * 
 * Server actions for sending email messages and tracking delivery status.
 * Integrates with the email service to provide bulk messaging capabilities.
 * 
 * Requirements: 11.3 - Email Service Provider Integration
 */

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import {
  sendEmail,
  sendBulkEmail,
  sendEmailWithRetry,
  sendTemplatedEmail,
  isEmailConfigured,
  isValidEmail,
  validateEmails,
  type EmailSendResult,
  type EmailOptions,
} from "@/lib/services/email-service";

/**
 * Send a single email message
 */
export async function sendSingleEmail(data: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user has permission to send emails
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate email address
    if (!isValidEmail(data.to)) {
      return { success: false, error: "Invalid email address format" };
    }

    // Validate content
    if (!data.html && !data.text) {
      return { success: false, error: "Email content (html or text) is required" };
    }

    // Send email with retry logic
    const result = await sendEmailWithRetry({
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo,
    });

    if (!result.success) {
      return { success: false, error: result.error || "Failed to send email" };
    }

    // Log the email in database (optional - for tracking)
    // You could create an EmailLog model to track all sent messages
    
    return {
      success: true,
      data: {
        messageId: result.messageId,
        status: result.status,
        to: result.to,
      },
    };
  } catch (error: any) {
    console.error("Error in sendSingleEmail:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

/**
 * Send bulk emails to multiple recipients
 */
export async function sendBulkEmailAction(data: {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user has permission to send bulk emails
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    if (!data.recipients || data.recipients.length === 0) {
      return { success: false, error: "No recipients provided" };
    }

    // Validate email addresses
    const { valid, invalid } = validateEmails(data.recipients);
    
    if (invalid.length > 0) {
      return {
        success: false,
        error: `Invalid email addresses: ${invalid.join(', ')}`,
      };
    }

    // Send bulk emails
    const results = await sendBulkEmail(valid, data.subject, data.html, data.text);

    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Log bulk email operation (optional)
    // You could create a BulkEmailLog model to track bulk operations

    return {
      success: true,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: results.map(r => ({
          to: r.to,
          success: r.success,
          messageId: r.messageId,
          status: r.status,
          error: r.error,
        })),
      },
    };
  } catch (error: any) {
    console.error("Error in sendBulkEmailAction:", error);
    return { success: false, error: error.message || "Failed to send bulk emails" };
  }
}

/**
 * Send email to parents of a specific class
 */
export async function sendEmailToClass(data: {
  classId: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get all students in the class through enrollments
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId: data.classId,
        status: "ACTIVE",
      },
      include: {
        student: {
          include: {
            parents: {
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return { success: false, error: "No students found in this class" };
    }

    // Extract parent email addresses
    const emailAddresses = enrollments
      .flatMap(e => e.student.parents.map(p => p.parent.user.email))
      .filter((email): email is string => !!email);

    if (emailAddresses.length === 0) {
      return { success: false, error: "No parent email addresses found" };
    }

    // Send bulk emails
    const result = await sendBulkEmailAction({
      recipients: emailAddresses,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    revalidatePath("/admin/communication");
    return result;
  } catch (error: any) {
    console.error("Error in sendEmailToClass:", error);
    return { success: false, error: error.message || "Failed to send emails to class" };
  }
}

/**
 * Send email to all parents
 */
export async function sendEmailToAllParents(data: {
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get all parents with email addresses
    const parents = await db.parent.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (parents.length === 0) {
      return { success: false, error: "No parent email addresses found" };
    }

    const emailAddresses = parents
      .map(p => p.user.email)
      .filter((email): email is string => !!email);

    // Send bulk emails
    const result = await sendBulkEmailAction({
      recipients: emailAddresses,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    revalidatePath("/admin/communication");
    return result;
  } catch (error: any) {
    console.error("Error in sendEmailToAllParents:", error);
    return { success: false, error: error.message || "Failed to send emails to all parents" };
  }
}

/**
 * Send email to all teachers
 */
export async function sendEmailToAllTeachers(data: {
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get all teachers with email addresses
    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (teachers.length === 0) {
      return { success: false, error: "No teacher email addresses found" };
    }

    const emailAddresses = teachers
      .map(t => t.user.email)
      .filter((email): email is string => !!email);

    // Send bulk emails
    const result = await sendBulkEmailAction({
      recipients: emailAddresses,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    revalidatePath("/admin/communication");
    return result;
  } catch (error: any) {
    console.error("Error in sendEmailToAllTeachers:", error);
    return { success: false, error: error.message || "Failed to send emails to all teachers" };
  }
}

/**
 * Send templated email
 */
export async function sendTemplatedEmailAction(data: {
  template: 'welcome' | 'password-reset' | 'admission-confirmation' | 'fee-reminder';
  to: string;
  templateData: Record<string, any>;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate email address
    if (!isValidEmail(data.to)) {
      return { success: false, error: "Invalid email address format" };
    }

    // Send templated email
    const result = await sendTemplatedEmail(data.template, data.to, data.templateData);

    if (!result.success) {
      return { success: false, error: result.error || "Failed to send email" };
    }

    return {
      success: true,
      data: {
        messageId: result.messageId,
        status: result.status,
        to: result.to,
      },
    };
  } catch (error: any) {
    console.error("Error in sendTemplatedEmailAction:", error);
    return { success: false, error: error.message || "Failed to send templated email" };
  }
}

/**
 * Send admission confirmation email
 */
export async function sendAdmissionConfirmationEmail(data: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  applicationNumber: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Send admission confirmation email
    const result = await sendTemplatedEmail(
      'admission-confirmation',
      data.parentEmail,
      {
        parentName: data.parentName,
        studentName: data.studentName,
        applicationNumber: data.applicationNumber,
      }
    );

    if (!result.success) {
      return { success: false, error: result.error || "Failed to send confirmation email" };
    }

    return {
      success: true,
      data: {
        messageId: result.messageId,
        status: result.status,
      },
    };
  } catch (error: any) {
    console.error("Error in sendAdmissionConfirmationEmail:", error);
    return { success: false, error: error.message || "Failed to send confirmation email" };
  }
}

/**
 * Check if email service is configured
 */
export async function checkEmailConfiguration() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    const configured = isEmailConfigured();

    return {
      success: true,
      data: {
        configured,
        message: configured
          ? "Email service is configured and ready to use"
          : "Email service is not configured. Please set RESEND_API_KEY and EMAIL_FROM environment variables.",
      },
    };
  } catch (error: any) {
    console.error("Error in checkEmailConfiguration:", error);
    return { success: false, error: error.message || "Failed to check email configuration" };
  }
}

