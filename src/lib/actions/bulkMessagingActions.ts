"use server";

/**
 * Bulk Messaging Actions
 * 
 * Server actions for sending bulk messages to classes or all parents via SMS, WhatsApp, or Email.
 * Provides role-based authorization (Admin only), recipient batching, progress tracking, and summary reports.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole, AuditAction } from "@prisma/client";
import {
  CommunicationChannel,
  NotificationType,
} from "@/lib/types/communication";
import { sendBulkNotification } from "@/lib/services/communication-service";

/**
 * Action result type
 */
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Bulk message summary
 */
interface BulkMessageSummary {
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  channel: CommunicationChannel;
  results: Array<{
    userId: string;
    userName?: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

/**
 * Send bulk message to all parents in a specific class
 * 
 * Authorization: Admin only
 * Requirements: 11.1, 11.3, 11.4, 11.5
 * 
 * @param data - Bulk message parameters for class
 * @returns Action result with delivery summary
 */
export async function sendBulkToClass(data: {
  classId: string;
  sectionId?: string;
  channel: CommunicationChannel;
  title: string;
  message: string;
  notificationType?: NotificationType;
}): Promise<ActionResult<BulkMessageSummary>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can send bulk messages.",
      };
    }

    // Validate inputs
    if (!data.classId) {
      return {
        success: false,
        error: "Class ID is required.",
      };
    }

    if (!data.title || !data.message) {
      return {
        success: false,
        error: "Title and message are required.",
      };
    }

    if (!data.channel) {
      return {
        success: false,
        error: "Communication channel is required.",
      };
    }

    // Validate channel
    const validChannels = [
      CommunicationChannel.EMAIL,
      CommunicationChannel.SMS,
      CommunicationChannel.WHATSAPP,
    ];
    if (!validChannels.includes(data.channel)) {
      return {
        success: false,
        error: `Invalid channel. Must be one of: ${validChannels.join(", ")}`,
      };
    }

    // Verify class exists
    const classExists = await db.class.findUnique({
      where: { id: data.classId },
      select: { id: true, name: true },
    });

    if (!classExists) {
      return {
        success: false,
        error: "Class not found.",
      };
    }

    // If section is specified, verify it exists
    if (data.sectionId) {
      const sectionExists = await db.classSection.findUnique({
        where: { id: data.sectionId },
        select: { id: true, name: true },
      });

      if (!sectionExists) {
        return {
          success: false,
          error: "Section not found.",
        };
      }
    }

    // Get all students in the class (and section if specified)
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId: data.classId,
        ...(data.sectionId && { sectionId: data.sectionId }),
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
                        id: true,
                        name: true,
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

    // Extract unique parent user IDs
    const parentUserIds = new Set<string>();
    const parentUserMap = new Map<string, { name: string; email: string }>();

    for (const enrollment of enrollments) {
      for (const studentParent of enrollment.student.parents) {
        const userId = studentParent.parent.user.id;
        parentUserIds.add(userId);
        parentUserMap.set(userId, {
          name: studentParent.parent.user.name || "Unknown",
          email: studentParent.parent.user.email || "",
        });
      }
    }

    const recipients = Array.from(parentUserIds);

    if (recipients.length === 0) {
      return {
        success: false,
        error: "No parents found for the specified class.",
      };
    }

    // Send bulk notification using Communication Service
    // The service handles batching automatically (50 per batch with 200ms delay)
    const result = await sendBulkNotification({
      recipients,
      type: data.notificationType || NotificationType.ANNOUNCEMENT,
      title: data.title,
      message: data.message,
      channel: data.channel,
    });

    // Enhance results with user names
    const enhancedResults = result.results.map((r) => ({
      ...r,
      userName: parentUserMap.get(r.userId)?.name,
    }));

    // Log bulk message operation in audit log
    await db.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        resource: "BULK_MESSAGE_CLASS",
        userId: session.user.id,
        changes: {
          channel: data.channel,
          classId: data.classId,
          sectionId: data.sectionId,
          totalRecipients: result.totalRecipients,
          successful: result.successCount,
          failed: result.failureCount,
          title: data.title,
        },
      },
    });

    return {
      success: true,
      data: {
        totalRecipients: result.totalRecipients,
        successCount: result.successCount,
        failureCount: result.failureCount,
        channel: data.channel,
        results: enhancedResults,
      },
    };
  } catch (error: any) {
    console.error("Error in sendBulkToClass:", error);
    return {
      success: false,
      error: error.message || "Failed to send bulk message to class.",
    };
  }
}

/**
 * Send bulk message to all parents in the school
 * 
 * Authorization: Admin only
 * Requirements: 11.2, 11.3, 11.4, 11.5
 * 
 * @param data - Bulk message parameters for all parents
 * @returns Action result with delivery summary
 */
export async function sendBulkToAllParents(data: {
  channel: CommunicationChannel;
  title: string;
  message: string;
  notificationType?: NotificationType;
  academicYearId?: string; // Optional: filter by academic year
}): Promise<ActionResult<BulkMessageSummary>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can send bulk messages.",
      };
    }

    // Validate inputs
    if (!data.title || !data.message) {
      return {
        success: false,
        error: "Title and message are required.",
      };
    }

    if (!data.channel) {
      return {
        success: false,
        error: "Communication channel is required.",
      };
    }

    // Validate channel
    const validChannels = [
      CommunicationChannel.EMAIL,
      CommunicationChannel.SMS,
      CommunicationChannel.WHATSAPP,
    ];
    if (!validChannels.includes(data.channel)) {
      return {
        success: false,
        error: `Invalid channel. Must be one of: ${validChannels.join(", ")}`,
      };
    }

    // Get all parents
    // If academicYearId is provided, filter by students enrolled in that academic year
    let parents;

    if (data.academicYearId) {
      // Verify academic year exists
      const academicYear = await db.academicYear.findUnique({
        where: { id: data.academicYearId },
        select: { id: true, name: true },
      });

      if (!academicYear) {
        return {
          success: false,
          error: "Academic year not found.",
        };
      }

      // Get parents of students enrolled in classes of this academic year
      const enrollments = await db.classEnrollment.findMany({
        where: {
          status: "ACTIVE",
          class: {
            academicYearId: data.academicYearId,
          },
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
                          id: true,
                          name: true,
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

      // Extract unique parent user IDs
      const parentUserIds = new Set<string>();
      const parentUserMap = new Map<string, { name: string; email: string }>();

      for (const enrollment of enrollments) {
        for (const studentParent of enrollment.student.parents) {
          const userId = studentParent.parent.user.id;
          parentUserIds.add(userId);
          parentUserMap.set(userId, {
            name: studentParent.parent.user.name || "Unknown",
            email: studentParent.parent.user.email || "",
          });
        }
      }

      parents = Array.from(parentUserIds).map((userId) => ({
        user: {
          id: userId,
          name: parentUserMap.get(userId)?.name || "Unknown",
          email: parentUserMap.get(userId)?.email || "",
        },
      }));
    } else {
      // Get all parents in the system
      parents = await db.parent.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    if (parents.length === 0) {
      return {
        success: false,
        error: "No parents found in the system.",
      };
    }

    // Extract user IDs
    const recipients = parents.map((p) => p.user.id);
    const parentUserMap = new Map(
      parents.map((p) => [
        p.user.id,
        { name: p.user.name || "Unknown", email: p.user.email || "" },
      ])
    );

    // Send bulk notification using Communication Service
    // The service handles batching automatically (50 per batch with 200ms delay)
    const result = await sendBulkNotification({
      recipients,
      type: data.notificationType || NotificationType.ANNOUNCEMENT,
      title: data.title,
      message: data.message,
      channel: data.channel,
    });

    // Enhance results with user names
    const enhancedResults = result.results.map((r) => ({
      ...r,
      userName: parentUserMap.get(r.userId)?.name,
    }));

    // Log bulk message operation in audit log
    await db.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        resource: "BULK_MESSAGE_ALL_PARENTS",
        userId: session.user.id,
        changes: {
          channel: data.channel,
          academicYearId: data.academicYearId,
          totalRecipients: result.totalRecipients,
          successful: result.successCount,
          failed: result.failureCount,
          title: data.title,
        },
      },
    });

    return {
      success: true,
      data: {
        totalRecipients: result.totalRecipients,
        successCount: result.successCount,
        failureCount: result.failureCount,
        channel: data.channel,
        results: enhancedResults,
      },
    };
  } catch (error: any) {
    console.error("Error in sendBulkToAllParents:", error);
    return {
      success: false,
      error: error.message || "Failed to send bulk message to all parents.",
    };
  }
}

/**
 * Get bulk message progress/status
 * 
 * This function can be used to track the progress of a bulk message operation
 * by querying the message logs for a specific time range and audit log entry.
 * 
 * Authorization: Admin only
 * Requirement: 11.4
 * 
 * @param auditLogId - Audit log ID of the bulk message operation
 * @returns Action result with progress information
 */
export async function getBulkMessageProgress(
  auditLogId: string
): Promise<
  ActionResult<{
    totalRecipients: number;
    processed: number;
    successful: number;
    failed: number;
    pending: number;
    details: {
      channel: string;
      classId?: string;
      sectionId?: string;
      academicYearId?: string;
      title: string;
      createdAt: Date;
    };
  }>
> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can view bulk message progress.",
      };
    }

    // Validate input
    if (!auditLogId) {
      return {
        success: false,
        error: "Audit log ID is required.",
      };
    }

    // Get audit log entry
    const auditLog = await db.auditLog.findUnique({
      where: { id: auditLogId },
    });

    if (!auditLog) {
      return {
        success: false,
        error: "Audit log entry not found.",
      };
    }

    // Verify this is a bulk message operation
    if (
      auditLog.resource !== "BULK_MESSAGE_CLASS" &&
      auditLog.resource !== "BULK_MESSAGE_ALL_PARENTS"
    ) {
      return {
        success: false,
        error: "This audit log entry is not a bulk message operation.",
      };
    }

    // Extract details from audit log
    const details = auditLog.changes as any;
    const totalRecipients = details?.totalRecipients || 0;
    const successful = details?.successful || 0;
    const failed = details?.failed || 0;

    return {
      success: true,
      data: {
        totalRecipients,
        processed: successful + failed,
        successful,
        failed,
        pending: Math.max(0, totalRecipients - successful - failed),
        details: {
          channel: details.channel,
          classId: details.classId,
          sectionId: details.sectionId,
          academicYearId: details.academicYearId,
          title: details.title,
          createdAt: auditLog.createdAt,
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getBulkMessageProgress:", error);
    return {
      success: false,
      error: error.message || "Failed to get bulk message progress.",
    };
  }
}

/**
 * Get bulk message history
 * 
 * Retrieve a list of recent bulk message operations with summary information.
 * 
 * Authorization: Admin only
 * Requirement: 11.5
 * 
 * @param limit - Maximum number of records to return (default: 20)
 * @returns Action result with bulk message history
 */
export async function getBulkMessageHistory(
  limit: number = 20
): Promise<
  ActionResult<
    Array<{
      id: string;
      action: string;
      userId: string;
      userName: string;
      createdAt: Date;
      details: {
        channel: string;
        classId?: string;
        sectionId?: string;
        academicYearId?: string;
        title: string;
        totalRecipients: number;
        successful: number;
        failed: number;
      };
    }>
  >
> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check authorization - Admin only
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can view bulk message history.",
      };
    }

    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 100); // Between 1 and 100

    // Get bulk message audit logs
    const auditLogs = await db.auditLog.findMany({
      where: {
        action: AuditAction.CREATE,
        resource: {
          in: ["BULK_MESSAGE_CLASS", "BULK_MESSAGE_ALL_PARENTS"],
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: validLimit,
    });

    // Format results
    const history = auditLogs.map((log) => {
      const details = log.changes as any;
      return {
        id: log.id,
        action: log.action,
        userId: log.userId,
        userName: log.user.name || "Unknown",
        createdAt: log.createdAt,
        details: {
          channel: details.channel || "UNKNOWN",
          classId: details.classId,
          sectionId: details.sectionId,
          academicYearId: details.academicYearId,
          title: details.title || "Untitled",
          totalRecipients: details.totalRecipients || 0,
          successful: details.successful || 0,
          failed: details.failed || 0,
        },
      };
    });

    return {
      success: true,
      data: history,
    };
  } catch (error: any) {
    console.error("Error in getBulkMessageHistory:", error);
    return {
      success: false,
      error: error.message || "Failed to get bulk message history.",
    };
  }
}


/**
 * Type definitions for bulk messaging
 */
export interface BulkMessageInput {
  messageType: "SMS" | "EMAIL" | "BOTH";
  subject?: string;
  body: string;
  recipientType: "MANUAL" | "CLASS" | "ROLE" | "ALL_PARENTS" | "ALL_TEACHERS" | "ALL_STUDENTS";
  selectedClasses?: string[];
  selectedRoles?: string[];
  manualRecipients?: string[];
}

export interface BulkMessageRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

/**
 * Send bulk message (wrapper function for UI compatibility)
 * 
 * @param data - Bulk message input
 * @returns Action result with delivery summary
 */
/**
 * Send bulk message (wrapper function for UI compatibility)
 * 
 * @param data - Bulk message input
 * @returns Action result with delivery summary
 */
export async function sendBulkMessage(
  data: BulkMessageInput
): Promise<ActionResult<BulkMessageSummary>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions. Only administrators can send bulk messages.",
      };
    }

    const { recipientType, messageType, subject, body } = data;
    const channel = messageType === "SMS" ? CommunicationChannel.SMS : CommunicationChannel.EMAIL;
    const title = subject || "Notification";
    const notificationType = NotificationType.GENERAL;

    let recipients: string[] = [];

    // 1. ALL PARENTS
    if (recipientType === "ALL_PARENTS") {
      return await sendBulkToAllParents({
        channel,
        title,
        message: body,
        notificationType,
      });
    }

    // 2. ALL TEACHERS
    else if (recipientType === "ALL_TEACHERS") {
      const teachers = await db.teacher.findMany({
        where: { user: { active: true } },
        select: { userId: true }
      });
      recipients = teachers.map(t => t.userId);
    }

    // 3. ALL STUDENTS
    else if (recipientType === "ALL_STUDENTS") {
      const students = await db.student.findMany({
        where: { user: { active: true } },
        select: { userId: true }
      });
      recipients = students.map(s => s.userId);
    }

    // 4. BY CLASS (Parents of students in these classes)
    else if (recipientType === "CLASS" && data.selectedClasses?.length) {
      // Find all students in these classes
      const enrollments = await db.classEnrollment.findMany({
        where: {
          classId: { in: data.selectedClasses },
          status: "ACTIVE",
        },
        include: {
          student: {
            include: {
              parents: {
                include: {
                  parent: {
                    include: { user: true }
                  }
                }
              }
            }
          }
        }
      });

      const parentIds = new Set<string>();
      enrollments.forEach(enrollment => {
        enrollment.student.parents.forEach(p => {
          if (p.parent.user.active) {
            parentIds.add(p.parent.user.id);
          }
        });
      });
      recipients = Array.from(parentIds);
    }

    // 5. BY ROLE
    else if (recipientType === "ROLE" && data.selectedRoles?.length) {
      // "PARENT", "TEACHER", "STUDENT"
      // Note: "ADMIN" is not user select in UI but can be mapped if needed.
      // We assume roles match UserRole enum or derived logic

      const userIds = new Set<string>();

      if (data.selectedRoles.includes("TEACHER")) {
        const t = await db.teacher.findMany({ select: { userId: true }, where: { user: { active: true } } });
        t.forEach(x => userIds.add(x.userId));
      }
      if (data.selectedRoles.includes("STUDENT")) {
        const s = await db.student.findMany({ select: { userId: true }, where: { user: { active: true } } });
        s.forEach(x => userIds.add(x.userId));
      }
      if (data.selectedRoles.includes("PARENT")) {
        const p = await db.parent.findMany({ select: { userId: true }, where: { user: { active: true } } });
        p.forEach(x => userIds.add(x.userId));
      }
      recipients = Array.from(userIds);
    }

    if (recipients.length === 0) {
      return {
        success: false,
        error: "No recipients found for the selected criteria."
      };
    }

    // Common Sending Logic
    const result = await sendBulkNotification({
      recipients,
      type: notificationType,
      title,
      message: body,
      channel,
    });

    // Log audit
    // We fetch user names for summary - this might be slow for large batches so we can skip or do a lightweight fetch
    // For now, let's keep it consistent with other actions: return without detailed per-user results if list is huge?
    // The BulkMessageSummary interface expects results array.

    const auditResource = `BULK_MESSAGE_${recipientType}`;

    await db.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        resource: auditResource,
        userId: session.user.id,
        changes: {
          channel,
          recipientType,
          totalRecipients: result.totalRecipients,
          successful: result.successCount,
          failed: result.failureCount,
          title,
        },
      },
    });

    return {
      success: true,
      data: {
        totalRecipients: result.totalRecipients,
        successCount: result.successCount,
        failureCount: result.failureCount,
        channel,
        results: result.results.map(r => ({ ...r, userId: r.userId })), // We skip name lookup for optimization here for now
      },
    };

  } catch (error: any) {
    console.error("Error sending bulk message:", error);
    return {
      success: false,
      error: error.message || "Failed to send bulk message.",
    };
  }
}

/**
 * Preview recipients before sending
 * 
 * @param data - Bulk message input
 * @returns Action result with recipient list
 */
export async function previewRecipients(
  data: Partial<BulkMessageInput>
): Promise<ActionResult<BulkMessageRecipient[]>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions.",
      };
    }

    const { recipientType } = data;
    let recipients: BulkMessageRecipient[] = [];

    // 1. ALL PARENTS
    if (recipientType === "ALL_PARENTS") {
      const parents = await db.parent.findMany({
        include: { user: true },
        where: { user: { active: true } }
      });
      recipients = parents.map(p => ({
        id: p.user.id,
        name: p.user.name || "Unknown Parent",
        email: p.user.email,
        phone: p.user.phone || undefined,
        role: "Parent"
      }));
    }

    // 2. ALL TEACHERS
    else if (recipientType === "ALL_TEACHERS") {
      const teachers = await db.teacher.findMany({
        include: { user: true },
        where: { user: { active: true } }
      });
      recipients = teachers.map(t => ({
        id: t.user.id,
        name: t.user.name || "Unknown Teacher",
        email: t.user.email,
        phone: t.user.phone || undefined,
        role: "Teacher"
      }));
    }

    // 3. ALL STUDENTS
    else if (recipientType === "ALL_STUDENTS") {
      const students = await db.student.findMany({
        include: { user: true },
        where: { user: { active: true } }
      });
      recipients = students.map(s => ({
        id: s.user.id,
        name: s.user.name || "Unknown Student",
        email: s.user.email,
        phone: s.user.phone || undefined,
        role: "Student"
      }));
    }

    // 4. BY CLASS (Parents)
    else if (recipientType === "CLASS" && data.selectedClasses?.length) {
      const enrollments = await db.classEnrollment.findMany({
        where: {
          classId: { in: data.selectedClasses },
          status: "ACTIVE",
        },
        include: {
          student: {
            include: {
              parents: {
                include: {
                  parent: {
                    include: { user: true }
                  }
                }
              }
            }
          }
        }
      });

      const uniqueMap = new Map<string, BulkMessageRecipient>();
      enrollments.forEach(enrollment => {
        enrollment.student.parents.forEach(p => {
          if (p.parent.user.active && !uniqueMap.has(p.parent.user.id)) {
            uniqueMap.set(p.parent.user.id, {
              id: p.parent.user.id,
              name: p.parent.user.name || "Unknown Parent",
              email: p.parent.user.email,
              phone: p.parent.user.phone || undefined,
              role: "Parent"
            });
          }
        });
      });
      recipients = Array.from(uniqueMap.values());
    }

    // 5. BY ROLE
    else if (recipientType === "ROLE" && data.selectedRoles?.length) {
      const map = new Map<string, BulkMessageRecipient>();

      if (data.selectedRoles.includes("TEACHER")) {
        const res = await db.teacher.findMany({ include: { user: true }, where: { user: { active: true } } });
        res.forEach(r => map.set(r.user.id, { id: r.user.id, name: r.user.name || "", email: r.user.email, role: "Teacher" }));
      }
      if (data.selectedRoles.includes("STUDENT")) {
        const res = await db.student.findMany({ include: { user: true }, where: { user: { active: true } } });
        res.forEach(r => map.set(r.user.id, { id: r.user.id, name: r.user.name || "", email: r.user.email, role: "Student" }));
      }
      if (data.selectedRoles.includes("PARENT")) {
        const res = await db.parent.findMany({ include: { user: true }, where: { user: { active: true } } });
        res.forEach(r => map.set(r.user.id, { id: r.user.id, name: r.user.name || "", email: r.user.email, role: "Parent" }));
      }
      recipients = Array.from(map.values());
    }

    return {
      success: true,
      data: recipients,
    };
  } catch (error: any) {
    console.error("Error previewing recipients:", error);
    return {
      success: false,
      error: error.message || "Failed to preview recipients.",
    };
  }
}

/**
 * Get available classes for bulk messaging
 * 
 * @returns Action result with class list
 */
export async function getAvailableClasses(): Promise<
  ActionResult<Array<{ id: string; name: string; section?: string }>>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions.",
      };
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
    console.error("Error getting available classes:", error);
    return {
      success: false,
      error: error.message || "Failed to get available classes.",
    };
  }
}

/**
 * Get bulk messaging statistics
 * 
 * @returns Action result with statistics
 */

export async function getBulkMessagingStats(): Promise<ActionResult<{
  totalUsers: number;
  totalParents: number;
  totalTeachers: number;
  totalStudents: number;
}>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Insufficient permissions.",
      };
    }

    // Get counts of active users by role
    const [totalParents, totalTeachers, totalStudents] = await Promise.all([
      db.user.count({ where: { role: "PARENT", active: true } }),
      db.user.count({ where: { role: "TEACHER", active: true } }),
      db.user.count({ where: { role: "STUDENT", active: true } }),
    ]);

    const totalUsers = totalParents + totalTeachers + totalStudents;

    return {
      success: true,
      data: {
        totalUsers,
        totalParents,
        totalTeachers,
        totalStudents,
      },
    };
  } catch (error: any) {
    console.error("Error getting bulk messaging stats:", error);
    return {
      success: false,
      error: error.message || "Failed to get bulk messaging stats.",
    };
  }
}
