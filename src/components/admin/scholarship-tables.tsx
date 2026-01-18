"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, UserCheck, Edit, Calendar } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { format } from "date-fns";

// Helper for amount display
function getScholarshipAmount(program: any) {
    if (program.amountType === "PERCENTAGE" || program.percentage) {
        return `${program.percentage}% of fees`;
    }
    return program.amount ? `₹${program.amount.toLocaleString()}` : "Varies";
}

interface ScholarshipProgramsTableProps {
    programs: any[];
    onView: (id: string) => void;
    onAward: (id: string) => void;
}

export function ScholarshipProgramsTable({ programs, onView, onAward }: ScholarshipProgramsTableProps) {
    const columns = [
        {
            key: "name",
            label: "Name",
            isHeader: true,
            render: (program: any) => (
                <div>
                    <div className="font-medium">{program.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{program.criteria}</div>
                </div>
            ),
            mobileRender: (program: any) => (
                <div>
                    <div className="font-medium text-sm">{program.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{program.criteria}</div>
                </div>
            )
        },
        {
            key: "amount",
            label: "Amount",
            render: (program: any) => getScholarshipAmount(program),
        },
        {
            key: "fundedBy",
            label: "Funded By",
            mobilePriority: "low" as const,
            render: (program: any) => program.fundedBy,
        },
        {
            key: "recipients",
            label: "Recipients",
            render: (program: any) => (
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    {program.recipients?.length || 0} students
                </Badge>
            ),
            mobileRender: (program: any) => (
                <div className="text-xs mt-1">
                    <span className="text-muted-foreground">Recipients: </span>
                    <span className="font-medium">{program.recipients?.length || 0}</span>
                </div>
            )
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (program: any) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(program.id)}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAward(program.id)}
                    >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Award
                    </Button>
                </div>
            ),
            mobileRender: (program: any) => (
                <div className="flex gap-2 mt-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onView(program.id)}>
                        View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs bg-primary/5 text-primary border-primary/20" onClick={() => onAward(program.id)}>
                        Award
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ResponsiveTable
            data={programs}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyState={
                <div className="text-center py-10">
                    <div className="text-muted-foreground mb-2">No scholarship programs found matching your search criteria</div>
                </div>
            }
        />
    );
}

interface ScholarshipRecipientsTableProps {
    recipients: any[];
    onView: (id: string) => void;
    onEdit: (id: string) => void;
}

export function ScholarshipRecipientsTable({ recipients, onView, onEdit }: ScholarshipRecipientsTableProps) {
    const columns = [
        {
            key: "student",
            label: "Student",
            isHeader: true,
            render: (recipient: any) => (
                <div>
                    <div className="font-medium">{recipient.student?.name || recipient.studentName}</div>
                    <div className="text-xs text-muted-foreground">{recipient.student?.class?.name || recipient.grade}</div>
                </div>
            ),
            mobileRender: (recipient: any) => (
                <div>
                    <div className="font-medium text-sm">{recipient.student?.name || recipient.studentName}</div>
                    <div className="text-xs text-muted-foreground">{recipient.student?.class?.name || recipient.grade}</div>
                </div>
            )
        },
        {
            key: "scholarship",
            label: "Scholarship",
            render: (recipient: any) => recipient.scholarship?.name || recipient.scholarshipName,
        },
        {
            key: "amount",
            label: "Amount",
            render: (recipient: any) => (
                <span className="font-medium">₹{recipient.amount.toLocaleString()}</span>
            ),
            mobileRender: (recipient: any) => (
                <span className="font-semibold text-sm text-green-700">₹{recipient.amount.toLocaleString()}</span>
            )
        },
        {
            key: "period",
            label: "Period",
            mobilePriority: "low" as const,
            render: (recipient: any) => (
                <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{new Date(recipient.awardDate).toLocaleDateString()} - {new Date(recipient.endDate).toLocaleDateString()}</span>
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (recipient: any) => (
                <Badge className={
                    recipient.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        recipient.status === "EXPIRED" ? "bg-gray-100 text-gray-800" :
                            "bg-red-100 text-red-800"
                }>
                    {recipient.status}
                </Badge>
            ),
            mobileRender: (recipient: any) => (
                <div className="text-right">
                    <Badge className={`text-[10px] h-5 px-1.5 ${recipient.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                            recipient.status === "EXPIRED" ? "bg-gray-100 text-gray-800" :
                                "bg-red-100 text-red-800"
                        }`}>
                        {recipient.status}
                    </Badge>
                </div>
            )
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (recipient: any) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(recipient.id)}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(recipient.id)}
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                </div>
            ),
            mobileRender: (recipient: any) => (
                <div className="flex gap-2 mt-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onView(recipient.id)}>
                        View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onEdit(recipient.id)}>
                        Edit
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ResponsiveTable
            data={recipients}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyState={
                <div className="text-center py-10">
                    <div className="text-muted-foreground mb-2">No scholarship recipients found matching your search criteria</div>
                </div>
            }
        />
    );
}
