"use client";

import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/ui/form";
import { Edit, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
// We import types from schema validation file
// If not exported, we use 'any', but Page imports them so they must be exported
import { BulkStudentAttendanceFormValues } from "@/lib/schemaValidation/attendanceSchemaValidation";

interface StudentAttendanceTableProps {
    data: any[]; // The attendance records with student info
    form: UseFormReturn<BulkStudentAttendanceFormValues>;
    onEdit: (student: any) => void;
    onDelete: (attendanceId: string) => void;
}

export function StudentAttendanceTable({ data, form, onEdit, onDelete }: StudentAttendanceTableProps) {

    const columns = [
        {
            key: "student",
            label: "Student",
            isHeader: true,
            render: (record: any) => (
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={record.avatar || ""} alt={record.name} />
                        <AvatarFallback className="text-xs">{record.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{record.name}</span>
                </div>
            ),
        },
        {
            key: "rollNumber",
            label: "Roll No.",
            className: "w-[100px]",
            mobilePriority: "low" as const,
            render: (record: any) => record.rollNumber || "—",
        },
        {
            key: "status",
            label: "Status",
            render: (record: any) => {
                // Find index in form array using studentId as key
                const formRecords = form.getValues("attendanceRecords");
                const index = formRecords.findIndex((r) => r.studentId === record.id);

                if (index === -1) return null;

                return (
                    <FormField
                        control={form.control}
                        name={`attendanceRecords.${index}.status`}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="w-[130px] h-8">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRESENT">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                            <span>Present</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ABSENT">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                            <span>Absent</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="LATE">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                            <span>Late</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="HALF_DAY">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                                            <span>Half Day</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="LEAVE">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                                            <span>Leave</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                );
            },
            mobileRender: (record: any) => {
                const formRecords = form.getValues("attendanceRecords");
                const index = formRecords.findIndex((r) => r.studentId === record.id);
                if (index === -1) return null;

                return (
                    <FormField
                        control={form.control}
                        name={`attendanceRecords.${index}.status`}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRESENT">Present</SelectItem>
                                    <SelectItem value="ABSENT">Absent</SelectItem>
                                    <SelectItem value="LATE">Late</SelectItem>
                                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                                    <SelectItem value="LEAVE">Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                )
            }
        },
        {
            key: "reason",
            label: "Reason",
            mobilePriority: "low" as const,
            render: (record: any) => {
                const formRecords = form.getValues("attendanceRecords");
                const index = formRecords.findIndex((r) => r.studentId === record.id);

                if (index === -1) return null;

                const status = form.watch(`attendanceRecords.${index}.status`);
                const isPresent = status === "PRESENT";

                return (
                    <FormField
                        control={form.control}
                        name={`attendanceRecords.${index}.reason`}
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={field.value || ""}
                                placeholder={isPresent ? "" : "Reason"}
                                disabled={isPresent}
                                className="h-8 min-w-[150px]"
                            />
                        )}
                    />
                );
            },
            mobileRender: (record: any) => {
                const formRecords = form.getValues("attendanceRecords");
                const index = formRecords.findIndex((r) => r.studentId === record.id);
                if (index === -1) return null;
                const status = form.watch(`attendanceRecords.${index}.status`);

                return (
                    <FormField
                        control={form.control}
                        name={`attendanceRecords.${index}.reason`}
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Reason"
                                disabled={status === "PRESENT"}
                                className="h-8 w-full text-xs"
                            />
                        )}
                    />
                )
            }
        },
        {
            key: "actions",
            label: "Actions",
            isAction: true,
            className: "text-right",
            render: (record: any) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(record)}
                        type="button" // Prevent form submission
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    {record.attendanceId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => onDelete(record.attendanceId)}
                            type="button"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return <ResponsiveTable data={data} columns={columns} keyExtractor={(r) => r.id} />;
}
