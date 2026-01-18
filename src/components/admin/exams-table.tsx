"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { format } from "date-fns";

interface ExamData {
    id: string;
    title: string;
    examDate: Date | string;
    startTime: Date | string;
    endTime: Date | string;
    subject: {
        name: string;
    };
    examType: {
        name: string;
    };
    term?: {
        name: string;
    };
}

interface ExamsTableProps {
    exams: ExamData[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    emptyMessage?: string;
}

const getStatusColor = (examDate: string | Date) => {
    const now = new Date();
    const date = new Date(examDate);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (date < now) {
        return "bg-green-100 text-green-800"; // Past
    } else if (date.getTime() - now.getTime() < oneDayInMs) {
        return "bg-amber-100 text-amber-800"; // Today/tomorrow
    } else {
        return "bg-primary/10 text-primary"; // Upcoming
    }
};

const getStatusText = (examDate: string | Date) => {
    const now = new Date();
    const date = new Date(examDate);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (date < now) {
        return "Completed";
    } else if (date.getTime() - now.getTime() < oneDayInMs) {
        return "Today/Tomorrow";
    } else {
        return "Upcoming";
    }
};

export function ExamsTable({ exams, onEdit, onDelete, emptyMessage }: ExamsTableProps) {
    const columns = [
        {
            key: "title",
            label: "Title",
            isHeader: true,
            render: (exam: ExamData) => <span className="font-medium">{exam.title}</span>,
            mobileRender: (exam: ExamData) => (
                <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-medium text-sm truncate">{exam.title}</span>
                    <Badge className={`${getStatusColor(exam.examDate)} shrink-0`}>
                        {getStatusText(exam.examDate)}
                    </Badge>
                </div>
            ),
        },
        {
            key: "subject",
            label: "Subject",
            render: (exam: ExamData) => exam.subject.name,
            mobileRender: (exam: ExamData) => (
                <span className="text-xs">{exam.subject.name}</span>
            ),
        },
        {
            key: "dateTime",
            label: "Date & Time",
            render: (exam: ExamData) => (
                <>
                    <span>{format(new Date(exam.examDate), "MMM d, yyyy")}</span>
                    <div className="text-xs text-muted-foreground">
                        {format(new Date(exam.startTime), "h:mm a")} -{" "}
                        {format(new Date(exam.endTime), "h:mm a")}
                    </div>
                </>
            ),
            mobileRender: (exam: ExamData) => (
                <span className="text-xs">
                    {format(new Date(exam.examDate), "MMM d")} •{" "}
                    {format(new Date(exam.startTime), "h:mm a")}
                </span>
            ),
        },
        {
            key: "type",
            label: "Type",
            mobilePriority: "low" as const,
            render: (exam: ExamData) => exam.examType.name,
        },
        {
            key: "status",
            label: "Status",
            mobilePriority: "low" as const, // Already in mobile header
            render: (exam: ExamData) => (
                <Badge className={getStatusColor(exam.examDate)}>
                    {getStatusText(exam.examDate)}
                </Badge>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (exam: ExamData) => (
                <div className="flex justify-end gap-2">
                    <Link href={`/admin/assessment/exams/${exam.id}`}>
                        <Button variant="ghost" size="sm">
                            View
                        </Button>
                    </Link>
                    {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(exam.id)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => onDelete(exam.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
            mobileRender: (exam: ExamData) => (
                <>
                    <Link href={`/admin/assessment/exams/${exam.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            View
                        </Button>
                    </Link>
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onEdit(exam.id)}
                        >
                            Edit
                        </Button>
                    )}
                </>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={exams}
            columns={columns}
            keyExtractor={(exam) => exam.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No exams found"}
                </div>
            }
        />
    );
}
