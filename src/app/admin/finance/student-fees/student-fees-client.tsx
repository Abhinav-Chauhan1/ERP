"use client";

import { useState, useMemo, useCallback } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { extractClassLevel } from "@/components/fees/fee-type-class-amount-config";
import {
  getStudentFeeAmountsForClass,
  setStudentFeeAmounts,
  type StudentFeeAmountColumn,
  type StudentFeeAmountRow,
} from "@/lib/actions/feeTypeStudentAmountActions";

interface ClassOption {
  id: string;
  name: string;
}

interface StudentFeesClientProps {
  initialClasses: ClassOption[];
}

// key: `${studentId}:${feeTypeId}`
type DirtyMap = Record<string, number>;

export function StudentFeesClient({ initialClasses }: StudentFeesClientProps) {
  const sortedClasses = useMemo(() => {
    return [...initialClasses].sort((a, b) => {
      const la = extractClassLevel(a.name);
      const lb = extractClassLevel(b.name);
      if (la !== null && lb !== null) return la - lb;
      return a.name.localeCompare(b.name);
    });
  }, [initialClasses]);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [columns, setColumns] = useState<StudentFeeAmountColumn[]>([]);
  const [rows, setRows] = useState<StudentFeeAmountRow[]>([]);
  const [dirty, setDirty] = useState<DirtyMap>({});

  const loadClass = useCallback(async (classId: string) => {
    setSelectedClassId(classId);
    setDirty({});
    if (!classId) {
      setColumns([]);
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const result = await getStudentFeeAmountsForClass(classId);
      if (result.success) {
        setColumns(result.data?.columns || []);
        setRows(result.data?.rows || []);
      } else {
        toast.error(result.error || "Failed to load student fees");
        setColumns([]);
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const cellKey = (studentId: string, feeTypeId: string) => `${studentId}:${feeTypeId}`;

  const getDisplayAmount = (row: StudentFeeAmountRow, feeTypeId: string): number => {
    const key = cellKey(row.studentId, feeTypeId);
    if (key in dirty) return dirty[key];
    return row.amounts[feeTypeId]?.amount ?? 0;
  };

  const isCellCustom = (row: StudentFeeAmountRow, feeTypeId: string): boolean => {
    const key = cellKey(row.studentId, feeTypeId);
    if (key in dirty) return true; // any edit is treated as custom until saved/reloaded
    return row.amounts[feeTypeId]?.isCustom ?? false;
  };

  const handleCellChange = (studentId: string, feeTypeId: string, value: string) => {
    const parsed = parseFloat(value);
    const amount = Number.isFinite(parsed) ? parsed : 0;
    setDirty((prev) => ({ ...prev, [cellKey(studentId, feeTypeId)]: amount }));
  };

  const dirtyCount = Object.keys(dirty).length;

  const handleReset = () => setDirty({});

  const handleSave = async () => {
    const entries = Object.entries(dirty).map(([key, amount]) => {
      const [studentId, feeTypeId] = key.split(":");
      return { studentId, feeTypeId, amount };
    });
    if (entries.length === 0) return;

    setSaving(true);
    try {
      const result = await setStudentFeeAmounts(entries);
      if (result.success) {
        toast.success(`Saved ${entries.length} fee amount${entries.length === 1 ? "" : "s"}`);
        setDirty({});
        await loadClass(selectedClassId);
      } else {
        toast.error(result.error || "Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Student Fees</h1>
        <p className="text-sm text-muted-foreground">
          Set each student&apos;s fee amount per fee type, laid out by class like the fee register.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a class</CardTitle>
          <CardDescription>Choose a class to view and edit its students&apos; fee amounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClassId} onValueChange={loadClass}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {sortedClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClassId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Fee amounts</CardTitle>
              <CardDescription>
                {rows.length} student{rows.length === 1 ? "" : "s"}. Muted values are the class default; edit a cell to set a
                student-specific amount.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {dirtyCount > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleReset} disabled={dirtyCount === 0 || saving}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={dirtyCount === 0 || saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save changes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Loading students...
              </div>
            ) : columns.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8 border rounded-md">
                No active fee structure found for this class.
              </div>
            ) : (
              <div className="border rounded-md max-h-[70vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[180px] sticky left-0 bg-background z-20">Student</TableHead>
                      {columns.map((col) => (
                        <TableHead key={col.feeTypeId} className="min-w-[130px]">
                          {col.feeTypeName}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.studentId}>
                        <TableCell className="font-medium sticky left-0 bg-background">
                          {row.studentName}
                          {row.rollNumber && (
                            <span className="text-xs text-muted-foreground ml-1">#{row.rollNumber}</span>
                          )}
                        </TableCell>
                        {columns.map((col) => {
                          const custom = isCellCustom(row, col.feeTypeId);
                          return (
                            <TableCell key={col.feeTypeId} className={cn(custom && "bg-primary/5")}>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={getDisplayAmount(row, col.feeTypeId)}
                                onChange={(e) => handleCellChange(row.studentId, col.feeTypeId, e.target.value)}
                                className={cn("h-8 w-full", !custom && "text-muted-foreground")}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
