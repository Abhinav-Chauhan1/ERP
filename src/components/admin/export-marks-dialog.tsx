"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileSpreadsheet, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportMarksToFile } from "@/lib/actions/exportMarksActions";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ExportMarksDialogProps {
  examId: string;
  classId?: string;
  sectionId?: string;
  examName?: string;
}

export function ExportMarksDialog({
  examId,
  classId,
  sectionId,
  examName,
}: ExportMarksDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"excel" | "csv">("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      const result = await exportMarksToFile({
        examId,
        classId,
        sectionId,
        format,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Export failed");
      }

      // Download the file
      if (format === "csv") {
        // Direct CSV download
        downloadCSV(result.data.content, result.data.filename);
      } else {
        // Generate Excel file from JSON data
        const jsonData = JSON.parse(result.data.content);
        downloadExcel(jsonData, result.data.filename);
      }

      setExportComplete(true);
      toast({
        title: "Export Successful",
        description: `Marks exported successfully as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export marks",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = (jsonData: any, filename: string) => {
    const { data, metadata } = jsonData;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Create metadata sheet
    const metadataSheet = [
      ["Exam", metadata.examName],
      ["Class", metadata.class],
      ["Section", metadata.section],
      ["Term", metadata.term],
      ["Academic Year", metadata.academicYear],
      ["Total Marks", metadata.totalMarks],
      ["Export Date", new Date(metadata.exportDate).toLocaleDateString()],
    ];

    // Create marks data sheet with headers
    const marksData = [
      [
        "Student ID",
        "Roll Number",
        "Student Name",
        "Theory Marks",
        "Practical Marks",
        "Internal Marks",
        "Total Marks",
        "Percentage",
        "Grade",
        "Status",
        "Remarks",
      ],
      ...data.map((row: any) => [
        row.studentId,
        row.rollNumber,
        row.studentName,
        row.theoryMarks !== null ? row.theoryMarks : "",
        row.practicalMarks !== null ? row.practicalMarks : "",
        row.internalMarks !== null ? row.internalMarks : "",
        row.totalMarks !== null ? row.totalMarks : "",
        row.percentage !== null ? row.percentage.toFixed(2) : "",
        row.grade || "",
        row.status,
        row.remarks || "",
      ]),
    ];

    // Convert to worksheets
    const metadataWS = XLSX.utils.aoa_to_sheet(metadataSheet);
    const marksWS = XLSX.utils.aoa_to_sheet(marksData);

    // Set column widths
    metadataWS["!cols"] = [{ wch: 20 }, { wch: 40 }];
    marksWS["!cols"] = [
      { wch: 25 }, // Student ID
      { wch: 12 }, // Roll Number
      { wch: 25 }, // Student Name
      { wch: 12 }, // Theory Marks
      { wch: 14 }, // Practical Marks
      { wch: 14 }, // Internal Marks
      { wch: 12 }, // Total Marks
      { wch: 12 }, // Percentage
      { wch: 8 },  // Grade
      { wch: 10 }, // Status
      { wch: 30 }, // Remarks
    ];

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, metadataWS, "Exam Info");
    XLSX.utils.book_append_sheet(wb, marksWS, "Marks");

    // Generate Excel file and download
    XLSX.writeFile(wb, filename);
  };

  const handleClose = () => {
    setOpen(false);
    setExportComplete(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Marks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Marks</DialogTitle>
          <DialogDescription>
            Export marks data to Excel or CSV format
            {examName && (
              <div className="mt-2 text-sm font-medium text-foreground">
                {examName}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {!exportComplete ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value as "excel" | "csv")}
                disabled={isExporting}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span>Excel (.xlsx)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>CSV (.csv)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <p className="font-medium mb-2">Export will include:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Student details (ID, Roll Number, Name)</li>
                  <li>Marks breakdown (Theory, Practical, Internal)</li>
                  <li>Total marks, Percentage, and Grade</li>
                  <li>Attendance status (Present/Absent)</li>
                  <li>Remarks (if any)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="py-8">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Export completed successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The file has been downloaded to your device.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {!exportComplete ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isExporting}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
