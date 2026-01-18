"use client";

import { Button } from "@/components/ui/button";
import { Award, Edit, Trash2 } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface GradeData {
    id: string;
    grade: string;
    minMarks: number;
    maxMarks: number;
    gpa: number | null;
    description?: string | null;
}

interface GradesTableProps {
    grades: GradeData[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    emptyMessage?: string;
}

const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-700";
    if (grade.startsWith("B")) return "bg-primary/10 text-primary";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-700";
    if (grade.startsWith("D")) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
};

export function GradesTable({ grades, onEdit, onDelete, emptyMessage }: GradesTableProps) {
    const columns = [
        {
            key: "grade",
            label: "Grade",
            isHeader: true,
            render: (grade: GradeData) => (
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${getGradeColor(grade.grade)}`}>
                        <Award className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{grade.grade}</span>
                </div>
            ),
            mobileRender: (grade: GradeData) => (
                <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${getGradeColor(grade.grade)}`}>
                            <Award className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{grade.grade}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        GPA: {grade.gpa !== null ? grade.gpa.toFixed(1) : "N/A"}
                    </span>
                </div>
            ),
        },
        {
            key: "minMarks",
            label: "Minimum Marks (%)",
            render: (grade: GradeData) => `${grade.minMarks.toFixed(2)}%`,
            mobileRender: (grade: GradeData) => (
                <span className="text-xs">{grade.minMarks.toFixed(2)}%</span>
            ),
        },
        {
            key: "maxMarks",
            label: "Maximum Marks (%)",
            render: (grade: GradeData) => `${grade.maxMarks.toFixed(2)}%`,
            mobileRender: (grade: GradeData) => (
                <span className="text-xs">to {grade.maxMarks.toFixed(2)}%</span>
            ),
        },
        {
            key: "gpa",
            label: "GPA",
            mobilePriority: "low" as const, // Already in mobile header
            render: (grade: GradeData) =>
                grade.gpa !== null ? grade.gpa.toFixed(1) : "N/A",
        },
        {
            key: "description",
            label: "Description",
            mobilePriority: "low" as const,
            className: "max-w-xs truncate",
            render: (grade: GradeData) => grade.description || "—",
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (grade: GradeData) => (
                <>
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEdit(grade.id)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => onDelete(grade.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </>
            ),
            mobileRender: (grade: GradeData) => (
                <>
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onEdit(grade.id)}
                        >
                            Edit
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-red-500 border-red-200"
                            onClick={() => onDelete(grade.id)}
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
            data={grades}
            columns={columns}
            keyExtractor={(grade) => grade.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No grades found"}
                </div>
            }
        />
    );
}
