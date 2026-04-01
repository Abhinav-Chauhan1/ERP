"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Papa from "papaparse";
import {
  validateImportData,
  importStudentsBatched,
  importTeachers,
  importParents,
  type ImportResult,
  type DuplicateHandling,
} from "@/lib/actions/bulkImportActions";

const BATCH_SIZE = 10;

type ImportType = "student" | "teacher" | "parent";

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
  classId: string;
}

interface BulkImportDialogProps {
  trigger?: React.ReactNode;
  classes?: ClassOption[];
  sections?: SectionOption[];
  defaultImportType?: ImportType;
}

// Student CSV template headers (no classId/sectionId — selected via UI)
const STUDENT_REQUIRED_HEADERS = [
  "firstName", "lastName", "email", "phone",
  "admissionId", "dateOfBirth", "gender",
];
const STUDENT_OPTIONAL_HEADERS = [
  "rollNumber", "address", "bloodGroup",
  "emergencyContact", "emergencyPhone", "height", "weight",
  // Indian-specific
  "aadhaarNumber", "apaarId", "pen", "abcId",
  "nationality", "religion", "caste", "category",
  "motherTongue", "birthPlace",
  "previousSchool", "previousClass", "tcNumber",
  "medicalConditions", "specialNeeds",
  // Parent/Guardian
  "fatherName", "fatherOccupation", "fatherPhone", "fatherAadhaar",
  "motherName", "motherOccupation", "motherPhone", "motherAadhaar",
  "guardianName", "guardianRelation", "guardianPhone", "guardianAadhaar",
];
const STUDENT_SAMPLE: Record<string, string> = {
  firstName: "John", lastName: "Doe", email: "john.doe@example.com",
  phone: "+919876543210", admissionId: "STU001", dateOfBirth: "2010-01-15",
  gender: "MALE", rollNumber: "1", address: "123 Main St", bloodGroup: "O+",
  emergencyContact: "Parent Name", emergencyPhone: "+919876543211",
  height: "150", weight: "45", aadhaarNumber: "123456789012",
  nationality: "Indian", religion: "Hindu", category: "General",
  fatherName: "Robert Doe", fatherPhone: "+919876543212",
  motherName: "Jane Doe", motherPhone: "+919876543213",
};

export function BulkImportDialog({
  trigger,
  classes = [],
  sections = [],
  defaultImportType = "student",
}: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>(defaultImportType);
  const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>("skip");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<"upload" | "validate" | "import" | "result">("upload");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  // Progress tracking
  const [importProgress, setImportProgress] = useState(0);
  const [importedSoFar, setImportedSoFar] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredSections = useMemo(
    () => sections.filter((s) => s.classId === selectedClassId),
    [selectedClassId, sections]
  );

  useEffect(() => {
    setSelectedSectionId("");
  }, [selectedClassId]);

  const hasClassData = classes.length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data as any[]);
        setCurrentStep("validate");
        toast.success(`Parsed ${results.data.length} rows from CSV`);
      },
      error: (error) => toast.error(`Error parsing CSV: ${error.message}`),
    });
  };

  const handleValidate = async () => {
    if (parsedData.length === 0) { toast.error("No data to validate"); return; }
    setIsValidating(true);
    try {
      const result = await validateImportData(parsedData, importType);
      setValidationErrors(result.errors);
      if (result.valid) {
        toast.success("Validation passed. Ready to import.");
        setCurrentStep("import");
      } else {
        toast.error(`Validation failed with ${result.errors.length} error(s)`);
      }
    } catch {
      toast.error("Error during validation");
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = useCallback(async () => {
    if (parsedData.length === 0) { toast.error("No data to import"); return; }

    setIsImporting(true);
    setImportProgress(0);
    setImportedSoFar(0);

    try {
      if (importType === "student") {
        // Batch-by-batch with live progress
        const totalBatches = Math.ceil(parsedData.length / BATCH_SIZE);
        const accumulated: ImportResult = {
          success: true,
          summary: { total: parsedData.length, created: 0, updated: 0, skipped: 0, failed: 0 },
          errors: [],
        };

        for (let b = 0; b < totalBatches; b++) {
          const batchResult = await importStudentsBatched(
            parsedData,
            duplicateHandling,
            hasClassData && selectedClassId ? selectedClassId : undefined,
            hasClassData && selectedSectionId ? selectedSectionId : undefined,
            b
          );

          accumulated.summary.created += batchResult.summary.created;
          accumulated.summary.updated += batchResult.summary.updated;
          accumulated.summary.skipped += batchResult.summary.skipped;
          accumulated.summary.failed += batchResult.summary.failed;
          accumulated.errors.push(...batchResult.errors);

          const processed = Math.min((b + 1) * BATCH_SIZE, parsedData.length);
          setImportedSoFar(processed);
          setImportProgress(Math.round((processed / parsedData.length) * 100));
        }

        accumulated.success = accumulated.summary.failed === 0;
        setImportResult(accumulated);
        setCurrentStep("result");
        if (accumulated.success) {
          toast.success("Import completed successfully.");
          router.refresh();
        } else {
          toast.error(`Import completed with ${accumulated.summary.failed} failure(s)`);
        }
      } else {
        // Teachers and parents — single call (no batched variant needed yet)
        const result =
          importType === "teacher"
            ? await importTeachers(parsedData, duplicateHandling)
            : await importParents(parsedData, duplicateHandling);

        setImportProgress(100);
        setImportResult(result);
        setCurrentStep("result");
        if (result.success) {
          toast.success("Import completed successfully.");
          router.refresh();
        } else {
          toast.error(`Import completed with ${result.summary.failed} failure(s)`);
        }
      }
    } catch {
      toast.error("Unexpected error during import");
    } finally {
      setIsImporting(false);
    }
  }, [parsedData, importType, duplicateHandling, hasClassData, selectedClassId, selectedSectionId, router]);

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
    setCurrentStep("upload");
    setSelectedClassId("");
    setSelectedSectionId("");
    setImportProgress(0);
    setImportedSoFar(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    if (importType === "student") {
      const headers = [...STUDENT_REQUIRED_HEADERS, ...STUDENT_OPTIONAL_HEADERS];
      const sample = headers.map((h) => STUDENT_SAMPLE[h] ?? "");
      const csv = [headers.join(","), sample.join(",")].join("\n");
      triggerDownload(csv, "student_import_template.csv");
    } else if (importType === "teacher") {
      const headers = ["firstName", "lastName", "email", "phone", "employeeId", "qualification", "joinDate", "salary", "departmentId"];
      const sample = ["Jane", "Smith", "jane.smith@example.com", "+919876543210", "EMP001", "M.Ed", "2020-01-15", "50000", ""];
      triggerDownload([headers.join(","), sample.join(",")].join("\n"), "teacher_import_template.csv");
    } else {
      const headers = ["firstName", "lastName", "email", "phone", "occupation", "address", "studentAdmissionId"];
      const sample = ["Robert", "Doe", "robert.doe@example.com", "+919876543210", "Engineer", "123 Main St", "STU001"];
      triggerDownload([headers.join(","), sample.join(",")].join("\n"), "parent_import_template.csv");
    }
  };

  function triggerDownload(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Data Import</DialogTitle>
          <DialogDescription>Import multiple records from a CSV file</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Upload */}
          {currentStep === "upload" && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Import Type</Label>
                  <Select value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="parent">Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Duplicate Handling</Label>
                  <RadioGroup value={duplicateHandling} onValueChange={(v) => setDuplicateHandling(v as DuplicateHandling)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="skip" id="skip" />
                      <Label htmlFor="skip" className="cursor-pointer font-normal">Skip duplicates (recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="update" id="update" />
                      <Label htmlFor="update" className="cursor-pointer font-normal">Update existing records</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="create" id="create" />
                      <Label htmlFor="create" className="cursor-pointer font-normal">Create new records (may create duplicates)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Class/Section selectors — always shown for student imports */}
                {importType === "student" && hasClassData && (
                  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <Label className="text-sm font-medium">Class Assignment (required)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All imported students will be enrolled in the selected class and section.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="classSelect">Class</Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                          <SelectTrigger id="classSelect"><SelectValue placeholder="Select a class..." /></SelectTrigger>
                          <SelectContent>
                            {classes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sectionSelect">Section</Label>
                        <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                          <SelectTrigger id="sectionSelect">
                            <SelectValue placeholder={selectedClassId ? "Select a section..." : "Select class first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredSections.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>CSV Template</AlertTitle>
                  <AlertDescription>
                    Download the template to see all available fields and the required format.
                    {importType === "student" && (
                      <span className="block mt-1 text-xs text-muted-foreground">
                        Required: firstName, lastName, email, admissionId, dateOfBirth, gender.
                        All other fields are optional.
                      </span>
                    )}
                    <Button variant="link" className="p-0 h-auto ml-0 mt-1 block" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-1 inline" />
                      Download Template
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-2">
                  <Label htmlFor="file">Upload CSV File</Label>
                  <input ref={fileInputRef} id="file" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {file ? file.name : "Choose CSV file"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Validate */}
          {currentStep === "validate" && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Data Preview</AlertTitle>
                <AlertDescription>Found {parsedData.length} records. Validate before importing.</AlertDescription>
              </Alert>

              {parsedData.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[280px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(parsedData[0]).map((key) => (
                            <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((val: any, j) => (
                              <TableCell key={j} className="whitespace-nowrap">{val}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {parsedData.length > 5 && (
                    <div className="p-2 text-sm text-muted-foreground text-center border-t">
                      Showing 5 of {parsedData.length} rows
                    </div>
                  )}
                </div>
              )}

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation Errors ({validationErrors.length})</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 max-h-[200px] overflow-auto space-y-1">
                      {validationErrors.slice(0, 10).map((err, i) => (
                        <div key={i} className="text-sm">
                          Row {err.row}: {err.field && `${err.field} — `}{err.message}
                        </div>
                      ))}
                      {validationErrors.length > 10 && (
                        <div className="text-sm font-medium">...and {validationErrors.length - 10} more errors</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>Start Over</Button>
                <Button onClick={handleValidate} disabled={isValidating || parsedData.length === 0} className="flex-1">
                  {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Validate Data
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Import Confirmation */}
          {currentStep === "import" && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Validation Passed</AlertTitle>
                <AlertDescription>
                  {parsedData.length} records ready to import
                  {importType === "student" && selectedClassId && selectedSectionId && (
                    <span> into {classes.find((c) => c.id === selectedClassId)?.name} / {filteredSections.find((s) => s.id === selectedSectionId)?.name}</span>
                  )}.
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-medium">Import Summary</h4>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Total Records</span>
                  <span className="font-medium">{parsedData.length}</span>
                  <span className="text-muted-foreground">Import Type</span>
                  <span className="font-medium capitalize">{importType}s</span>
                  <span className="text-muted-foreground">Duplicate Handling</span>
                  <span className="font-medium capitalize">{duplicateHandling}</span>
                  <span className="text-muted-foreground">Batch Size</span>
                  <span className="font-medium">{BATCH_SIZE} records/batch</span>
                </div>
              </div>

              {/* Progress bar — shown while importing */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Importing...</span>
                    <span>{importedSoFar} / {parsedData.length} records</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{importProgress}% complete</p>
                </div>
              )}

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>This action cannot be undone. Review the data carefully before proceeding.</AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} disabled={isImporting}>Cancel</Button>
                <Button onClick={handleImport} disabled={isImporting} className="flex-1">
                  {isImporting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing ({importProgress}%)...</>
                  ) : (
                    "Start Import"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === "result" && importResult && (
            <div className="space-y-4">
              <Alert variant={importResult.success ? "default" : "destructive"}>
                {importResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>
                  {importResult.success ? "Import Completed" : "Import Completed with Errors"}
                </AlertTitle>
                <AlertDescription>
                  {importResult.success
                    ? "All records were processed successfully."
                    : `${importResult.summary.failed} record(s) failed. Review errors below.`}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Total", value: importResult.summary.total, color: "" },
                  { label: "Created", value: importResult.summary.created, color: "bg-green-50 dark:bg-green-950 text-green-600" },
                  { label: "Updated", value: importResult.summary.updated, color: "bg-blue-50 dark:bg-blue-950 text-blue-600" },
                  { label: "Skipped", value: importResult.summary.skipped, color: "bg-yellow-50 dark:bg-yellow-950 text-yellow-600" },
                  { label: "Failed", value: importResult.summary.failed, color: "bg-red-50 dark:bg-red-950 text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`border rounded-lg p-3 text-center ${color}`}>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              {importResult.errors.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Errors ({importResult.errors.length})</h4>
                  <div className="max-h-[280px] overflow-auto space-y-1">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="text-sm p-2 bg-red-50 dark:bg-red-950 rounded">
                        <span className="font-medium">Row {err.row}:</span>{" "}
                        {err.field && `${err.field} — `}{err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { handleReset(); setOpen(false); }} className="flex-1">Close</Button>
                <Button onClick={handleReset} className="flex-1">Import More</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
