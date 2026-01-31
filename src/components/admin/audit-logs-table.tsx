"use client";

import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { formatDistanceToNow } from "date-fns";

interface AuditLogData {
    id: string;
    timestamp: Date | null;
    action: string;
    resource: string | null;
    resourceId?: string | null;
    ipAddress?: string | null;
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        role: string;
    } | null;
}

interface AuditLogsTableProps {
    logs: AuditLogData[];
    emptyMessage?: string;
}

const getActionColor = (action: string) => {
    switch (action) {
        case "CREATE":
            return "bg-green-500 hover:bg-green-500";
        case "UPDATE":
            return "bg-blue-500 hover:bg-blue-500";
        case "DELETE":
            return "bg-red-500 hover:bg-red-500";
        case "READ":
            return "bg-gray-500 hover:bg-gray-500";
        case "LOGIN":
            return "bg-purple-500 hover:bg-purple-500";
        case "LOGOUT":
            return "bg-orange-500 hover:bg-orange-500";
        case "EXPORT":
            return "bg-yellow-500 hover:bg-yellow-500";
        case "IMPORT":
            return "bg-teal-500 hover:bg-teal-500";
        default:
            return "bg-gray-500 hover:bg-gray-500";
    }
};

export function AuditLogsTable({ logs, emptyMessage }: AuditLogsTableProps) {
    const columns = [
        {
            key: "timestamp",
            label: "Timestamp",
            isHeader: true,
            render: (log: AuditLogData) => (
                <div>
                    <div className="text-sm">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">
                        {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : 'Unknown time'}
                    </div>
                </div>
            ),
            mobileRender: (log: AuditLogData) => (
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm">
                        {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : 'Unknown time'}
                    </div>
                    <Badge className={`${getActionColor(log.action)} text-xs text-white`}>
                        {log.action}
                    </Badge>
                </div>
            ),
        },
        {
            key: "user",
            label: "User",
            render: (log: AuditLogData) => (
                <div>
                    <div className="text-sm font-medium">
                        {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User'}
                    </div>
                    <div className="text-xs text-muted-foreground">{log.user?.email || 'No email'}</div>
                </div>
            ),
            mobileRender: (log: AuditLogData) => (
                <span className="text-xs truncate max-w-[120px] inline-block">
                    {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User'}
                </span>
            ),
        },
        {
            key: "action",
            label: "Action",
            mobilePriority: "low" as const, // Already in header on mobile
            render: (log: AuditLogData) => (
                <Badge className={`${getActionColor(log.action)} text-white`}>
                    {log.action}
                </Badge>
            ),
        },
        {
            key: "resource",
            label: "Resource",
            render: (log: AuditLogData) => (
                <span className="capitalize">{log.resource || 'N/A'}</span>
            ),
            mobileRender: (log: AuditLogData) => (
                <span className="capitalize text-xs">{log.resource || 'N/A'}</span>
            ),
        },
        {
            key: "resourceId",
            label: "Resource ID",
            mobilePriority: "low" as const,
            render: (log: AuditLogData) =>
                log.resourceId ? (
                    <span className="font-mono text-xs truncate max-w-[100px] inline-block">
                        {log.resourceId}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                ),
        },
        {
            key: "ipAddress",
            label: "IP Address",
            mobilePriority: "low" as const,
            render: (log: AuditLogData) => (
                <span className="text-sm">{log.ipAddress || "-"}</span>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={logs}
            columns={columns}
            keyExtractor={(log) => log.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No audit logs found"}
                </div>
            }
        />
    );
}
