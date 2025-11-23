"use server";

/**
 * Bulk Messaging Actions
 * 
 * Server actions for sending bulk messages (SMS and Email) to multiple recipients.
 * Supports recipient selection by class, role, and custom groups.
 * Implements batch sending and retry logic to handle rate limits.
 * 
 * Requirements: 11.4 - Bulk Messaging with Retry Logic
 */

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendBulkSMS } from "@/lib/services/sms-service";
import { sendBulkEmail } from "@/lib/services/email-service";
import { renderTemplate } from "@/lib/actions/messageTemplateActions";
import { logMessageHistory } from "@/lib/actions/messageHistoryActions";
import { MessageType, MessageStatus } from "@prisma/client";

// Batch size for sending messages to avoid rate limits
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000; // 1 second delay between batches
const MAX_RETRIES = 3;

export interface BulkMessageRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

export interface BulkMessageInput {
  messageType: "SMS" | "EMAIL" | "BOTH";
  subject?: string; // Required for email
  body: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  recipientSelection: {
    type: "MANUAL" | "CLASS" | "ROLE" | "ALL_PARENTS" | "ALL_TEACHERS" | "ALL_STUDENTS";
    classIds?: string[];
    roles?: string[];
    manualRecipients?: string[]; // User IDs
  };
}

/**
 * Get recipients based on selection criteria
 */
export async function getRecipients(selection: BulkMessageInput["recipientSelection"]) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    let recipients: BulkMessageRecipient[] = [];

    switch (selection.type) {
      case "MANUAL":
        if (!selection.manualRecipients || selection.manualRecipients.length === 0) {
          return { success: false, error: "No recipients selected" };
        }
        
        const manualUsers = await db.user.findMany({
          where: {
            id: { in: selection.manualRecipients },
            active: true,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        });

        recipients = manualUsers.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          phone: u.phone || undefined,
          role: u.role,
        }));
        break;

      case "CLASS":
        if (!selection.classIds || selection.classIds.length === 0) {
          return { success: false, error: "No classes selected" };
        }

        // Get students in selected classes
        const students = await db.student.findMany({
          where: {
            enrollments: {
              some: {
                classId: { in: selection.classIds },
              },
            },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
            parents: {
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // Add students
        recipients.push(...students.map(s => ({
          id: s.user.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          email: s.user.email,
          phone: s.user.phone || undefined,
          role: s.user.role,
        })));

        // Add parents
        students.forEach(s => {
          s.parents.forEach(sp => {
            recipients.push({
              id: sp.parent.user.id,
              name: `${sp.parent.user.firstName} ${sp.parent.user.lastName}`,
              email: sp.parent.user.email,
              phone: sp.parent.user.phone || undefined,
              role: sp.parent.user.role,
            });
          });
        });
        break;

      case "ROLE":
        if (!selection.roles || selection.roles.length === 0) {
          return { success: false, error: "No roles selected" };
        }

        const roleUsers = await db.user.findMany({
          where: {
            role: { in: selection.roles as any[] },
            active: true,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        });

        recipients = roleUsers.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          phone: u.phone || undefined,
          role: u.role,
        }));
        break;

      case "ALL_PARENTS":
        const parents = await db.parent.findMany({
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                active: true,
              },
            },
          },
          where: {
            user: {
              active: true,
            },
          },
        });

        recipients = parents.map(p => ({
          id: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          email: p.user.email,
          phone: p.user.phone || undefined,
          role: p.user.role,
        }));
        break;

      case "ALL_TEACHERS":
        const teachers = await db.teacher.findMany({
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                active: true,
              },
            },
          },
          where: {
            user: {
              active: true,
            },
          },
        });

        recipients = teachers.map(t => ({
          id: t.user.id,
          name: `${t.user.firstName} ${t.user.lastName}`,
          email: t.user.email,
          phone: t.user.phone || undefined,
          role: t.user.role,
        }));
        break;

      case "ALL_STUDENTS":
        const allStudents = await db.student.findMany({
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                active: true,
              },
            },
          },
          where: {
            user: {
              active: true,
            },
          },
        });

        recipients = allStudents.map(s => ({
          id: s.user.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          email: s.user.email,
          phone: s.user.phone || undefined,
          role: s.user.role,
        }));
        break;

      default:
        return { success: false, error: "Invalid recipient selection type" };
    }

    // Remove duplicates based on ID
    const uniqueRecipients = Array.from(
      new Map(recipients.map(r => [r.id, r])).values()
    );

    return {
      success: true,
      data: uniqueRecipients,
    };
  } catch (error: any) {
    console.error("Error in getRecipients:", error);
    return { success: false, error: error.message || "Failed to get recipients" };
  }
}

/**
 * Send message with retry logic
 */
async function sendWithRetry<T>(
  sendFn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<{ success: boolean; data?: T; error?: string; attempts: number }> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendFn();
      return { success: true, data: result, attempts: attempt };
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  return {
    success: false,
    error: lastError?.message || "Failed after maximum retries",
    attempts: maxRetries,
  };
}

/**
 * Send messages in batches
 */
async function sendInBatches<T>(
  items: T[],
  batchSize: number,
  sendBatchFn: (batch: T[]) => Promise<any>
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Send batch with retry logic
    const batchResult = await sendWithRetry(() => sendBatchFn(batch));
    results.push(batchResult);
    
    // Delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  
  return results;
}

/**
 * Send bulk messages (SMS, Email, or Both)
 */
export async function sendBulkMessage(input: BulkMessageInput) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    if (!input.body) {
      return { success: false, error: "Message body is required" };
    }

    if ((input.messageType === "EMAIL" || input.messageType === "BOTH") && !input.subject) {
      return { success: false, error: "Subject is required for email messages" };
    }

    // Get recipients
    const recipientsResult = await getRecipients(input.recipientSelection);
    if (!recipientsResult.success || !recipientsResult.data) {
      return recipientsResult;
    }

    const recipients = recipientsResult.data;

    if (recipients.length === 0) {
      return { success: false, error: "No recipients found" };
    }

    // Prepare message content (apply template if provided)
    let messageBody = input.body;
    let messageSubject = input.subject;

    if (input.templateId) {
      const template = await db.messageTemplate.findUnique({
        where: { id: input.templateId },
      });

      if (template) {
        messageBody = await renderTemplate(template.body, input.templateVariables || {});
        if (template.subject) {
          messageSubject = await renderTemplate(template.subject, input.templateVariables || {});
        }
      }
    }

    const results: any = {
      total: recipients.length,
      sms: { sent: 0, failed: 0, results: [] as any[] },
      email: { sent: 0, failed: 0, results: [] as any[] },
    };

    // Send SMS
    if (input.messageType === "SMS" || input.messageType === "BOTH") {
      const smsRecipients = recipients.filter(r => r.phone);
      
      if (smsRecipients.length > 0) {
        const phoneNumbers = smsRecipients.map(r => r.phone!);
        
        // Send in batches
        const smsBatches = await sendInBatches(
          phoneNumbers,
          BATCH_SIZE,
          async (batch) => {
            return await sendBulkSMS(batch, messageBody);
          }
        );

        // Aggregate results
        smsBatches.forEach(batchResult => {
          if (batchResult.success && batchResult.data) {
            batchResult.data.forEach((smsResult: any) => {
              if (smsResult.success) {
                results.sms.sent++;
              } else {
                results.sms.failed++;
              }
              results.sms.results.push(smsResult);
            });
          } else {
            results.sms.failed += BATCH_SIZE;
          }
        });
      }
    }

    // Send Email
    if (input.messageType === "EMAIL" || input.messageType === "BOTH") {
      const emailRecipients = recipients.filter(r => r.email);
      
      if (emailRecipients.length > 0) {
        const emailAddresses = emailRecipients.map(r => r.email!);
        
        // Send in batches
        const emailBatches = await sendInBatches(
          emailAddresses,
          BATCH_SIZE,
          async (batch) => {
            return await sendBulkEmail(batch, messageSubject!, messageBody);
          }
        );

        // Aggregate results
        emailBatches.forEach(batchResult => {
          if (batchResult.success && batchResult.data) {
            batchResult.data.forEach((emailResult: any) => {
              if (emailResult.success) {
                results.email.sent++;
              } else {
                results.email.failed++;
              }
              results.email.results.push(emailResult);
            });
          } else {
            results.email.failed += BATCH_SIZE;
          }
        });
      }
    }

    // Log bulk message operation to history
    const totalSent = results.sms.sent + results.email.sent;
    const totalFailed = results.sms.failed + results.email.failed;
    
    // Calculate costs (example rates - should be configurable)
    const SMS_COST_PER_MESSAGE = 0.05; // $0.05 per SMS
    const EMAIL_COST_PER_MESSAGE = 0.001; // $0.001 per email
    
    const smsCost = results.sms.sent * SMS_COST_PER_MESSAGE;
    const emailCost = results.email.sent * EMAIL_COST_PER_MESSAGE;
    const totalCost = smsCost + emailCost;
    
    // Determine status
    let status: MessageStatus = MessageStatus.SENT;
    if (totalFailed > 0 && totalSent === 0) {
      status = MessageStatus.FAILED;
    } else if (totalFailed > 0 && totalSent > 0) {
      status = MessageStatus.PARTIALLY_SENT;
    }
    
    await logMessageHistory({
      messageType: input.messageType as MessageType,
      subject: messageSubject,
      body: messageBody,
      templateId: input.templateId,
      recipientCount: recipients.length,
      sentCount: totalSent,
      failedCount: totalFailed,
      smsCount: results.sms.sent,
      emailCount: results.email.sent,
      smsCost,
      emailCost,
      totalCost,
      status,
      recipientSelection: input.recipientSelection,
      results,
    });

    revalidatePath("/admin/communication");
    revalidatePath("/admin/communication/history");

    return {
      success: true,
      data: results,
    };
  } catch (error: any) {
    console.error("Error in sendBulkMessage:", error);
    return { success: false, error: error.message || "Failed to send bulk messages" };
  }
}

/**
 * Get available classes for recipient selection
 */
export async function getAvailableClasses() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const classes = await db.class.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: classes,
    };
  } catch (error: any) {
    console.error("Error in getAvailableClasses:", error);
    return { success: false, error: error.message || "Failed to fetch classes" };
  }
}

/**
 * Preview recipients before sending
 */
export async function previewRecipients(selection: BulkMessageInput["recipientSelection"]) {
  return await getRecipients(selection);
}

/**
 * Get bulk messaging statistics
 */
export async function getBulkMessagingStats() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get counts
    const [totalParents, totalTeachers, totalStudents, totalClasses] = await Promise.all([
      db.parent.count({ where: { user: { active: true } } }),
      db.teacher.count({ where: { user: { active: true } } }),
      db.student.count({ where: { user: { active: true } } }),
      db.class.count(),
    ]);

    return {
      success: true,
      data: {
        totalParents,
        totalTeachers,
        totalStudents,
        totalClasses,
        totalUsers: totalParents + totalTeachers + totalStudents,
      },
    };
  } catch (error: any) {
    console.error("Error in getBulkMessagingStats:", error);
    return { success: false, error: error.message || "Failed to fetch statistics" };
  }
}
