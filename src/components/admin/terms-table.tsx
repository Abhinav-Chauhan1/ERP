"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface TermData {
    id: string;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
    academicYear: {
        name: string;
        isCurrent?: boolean;
    };
    _count?: {
        exams: number;
    };
}

interface TermsTableProps {
    terms: TermData[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    emptyMessage?: string;
}

export function TermsTable({ terms, onEdit, onDelete, emptyMessage }: TermsTableProps) {
    const getDuration = (startDate: Date | string, endDate: Date | string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const columns = [
        {
            key: "name",
            label: "Term Name",
            isHeader: true,
            render: (term: TermData) => (
                <span className="font-medium">{term.name}</span>
            ),
            mobileRender: (term: TermData) => (
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{term.name}</span>
                    {term.academicYear.isCurrent && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                            Current
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: "academicYear",
            label: "Academic Year",
            mobileLabel: "Year",
            render: (term: TermData) => (
                <div className="flex items-center gap-2">
                    {term.academicYear.name}
                    {term.academicYear.isCurrent && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
                    )}
                </div>
            ),
            mobileRender: (term: TermData) => (
                <span className="text-xs">{term.academicYear.name}</span>
            ),
        },
        {
            key: "startDate",
            label: "Start Date",
            mobileLabel: "Start",
            render: (term: TermData) => format(new Date(term.startDate), "MMM d, yyyy"),
            mobileRender: (term: TermData) => (
                <span className="text-xs">{format(new Date(term.startDate), "MMM d")}</span>
            ),
        },
        {
            key: "endDate",
            label: "End Date",
            mobileLabel: "End",
            mobilePriority: "low" as const,
            render: (term: TermData) => format(new Date(term.endDate), "MMM d, yyyy"),
        },
        {
            key: "duration",
            label: "Duration",
            mobilePriority: "low" as const,
            render: (term: TermData) => `${getDuration(term.startDate, term.endDate)} days`,
        },
        {
            key: "exams",
            label: "Exams",
            mobilePriority: "low" as const,
            render: (term: TermData) => term._count?.exams || 0,
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (term: TermData) => (
                <>
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEdit(term.id)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => onDelete(term.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </>
            ),
            mobileRender: (term: TermData) => (
                <>
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onEdit(term.id)}
                        >
                            Edit
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-red-500 border-red-200"
                            onClick={() => onDelete(term.id)}
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
            data={terms}
            columns={columns}
            keyExtractor={(term) => term.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No terms found"}
                </div>
            }
        />
    );
}
