"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { TimePicker } from "@/components/ui/time-picker";
import { createScheduledReport, updateScheduledReport, ScheduledReportInput } from "@/lib/actions/scheduledReportActions";

const scheduledReportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  dataSource: z.string().min(1, "Data source is required"),
  selectedFields: z.array(z.string()).min(1, "At least one field is required"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  scheduleTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  recipients: z.array(z.string().email()).min(1, "At least one recipient is required"),
  exportFormat: z.enum(["pdf", "excel", "csv"]),
});

type ScheduledReportFormData = z.infer<typeof scheduledReportSchema>;

interface ScheduledReportFormProps {
  initialData?: any;
  reportId?: string;
}

const DATA_SOURCES = [
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "attendance", label: "Attendance" },
  { value: "fees", label: "Fee Payments" },
  { value: "exams", label: "Exam Results" },
  { value: "classes", label: "Classes" },
  { value: "assignments", label: "Assignments" },
];

const FIELD_OPTIONS: Record<string, string[]> = {
  students: ["name", "email", "class", "section", "rollNumber", "dateOfBirth", "gender", "phone"],
  teachers: ["name", "email", "employeeId", "qualification", "joinDate", "subjects"],
  attendance: ["studentName", "date", "status", "class", "section", "remarks"],
  fees: ["studentName", "amount", "paymentDate", "status", "method", "class"],
  exams: ["studentName", "examName", "subject", "marks", "totalMarks", "percentage", "grade"],
  classes: ["name", "section", "grade", "capacity", "teacher", "studentCount"],
  assignments: ["title", "subject", "class", "dueDate", "status", "submissionCount", "teacher"],
};

export function ScheduledReportForm({ initialData, reportId }: ScheduledReportFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>(initialData?.recipients || []);
  const [selectedFields, setSelectedFields] = useState<string[]>(initialData?.selectedFields || []);
  const [dataSource, setDataSource] = useState(initialData?.dataSource || "");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScheduledReportFormData>({
    resolver: zodResolver(scheduledReportSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      dataSource: initialData?.dataSource || "",
      selectedFields: initialData?.selectedFields || [],
      frequency: initialData?.frequency || "daily",
      scheduleTime: initialData?.scheduleTime || "09:00",
      dayOfWeek: initialData?.dayOfWeek,
      dayOfMonth: initialData?.dayOfMonth,
      recipients: initialData?.recipients || [],
      exportFormat: initialData?.exportFormat || "pdf",
    },
  });

  const frequency = watch("frequency");

  function addRecipient() {
    const email = recipientInput.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email address");
      return;
    }

    if (recipients.includes(email)) {
      toast.error("Email already added");
      return;
    }

    const newRecipients = [...recipients, email];
    setRecipients(newRecipients);
    setValue("recipients", newRecipients);
    setRecipientInput("");
  }

  function removeRecipient(email: string) {
    const newRecipients = recipients.filter((r) => r !== email);
    setRecipients(newRecipients);
    setValue("recipients", newRecipients);
  }

  function toggleField(field: string) {
    const newFields = selectedFields.includes(field)
      ? selectedFields.filter((f) => f !== field)
      : [...selectedFields, field];
    setSelectedFields(newFields);
    setValue("selectedFields", newFields);
  }

  async function onSubmit(data: ScheduledReportFormData) {
    setLoading(true);

    const input: ScheduledReportInput = {
      ...data,
      filters: [],
      sorting: [],
    };

    try {
      const result = reportId
        ? await updateScheduledReport(reportId, input)
        : await createScheduledReport(input);

      if (result.success) {
        toast.success(reportId ? "Scheduled report updated" : "Scheduled report created");
        router.push("/admin/reports/scheduled");
      } else {
        toast.error(result.error || "Failed to save scheduled report");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div>
          <Label htmlFor="name">Report Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Weekly Student Attendance Report"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Optional description of this report"
            rows={3}
          />
        </div>
      </div>

      {/* Data Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Data Configuration</h3>

        <div>
          <Label htmlFor="dataSource">Data Source *</Label>
          <Select
            value={dataSource}
            onValueChange={(value) => {
              setDataSource(value);
              setValue("dataSource", value);
              setSelectedFields([]);
              setValue("selectedFields", []);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent>
              {DATA_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.dataSource && (
            <p className="text-sm text-destructive mt-1">{errors.dataSource.message}</p>
          )}
        </div>

        {dataSource && (
          <div>
            <Label>Fields to Include *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {FIELD_OPTIONS[dataSource]?.map((field) => (
                <Badge
                  key={field}
                  variant={selectedFields.includes(field) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleField(field)}
                >
                  {field}
                </Badge>
              ))}
            </div>
            {errors.selectedFields && (
              <p className="text-sm text-destructive mt-1">{errors.selectedFields.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Schedule Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Schedule Configuration</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="frequency">Frequency *</Label>
            <Select {...register("frequency")} onValueChange={(value) => setValue("frequency", value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scheduleTime">Time *</Label>
            <TimePicker
              date={watch("scheduleTime") ? new Date(`2000-01-01T${watch("scheduleTime")}:00`) : undefined}
              setDate={(date) => setValue("scheduleTime", date ? format(date, "HH:mm") : "")}
            />
            <input type="hidden" {...register("scheduleTime")} />
            {errors.scheduleTime && (
              <p className="text-sm text-destructive mt-1">{errors.scheduleTime.message}</p>
            )}
          </div>
        </div>

        {frequency === "weekly" && (
          <div>
            <Label htmlFor="dayOfWeek">Day of Week *</Label>
            <Select {...register("dayOfWeek", { valueAsNumber: true })} onValueChange={(value) => setValue("dayOfWeek", parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {frequency === "monthly" && (
          <div>
            <Label htmlFor="dayOfMonth">Day of Month *</Label>
            <Input
              id="dayOfMonth"
              type="number"
              min="1"
              max="31"
              {...register("dayOfMonth", { valueAsNumber: true })}
              placeholder="1-31"
            />
            {errors.dayOfMonth && (
              <p className="text-sm text-destructive mt-1">{errors.dayOfMonth.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Recipients */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recipients</h3>

        <div>
          <Label htmlFor="recipientInput">Email Addresses *</Label>
          <div className="flex gap-2">
            <Input
              id="recipientInput"
              type="email"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
              placeholder="Enter email address"
            />
            <Button type="button" onClick={addRecipient}>
              Add
            </Button>
          </div>
          {errors.recipients && (
            <p className="text-sm text-destructive mt-1">{errors.recipients.message}</p>
          )}
        </div>

        {recipients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipients.map((email) => (
              <Badge key={email} variant="secondary" className="gap-1">
                {email}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeRecipient(email)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Export Format */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Export Format</h3>

        <div>
          <Label htmlFor="exportFormat">Format *</Label>
          <Select {...register("exportFormat")} onValueChange={(value) => setValue("exportFormat", value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : reportId ? "Update Report" : "Create Report"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
