"use client";

import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  importStudents,
  importTeachers,
  importParents,
  type ImportResult,
  type DuplicateHandling,
} from "@/lib/actions/bulkImportActions";

type ImportType = "student" | "teacher" | "parent";

interface BulkImportDialogProps {
  trigger?: React.ReactNode;
}

export function BulkImportDialog({ trigger }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>("student");
  const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>("skip");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<"upload" | "validate" | "import" | "result">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data);
        setCurrentStep("validate");
        toast.success(`Parsed ${results.data.length} rows from CSV`);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleValidate = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to validate");
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateImportData(parsedData, importType);
      setValidationErrors(result.errors);
      
      if (result.valid) {
        toast.success("Validation successful! Ready to import.");
        setCurrentStep("import");
      } else {
        toast.error(`Validation failed with ${result.errors.length} errors`);
      }
    } catch (error) {
      toast.error("Error during validation");
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to import");
      return;
    }

    setIsImporting(true);
    try {
      let result: ImportResult;
      
      if (importType === "student") {
        result = await importStudents(parsedData, duplicateHandling);
      } else if (importType === "teacher") {
        result = await importTeachers(parsedData, duplicateHandling);
      } else {
        result = await importParents(parsedData, duplicateHandling);
      }

      setImportResult(result);
      setCurrentStep("result");

      if (result.success) {
        toast.success(`Import completed successfully!`);
        router.refresh();
      } else {
        toast.error(`Import completed with ${result.summary.failed} failures`);
      }
    } catch (error) {
      toast.error("Error during import");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
    setCurrentStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    setOpen(false);
  };

  const downloadTemplate = () => {
    let headers: string[] = [];
    let sampleData: string[] = [];

    if (importType === "student") {
      headers = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "admissionId",
        "dateOfBirth",
        "gender",
        "address",
        "bloodGroup",
        "emergencyContact",
        "classId",
        "sectionId",
        "rollNumber",
      ];
      sampleData = [
        "John",
        "Doe",
        "john.doe@example.com",
        "+1234567890",
        "STU001",
        "2010-01-15",
        "MALE",
        "123 Main St",
        "O+",
        "+1234567891",
        "class-id-here",
        "section-id-here",
        "1",
      ];
    } else if (importType === "teacher") {
      headers = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "employeeId",
        "qualification",
        "joinDate",
        "salary",
        "departmentId",
      ];
      sampleData = [
        "Jane",
        "Smith",
        "jane.smith@example.com",
        "+1234567890",
        "EMP001",
        "M.Ed",
        "2020-01-15",
        "50000",
        "department-id-here",
      ];
    } else {
      headers = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "occupation",
        "address",
        "studentAdmissionId",
      ];
      sampleData = [
        "Robert",
        "Doe",
        "robert.doe@example.com",
        "+1234567890",
        "Engineer",
        "123 Main St",
        "STU001",
      ];
    }

    const csv = [headers.join(","), sampleData.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}_import_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
          <DialogDescription>
            Import multiple records from a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Upload Configuration */}
          {currentStep === "upload" && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="importType">Import Type</Label>
                  <Select
                    value={importType}
                    onValueChange={(value) => setImportType(value as ImportType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="parent">Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Duplicate Handling</Label>
                  <RadioGroup
                    value={duplicateHandling}
                    onValueChange={(value) => setDuplicateHandling(value as DuplicateHandling)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="skip" id="skip" />
                      <Label htmlFor="skip" className="cursor-pointer font-normal">
                        Skip duplicates (recommended)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="update" id="update" />
                      <Label htmlFor="update" className="cursor-pointer font-normal">
                        Update existing records
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="create" id="create" />
                      <Label htmlFor="create" className="cursor-pointer font-normal">
                        Create new records (may create duplicates)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Template Available</AlertTitle>
                  <AlertDescription>
                    Download the CSV template to see the required format and fields.
                    <Button
                      variant="link"
                      className="p-0 h-auto ml-2"
                      onClick={downloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Template
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-2">
                  <Label htmlFor="file">Upload CSV File</Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      id="file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {file ? file.name : "Choose CSV file"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Validation */}
          {currentStep === "validate" && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Data Preview</AlertTitle>
                <AlertDescription>
                  Found {parsedData.length} records. Click validate to check for errors.
                </AlertDescription>
              </Alert>

              {parsedData.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[300px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(parsedData[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, i) => (
                              <TableCell key={i}>{value}</TableCell>
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
                      {validationErrors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm">
                          Row {error.row}: {error.field && `${error.field} - `}
                          {error.message}
                        </div>
                      ))}
                      {validationErrors.length > 10 && (
                        <div className="text-sm font-medium">
                          ... and {validationErrors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Start Over
                </Button>
                <Button
                  onClick={handleValidate}
                  disabled={isValidating || parsedData.length === 0}
                  className="flex-1"
                >
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
                <AlertTitle>Validation Successful</AlertTitle>
                <AlertDescription>
                  All {parsedData.length} records passed validation. Ready to import.
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Import Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Records:</div>
                  <div className="font-medium">{parsedData.length}</div>
                  <div>Import Type:</div>
                  <div className="font-medium capitalize">{importType}s</div>
                  <div>Duplicate Handling:</div>
                  <div className="font-medium capitalize">{duplicateHandling}</div>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. Please review the data carefully before proceeding.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1"
                >
                  {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isImporting ? "Importing..." : "Start Import"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === "result" && importResult && (
            <div className="space-y-4">
              <Alert variant={importResult.success ? "default" : "destructive"}>
                {importResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {importResult.success ? "Import Completed" : "Import Completed with Errors"}
                </AlertTitle>
                <AlertDescription>
                  {importResult.success
                    ? "All records were processed successfully."
                    : `Some records failed to import. Please review the errors below.`}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{importResult.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="border rounded-lg p-4 text-center bg-green-50 dark:bg-green-950">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.summary.created}
                  </div>
                  <div className="text-sm text-muted-foreground">Created</div>
                </div>
                <div className="border rounded-lg p-4 text-center bg-blue-50 dark:bg-blue-950">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.summary.updated}
                  </div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </div>
                <div className="border rounded-lg p-4 text-center bg-yellow-50 dark:bg-yellow-950">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.summary.skipped}
                  </div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div className="border rounded-lg p-4 text-center bg-red-50 dark:bg-red-950">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    Errors ({importResult.errors.length})
                  </h4>
                  <div className="max-h-[300px] overflow-auto space-y-2">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-red-50 dark:bg-red-950 rounded"
                      >
                        <span className="font-medium">Row {error.row}:</span>{" "}
                        {error.field && `${error.field} - `}
                        {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Close
                </Button>
                <Button onClick={handleReset} className="flex-1">
                  Import More Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
