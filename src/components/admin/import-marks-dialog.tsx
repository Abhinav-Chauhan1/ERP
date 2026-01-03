"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { importMarksFromFile, type ImportResult } from "@/lib/actions/importMarksActions";

interface ImportMarksDialogProps {
  examId: string;
  subjectId: string;
  onImportComplete?: () => void;
}

interface ParsedRow {
  studentId?: string;
  rollNumber?: string;
  name?: string;
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  internalMarks?: number | null;
  isAbsent?: boolean;
  remarks?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function ImportMarksDialog({
  examId,
  subjectId,
  onImportComplete,
}: ImportMarksDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(fileExtension || "")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);

    try {
      let data: ParsedRow[] = [];

      if (fileExtension === "csv") {
        // Parse CSV
        data = await parseCSV(selectedFile);
      } else {
        // Parse Excel
        data = await parseExcel(selectedFile);
      }

      // Validate parsed data
      const errors = validateParsedData(data);
      setValidationErrors(errors);
      setParsedData(data);
      setStep("preview");
    } catch (error) {
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (file: File): Promise<ParsedRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data.map((row: any) => ({
              studentId: row.studentId || row.student_id || row.StudentID || "",
              rollNumber: row.rollNumber || row.roll_number || row.RollNumber || "",
              name: row.name || row.studentName || row.Name || "",
              theoryMarks: parseMarks(row.theoryMarks || row.theory_marks || row.Theory),
              practicalMarks: parseMarks(
                row.practicalMarks || row.practical_marks || row.Practical
              ),
              internalMarks: parseMarks(
                row.internalMarks || row.internal_marks || row.Internal
              ),
              isAbsent: parseBoolean(row.isAbsent || row.is_absent || row.Absent),
              remarks: row.remarks || row.Remarks || "",
            }));
            resolve(data);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  };

  const parseExcel = async (file: File): Promise<ParsedRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const parsedData = jsonData.map((row: any) => ({
            studentId: row.studentId || row.student_id || row.StudentID || "",
            rollNumber: row.rollNumber || row.roll_number || row.RollNumber || "",
            name: row.name || row.studentName || row.Name || "",
            theoryMarks: parseMarks(row.theoryMarks || row.theory_marks || row.Theory),
            practicalMarks: parseMarks(
              row.practicalMarks || row.practical_marks || row.Practical
            ),
            internalMarks: parseMarks(
              row.internalMarks || row.internal_marks || row.Internal
            ),
            isAbsent: parseBoolean(row.isAbsent || row.is_absent || row.Absent),
            remarks: row.remarks || row.Remarks || "",
          }));

          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : "Unknown error"}`));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsBinaryString(file);
    });
  };

  const parseMarks = (value: any): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const parseBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      return lower === "true" || lower === "yes" || lower === "1" || lower === "absent";
    }
    return false;
  };

  const validateParsedData = (data: ParsedRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and row 1 is header

      // Validate required fields
      if (!row.studentId && !row.rollNumber) {
        errors.push({
          row: rowNumber,
          field: "studentId/rollNumber",
          message: "Either studentId or rollNumber is required",
        });
      }

      // Validate marks are numeric if provided
      if (row.theoryMarks != null && isNaN(row.theoryMarks as number)) {
        errors.push({
          row: rowNumber,
          field: "theoryMarks",
          message: "Theory marks must be a valid number",
        });
      }

      if (row.practicalMarks != null && isNaN(row.practicalMarks as number)) {
        errors.push({
          row: rowNumber,
          field: "practicalMarks",
          message: "Practical marks must be a valid number",
        });
      }

      if (row.internalMarks != null && isNaN(row.internalMarks as number)) {
        errors.push({
          row: rowNumber,
          field: "internalMarks",
          message: "Internal marks must be a valid number",
        });
      }

      // Validate marks are non-negative
      if (row.theoryMarks != null && (row.theoryMarks as number) < 0) {
        errors.push({
          row: rowNumber,
          field: "theoryMarks",
          message: "Theory marks cannot be negative",
        });
      }

      if (row.practicalMarks != null && (row.practicalMarks as number) < 0) {
        errors.push({
          row: rowNumber,
          field: "practicalMarks",
          message: "Practical marks cannot be negative",
        });
      }

      if (row.internalMarks != null && (row.internalMarks as number) < 0) {
        errors.push({
          row: rowNumber,
          field: "internalMarks",
          message: "Internal marks cannot be negative",
        });
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsProcessing(true);

    try {
      const result = await importMarksFromFile({
        examId,
        subjectId,
        data: parsedData,
      });

      setImportResult(result);
      setStep("result");

      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported marks for ${result.successCount} students.`,
        });

        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import marks",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to import marks",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    setOpen(false);
  };

  const downloadTemplate = () => {
    const template = [
      {
        studentId: "student-id-1",
        rollNumber: "001",
        name: "Student Name",
        theoryMarks: 85,
        practicalMarks: 90,
        internalMarks: 18,
        isAbsent: false,
        remarks: "Good performance",
      },
      {
        studentId: "student-id-2",
        rollNumber: "002",
        name: "Another Student",
        theoryMarks: "",
        practicalMarks: "",
        internalMarks: "",
        isAbsent: true,
        remarks: "Absent",
      },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marks-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import from File
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Marks from File</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file containing student marks. Download the template to
            see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <>
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV, XLSX, or XLS files (max 10MB)
                    </p>
                  </div>
                </label>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Processing file...</p>
                  <Progress value={undefined} className="w-full" />
                </div>
              )}
            </>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">File: {file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedData.length} rows found
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="mr-2 h-4 w-4" />
                  Change File
                </Button>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">
                      Found {validationErrors.length} validation error(s):
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs max-h-32 overflow-y-auto">
                      {validationErrors.slice(0, 10).map((error, index) => (
                        <li key={index}>
                          Row {error.row}, {error.field}: {error.message}
                        </li>
                      ))}
                      {validationErrors.length > 10 && (
                        <li>... and {validationErrors.length - 10} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Data Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-accent p-2">
                  <p className="text-sm font-medium">Data Preview</p>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Row</th>
                        <th className="p-2 text-left">Student ID</th>
                        <th className="p-2 text-left">Roll No</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-right">Theory</th>
                        <th className="p-2 text-right">Practical</th>
                        <th className="p-2 text-right">Internal</th>
                        <th className="p-2 text-center">Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 50).map((row, index) => {
                        const rowErrors = validationErrors.filter(
                          (e) => e.row === index + 2
                        );
                        const hasError = rowErrors.length > 0;

                        return (
                          <tr
                            key={index}
                            className={`border-b ${hasError ? "bg-red-50 dark:bg-red-950/20" : ""
                              }`}
                          >
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2 font-mono text-xs">
                              {row.studentId || "-"}
                            </td>
                            <td className="p-2">{row.rollNumber || "-"}</td>
                            <td className="p-2">{row.name || "-"}</td>
                            <td className="p-2 text-right">
                              {row.theoryMarks ?? "-"}
                            </td>
                            <td className="p-2 text-right">
                              {row.practicalMarks ?? "-"}
                            </td>
                            <td className="p-2 text-right">
                              {row.internalMarks ?? "-"}
                            </td>
                            <td className="p-2 text-center">
                              {row.isAbsent ? (
                                <Badge variant="secondary" className="text-xs">
                                  Yes
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {parsedData.length > 50 && (
                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted">
                      Showing first 50 of {parsedData.length} rows
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Result */}
          {step === "result" && importResult && (
            <>
              <div className="space-y-4">
                {importResult.success ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Import Completed Successfully</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p>Total rows: {importResult.totalRows}</p>
                        <p className="text-green-600">
                          Successfully imported: {importResult.successCount}
                        </p>
                        {importResult.failedCount > 0 && (
                          <p className="text-red-600">
                            Failed: {importResult.failedCount}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Import Failed</p>
                      <p className="text-sm mt-1">{importResult.error}</p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Details */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-accent p-2">
                      <p className="text-sm font-medium">
                        Error Details ({importResult.errors.length})
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <ul className="divide-y">
                        {importResult.errors.map((error, index) => (
                          <li key={index} className="p-3 text-sm">
                            <p className="font-medium text-red-600">
                              Row {error.row}: {error.studentIdentifier}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {error.message}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || validationErrors.length > 0}
              >
                {isProcessing ? "Importing..." : "Import Marks"}
              </Button>
            </>
          )}

          {step === "result" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
