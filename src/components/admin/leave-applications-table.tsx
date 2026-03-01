"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info, Edit, Check, Trash2, CalendarDays } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { format } from "date-fns";

interface LeaveApplicationData {
    id: string;
    applicantType: "STUDENT" | "TEACHER";
    fromDate: Date | string;
    toDate: Date | string;
    duration: number;
    status: string;
    applicant?: {
        name?: string;
        id?: string;
        avatar?: string;
    };
}

interface LeaveApplicationsTableProps {
    applications: LeaveApplicationData[];
    onView?: (id: string) => void;
    onEdit?: (leave: LeaveApplicationData) => void;
    onProcess?: (leave: LeaveApplicationData) => void;
    onDelete?: (leave: LeaveApplicationData) => void;
    emptyMessage?: string;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case "PENDING":
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
        case "APPROVED":
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
        case "REJECTED":
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
        case "CANCELLED":
            return <Badge variant="outline" className="bg-accent text-gray-700 border-gray-200">Cancelled</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export function LeaveApplicationsTable({
    applications,
    onView,
    onEdit,
    onProcess,
    onDelete,
    emptyMessage,
}: LeaveApplicationsTableProps) {
    const columns = [
        {
            key: "applicant",
            label: "Applicant",
            isHeader: true,
            render: (leave: LeaveApplicationData) => (
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={leave.applicant?.avatar || ""} alt={leave.applicant?.name} />
                        <AvatarFallback className="text-xs">
                            {leave.applicant?.name?.substring(0, 2).toUpperCase() || "N/A"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{leave.applicant?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{leave.applicant?.id || ""}</div>
                    </div>
                </div>
            ),
            mobileRender: (leave: LeaveApplicationData) => (
                <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-xs">
                                {leave.applicant?.name?.substring(0, 2).toUpperCase() || "N/A"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm truncate">{leave.applicant?.name || "Unknown"}</span>
                    </div>
                    {getStatusBadge(leave.status)}
                </div>
            ),
        },
        {
            key: "type",
            label: "Type",
            render: (leave: LeaveApplicationData) => (
                <Badge
                    variant="outline"
                    className={
                        leave.applicantType === "STUDENT"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-teal-50 text-teal-700 border-teal-200"
                    }
                >
                    {leave.applicantType === "STUDENT" ? "Student" : "Teacher"}
                </Badge>
            ),
            mobileRender: (leave: LeaveApplicationData) => (
                <Badge
                    variant="outline"
                    className={`text-xs ${leave.applicantType === "STUDENT"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-teal-50 text-teal-700 border-teal-200"
                        }`}
                >
                    {leave.applicantType === "STUDENT" ? "Student" : "Teacher"}
                </Badge>
            ),
        },
        {
            key: "dateRange",
            label: "Date Range",
            mobilePriority: "low" as const,
            render: (leave: LeaveApplicationData) => (
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                        {format(new Date(leave.fromDate), "MMM d, yyyy")} -{" "}
                        {format(new Date(leave.toDate), "MMM d, yyyy")}
                    </span>
                </div>
            ),
        },
        {
            key: "duration",
            label: "Duration",
            render: (leave: LeaveApplicationData) => (
                <span>
                    {leave.duration} {leave.duration === 1 ? "day" : "days"}
                </span>
            ),
            mobileRender: (leave: LeaveApplicationData) => (
                <span className="text-xs">
                    {leave.duration} {leave.duration === 1 ? "day" : "days"}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            mobilePriority: "low" as const, // Already in mobile header
            render: (leave: LeaveApplicationData) => getStatusBadge(leave.status),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (leave: LeaveApplicationData) => (
                <>
                    {onView && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onView(leave.id)}
                        >
                            <Info className="h-4 w-4" />
                        </Button>
                    )}
                    {leave.status === "PENDING" && (
                        <>
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => onEdit(leave)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            {onProcess && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-green-600"
                                    onClick={() => onProcess(leave)}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500"
                                    onClick={() => onDelete(leave)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </>
            ),
            mobileRender: (leave: LeaveApplicationData) => (
                <>
                    {onView && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onView(leave.id)}>
                            View
                        </Button>
                    )}
                    {leave.status === "PENDING" && (
                        <>
                            {onProcess && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs text-green-600 border-green-200"
                                    onClick={() => onProcess(leave)}
                                >
                                    Process
                                </Button>
                            )}
                        </>
                    )}
                </>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={applications}
            columns={columns}
            keyExtractor={(leave) => leave.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No leave applications found"}
                </div>
            }
        />
    );
}
