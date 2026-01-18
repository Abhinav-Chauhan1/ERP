"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Calendar, Clock, MoreVertical, Edit, Mail, CheckCircle,
    XCircle, Trash2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface ParentMeetingData {
    id: string;
    scheduledAt: Date | string;
    duration: number;
    location?: string | null;
    status: string;
    purpose?: string | null;
    parent?: {
        user?: {
            firstName: string;
            lastName: string;
        };
        children?: Array<{
            student: {
                user?: {
                    firstName: string;
                    lastName: string;
                };
                enrollments?: Array<{
                    class: { name: string };
                    section: { name: string };
                }>;
            };
        }>;
    };
    teacher?: {
        user?: {
            firstName: string;
            lastName: string;
        };
    };
}

interface ParentMeetingsTableProps {
    meetings: ParentMeetingData[];
    onView?: (id: string) => void;
    onComplete?: (id: string) => void;
    onCancel?: (id: string) => void;
    onDelete?: (id: string) => void;
    emptyMessage?: string;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case "SCHEDULED":
            return <Badge className="bg-primary/10 text-primary">Scheduled</Badge>;
        case "COMPLETED":
            return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
        case "CANCELLED":
            return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
        case "PENDING":
            return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

export function ParentMeetingsTable({
    meetings,
    onView,
    onComplete,
    onCancel,
    onDelete,
    emptyMessage,
}: ParentMeetingsTableProps) {
    const columns = [
        {
            key: "participants",
            label: "Participants",
            isHeader: true,
            render: (meeting: ParentMeetingData) => {
                const parentName = `${meeting.parent?.user?.firstName || ""} ${meeting.parent?.user?.lastName || ""}`;
                const parentInitials = `${meeting.parent?.user?.firstName?.[0] || ""}${meeting.parent?.user?.lastName?.[0] || ""}`;
                const studentInfo = meeting.parent?.children?.[0]?.student;
                const studentName = studentInfo?.user
                    ? `${studentInfo.user.firstName} ${studentInfo.user.lastName}`
                    : "No student";
                const grade = studentInfo?.enrollments?.[0]
                    ? `${studentInfo.enrollments[0].class.name}-${studentInfo.enrollments[0].section.name}`
                    : "";

                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{parentInitials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{parentName}</div>
                            <div className="text-xs text-muted-foreground">
                                {studentName}{grade ? `, ${grade}` : ""}
                            </div>
                        </div>
                    </div>
                );
            },
            mobileRender: (meeting: ParentMeetingData) => {
                const parentName = `${meeting.parent?.user?.firstName || ""} ${meeting.parent?.user?.lastName || ""}`;
                const parentInitials = `${meeting.parent?.user?.firstName?.[0] || ""}${meeting.parent?.user?.lastName?.[0] || ""}`;

                return (
                    <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className="text-xs">{parentInitials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm truncate">{parentName}</span>
                        </div>
                        {getStatusBadge(meeting.status)}
                    </div>
                );
            },
        },
        {
            key: "purpose",
            label: "Purpose",
            render: (meeting: ParentMeetingData) => (
                <span className="font-medium">{meeting.purpose || "Meeting"}</span>
            ),
            mobileRender: (meeting: ParentMeetingData) => (
                <span className="text-xs truncate">{meeting.purpose || "Meeting"}</span>
            ),
        },
        {
            key: "schedule",
            label: "Schedule",
            render: (meeting: ParentMeetingData) => (
                <>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>
                            {new Date(meeting.scheduledAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                        <span>({meeting.duration} min)</span>
                    </div>
                </>
            ),
            mobileRender: (meeting: ParentMeetingData) => (
                <span className="text-xs">
                    {new Date(meeting.scheduledAt).toLocaleDateString()} at{" "}
                    {new Date(meeting.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            ),
        },
        {
            key: "location",
            label: "Location",
            mobilePriority: "low" as const,
            render: (meeting: ParentMeetingData) => meeting.location || "TBD",
        },
        {
            key: "status",
            label: "Status",
            mobilePriority: "low" as const, // Already in mobile header
            render: (meeting: ParentMeetingData) => getStatusBadge(meeting.status),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (meeting: ParentMeetingData) => (
                <>
                    {onView && (
                        <Button variant="ghost" size="sm" onClick={() => onView(meeting.id)}>
                            View
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
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Email Reminder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {meeting.status === "SCHEDULED" && (
                                <>
                                    {onComplete && (
                                        <DropdownMenuItem onClick={() => onComplete(meeting.id)}>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Mark as Completed
                                        </DropdownMenuItem>
                                    )}
                                    {onCancel && (
                                        <DropdownMenuItem onClick={() => onCancel(meeting.id)}>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Cancel Meeting
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => onDelete(meeting.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ),
            mobileRender: (meeting: ParentMeetingData) => (
                <>
                    {onView && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onView(meeting.id)}
                        >
                            View
                        </Button>
                    )}
                    {meeting.status === "SCHEDULED" && onComplete && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-green-600 border-green-200"
                            onClick={() => onComplete(meeting.id)}
                        >
                            Complete
                        </Button>
                    )}
                </>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={meetings}
            columns={columns}
            keyExtractor={(meeting) => meeting.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No meetings found"}
                </div>
            }
        />
    );
}
