"use client";

import { useEffect, useState } from "react";
import type { DiscountType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { bulkSaveClassDiscounts, type BulkDiscountFeeRow, type BulkDiscountSaveRow } from "@/lib/actions/miscFeeActions";
import { useToast } from "@/hooks/use-toast";

interface ClassSectionDiscountGridProps {
  academicYearId: string;
  classId: string;
  sectionId: string;
  feeStructure: { id: string; name: string } | null;
  initialRows: BulkDiscountFeeRow[];
  onSaved: () => void;
}

interface EditableRow {
  studentId: string;
  rollNumber: string | null;
  name: string;
  normalGrossTotal: number;
  normalDiscountType: DiscountType | null;
  normalDiscountValue: number | null;
  booksAmount: number;
  booksDiscountType: DiscountType | null;
  booksDiscountValue: number | null;
  transportAmount: number;
  transportDiscountType: DiscountType | null;
  transportDiscountValue: number | null;
}

interface ValidationError {
  studentId: string;
  field: string;
  message: string;
}

function toEditableRow(row: BulkDiscountFeeRow): EditableRow {
  return {
    studentId: row.studentId,
    rollNumber: row.rollNumber,
    name: row.name,
    normalGrossTotal: row.normalFee.grossTotal,
    normalDiscountType: row.normalFee.discountType,
    normalDiscountValue: row.normalFee.value,
    booksAmount: row.booksFee.amount,
    booksDiscountType: row.booksFee.discountType,
    booksDiscountValue: row.booksFee.discountValue,
    transportAmount: row.transportFee.amount,
    transportDiscountType: row.transportFee.discountType,
    transportDiscountValue: row.transportFee.discountValue,
  };
}

// Mirrors calculateDiscountAmount/calculateNetPayable in payment-helpers.ts —
// duplicated here (client-side, for instant preview) since that file imports
// the Prisma db client and can't be bundled into a client component. The
// server recomputes these authoritatively on save.
function calcDiscountAmount(gross: number, type: DiscountType | null, value: number | null): number {
  if (!type || !value || gross <= 0) return 0;
  const raw = type === "PERCENTAGE" ? (gross * value) / 100 : value;
  return Math.min(Math.max(raw, 0), gross);
}

function calcNet(gross: number, type: DiscountType | null, value: number | null): number {
  return gross - calcDiscountAmount(gross, type, value);
}

export function ClassSectionDiscountGrid({
  academicYearId,
  classId,
  sectionId,
  feeStructure,
  initialRows,
  onSaved,
}: ClassSectionDiscountGridProps) {
  const [rows, setRows] = useState<EditableRow[]>(initialRows.map(toEditableRow));
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [rowErrors, setRowErrors] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    setRows(initialRows.map(toEditableRow));
    setValidationErrors([]);
    setRowErrors(new Map());
  }, [initialRows]);

  const validateDiscount = (
    studentId: string,
    field: string,
    type: DiscountType | null,
    value: number | null
  ) => {
    let message: string | null = null;
    if (type && value !== null) {
      if (value < 0) message = "Must be non-negative";
      else if (type === "PERCENTAGE" && value > 100) message = "Percentage cannot exceed 100";
    }
    setValidationErrors((prev) => {
      const filtered = prev.filter((e) => !(e.studentId === studentId && e.field === field));
      return message ? [...filtered, { studentId, field, message }] : filtered;
    });
  };

  const validateAmount = (studentId: string, field: string, value: number) => {
    const message = value < 0 ? "Must be non-negative" : null;
    setValidationErrors((prev) => {
      const filtered = prev.filter((e) => !(e.studentId === studentId && e.field === field));
      return message ? [...filtered, { studentId, field, message }] : filtered;
    });
  };

  const updateRow = (studentId: string, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)));
  };

  const getFieldError = (studentId: string, field: string) =>
    validationErrors.find((e) => e.studentId === studentId && e.field === field)?.message || null;

  const hasErrors = validationErrors.length > 0;

  const handleSave = async () => {
    if (hasErrors) {
      toast({
        title: "Validation Errors",
        description: "Please fix all validation errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setRowErrors(new Map());

    const saveRows: BulkDiscountSaveRow[] = rows.map((r) => ({
      studentId: r.studentId,
      normalFee: { discountType: r.normalDiscountType, value: r.normalDiscountValue },
      booksFee: {
        amount: r.booksAmount,
        discountType: r.booksDiscountType,
        discountValue: r.booksDiscountValue,
      },
      transportFee: {
        amount: r.transportAmount,
        discountType: r.transportDiscountType,
        discountValue: r.transportDiscountValue,
      },
    }));

    const result = await bulkSaveClassDiscounts(academicYearId, classId, sectionId, saveRows);
    setIsSaving(false);

    if (!result.success || !result.data) {
      toast({
        title: "Error",
        description: !result.success ? result.error || "Failed to save discounts" : "Failed to save discounts",
        variant: "destructive",
      });
      return;
    }

    const { summary, results } = result.data;
    const failedMap = new Map<string, string>(
      results.filter((r) => !r.success).map((r) => [r.studentId, r.error || "Failed to save"])
    );
    setRowErrors(failedMap);

    if (summary.failed === 0) {
      toast({ title: "Discounts Saved", description: `Successfully saved discounts for ${summary.succeeded} students.` });
      onSaved();
    } else {
      toast({
        title: "Partially Saved",
        description: `${summary.succeeded} saved, ${summary.failed} failed. See row errors below.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {rows.length} students &middot;{" "}
          {feeStructure ? `Normal Fee: ${feeStructure.name}` : "No Normal Fee structure assigned to this class"}
        </div>
        <Button onClick={handleSave} disabled={isSaving || hasErrors}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There are {validationErrors.length} validation error(s). Please fix them before saving.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground sticky left-0 bg-accent z-10">
                  Student
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Roll No.</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground" colSpan={3}>
                  Normal Fee
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground" colSpan={3}>
                  Books Fee
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground" colSpan={3}>
                  Transport Fee
                </th>
              </tr>
              <tr className="bg-accent/50 border-b text-xs">
                <th className="py-2 px-4 sticky left-0 bg-accent/50 z-10" />
                <th className="py-2 px-4" />
                <th className="py-2 px-2 font-normal text-muted-foreground">Gross</th>
                <th className="py-2 px-2 font-normal text-muted-foreground">Discount</th>
                <th className="py-2 px-2 font-normal text-muted-foreground">Net</th>
                <th className="py-2 px-2 font-normal text-muted-foreground">Amount</th>
                <th className="py-2 px-2 font-normal text-muted-foreground">Discount</th>
                <th className="py-2 px-2 font-normal text-muted-foreground">Net</th>
                <th className="py-2 px-2 font-normal text-muted-foreground">Amount</th>
                <th className="py-2 px-2 font-normal text-muted-foreground">Discount</th>
                <th className="py-2 px-2 font-normal text-muted-foreground">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowError = rowErrors.get(row.studentId);
                return (
                  <tr key={row.studentId} className="border-b hover:bg-accent/50 align-top">
                    <td className="py-3 px-4 sticky left-0 bg-background">
                      <div className="font-medium">{row.name}</div>
                      {rowError && <div className="text-xs text-red-500 mt-1">{rowError}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline">{row.rollNumber || "-"}</Badge>
                    </td>

                    {/* Normal Fee */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {feeStructure ? row.normalGrossTotal.toFixed(0) : "-"}
                    </td>
                    <td className="py-3 px-2">
                      <DiscountCell
                        disabled={!feeStructure}
                        type={row.normalDiscountType}
                        value={row.normalDiscountValue}
                        error={getFieldError(row.studentId, "normalDiscount")}
                        onChange={(type, value) => {
                          updateRow(row.studentId, { normalDiscountType: type, normalDiscountValue: value });
                          validateDiscount(row.studentId, "normalDiscount", type, value);
                        }}
                      />
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {feeStructure
                        ? calcNet(row.normalGrossTotal, row.normalDiscountType, row.normalDiscountValue).toFixed(0)
                        : "-"}
                    </td>

                    {/* Books Fee */}
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={row.booksAmount || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          updateRow(row.studentId, { booksAmount: value });
                          validateAmount(row.studentId, "booksAmount", value);
                        }}
                        className={`w-24 text-center ${getFieldError(row.studentId, "booksAmount") ? "border-red-500" : ""}`}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <DiscountCell
                        type={row.booksDiscountType}
                        value={row.booksDiscountValue}
                        error={getFieldError(row.studentId, "booksDiscount")}
                        onChange={(type, value) => {
                          updateRow(row.studentId, { booksDiscountType: type, booksDiscountValue: value });
                          validateDiscount(row.studentId, "booksDiscount", type, value);
                        }}
                      />
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {calcNet(row.booksAmount, row.booksDiscountType, row.booksDiscountValue).toFixed(0)}
                    </td>

                    {/* Transport Fee */}
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={row.transportAmount || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          updateRow(row.studentId, { transportAmount: value });
                          validateAmount(row.studentId, "transportAmount", value);
                        }}
                        className={`w-24 text-center ${getFieldError(row.studentId, "transportAmount") ? "border-red-500" : ""}`}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <DiscountCell
                        type={row.transportDiscountType}
                        value={row.transportDiscountValue}
                        error={getFieldError(row.studentId, "transportDiscount")}
                        onChange={(type, value) => {
                          updateRow(row.studentId, { transportDiscountType: type, transportDiscountValue: value });
                          validateDiscount(row.studentId, "transportDiscount", type, value);
                        }}
                      />
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {calcNet(row.transportAmount, row.transportDiscountType, row.transportDiscountValue).toFixed(0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!hasErrors && rowErrors.size === 0 && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>All entries valid</span>
        </div>
      )}
    </div>
  );
}

function DiscountCell({
  type,
  value,
  disabled,
  error,
  onChange,
}: {
  type: DiscountType | null;
  value: number | null;
  disabled?: boolean;
  error: string | null;
  onChange: (type: DiscountType | null, value: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Select
          value={type ?? "NONE"}
          onValueChange={(next) => {
            const nextType = next === "NONE" ? null : (next as DiscountType);
            onChange(nextType, nextType ? value ?? 0 : null);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-16 text-xs px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            <SelectItem value="FLAT_AMOUNT">Flat</SelectItem>
            <SelectItem value="PERCENTAGE">%</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          min="0"
          step="1"
          value={value ?? ""}
          disabled={disabled || !type}
          onChange={(e) => onChange(type, e.target.value ? parseFloat(e.target.value) : 0)}
          className={`w-20 text-center ${error ? "border-red-500" : ""}`}
        />
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
