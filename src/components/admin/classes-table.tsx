"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface ClassData {
    id: string;
    name: string;
    academicYear: {
        name: string;
        isCurrent?: boolean;
    };
    sections: Array<{ id: string; name: string }>;
    _count: {
        enrollments: number;
    };
}

interface ClassesTableProps {
    classes: ClassData[];
    onEdit?: (id: string) => void;
    emptyMessage?: string;
}

export function ClassesTable({ classes, onEdit, emptyMessage }: ClassesTableProps) {
    const columns = [
        {
            key: "name",
            label: "Class",
            isHeader: true,
            render: (cls: ClassData) => (
                <span className="font-medium">{cls.name}</span>
            ),
            mobileRender: (cls: ClassData) => (
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{cls.name}</span>
                    {cls.academicYear.isCurrent && (
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
            render: (cls: ClassData) => (
                <div className="flex items-center gap-2">
                    {cls.academicYear.name}
                    {cls.academicYear.isCurrent && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
                    )}
                </div>
            ),
            mobileRender: (cls: ClassData) => (
                <span className="text-xs">{cls.academicYear.name}</span>
            ),
        },
        {
            key: "sections",
            label: "Sections",
            render: (cls: ClassData) => (
                <div className="flex flex-wrap gap-1">
                    {cls.sections.map((section) => (
                        <Badge
                            key={section.id}
                            variant="outline"
                            className="text-xs"
                        >
                            {section.name}
                        </Badge>
                    ))}
                </div>
            ),
            mobileRender: (cls: ClassData) => (
                <div className="flex flex-wrap gap-0.5 justify-end">
                    {cls.sections.slice(0, 2).map((section) => (
                        <Badge
                            key={section.id}
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                        >
                            {section.name}
                        </Badge>
                    ))}
                    {cls.sections.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                            +{cls.sections.length - 2}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: "students",
            label: "Students",
            mobilePriority: "low" as const,
            render: (cls: ClassData) => cls._count.enrollments,
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (cls: ClassData) => (
                <>
                    {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(cls.id)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                    )}
                    <Link href={`/admin/classes/${cls.id}`}>
                        <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                    </Link>
                </>
            ),
            mobileRender: (cls: ClassData) => (
                <>
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onEdit(cls.id)}
                        >
                            Edit
                        </Button>
                    )}
                    <Link href={`/admin/classes/${cls.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            View
                        </Button>
                    </Link>
                </>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={classes}
            columns={columns}
            keyExtractor={(cls) => cls.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No classes found"}
                </div>
            }
        />
    );
}
