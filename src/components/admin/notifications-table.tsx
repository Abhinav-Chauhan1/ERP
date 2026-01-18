"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Info, AlertTriangle, AlertCircle, CheckCircle,
    Bell, Users, Clock, Eye, MoreVertical, Send, Trash2, PlusCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface NotificationData {
    id: string;
    title: string;
    message: string;
    type: string;
    recipientRole?: string | null;
    createdAt: Date | string;
    sender?: {
        firstName: string;
        lastName: string;
    } | null;
}

interface NotificationsTableProps {
    notifications: NotificationData[];
    onView?: (id: string) => void;
    onDelete?: (id: string) => void;
    emptyMessage?: string;
}

const getTypeIcon = (type: string) => {
    switch (type) {
        case "INFO":
            return <Info className="h-4 w-4" />;
        case "WARNING":
            return <AlertTriangle className="h-4 w-4" />;
        case "ALERT":
            return <AlertCircle className="h-4 w-4" />;
        case "SUCCESS":
            return <CheckCircle className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case "INFO":
            return "bg-primary/10 text-primary";
        case "WARNING":
            return "bg-amber-100 text-amber-700";
        case "ALERT":
            return "bg-red-100 text-red-700";
        case "SUCCESS":
            return "bg-green-100 text-green-700";
        default:
            return "bg-muted text-gray-700";
    }
};

export function NotificationsTable({
    notifications,
    onView,
    onDelete,
    emptyMessage,
}: NotificationsTableProps) {
    const columns = [
        {
            key: "notification",
            label: "Notification",
            isHeader: true,
            render: (notification: NotificationData) => (
                <div>
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {notification.message}
                    </div>
                </div>
            ),
            mobileRender: (notification: NotificationData) => (
                <div className="flex items-center justify-between gap-2 w-full">
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{notification.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                            {notification.message}
                        </div>
                    </div>
                    <Badge className={`${getTypeColor(notification.type)} shrink-0`}>
                        {getTypeIcon(notification.type)}
                    </Badge>
                </div>
            ),
        },
        {
            key: "type",
            label: "Type",
            mobilePriority: "low" as const, // Already in mobile header
            render: (notification: NotificationData) => (
                <Badge className={getTypeColor(notification.type)}>
                    <div className="flex items-center gap-1">
                        {getTypeIcon(notification.type)}
                        <span>{notification.type}</span>
                    </div>
                </Badge>
            ),
        },
        {
            key: "sentTo",
            label: "Sent To",
            render: (notification: NotificationData) => (
                <>
                    <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{notification.recipientRole || "ALL"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {notification.sender
                            ? `By ${notification.sender.firstName} ${notification.sender.lastName}`
                            : "System"}
                    </div>
                </>
            ),
            mobileRender: (notification: NotificationData) => (
                <span className="text-xs">{notification.recipientRole || "ALL"}</span>
            ),
        },
        {
            key: "date",
            label: "Date",
            mobilePriority: "low" as const,
            render: (notification: NotificationData) => (
                <>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleTimeString()}
                    </div>
                </>
            ),
        },
        {
            key: "readRate",
            label: "Read Rate",
            mobilePriority: "low" as const,
            render: (notification: NotificationData) => (
                <div className="text-xs text-muted-foreground">
                    Sent to {notification.recipientRole || "ALL"}
                </div>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (notification: NotificationData) => (
                <>
                    {onView && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(notification.id)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Resend
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {onDelete && (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => onDelete(notification.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ),
            mobileRender: (notification: NotificationData) => (
                <>
                    {onView && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onView(notification.id)}
                        >
                            View
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-red-500 border-red-200"
                            onClick={() => onDelete(notification.id)}
                        >
                            Delete
                        </Button>
                    )}
                </>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={notifications}
            columns={columns}
            keyExtractor={(notification) => notification.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No notifications found"}
                </div>
            }
        />
    );
}
