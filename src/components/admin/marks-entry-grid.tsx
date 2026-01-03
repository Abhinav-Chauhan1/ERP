"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, FileDown, AlertCircle, CheckCircle2, History } from "lucide-react";
import { saveExamMarks, type StudentMarkEntry, getExamResultLastModified } from "@/lib/actions/marksEntryActions";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarkConfig {
  theoryMaxMarks?: number | null;
  practicalMaxMarks?: number | null;
  internalMaxMarks?: number | null;
  totalMarks: number;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  avatar?: string | null;
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  internalMarks?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  grade?: string | null;
  isAbsent: boolean;
  remarks?: string;
  resultId?: string;
}

interface LastModifiedInfo {
  timestamp: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
}

interface MarksEntryGridProps {
  students: Student[];
  examId: string;
  subjectId: string;
  markConfig: MarkConfig | null;
  examTotalMarks: number;
}

interface ValidationError {
  studentId: string;
  field: string;
  message: string;
}

export function MarksEntryGrid({
  students: initialStudents,
  examId,
  subjectId,
  markConfig,
  examTotalMarks,
}: MarksEntryGridProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastModifiedInfo, setLastModifiedInfo] = useState<Map<string, LastModifiedInfo>>(new Map());
  const [loadingLastModified, setLoadingLastModified] = useState(false);
  const { toast } = useToast();

  // Update students when initial data changes
  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  // Load last modified info for students with existing results
  useEffect(() => {
    const loadLastModifiedInfo = async () => {
      setLoadingLastModified(true);
      const infoMap = new Map<string, LastModifiedInfo>();
      
      for (const student of initialStudents) {
        if (student.resultId) {
          const result = await getExamResultLastModified(examId, student.id);
          if (result.success && result.data) {
            infoMap.set(student.id, result.data);
          }
        }
      }
      
      setLastModifiedInfo(infoMap);
      setLoadingLastModified(false);
    };

    if (initialStudents.length > 0) {
      loadLastModifiedInfo();
    }
  }, [initialStudents, examId]);

  const validateField = (
    studentId: string,
    field: "theoryMarks" | "practicalMarks" | "internalMarks",
    value: number | null
  ): string | null => {
    if (value === null || value === undefined) return null;

    // Check if numeric and non-negative
    if (isNaN(value) || value < 0) {
      return "Must be a non-negative number";
    }

    // Check against maximum marks
    if (markConfig) {
      const maxMarks =
        field === "theoryMarks"
          ? markConfig.theoryMaxMarks
          : field === "practicalMarks"
          ? markConfig.practicalMaxMarks
          : markConfig.internalMaxMarks;

      if (maxMarks && value > maxMarks) {
        return `Exceeds maximum (${maxMarks})`;
      }
    }

    return null;
  };

  const updateStudentMark = (
    studentId: string,
    field: keyof Student,
    value: any
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updated = { ...student, [field]: value };

        // If marking as absent, clear all marks
        if (field === "isAbsent" && value === true) {
          updated.theoryMarks = null;
          updated.practicalMarks = null;
          updated.internalMarks = null;
          updated.totalMarks = null;
          updated.percentage = null;
          updated.grade = null;
        }

        // If unmarking absent, recalculate totals
        if (field === "isAbsent" && value === false) {
          const total =
            (updated.theoryMarks || 0) +
            (updated.practicalMarks || 0) +
            (updated.internalMarks || 0);
          updated.totalMarks = total;
          updated.percentage = examTotalMarks > 0 ? (total / examTotalMarks) * 100 : 0;
          updated.grade = calculateGrade(updated.percentage);
        }

        // Recalculate total if marks changed
        if (
          field === "theoryMarks" ||
          field === "practicalMarks" ||
          field === "internalMarks"
        ) {
          if (!updated.isAbsent) {
            const total =
              (updated.theoryMarks || 0) +
              (updated.practicalMarks || 0) +
              (updated.internalMarks || 0);
            updated.totalMarks = total;
            updated.percentage = examTotalMarks > 0 ? (total / examTotalMarks) * 100 : 0;
            updated.grade = calculateGrade(updated.percentage);
          }

          // Validate the field
          const error = validateField(
            studentId,
            field as "theoryMarks" | "practicalMarks" | "internalMarks",
            value
          );

          setValidationErrors((prev) => {
            const filtered = prev.filter(
              (e) => !(e.studentId === studentId && e.field === field)
            );
            if (error) {
              return [...filtered, { studentId, field, message: error }];
            }
            return filtered;
          });
        }

        return updated;
      })
    );
  };

  const calculateGrade = (percentage: number): string => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C+";
    if (percentage >= 40) return "C";
    if (percentage >= 33) return "D";
    return "F";
  };

  const getFieldError = (studentId: string, field: string): string | null => {
    const error = validationErrors.find(
      (e) => e.studentId === studentId && e.field === field
    );
    return error?.message || null;
  };

  const hasErrors = validationErrors.length > 0;

  const handleSave = async (isDraft: boolean = false) => {
    if (hasErrors && !isDraft) {
      toast({
        title: "Validation Errors",
        description: "Please fix all validation errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const marksData: StudentMarkEntry[] = students.map((student) => ({
      studentId: student.id,
      theoryMarks: student.theoryMarks,
      practicalMarks: student.practicalMarks,
      internalMarks: student.internalMarks,
      isAbsent: student.isAbsent,
      remarks: student.remarks,
    }));

    const result = await saveExamMarks({
      examId,
      subjectId,
      marks: marksData,
      isDraft,
    });

    setIsSaving(false);

    if (result.success) {
      toast({
        title: isDraft ? "Saved as Draft" : "Marks Saved",
        description: `Successfully saved marks for ${result.data?.savedCount} students.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save marks",
        variant: "destructive",
      });
    }
  };

  const hasTheory = markConfig?.theoryMaxMarks !== null && markConfig?.theoryMaxMarks !== undefined;
  const hasPractical = markConfig?.practicalMaxMarks !== null && markConfig?.practicalMaxMarks !== undefined;
  const hasInternal = markConfig?.internalMaxMarks !== null && markConfig?.internalMaxMarks !== undefined;

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {students.length} students enrolled
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSave(false)} disabled={isSaving || hasErrors}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </div>

      {/* Validation Summary */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There are {validationErrors.length} validation error(s). Please fix them before
            saving.
          </AlertDescription>
        </Alert>
      )}

      {/* Marks Entry Grid */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground sticky left-0 bg-accent z-10">
                  Student
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Roll No.
                </th>
                {hasTheory && (
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                    Theory
                    <div className="text-xs font-normal">
                      (Max: {markConfig?.theoryMaxMarks})
                    </div>
                  </th>
                )}
                {hasPractical && (
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                    Practical
                    <div className="text-xs font-normal">
                      (Max: {markConfig?.practicalMaxMarks})
                    </div>
                  </th>
                )}
                {hasInternal && (
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                    Internal
                    <div className="text-xs font-normal">
                      (Max: {markConfig?.internalMaxMarks})
                    </div>
                  </th>
                )}
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Total
                  <div className="text-xs font-normal">(Max: {examTotalMarks})</div>
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  %
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Grade
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Absent
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Last Modified
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const theoryError = getFieldError(student.id, "theoryMarks");
                const practicalError = getFieldError(student.id, "practicalMarks");
                const internalError = getFieldError(student.id, "internalMarks");

                return (
                  <tr key={student.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 align-middle sticky left-0 bg-background">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar || undefined} />
                          <AvatarFallback>
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle text-center">
                      <Badge variant="outline">{student.rollNumber || "-"}</Badge>
                    </td>
                    {hasTheory && (
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max={markConfig?.theoryMaxMarks || undefined}
                            step="0.5"
                            value={student.theoryMarks ?? ""}
                            onChange={(e) =>
                              updateStudentMark(
                                student.id,
                                "theoryMarks",
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            disabled={student.isAbsent}
                            className={`w-20 text-center ${
                              theoryError ? "border-red-500" : ""
                            }`}
                          />
                          {theoryError && (
                            <span className="text-xs text-red-500">{theoryError}</span>
                          )}
                        </div>
                      </td>
                    )}
                    {hasPractical && (
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max={markConfig?.practicalMaxMarks || undefined}
                            step="0.5"
                            value={student.practicalMarks ?? ""}
                            onChange={(e) =>
                              updateStudentMark(
                                student.id,
                                "practicalMarks",
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            disabled={student.isAbsent}
                            className={`w-20 text-center ${
                              practicalError ? "border-red-500" : ""
                            }`}
                          />
                          {practicalError && (
                            <span className="text-xs text-red-500">{practicalError}</span>
                          )}
                        </div>
                      </td>
                    )}
                    {hasInternal && (
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max={markConfig?.internalMaxMarks || undefined}
                            step="0.5"
                            value={student.internalMarks ?? ""}
                            onChange={(e) =>
                              updateStudentMark(
                                student.id,
                                "internalMarks",
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            disabled={student.isAbsent}
                            className={`w-20 text-center ${
                              internalError ? "border-red-500" : ""
                            }`}
                          />
                          {internalError && (
                            <span className="text-xs text-red-500">{internalError}</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-4 align-middle text-center">
                      {student.isAbsent ? (
                        <Badge variant="secondary">AB</Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                          {student.totalMarks?.toFixed(1) || "0.0"}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 align-middle text-center">
                      {student.isAbsent ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="font-medium">
                          {student.percentage?.toFixed(1) || "0.0"}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-middle text-center">
                      {student.isAbsent ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <Badge
                          variant={
                            student.grade === "F" ? "destructive" : "default"
                          }
                        >
                          {student.grade || "-"}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 align-middle text-center">
                      <Checkbox
                        checked={student.isAbsent}
                        onCheckedChange={(checked) =>
                          updateStudentMark(student.id, "isAbsent", checked === true)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 align-middle text-center">
                      {loadingLastModified ? (
                        <span className="text-xs text-muted-foreground">Loading...</span>
                      ) : lastModifiedInfo.has(student.id) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1 cursor-help">
                                <History className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(lastModifiedInfo.get(student.id)!.timestamp),
                                    "MMM dd, HH:mm"
                                  )}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <p>
                                  <span className="font-medium">Action:</span>{" "}
                                  {lastModifiedInfo.get(student.id)!.action}
                                </p>
                                <p>
                                  <span className="font-medium">By:</span>{" "}
                                  {lastModifiedInfo.get(student.id)!.user.firstName}{" "}
                                  {lastModifiedInfo.get(student.id)!.user.lastName}
                                </p>
                                <p>
                                  <span className="font-medium">Email:</span>{" "}
                                  {lastModifiedInfo.get(student.id)!.user.email}
                                </p>
                                <p>
                                  <span className="font-medium">Time:</span>{" "}
                                  {format(
                                    new Date(lastModifiedInfo.get(student.id)!.timestamp),
                                    "MMM dd, yyyy HH:mm:ss"
                                  )}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex gap-4">
          <div>
            <span className="text-muted-foreground">Present: </span>
            <span className="font-medium">
              {students.filter((s) => !s.isAbsent).length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Absent: </span>
            <span className="font-medium">
              {students.filter((s) => s.isAbsent).length}
            </span>
          </div>
        </div>
        {!hasErrors && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>All entries valid</span>
          </div>
        )}
      </div>
    </div>
  );
}
