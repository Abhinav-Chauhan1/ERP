"use server";

import { db } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { auth } from "@/auth";

export interface AuditLogWithUser {
    id: string;
    timestamp: Date;
    userId: string | null;
    userName: string;
    userRole: string;
    action: AuditAction;
    resource: string | null;
    resourceId: string | null;
    details: Record<string, unknown>;
    ipAddress: string | null;
    userAgent: string | null;
    schoolId: string | null;
    schoolName: string | null;
}

export interface AuditLogStats {
    total: number;
    success: number;
    failed: number;
    critical: number;
    byAction: Record<string, number>;
}

export interface GetAuditLogsParams {
    search?: string;
    action?: string;
    severity?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
    schoolId?: string;
}

// Map actions to severity levels
function getActionSeverity(action: AuditAction): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const criticalActions: AuditAction[] = [AuditAction.DELETE, AuditAction.BULK_REJECT];
    const highActions: AuditAction[] = [AuditAction.UPDATE, AuditAction.APPROVE, AuditAction.REJECT];
    const mediumActions: AuditAction[] = [AuditAction.CREATE, AuditAction.IMPORT, AuditAction.EXPORT];

    if (criticalActions.includes(action)) return "CRITICAL";
    if (highActions.includes(action)) return "HIGH";
    if (mediumActions.includes(action)) return "MEDIUM";
    return "LOW";
}

// Map actions to status (for display purposes)
function getActionStatus(action: AuditAction): "SUCCESS" | "FAILED" | "WARNING" {
    // Most logged actions are successful - failures typically aren't logged
    // We can enhance this if we add a status field to the audit log
    const warningActions: AuditAction[] = [AuditAction.REJECT, AuditAction.BULK_REJECT];
    if (warningActions.includes(action)) return "WARNING";
    return "SUCCESS";
}

/**
 * Get audit logs with filtering, pagination, and user information
 */
export async function getAuditLogs(params: GetAuditLogsParams = {}): Promise<{
    success: boolean;
    data?: AuditLogWithUser[];
    total?: number;
    error?: string;
}> {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        // Check if user is super admin
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (user?.role !== "SUPER_ADMIN") {
            return { success: false, error: "Access denied" };
        }

        const {
            search,
            action,
            severity,
            dateFrom,
            dateTo,
            limit = 50,
            offset = 0,
            schoolId,
        } = params;

        // Build where clause
        const where: Record<string, unknown> = {};

        if (schoolId) {
            where.schoolId = schoolId;
        }

        if (action && action !== "ALL") {
            where.action = action as AuditAction;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                (where.createdAt as Record<string, Date>).gte = dateFrom;
            }
            if (dateTo) {
                (where.createdAt as Record<string, Date>).lte = dateTo;
            }
        }

        if (search) {
            where.OR = [
                { resource: { contains: search, mode: "insensitive" } },
                { user: { firstName: { contains: search, mode: "insensitive" } } },
                { user: { lastName: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
            ];
        }

        // Fetch logs with user and school information
        const [logs, total] = await Promise.all([
            db.auditLog.findMany({
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
                    school: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            db.auditLog.count({ where }),
        ]);

        // Transform logs to include user-friendly data
        const transformedLogs: AuditLogWithUser[] = logs.map((log) => {
            const userName = log.user
                ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email
                : "System";

            return {
                id: log.id,
                timestamp: log.createdAt,
                userId: log.userId,
                userName: userName || "System",
                userRole: log.user?.role || "SYSTEM",
                action: log.action,
                resource: log.resource,
                resourceId: log.resourceId,
                details: (log.details as Record<string, unknown>) || {},
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                schoolId: log.schoolId,
                schoolName: log.school?.name || null,
            };
        });

        // Filter by severity after transformation if needed
        let filteredLogs = transformedLogs;
        if (severity && severity !== "ALL") {
            filteredLogs = transformedLogs.filter(
                (log) => getActionSeverity(log.action) === severity
            );
        }

        return {
            success: true,
            data: filteredLogs as AuditLogWithUser[],
            total,
        };
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return { success: false, error: "Failed to fetch audit logs" };
    }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(params: {
    schoolId?: string;
    dateFrom?: Date;
    dateTo?: Date;
} = {}): Promise<{
    success: boolean;
    data?: AuditLogStats;
    error?: string;
}> {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const { schoolId, dateFrom, dateTo } = params;

        const where: Record<string, unknown> = {};
        if (schoolId) {
            where.schoolId = schoolId;
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                (where.createdAt as Record<string, Date>).gte = dateFrom;
            }
            if (dateTo) {
                (where.createdAt as Record<string, Date>).lte = dateTo;
            }
        }

        const [total, actionCounts] = await Promise.all([
            db.auditLog.count({ where }),
            db.auditLog.groupBy({
                by: ["action"],
                where,
                _count: true,
            }),
        ]);

        // Calculate stats
        const byAction: Record<string, number> = {};
        let criticalCount = 0;
        let warningCount = 0;

        actionCounts.forEach((item) => {
            byAction[item.action] = item._count;

            const severity = getActionSeverity(item.action);
            if (severity === "CRITICAL" || severity === "HIGH") {
                criticalCount += item._count;
            }

            const status = getActionStatus(item.action);
            if (status === "WARNING") {
                warningCount += item._count;
            }
        });

        return {
            success: true,
            data: {
                total,
                success: total - warningCount,
                failed: warningCount, // Using warning as proxy for "failed"
                critical: criticalCount,
                byAction,
            },
        };
    } catch (error) {
        console.error("Error fetching audit stats:", error);
        return { success: false, error: "Failed to fetch audit statistics" };
    }
}

/**
 * Get recent audit logs for dashboard (limited to 5)
 */
export async function getRecentAuditLogs(limit: number = 5): Promise<{
    success: boolean;
    data?: Array<{
        id: string;
        action: string;
        entityType: string;
        entityId: string;
        userName: string;
        userEmail: string;
        createdAt: Date;
        metadata?: Record<string, unknown>;
    }>;
    error?: string;
}> {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const logs = await db.auditLog.findMany({
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const transformedLogs = logs.map((log) => ({
            id: log.id,
            action: log.action,
            entityType: log.resource || "SYSTEM",
            entityId: log.resourceId || "",
            userName: log.user
                ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || "System User"
                : "System",
            userEmail: log.user?.email || "",
            createdAt: log.createdAt,
            metadata: log.details as Record<string, unknown>,
        }));

        return { success: true, data: transformedLogs };
    } catch (error) {
        console.error("Error fetching recent logs:", error);
        return { success: false, error: "Failed to fetch recent logs" };
    }
}

/**
 * Export audit logs (for CSV/JSON download)
 */
export async function exportAuditLogs(params: GetAuditLogsParams & { format: "json" | "csv" }): Promise<{
    success: boolean;
    data?: string;
    error?: string;
}> {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        // Check if user is super admin
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (user?.role !== "SUPER_ADMIN") {
            return { success: false, error: "Access denied" };
        }

        // Get all logs without pagination for export
        const result = await getAuditLogs({ ...params, limit: 10000, offset: 0 });

        if (!result.success || !result.data) {
            return { success: false, error: result.error };
        }

        const { format } = params;

        if (format === "json") {
            return { success: true, data: JSON.stringify(result.data, null, 2) };
        }

        // CSV format
        const headers = ["Timestamp", "User", "Role", "Action", "Resource", "Resource ID", "IP Address", "Details"];
        const rows = result.data.map((log) => [
            log.timestamp.toISOString(),
            log.userName,
            log.userRole,
            log.action,
            log.resource || "",
            log.resourceId || "",
            log.ipAddress || "",
            JSON.stringify(log.details),
        ]);

        const csv = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
        ].join("\n");

        return { success: true, data: csv };
    } catch (error) {
        console.error("Error exporting audit logs:", error);
        return { success: false, error: "Failed to export audit logs" };
    }
}
