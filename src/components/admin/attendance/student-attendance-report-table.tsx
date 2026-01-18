"use client";

import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Badge } from "@/components/ui/badge";

interface StudentAttendanceReportTableProps {
    data: any[];
}

export function StudentAttendanceReportTable({ data }: StudentAttendanceReportTableProps) {
    const columns = [
        {
            key: "student",
            label: "Student",
            isHeader: true,
            render: (item: any) => (
                <div className="font-medium">{item.studentName}</div>
            ),
        },
        {
            key: "rollNumber",
            label: "Roll No.",
            mobilePriority: "low" as const,
            render: (item: any) => item.rollNumber || "—",
        },
        {
            key: "present",
            label: "Present",
            className: "text-center",
            render: (item: any) => item.summary.present,
        },
        {
            key: "absent",
            label: "Absent",
            className: "text-center",
            render: (item: any) => item.summary.absent,
        },
        {
            key: "late",
            label: "Late",
            className: "text-center",
            mobilePriority: "low" as const,
            render: (item: any) => item.summary.late,
        },
        {
            key: "leave",
            label: "Leave",
            className: "text-center",
            mobilePriority: "low" as const,
            render: (item: any) => item.summary.leave,
        },
        {
            key: "percentage",
            label: "Present %",
            className: "text-center",
            render: (item: any) => {
                const total = item.summary.total || 1; // Avoid division by zero
                const percentage = Math.round((item.summary.present / total) * 100);
                return (
                    <div className="flex justify-center">
                        <Badge variant={item.summary.present / total > 0.5 ? "default" : "destructive"}>
                            {percentage}%
                        </Badge>
                    </div>
                );
            },
            mobileRender: (item: any) => {
                const total = item.summary.total || 1;
                const percentage = Math.round((item.summary.present / total) * 100);
                return (
                    <Badge variant={item.summary.present / total > 0.5 ? "default" : "destructive"}>
                        {percentage}%
                    </Badge>
                )
            }
        }
    ];

    return (
        <ResponsiveTable
            data={data}
            columns={columns}
            keyExtractor={(item) => item.studentId}
            emptyState={<div className="text-center py-4">No report data available</div>}
        />
    );
}
