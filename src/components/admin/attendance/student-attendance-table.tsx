"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock4,
  Clock,
  CalendarDays,
  Edit,
  Trash2
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BulkStudentAttendanceFormValues } from "@/lib/schemaValidation/attendanceSchemaValidation";
import { cn } from "@/lib/utils";

interface StudentAttendanceTableProps {
  data: any[]; // The attendance records with student info
  form: UseFormReturn<BulkStudentAttendanceFormValues>;
  onEdit: (student: any) => void;
  onDelete: (attendanceId: string) => void;
}

export function StudentAttendanceTable({ data, form, onEdit, onDelete }: StudentAttendanceTableProps) {
  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground w-[120px]">Roll No.</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground w-[180px]">Status</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Reason</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((record) => {
                const formRecords = form.getValues("attendanceRecords");
                const index = formRecords.findIndex((r) => r.studentId === record.id);
                if (index === -1) return null;

                const status = form.watch(`attendanceRecords.${index}.status`);
                const isPresent = status === "PRESENT";

                return (
                  <tr key={record.id} className="border-b hover:bg-accent/50 transition-colors">
                    {/* Student Info */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={record.avatar || ""} alt={record.name} />
                          <AvatarFallback className="text-xs">
                            {record.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{record.name}</span>
                      </div>
                    </td>

                    {/* Roll Number */}
                    <td className="py-3 px-4 align-middle text-muted-foreground">
                      {record.rollNumber || "—"}
                    </td>

                    {/* Attendance Status Select */}
                    <td className="py-3 px-4 align-middle">
                      <FormField
                        control={form.control}
                        name={`attendanceRecords.${index}.status`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-[150px] h-9">
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
                    </td>

                    {/* Reason Input */}
                    <td className="py-3 px-4 align-middle">
                      <FormField
                        control={form.control}
                        name={`attendanceRecords.${index}.reason`}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder={isPresent ? "" : "Reason for absence/leave..."}
                            disabled={isPresent}
                            className="h-9 w-full max-w-[300px]"
                          />
                        )}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-middle text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEdit(record)}
                          type="button"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {record.attendanceId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(record.attendanceId)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-3">
        {data.map((record) => {
          const formRecords = form.getValues("attendanceRecords");
          const index = formRecords.findIndex((r) => r.studentId === record.id);
          if (index === -1) return null;

          const status = form.watch(`attendanceRecords.${index}.status`);

          return (
            <div key={record.id} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3">
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={record.avatar || ""} alt={record.name} />
                    <AvatarFallback className="text-xs">
                      {record.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{record.name}</div>
                    <div className="text-xs text-gray-500">Roll: {record.rollNumber || "—"}</div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {status === "PRESENT" && (
                    <Badge variant="default" className="capitalize bg-green-500 hover:bg-green-600 text-xs">
                      Present
                    </Badge>
                  )}
                  {status === "ABSENT" && (
                    <Badge variant="destructive" className="capitalize text-xs">
                      Absent
                    </Badge>
                  )}
                  {status === "LATE" && (
                    <Badge variant="default" className="capitalize bg-yellow-500 hover:bg-yellow-600 text-xs">
                      Late
                    </Badge>
                  )}
                  {status === "HALF_DAY" && (
                    <Badge variant="default" className="capitalize bg-orange-500 hover:bg-orange-600 text-xs">
                      Half Day
                    </Badge>
                  )}
                  {status === "LEAVE" && (
                    <Badge variant="outline" className="capitalize text-xs">
                      Leave
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons - 5-column grid for Admin */}
              <div className="grid grid-cols-5 gap-1.5 mt-1">
                {/* Present Button */}
                <Button
                  type="button"
                  size="sm"
                  variant={status === "PRESENT" ? "default" : "outline"}
                  className={cn(
                    "w-full h-9 p-0 flex items-center justify-center transition-all",
                    status === "PRESENT"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "hover:bg-green-50 hover:text-green-600 border-green-200 text-green-600"
                  )}
                  onClick={() => {
                    form.setValue(`attendanceRecords.${index}.status`, "PRESENT", {
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                    form.setValue(`attendanceRecords.${index}.reason`, "", {
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                  title="Mark Present"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>

                {/* Absent Button */}
                <Button
                  type="button"
                  size="sm"
                  variant={status === "ABSENT" ? "destructive" : "outline"}
                  className={cn(
                    "w-full h-9 p-0 flex items-center justify-center transition-all",
                    status === "ABSENT"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "hover:bg-red-50 hover:text-red-600 border-red-200 text-red-600"
                  )}
                  onClick={() =>
                    form.setValue(`attendanceRecords.${index}.status`, "ABSENT", {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  title="Mark Absent"
                >
                  <XCircle className="h-4 w-4" />
                </Button>

                {/* Late Button */}
                <Button
                  type="button"
                  size="sm"
                  variant={status === "LATE" ? "default" : "outline"}
                  className={cn(
                    "w-full h-9 p-0 flex items-center justify-center transition-all",
                    status === "LATE"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : "hover:bg-yellow-50 hover:text-yellow-600 border-yellow-200 text-yellow-600"
                  )}
                  onClick={() =>
                    form.setValue(`attendanceRecords.${index}.status`, "LATE", {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  title="Mark Late"
                >
                  <Clock4 className="h-4 w-4" />
                </Button>

                {/* Half Day Button */}
                <Button
                  type="button"
                  size="sm"
                  variant={status === "HALF_DAY" ? "default" : "outline"}
                  className={cn(
                    "w-full h-9 p-0 flex items-center justify-center transition-all",
                    status === "HALF_DAY"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "hover:bg-orange-50 hover:text-orange-600 border-orange-200 text-orange-600"
                  )}
                  onClick={() =>
                    form.setValue(`attendanceRecords.${index}.status`, "HALF_DAY", {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  title="Mark Half Day"
                >
                  <Clock className="h-4 w-4" />
                </Button>

                {/* Leave Button */}
                <Button
                  type="button"
                  size="sm"
                  variant={status === "LEAVE" ? "default" : "outline"}
                  className={cn(
                    "w-full h-9 p-0 flex items-center justify-center transition-all",
                    status === "LEAVE"
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "hover:bg-blue-50 hover:text-blue-600 border-blue-200 text-blue-600"
                  )}
                  onClick={() =>
                    form.setValue(`attendanceRecords.${index}.status`, "LEAVE", {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  title="Mark Leave"
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>

              {/* Reason Field for Non-Present */}
              {status !== "PRESENT" && (
                <div className="mt-1">
                  <FormField
                    control={form.control}
                    name={`attendanceRecords.${index}.reason`}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Reason for absence/leave/late..."
                        className="h-9 w-full text-xs"
                      />
                    )}
                  />
                </div>
              )}

              {/* Quick Actions (Edit / Delete) */}
              <div className="flex justify-end gap-1 border-t pt-2 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 hover:bg-gray-100"
                  onClick={() => onEdit(record)}
                  type="button"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
                {record.attendanceId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDelete(record.attendanceId)}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
