/**
 * Receipt Audit Service
 * 
 * Provides audit logging functionality for all receipt-related actions.
 * Tracks who did what, when, and from where for compliance and debugging.
 */

import { db } from "@/lib/db";
import { AuditAction } from "@prisma/client";

interface AuditLogData {
  userId: string;
  action: AuditAction;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a receipt action to the audit log
 */
export async function logReceiptAction(data: AuditLogData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: "PAYMENT_RECEIPT",
        resourceId: data.resourceId,
        changes: data.changes || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error("Failed to log receipt action:", error);
  }
}

/**
 * Log receipt upload
 */
export async function logReceiptUpload(
  userId: string,
  receiptId: string,
  receiptData: {
    referenceNumber: string;
    amount: number;
    paymentMethod: string;
    studentId: string;
  },
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId,
    action: "UPLOAD",
    resourceId: receiptId,
    changes: {
      referenceNumber: receiptData.referenceNumber,
      amount: receiptData.amount,
      paymentMethod: receiptData.paymentMethod,
      studentId: receiptData.studentId,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log receipt re-upload (after rejection)
 */
export async function logReceiptReupload(
  userId: string,
  receiptId: string,
  previousReceiptId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId,
    action: "REUPLOAD",
    resourceId: receiptId,
    changes: {
      previousReceiptId,
      reason: "Re-uploaded after rejection",
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log receipt verification
 */
export async function logReceiptVerification(
  adminUserId: string,
  receiptId: string,
  receiptData: {
    referenceNumber: string;
    studentId: string;
    amount: number;
  },
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId: adminUserId,
    action: "VERIFY",
    resourceId: receiptId,
    changes: {
      status: "VERIFIED",
      referenceNumber: receiptData.referenceNumber,
      studentId: receiptData.studentId,
      amount: receiptData.amount,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log receipt rejection
 */
export async function logReceiptRejection(
  adminUserId: string,
  receiptId: string,
  receiptData: {
    referenceNumber: string;
    studentId: string;
    amount: number;
  },
  rejectionReason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId: adminUserId,
    action: "REJECT",
    resourceId: receiptId,
    changes: {
      status: "REJECTED",
      rejectionReason,
      referenceNumber: receiptData.referenceNumber,
      studentId: receiptData.studentId,
      amount: receiptData.amount,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log bulk verification
 */
export async function logBulkVerification(
  adminUserId: string,
  receiptIds: string[],
  successCount: number,
  failureCount: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId: adminUserId,
    action: "BULK_VERIFY",
    resourceId: "BULK_OPERATION",
    changes: {
      receiptIds,
      successCount,
      failureCount,
      totalCount: receiptIds.length,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log bulk rejection
 */
export async function logBulkRejection(
  adminUserId: string,
  receiptIds: string[],
  rejectionReason: string,
  successCount: number,
  failureCount: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId: adminUserId,
    action: "BULK_REJECT",
    resourceId: "BULK_OPERATION",
    changes: {
      receiptIds,
      rejectionReason,
      successCount,
      failureCount,
      totalCount: receiptIds.length,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log receipt view
 */
export async function logReceiptView(
  userId: string,
  receiptId: string,
  receiptData: {
    referenceNumber: string;
    status: string;
  },
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId,
    action: "VIEW",
    resourceId: receiptId,
    changes: {
      referenceNumber: receiptData.referenceNumber,
      status: receiptData.status,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log receipt note addition
 */
export async function logReceiptNoteAdd(
  adminUserId: string,
  receiptId: string,
  noteId: string,
  noteContent: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId: adminUserId,
    action: "ADD_NOTE",
    resourceId: receiptId,
    changes: {
      noteId,
      noteLength: noteContent.length,
      notePreview: noteContent.substring(0, 100),
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log receipt note deletion
 */
export async function logReceiptNoteDelete(
  adminUserId: string,
  receiptId: string,
  noteId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId: adminUserId,
    action: "DELETE_NOTE",
    resourceId: receiptId,
    changes: {
      noteId,
      action: "deleted",
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log receipt export
 */
export async function logReceiptExport(
  userId: string,
  exportType: "pending" | "verified" | "rejected" | "all",
  recordCount: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logReceiptAction({
    userId,
    action: "EXPORT",
    resourceId: "EXPORT_OPERATION",
    changes: {
      exportType,
      recordCount,
      format: "CSV",
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs for a specific receipt
 */
export async function getReceiptAuditLogs(receiptId: string) {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        resource: "PAYMENT_RECEIPT",
        resourceId: receiptId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    return logs;
  } catch (error) {
    console.error("Failed to fetch receipt audit logs:", error);
    return [];
  }
}

/**
 * Get all receipt audit logs with filters
 */
export async function getAllReceiptAuditLogs(filters?: {
  action?: AuditAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  schoolId?: string;
}) {
  try {
    const where: any = {
      resource: "PAYMENT_RECEIPT",
      ...(filters?.schoolId ? { schoolId: filters.schoolId } : {})
    };

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const logs = await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });

    const totalCount = await db.auditLog.count({ where });

    return {
      logs,
      totalCount,
      hasMore: (filters?.offset || 0) + logs.length < totalCount,
    };
  } catch (error) {
    console.error("Failed to fetch receipt audit logs:", error);
    return {
      logs: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}

/**
 * Export audit logs to CSV format
 */
export function exportAuditLogsToCSV(logs: any[]): string {
  const headers = [
    "Timestamp",
    "Action",
    "User",
    "User Email",
    "User Role",
    "Receipt ID",
    "Reference Number",
    "Details",
    "IP Address",
    "User Agent",
  ];

  const rows = logs.map((log) => {
    const changes = log.changes as Record<string, any> || {};
    const details = JSON.stringify(changes);

    return [
      new Date(log.timestamp).toISOString(),
      log.action,
      `${log.user.firstName} ${log.user.lastName}`,
      log.user.email,
      log.user.role,
      log.resourceId,
      changes.referenceNumber || "",
      details,
      log.ipAddress || "",
      log.userAgent || "",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}
