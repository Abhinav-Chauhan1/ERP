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
import { exportToExcel } from "@/lib/utils/excel";

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
        await downloadExcel(jsonData, result.data.filename);
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

  const downloadExcel = async (jsonData: any, filename: string) => {
    const { data, metadata } = jsonData;

    // Prepare data for export
    const exportData = data.map((row: any) => ({
      'Student ID': row.studentId,
      'Roll Number': row.rollNumber,
      'Student Name': row.studentName,
      'Theory Marks': row.theoryMarks !== null ? row.theoryMarks : '',
      'Practical Marks': row.practicalMarks !== null ? row.practicalMarks : '',
      'Internal Marks': row.internalMarks !== null ? row.internalMarks : '',
      'Total Marks': row.totalMarks !== null ? row.totalMarks : '',
      'Percentage': row.percentage !== null ? row.percentage.toFixed(2) : '',
      'Grade': row.grade || '',
      'Status': row.status,
      'Remarks': row.remarks || '',
    }));

    // Use ExcelJS for export
    await exportToExcel(exportData, {
      filename: filename.replace('.xlsx', ''),
      title: metadata.examName,
      subtitle: `${metadata.class} - ${metadata.section} | ${metadata.term} | ${metadata.academicYear}`,
      includeTimestamp: true,
    });
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
