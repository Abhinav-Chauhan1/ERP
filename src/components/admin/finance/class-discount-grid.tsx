"use client";

import { useEffect, useState } from "react";
import type { DiscountType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

interface ClassDiscountGridProps {
  academicYearId: string;
  classId: string;
  feeStructure: { id: string; name: string } | null;
  initialRows: BulkDiscountFeeRow[];
  onSaved: () => void;
}

interface EditableRow {
  studentId: string;
  rollNumber: string | null;
  name: string;
  sectionName: string | null;
  normalGrossTotal: number;
  normalDiscountValue: number | null;
  booksAmount: number;
  booksDiscountValue: number | null;
  transportAmount: number;
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
    sectionName: row.sectionName,
    normalGrossTotal: row.normalFee.grossTotal,
    normalDiscountValue: row.normalFee.value,
    booksAmount: row.booksFee.amount,
    booksDiscountValue: row.booksFee.discountValue,
    transportAmount: row.transportFee.amount,
    transportDiscountValue: row.transportFee.discountValue,
  };
}

// Mirrors calculateDiscountAmount/calculateNetPayable in payment-helpers.ts —
// duplicated here (client-side, for instant preview) since that file imports
// the Prisma db client and can't be bundled into a client component. The
// server recomputes these authoritatively on save.
function calcDiscountAmount(gross: number, type: DiscountType, value: number | null): number {
  if (!value || gross <= 0) return 0;
  const raw = type === "PERCENTAGE" ? (gross * value) / 100 : value;
  return Math.min(Math.max(raw, 0), gross);
}

function calcNet(gross: number, type: DiscountType, value: number | null): number {
  return gross - calcDiscountAmount(gross, type, value);
}

export function ClassDiscountGrid({
  academicYearId,
  classId,
  feeStructure,
  initialRows,
  onSaved,
}: ClassDiscountGridProps) {
  const [rows, setRows] = useState<EditableRow[]>(initialRows.map(toEditableRow));
  const [discountType, setDiscountType] = useState<DiscountType>("FLAT_AMOUNT");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [rowErrors, setRowErrors] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    setRows(initialRows.map(toEditableRow));
    setValidationErrors([]);
    setRowErrors(new Map());
  }, [initialRows]);

  const validateDiscount = (studentId: string, field: string, value: number | null) => {
    let message: string | null = null;
    if (value !== null) {
      if (value < 0) message = "Must be non-negative";
      else if (discountType === "PERCENTAGE" && value > 100) message = "Percentage cannot exceed 100";
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

  // Discount type changed globally — re-validate every existing discount value
  // (e.g. a leftover value > 100 becomes invalid once switched to Percentage).
  const handleDiscountTypeChange = (next: DiscountType) => {
    setDiscountType(next);
    setValidationErrors((prev) =>
      prev.filter((e) => {
        if (next !== "PERCENTAGE") return true;
        const row = rows.find((r) => r.studentId === e.studentId);
        if (!row) return true;
        const value =
          e.field === "normalDiscount" ? row.normalDiscountValue :
          e.field === "booksDiscount" ? row.booksDiscountValue :
          e.field === "transportDiscount" ? row.transportDiscountValue : null;
        return !(value !== null && value >= 0 && value <= 100);
      })
    );
    rows.forEach((row) => {
      validateDiscount(row.studentId, "normalDiscount", row.normalDiscountValue);
      validateDiscount(row.studentId, "booksDiscount", row.booksDiscountValue);
      validateDiscount(row.studentId, "transportDiscount", row.transportDiscountValue);
    });
  };

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
      normalFee: { value: r.normalDiscountValue },
      booksFee: { amount: r.booksAmount, discountValue: r.booksDiscountValue },
      transportFee: { amount: r.transportAmount, discountValue: r.transportDiscountValue },
    }));

    const result = await bulkSaveClassDiscounts(academicYearId, classId, discountType, saveRows);
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
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="text-sm text-muted-foreground">
          {rows.length} students &middot;{" "}
          {feeStructure ? `Normal Fee: ${feeStructure.name}` : "No Normal Fee structure assigned to this class"}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Discount Type</Label>
            <Select value={discountType} onValueChange={(v) => handleDiscountTypeChange(v as DiscountType)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FLAT_AMOUNT">Flat (₹)</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={isSaving || hasErrors}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save All"}
          </Button>
        </div>
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
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Section</th>
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
                      <Badge variant="secondary">{row.sectionName || "-"}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline">{row.rollNumber || "-"}</Badge>
                    </td>

                    {/* Normal Fee */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {feeStructure ? row.normalGrossTotal.toFixed(0) : "-"}
                    </td>
                    <td className="py-3 px-2">
                      <DiscountValueCell
                        disabled={!feeStructure}
                        value={row.normalDiscountValue}
                        error={getFieldError(row.studentId, "normalDiscount")}
                        onChange={(value) => {
                          updateRow(row.studentId, { normalDiscountValue: value });
                          validateDiscount(row.studentId, "normalDiscount", value);
                        }}
                      />
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {feeStructure
                        ? calcNet(row.normalGrossTotal, discountType, row.normalDiscountValue).toFixed(0)
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
                      <DiscountValueCell
                        value={row.booksDiscountValue}
                        error={getFieldError(row.studentId, "booksDiscount")}
                        onChange={(value) => {
                          updateRow(row.studentId, { booksDiscountValue: value });
                          validateDiscount(row.studentId, "booksDiscount", value);
                        }}
                      />
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {calcNet(row.booksAmount, discountType, row.booksDiscountValue).toFixed(0)}
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
                      <DiscountValueCell
                        value={row.transportDiscountValue}
                        error={getFieldError(row.studentId, "transportDiscount")}
                        onChange={(value) => {
                          updateRow(row.studentId, { transportDiscountValue: value });
                          validateDiscount(row.studentId, "transportDiscount", value);
                        }}
                      />
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {calcNet(row.transportAmount, discountType, row.transportDiscountValue).toFixed(0)}
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

function DiscountValueCell({
  value,
  disabled,
  error,
  onChange,
}: {
  value: number | null;
  disabled?: boolean;
  error: string | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Input
        type="number"
        min="0"
        step="1"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
        className={`w-20 text-center ${error ? "border-red-500" : ""}`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
